// pipeline — admin-only pipeline board (kanban by stage).
// Requires ?k=<ADMIN_TOKEN>. Served via ovae.ai/pipeline/ wrapper.
import { renderPipelineHTML } from "../_shared/pipeline.ts";
import type { PRow } from "../_shared/pipeline-core.ts";

const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS", "access-control-allow-headers": "*" };

function shell(msg: string): string {
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ovae Pipeline</title>
<body style="margin:0;background:#14101A;color:#E8E4DC;font-family:'DM Sans',system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center">
<div><div style="font:600 13px monospace;letter-spacing:.16em;text-transform:uppercase;color:#7BC9C4;margin-bottom:14px">Ovae · Pipeline</div>
<div style="font-size:18px;color:#A39E96">${msg}</div></div></body>`;
}

async function fetchAll(): Promise<PRow[]> {
  const base = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(`${base}/rest/v1/pipeline?select=*&order=created_at.desc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`read failed: ${res.status} ${await res.text()}`);
  return await res.json() as PRow[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const token = new URL(req.url).searchParams.get("k") || "";
  const html = (body: string, status = 200) =>
    new Response(body, { status, headers: { ...CORS, "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  if (!token || token !== Deno.env.get("ADMIN_TOKEN")) return html(shell("Not authorized."), 403);
  try {
    return html(renderPipelineHTML(await fetchAll(), token));
  } catch (e) {
    console.error("pipeline error:", e);
    return html(shell("Could not load pipeline."), 500);
  }
});
