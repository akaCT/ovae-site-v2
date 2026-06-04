// pipeline-ingest — drop a transcript/notes/text on a client; Claude extracts
// key facts + an activity summary and applies them to the dossier. Raw input is
// always saved as an artifact, even if extraction is unavailable.
// Requires ?k=<ADMIN_TOKEN>. Body: { pipeline_id, text, source_label? }
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization, apikey",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "content-type": "application/json" } });

const BASE = () => Deno.env.get("SUPABASE_URL")!;
const KEY = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
function db(path: string, init: RequestInit) {
  return fetch(`${BASE()}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}`, "content-type": "application/json", Prefer: "return=representation", ...(init.headers || {}) },
  });
}
async function getRow(id: string) {
  const r = await fetch(`${BASE()}/rest/v1/pipeline?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` } });
  const j = await r.json();
  return Array.isArray(j) && j.length ? j[0] : null;
}

const EXTRACT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string", description: "1-2 sentence summary of what this input contains" },
    activity_title: { type: "string", description: "Short title for the activity log entry (e.g. 'Discovery call', 'Pricing email')" },
    activity_kind: { type: "string", enum: ["note", "call", "email"] },
    facts: {
      type: "array",
      description: "Concrete, durable facts worth saving to the client profile",
      items: {
        type: "object", additionalProperties: false,
        properties: { label: { type: "string" }, value: { type: "string" } },
        required: ["label", "value"],
      },
    },
    next_step: { type: ["string", "null"], description: "Suggested next step if implied, else null" },
  },
  required: ["summary", "activity_title", "activity_kind", "facts", "next_step"],
};

let LAST_DIAG: any = {};
async function extract(row: any, text: string): Promise<any | null> {
  const apiKey = (Deno.env.get("ANTHROPIC_API_KEY") || "").trim();
  LAST_DIAG = { keyPresent: !!apiKey, keyLen: apiKey.length };
  if (!apiKey) return null;
  const existingLabels = Object.keys(row.details || {});
  const sys = `You extract CRM dossier data from raw input about a sales prospect/client (call transcripts, meeting notes, emails).
Produce: a concise 1-2 sentence summary; a short activity title; the activity kind; a list of concrete, durable facts worth saving to the client profile (deal terms, budget/$ figures, systems/tools they use, people & roles, pain points, timelines, decisions) — only specific facts, no fluff or speculation; and a suggested next step if one is implied (else null).
Use short Title Case fact labels. Do not duplicate facts already on file. Prefer specifics (numbers, names, dates) over generalities.`;
  const user = `CLIENT: ${row.name}${row.company ? " · " + row.company : ""}
EXISTING FACT LABELS (avoid duplicating): ${existingLabels.join(", ") || "(none)"}

RAW INPUT TO PROCESS:
"""
${text.slice(0, 60000)}
"""`;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 2000,
        output_config: { format: { type: "json_schema", schema: EXTRACT_SCHEMA }, effort: "low" },
        system: sys,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) { const t = await res.text(); LAST_DIAG.status = res.status; LAST_DIAG.errBody = t.slice(0, 400); console.error("anthropic error", res.status, t); return null; }
    const data = await res.json();
    const textBlock = (data.content || []).find((b: any) => b.type === "text");
    if (!textBlock) { LAST_DIAG.noTextBlock = true; LAST_DIAG.stop = data.stop_reason; return null; }
    return JSON.parse(textBlock.text);
  } catch (e) {
    LAST_DIAG.exception = String(e);
    console.error("extract failed:", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if ((new URL(req.url).searchParams.get("k") || "") !== Deno.env.get("ADMIN_TOKEN")) return json({ error: "not authorized" }, 403);

  try {
    const b = await req.json().catch(() => ({}));
    const id = b.pipeline_id;
    const text = (b.text || "").trim();
    if (!id || !text) return json({ error: "pipeline_id and text required" }, 400);
    const row = await getRow(id);
    if (!row) return json({ error: "client not found" }, 404);

    // 1) Always save the raw input as an artifact.
    await db("client_notes", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({
      pipeline_id: id, kind: "artifact",
      title: b.source_label || `Ingested ${new Date().toISOString().slice(0, 10)}`,
      body: text,
    }) });

    // 2) Try AI extraction.
    const ex = await extract(row, text);
    let factsAdded = 0;
    if (ex) {
      // merge facts
      const details = { ...(row.details || {}) };
      for (const f of (ex.facts || [])) {
        if (f.label && f.value && !(f.label in details)) { details[f.label] = String(f.value); factsAdded++; }
      }
      // activity note from the summary
      await db("client_notes", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({
        pipeline_id: id, kind: ["note", "call", "email"].includes(ex.activity_kind) ? ex.activity_kind : "note",
        title: ex.activity_title || "Activity", body: ex.summary || null,
      }) });
      const patch: Record<string, unknown> = { details, last_activity: new Date().toISOString() };
      if (ex.next_step && !row.next_step) patch.next_step = ex.next_step;
      await db(`pipeline?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(patch) });
      return json({ ok: true, extracted: true, facts_added: factsAdded, summary: ex.summary, next_step: ex.next_step });
    }

    // No extraction available — raw artifact saved, still bump activity.
    await db(`pipeline?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ last_activity: new Date().toISOString() }) });
    return json({ ok: true, extracted: false, note: "Saved as an artifact. Set ANTHROPIC_API_KEY to enable automatic fact extraction.", ...(b.debug ? { diag: LAST_DIAG } : {}) });
  } catch (e) {
    console.error("pipeline-ingest error:", e);
    return json({ error: String(e) }, 500);
  }
});
