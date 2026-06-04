// pipeline-client — admin-only client dossier (one entry, full detail).
// Requires ?k=<ADMIN_TOKEN>&id=<uuid>. Served via ovae.ai/pipeline/c/ wrapper.
import { renderClientHTML } from "../_shared/dossier.ts";
import type { PRow, CNote } from "../_shared/pipeline-core.ts";

const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS", "access-control-allow-headers": "*" };
function shell(msg: string): string {
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ovae</title>
<body style="margin:0;background:#14101A;color:#E8E4DC;font-family:'DM Sans',system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center">
<div><div style="font:600 13px monospace;letter-spacing:.16em;text-transform:uppercase;color:#7BC9C4;margin-bottom:14px">Ovae</div>
<div style="font-size:18px;color:#A39E96">${msg}</div></div></body>`;
}

function api(path: string) {
  const base = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return fetch(`${base}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url);
  const token = url.searchParams.get("k") || "";
  const id = url.searchParams.get("id") || "";
  const html = (b: string, s = 200) => new Response(b, { status: s, headers: { ...CORS, "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  if (!token || token !== Deno.env.get("ADMIN_TOKEN")) return html(shell("Not authorized."), 403);
  if (!id) return html(shell("Missing client id."), 400);
  try {
    const pr = await api(`pipeline?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const rows = await pr.json() as PRow[];
    if (!rows.length) return html(shell("Client not found."), 404);
    const row = rows[0];

    let readiness: any = null;
    if (row.source_table === "readiness_submissions" && row.source_id) {
      const rr = await api(`readiness_submissions?id=eq.${encodeURIComponent(row.source_id)}&select=*&limit=1`);
      const rj = await rr.json();
      if (Array.isArray(rj) && rj.length) readiness = rj[0];
    }
    const nr = await api(`client_notes?pipeline_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc`);
    const notes = await nr.json() as CNote[];

    return html(renderClientHTML(row, readiness, Array.isArray(notes) ? notes : [], token));
  } catch (e) {
    console.error("pipeline-client error:", e);
    return html(shell("Could not load client."), 500);
  }
});
