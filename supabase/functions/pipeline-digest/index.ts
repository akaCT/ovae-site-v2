// pipeline-digest — daily "what needs you" email for the Ovae pipeline.
// Surfaces open deals to follow up (overdue / undated / due-soon / stale) + hot untriaged leads.
// Gated by ADMIN_TOKEN via ?k= (manual test) or x-admin-token header (cron via pg_net).
// ?dry=1 renders + returns the digest WITHOUT sending the email.
// Deploy with --no-verify-jwt; invoked by a daily pg_cron job.
import {
  ACCENT, GREEN, RUST, esc, fmtUsd, STAGE_LABEL, STAGE_PROB,
  dealStr, dealMid, dueInfo, DUE_COLOR, isStale, todayItems,
  invoiceBadge, readyToWin, num, nextCallInfo, type PRow,
} from "../_shared/pipeline-core.ts";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } });

async function fetchAll(): Promise<PRow[]> {
  const base = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(`${base}/rest/v1/pipeline?select=*&order=created_at.desc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`read failed: ${res.status} ${await res.text()}`);
  return await res.json() as PRow[];
}

function todayStr(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/Chicago" });
}

function renderDigestHTML(rows: PRow[], token: string, site: string): string {
  const today = todayItems(rows);
  const openStages = ["qualified", "proposal", "negotiation"];
  const open = rows.filter((r) => openStages.includes(r.stage));
  const openVal = open.reduce((s, r) => s + dealMid(r), 0);
  const forecast = open.reduce((s, r) => s + dealMid(r) * (STAGE_PROB[r.stage] || 0), 0);

  const item = (r: PRow): string => {
    const lead = r.stage === "new";
    const di = dueInfo(r.next_step_due);
    const ci = nextCallInfo(r);
    let c: string, tag: string;
    if (readyToWin(r)) { c = GREEN; tag = "PAID · MARK WON"; }
    else if (r.invoice_status === "overdue") { c = RUST; tag = "INVOICE OVERDUE"; }
    else if (ci.state === "today" || ci.state === "tomorrow") { c = ACCENT; tag = ci.label.toUpperCase(); }
    else if (lead) { c = GREEN; tag = "HOT LEAD"; }
    else { c = DUE_COLOR[di.state]; tag = (isStale(r) && di.state === "ok" ? "STALE" : di.label.toUpperCase()); }
    const ib = invoiceBadge(r);
    const invTag = !lead && ib && !readyToWin(r) && r.invoice_status !== "overdue" ? ` · invoice ${esc(ib.label.toLowerCase())}` : "";
    const meta = lead ? `${esc(STAGE_LABEL[r.stage] || r.stage)} · triage` : `${esc(STAGE_LABEL[r.stage] || r.stage)} · ${dealStr(r)}${invTag}`;
    const url = `${site}/pipeline/c/?id=${esc(r.id)}&k=${esc(token)}`;
    return `<tr><td style="padding:12px 0;border-bottom:1px solid rgba(232,228,220,.1)">
      <span style="display:inline-block;font:600 10px monospace;letter-spacing:.04em;color:${c};border:1px solid ${c};border-radius:999px;padding:2px 8px;margin-bottom:6px">${tag}</span>
      <div style="font-weight:600;font-size:16px;color:#E8E4DC">${esc(r.name)} <span style="color:#A39E96;font-weight:400;font-size:14px">· ${esc(r.company || "—")}</span></div>
      <div style="font:500 12px monospace;color:#A39E96;margin:3px 0 4px">${meta}</div>
      <div style="font-size:13px;color:#C9C4BC">${r.next_step ? "▸ " + esc(r.next_step) : "<span style='color:#6F6A63'>no next step set</span>"}</div>
      <a href="${url}" style="font:500 12px sans-serif;color:${ACCENT};text-decoration:none">Open dossier →</a>
    </td></tr>`;
  };

  const list = today.length
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${today.map(item).join("")}</table>`
    : `<div style="padding:18px;border:1px solid rgba(99,224,132,.3);border-radius:12px;background:rgba(99,224,132,.06);color:#63E084;font-size:14px">✓ All clear — every open deal has a scheduled next step.</div>`;

  const boardUrl = `${site}/pipeline/?k=${esc(token)}`;
  return `<div style="margin:0;padding:24px;background:#14101A;font-family:'DM Sans',system-ui,sans-serif">
  <div style="max-width:560px;margin:0 auto">
    <div style="font:600 12px monospace;letter-spacing:.16em;text-transform:uppercase;color:${ACCENT};margin-bottom:4px">Ovae · Daily Pipeline</div>
    <div style="font-size:14px;color:#A39E96;margin-bottom:18px">${esc(todayStr())}</div>
    <div style="font-size:15px;color:#E8E4DC;margin-bottom:16px"><b>${today.length}</b> ${today.length === 1 ? "thing needs" : "things need"} you today · open ${openVal ? fmtUsd(openVal) : "—"} · forecast ${forecast ? fmtUsd(Math.round(forecast)) : "—"}</div>
    ${list}
    <div style="margin-top:22px;text-align:center"><a href="${boardUrl}" style="display:inline-block;font:600 13px sans-serif;color:#0F0C14;background:${ACCENT};border-radius:9px;padding:10px 20px;text-decoration:none">Open the board →</a></div>
    <div style="margin-top:18px;font:500 11px monospace;color:#6F6A63;text-align:center;letter-spacing:.04em">ovae.ai/pipeline · automated daily digest</div>
  </div></div>`;
}

async function sendEmail(html: string, count: number): Promise<string> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY not set");
  const from = Deno.env.get("NOTIFY_FROM") || "Ovae Team <onboarding@resend.dev>";
  const to = (Deno.env.get("NOTIFY_TO") || "ct@ovae.ai").split(",").map((s) => s.trim());
  const subject = count > 0 ? `📋 Pipeline · ${count} need${count === 1 ? "s" : ""} follow-up today` : "📋 Pipeline · all clear";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  const out = await res.json();
  if (!res.ok) throw new Error(`resend failed: ${res.status} ${JSON.stringify(out)}`);
  return out.id;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("k") || req.headers.get("x-admin-token") || "";
  if (!token || token !== Deno.env.get("ADMIN_TOKEN")) return json({ error: "not authorized" }, 403);

  try {
    const rows = await fetchAll();
    const site = Deno.env.get("SITE_URL") || "https://ovae.ai";
    const adminToken = Deno.env.get("ADMIN_TOKEN") || "";
    const html = renderDigestHTML(rows, adminToken, site);
    const count = todayItems(rows).length;

    if (url.searchParams.get("dry")) return json({ ok: true, dry: true, count });

    const emailId = await sendEmail(html, count);
    return json({ ok: true, count, email_id: emailId });
  } catch (e) {
    console.error("pipeline-digest error:", e);
    return json({ error: String(e) }, 500);
  }
});
