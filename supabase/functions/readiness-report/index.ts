// readiness-report — per-lead results page (server-rendered, reads by id).
// ?id=<uuid>            -> client-safe report
// ?id=<uuid>&k=<token>  -> full internal lead view (token = ADMIN_TOKEN secret)
// Deployed --no-verify-jwt so the unique link works without an apikey.
import { fetchRow } from "../_shared/readiness.ts";
import { renderReportHTML } from "../_shared/render.ts";

const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS", "access-control-allow-headers": "*" };

function shell(msg: string): string {
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ovae Readiness</title>
<body style="margin:0;background:#14101A;color:#E8E4DC;font-family:'DM Sans',system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center">
<div><div style="font:600 13px monospace;letter-spacing:.16em;text-transform:uppercase;color:#7BC9C4;margin-bottom:14px">Ovae · Readiness</div>
<div style="font-size:18px;color:#A39E96">${msg}</div></div></body>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const token = url.searchParams.get("k");
  const isAdmin = !!token && token === Deno.env.get("ADMIN_TOKEN");
  const html = (body: string, status = 200) =>
    new Response(body, { status, headers: { ...CORS, "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

  if (!id) return html(shell("Missing report id."), 400);
  try {
    const row = await fetchRow(id);
    if (!row) return html(shell("That report could not be found."), 404);
    return html(renderReportHTML(row, isAdmin));
  } catch (e) {
    console.error("readiness-report error:", e);
    return html(shell("Something went wrong loading this report."), 500);
  }
});
