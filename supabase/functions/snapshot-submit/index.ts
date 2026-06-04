// snapshot-submit — capture an AI Leverage Snapshot lead.
//   POST a payload with NO id  -> insert a new row, email CT, return { id }.
//   POST a payload WITH id     -> patch the existing row (enrich as they go deeper).
// Emails CT on insert (every lead) and again on a business-complete row that turns hot.
// Deploy with --no-verify-jwt; called cross-origin from ovae.ai.

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization, apikey",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...CORS, "content-type": "application/json" } });

const RUNG = ["Unaware", "Searcher", "Drafter", "Operator", "Builder", "Conductor"];
const STYLE: Record<string, string> = { centaur: "Centaur", cyborg: "Cyborg", self: "Self-Automator" };

// map the client payload to table columns (note: `constraint` -> constraint_dim).
// Only include keys PRESENT in the payload, so a partial PATCH never nulls
// out fields captured on insert.
function toRow(b: Record<string, unknown>) {
  const map: Record<string, string> = {
    name: "name", email: "email", company: "company", role: "role", industry: "industry",
    rung: "rung", rung_name: "rung_name", style: "style", ai_index: "ai_index",
    persona: "persona", band: "band", business_pct: "business_pct", constraint: "constraint_dim",
    appetite: "appetite", revenue: "revenue", headcount: "headcount",
    answers: "answers", flag: "flag", attribution: "attribution", via: "via",
    user_agent: "user_agent", referrer: "referrer",
  };
  const row: Record<string, unknown> = {};
  for (const k in map) if (b[k] !== undefined && k !== "id") row[map[k]] = b[k];
  return row;
}

function subjectFor(r: Record<string, any>): string {
  const lvl = (typeof r.rung === "number" ? `L${r.rung} ${RUNG[r.rung] || ""}` : "—").trim();
  const sty = r.style ? (STYLE[r.style] || r.style) : "";
  const who = r.name || r.email || "—";
  const via = r.via ? ` · via ${r.via}` : "";
  const tag = r.flag === "flagship" ? "★ [FLAGSHIP]" : r.flag === "qualified" ? "◇ [Qualified]" : "○ [Lead]";
  return `${tag} ${who} · ${sty} ${lvl}${r.band ? " · biz " + r.band : ""}${via}`;
}

function emailHTML(r: Record<string, any>, id: string): string {
  const rows: [string, unknown][] = [
    ["Name", r.name], ["Email", r.email], ["Company", r.company], ["Role", r.role], ["Industry", r.industry],
    ["AI level", typeof r.rung === "number" ? `${r.rung} — ${RUNG[r.rung]}` : null],
    ["AI style", r.style ? STYLE[r.style] : null], ["AI Leverage Index", r.ai_index],
    ["Persona", r.persona], ["Business band", r.band], ["Business %", r.business_pct],
    ["Constraint", r.constraint_dim], ["Appetite", r.appetite],
    ["Revenue", r.revenue], ["Headcount", r.headcount], ["Flag", r.flag],
    ["Via (attribution)", r.via], ["Referrer", r.referrer],
  ];
  const body = rows.filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `<tr><td style="padding:4px 14px 4px 0;color:#6F6A63;font-size:13px;">${k}</td><td style="padding:4px 0;color:#E8E4DC;font-size:13px;font-weight:500;">${String(v)}</td></tr>`).join("");
  return `<div style="background:#14101A;padding:28px;font-family:system-ui,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#1A1622;border:1px solid rgba(232,228,220,0.1);border-radius:14px;padding:24px;">
      <div style="color:#7BC9C4;font-size:12px;letter-spacing:.12em;text-transform:uppercase;">AI Leverage Snapshot · New lead</div>
      <table style="margin-top:14px;border-collapse:collapse;">${body}</table>
      <div style="margin-top:16px;color:#6F6A63;font-size:11px;">id: ${id}</div>
    </div></div>`;
}

async function sb(method: string, path: string, body?: unknown) {
  const base = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(`${base}/rest/v1/${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "content-type": "application/json", Prefer: "return=representation" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

async function emailCT(r: Record<string, any>, id: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY"); if (!apiKey) return;
  const from = Deno.env.get("NOTIFY_FROM") || "Ovae Snapshot <onboarding@resend.dev>";
  const to = (Deno.env.get("NOTIFY_TO") || "ct@ovae.ai").split(",").map((s) => s.trim());
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to, reply_to: r.email || undefined, subject: subjectFor(r), html: emailHTML(r, id) }),
  }).catch((e) => console.error("resend:", e));
}

// email the TAKER their result + level-up prompt + a reply invite.
// NOTE: only delivers once ovae.ai is verified at resend.com/domains; until then
// Resend rejects sends to non-account addresses (caught, never blocks the submit).
async function emailTaker(row: Record<string, any>, promptText: string, emailLine: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY"); if (!apiKey || !row.email) return;
  const from = Deno.env.get("TAKER_FROM") || Deno.env.get("NOTIFY_FROM") || "CT at Ovae <onboarding@resend.dev>";
  const site = Deno.env.get("SITE_URL") || "https://ovae.ai";
  const name = row.name || "there";
  const level = row.rung_name || "";
  const style = row.style ? (STYLE[row.style] || row.style) : "";
  const url = `${site}/snapshot/?id=${row.id}`;
  const esc = (t: unknown) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<div style="background:#14101A;padding:28px;font-family:system-ui,sans-serif;color:#E8E4DC;">
    <div style="max-width:560px;margin:0 auto;line-height:1.6;">
      <p>Hey ${esc(name)},</p>
      <p>You finished the whole AI Leverage Snapshot, which most people don't. Here's where you landed:</p>
      <p style="font-size:18px;margin:18px 0;"><b>Level: ${esc(level)}</b><br/><b>Your style: ${esc(style)}</b></p>
      ${emailLine ? `<p style="color:#A39E96;">${esc(emailLine)}</p>` : ""}
      <p>Want the full breakdown — your map, where you stack up, the parts that don't fit in an email? <a href="${url}" style="color:#7BC9C4;">See your full Snapshot &rarr;</a></p>
      <p>Now the useful part. A score is just a mirror; what moves you is the next move. So we built you a prompt tuned to your level and style. Paste it into Claude or ChatGPT and it meets you where you are and pulls you up a rung.</p>
      <p style="color:#6F6A63;">Copy everything between the lines:</p>
      <pre style="white-space:pre-wrap;background:#1A1622;border:1px solid rgba(232,228,220,0.12);border-radius:10px;padding:16px;font-size:13px;line-height:1.5;color:#E8E4DC;">${esc(promptText)}</pre>
      <p>Paste it in fresh, answer what it asks, and do the first thing it hands back. Ten minutes today beats a saved-for-later tab.</p>
      <p><b>One real ask:</b> hit reply and tell me one thing you learned, or one thing that surprised you. I read every reply myself.</p>
      <p>Go run the prompt, then tell me what happened.</p>
      <p>CT<br/>Ovae</p>
    </div></div>`;
  const subject = `${name}, your AI level: ${style} ${level} (+ the prompt to level up)`.trim();
  const replyTo = Deno.env.get("NOTIFY_TO") || "ct@ovae.ai";
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [row.email], reply_to: replyTo, subject, html }),
  }).then(async (r) => { if (!r.ok) console.error("taker email rejected (verify ovae.ai at resend):", await r.text()); })
    .catch((e) => console.error("taker email:", e));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // GET ?id= -> PII-SAFE public identity for the shareable /u/ page.
  // Never returns name, email, answers, attribution, or the private Index.
  if (req.method === "GET") {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return json({ error: "id required" }, 400);
    try {
      const rows = await sb("GET", `snapshot_submissions?id=eq.${encodeURIComponent(id)}&select=rung,rung_name,style,persona,band,industry,role`);
      const r = Array.isArray(rows) && rows[0] ? rows[0] : null;
      if (!r) return json({ error: "not found" }, 404);
      return json({
        rung: r.rung, rung_name: r.rung_name, style: r.style,
        persona: r.persona, band: r.band, industry: r.industry, role: r.role,
      });
    } catch (e) { return json({ error: String(e) }, 500); }
  }

  if (req.method !== "POST") return json({ error: "POST or GET" }, 405);
  try {
    const b = await req.json().catch(() => ({}));
    if (b.id) {
      const patch = toRow(b); (patch as any).updated_at = new Date().toISOString();
      const updated = await sb("PATCH", `snapshot_submissions?id=eq.${encodeURIComponent(String(b.id))}`, patch);
      const row = Array.isArray(updated) && updated[0] ? updated[0] : null;
      // nudge CT again only when an enriched row turns hot
      if (row && (row.flag === "flagship" || row.flag === "qualified") && row.business_pct != null) {
        await emailCT(row, String(b.id));
      }
      return json({ ok: true, id: b.id });
    }
    if (!b.email) return json({ error: "email required" }, 400);
    const inserted = await sb("POST", "snapshot_submissions", toRow(b));
    const row = inserted[0];
    await emailCT(row, row.id);
    await emailTaker(row, b.prompt_text || "", b.email_line || "");
    return json({ ok: true, id: row.id });
  } catch (e) {
    console.error("snapshot-submit:", e);
    return json({ error: String(e) }, 500);
  }
});
