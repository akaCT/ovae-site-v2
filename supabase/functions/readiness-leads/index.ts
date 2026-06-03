// readiness-leads — admin-only index of all submissions.
// Requires ?k=<ADMIN_TOKEN>. Served through ovae.ai/readiness/leads/ wrapper.
import { renderLeadsHTML } from "../_shared/render.ts";
import type { Row } from "../_shared/readiness.ts";

const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS", "access-control-allow-headers": "*" };

function shell(msg: string): string {
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ovae Readiness</title>
<body style="margin:0;background:#14101A;color:#E8E4DC;font-family:'DM Sans',system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center">
<div><div style="font:600 13px monospace;letter-spacing:.16em;text-transform:uppercase;color:#7BC9C4;margin-bottom:14px">Ovae · Readiness</div>
<div style="font-size:18px;color:#A39E96">${msg}</div></div></body>`;
}

async function fetchAll(): Promise<Row[]> {
  const base = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(`${base}/rest/v1/readiness_submissions?select=*&order=created_at.desc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`read failed: ${res.status} ${await res.text()}`);
  return await res.json() as Row[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const token = new URL(req.url).searchParams.get("k") || "";
  const html = (body: string, status = 200) =>
    new Response(body, { status, headers: { ...CORS, "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

  if (!token || token !== Deno.env.get("ADMIN_TOKEN")) return html(shell("Not authorized."), 403);
  try {
    const rows = await fetchAll();
    return html(renderLeadsHTML(rows, token));
  } catch (e) {
    console.error("readiness-leads error:", e);
    return html(shell("Could not load leads."), 500);
  }
});
