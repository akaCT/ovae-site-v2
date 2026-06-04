// pipeline-edit — admin-only writes. Requires ?k=<ADMIN_TOKEN>.
// actions: save | stage | promote | dismiss | delete | set-fact | del-fact | add-note | delete-note
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization, apikey",
};
const STAGES = ["new", "qualified", "proposal", "negotiation", "won", "lost"];
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
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
async function touch(id: string) {
  await db(`pipeline?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ last_activity: new Date().toISOString() }) });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if ((new URL(req.url).searchParams.get("k") || "") !== Deno.env.get("ADMIN_TOKEN")) return json({ error: "not authorized" }, 403);

  try {
    const b = await req.json().catch(() => ({}));
    const a = b.action;

    if (a === "delete") {
      if (!b.id) return json({ error: "id required" }, 400);
      const r = await db(`pipeline?id=eq.${encodeURIComponent(b.id)}`, { method: "DELETE" });
      return r.ok ? json({ ok: true }) : json({ error: await r.text() }, 500);
    }

    if (a === "stage" || a === "promote" || a === "dismiss") {
      const stage = a === "promote" ? "qualified" : a === "dismiss" ? "lost" : b.stage;
      if (!b.id || !STAGES.includes(stage)) return json({ error: "id and valid stage required" }, 400);
      const r = await db(`pipeline?id=eq.${encodeURIComponent(b.id)}`, { method: "PATCH", body: JSON.stringify({ stage, last_activity: new Date().toISOString() }) });
      return r.ok ? json({ ok: true }) : json({ error: await r.text() }, 500);
    }

    if (a === "set-fact" || a === "del-fact") {
      if (!b.id || !b.key) return json({ error: "id and key required" }, 400);
      const row = await getRow(b.id);
      if (!row) return json({ error: "not found" }, 404);
      const details = row.details || {};
      if (a === "set-fact") details[b.key] = String(b.value ?? "");
      else delete details[b.key];
      const r = await db(`pipeline?id=eq.${encodeURIComponent(b.id)}`, { method: "PATCH", body: JSON.stringify({ details, last_activity: new Date().toISOString() }) });
      return r.ok ? json({ ok: true }) : json({ error: await r.text() }, 500);
    }

    if (a === "add-note") {
      if (!b.pipeline_id) return json({ error: "pipeline_id required" }, 400);
      const note = { pipeline_id: b.pipeline_id, kind: ["note", "call", "email", "artifact"].includes(b.kind) ? b.kind : "note", title: b.title || null, body: b.body || null, url: b.url || null, author: b.author || null };
      const r = await db(`client_notes`, { method: "POST", body: JSON.stringify(note) });
      if (!r.ok) return json({ error: await r.text() }, 500);
      await touch(b.pipeline_id);
      return json({ ok: true });
    }

    if (a === "delete-note") {
      if (!b.note_id) return json({ error: "note_id required" }, 400);
      const r = await db(`client_notes?id=eq.${encodeURIComponent(b.note_id)}`, { method: "DELETE" });
      return r.ok ? json({ ok: true }) : json({ error: await r.text() }, 500);
    }

    if (a === "save") {
      const name = (b.name || "").trim();
      if (!name) return json({ error: "name required" }, 400);
      const stage = STAGES.includes(b.stage) ? b.stage : "new";
      const fields: Record<string, unknown> = {
        name, company: b.company || null, email: b.email || null, contact_title: b.contact_title || null,
        phone: b.phone || null, stage, owner: b.owner || null,
        deal_value_low: num(b.deal_value_low), deal_value_high: num(b.deal_value_high),
        opportunity_low: num(b.opportunity_low), opportunity_high: num(b.opportunity_high),
        next_step: b.next_step || null, next_step_due: b.next_step_due || null,
        proposal_url: b.proposal_url || null, last_activity: new Date().toISOString(),
      };
      if (b.lead_type) fields.lead_type = b.lead_type;
      if (b.notes !== undefined) fields.notes = b.notes || null;
      if (b.id) {
        const r = await db(`pipeline?id=eq.${encodeURIComponent(b.id)}`, { method: "PATCH", body: JSON.stringify(fields) });
        return r.ok ? json({ ok: true, id: b.id }) : json({ error: await r.text() }, 500);
      } else {
        const r = await db(`pipeline`, { method: "POST", body: JSON.stringify({ ...fields, source: "manual", lead_type: b.lead_type || "manual" }) });
        if (!r.ok) return json({ error: await r.text() }, 500);
        const rows = await r.json();
        return json({ ok: true, id: rows[0]?.id });
      }
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    console.error("pipeline-edit error:", e);
    return json({ error: String(e) }, 500);
  }
});
