// pipeline-edit — admin-only writes to the pipeline (add/update/move/delete).
// Requires ?k=<ADMIN_TOKEN>. Body: { action: "save"|"stage"|"delete", ... }
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization, apikey",
};
const STAGES = ["new", "qualified", "proposal", "negotiation", "won", "lost"];
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...CORS, "content-type": "application/json" } });

function db(path: string, init: RequestInit) {
  const base = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return fetch(`${base}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "content-type": "application/json", Prefer: "return=representation", ...(init.headers || {}) },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const token = new URL(req.url).searchParams.get("k") || "";
  if (!token || token !== Deno.env.get("ADMIN_TOKEN")) return json({ error: "not authorized" }, 403);

  try {
    const b = await req.json().catch(() => ({}));
    const action = b.action;

    if (action === "delete") {
      if (!b.id) return json({ error: "id required" }, 400);
      const res = await db(`pipeline?id=eq.${encodeURIComponent(b.id)}`, { method: "DELETE" });
      if (!res.ok) return json({ error: await res.text() }, 500);
      return json({ ok: true });
    }

    if (action === "stage") {
      if (!b.id || !STAGES.includes(b.stage)) return json({ error: "id and valid stage required" }, 400);
      const res = await db(`pipeline?id=eq.${encodeURIComponent(b.id)}`, { method: "PATCH", body: JSON.stringify({ stage: b.stage }) });
      if (!res.ok) return json({ error: await res.text() }, 500);
      return json({ ok: true });
    }

    if (action === "save") {
      const name = (b.name || "").trim();
      if (!name) return json({ error: "name required" }, 400);
      const stage = STAGES.includes(b.stage) ? b.stage : "new";
      const fields = {
        name,
        company: b.company || null,
        email: b.email || null,
        stage,
        value_low: Number.isFinite(b.value_low) ? b.value_low : null,
        value_high: Number.isFinite(b.value_high) ? b.value_high : null,
        proposal_url: b.proposal_url || null,
        notes: b.notes || null,
      };
      if (b.id) {
        const res = await db(`pipeline?id=eq.${encodeURIComponent(b.id)}`, { method: "PATCH", body: JSON.stringify(fields) });
        if (!res.ok) return json({ error: await res.text() }, 500);
        return json({ ok: true, id: b.id });
      } else {
        const res = await db(`pipeline`, { method: "POST", body: JSON.stringify({ ...fields, source: "manual" }) });
        if (!res.ok) return json({ error: await res.text() }, 500);
        const rows = await res.json();
        return json({ ok: true, id: rows[0]?.id });
      }
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    console.error("pipeline-edit error:", e);
    return json({ error: String(e) }, 500);
  }
});
