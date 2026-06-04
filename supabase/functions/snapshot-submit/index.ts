// snapshot-submit — capture an AI Leverage Snapshot lead.
//   POST a payload with NO id  -> insert a new row, email CT + the taker, return { id }.
//   POST a payload WITH id     -> patch the existing row (enrich as they go deeper).
//   GET  ?id=                  -> PII-safe public identity for the shareable result page.
// Deploy with --no-verify-jwt; called cross-origin from ovae.ai.

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization, apikey",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...CORS, "content-type": "application/json" } });

// ── Display nomenclature (MUST match the live site's scoring code, js/score.js + js/app.js) ──
const RUNG = ["Newcomer", "Searcher", "Drafter", "Operator", "Builder", "Conductor"];
const STYLE: Record<string, string> = { centaur: "Delegator", cyborg: "Collaborator", self: "Automator" };
const PERSONA: Record<string, string> = {
  bottlenecked_builder: "Bottlenecked", next_at_wheel: "Coasting", ground_floor: "Untapped", ai_native: "Compounding",
};
const DIM: Record<string, string> = {
  BI: "Business Intelligence", KPD: "Key-Person Dependency", AUTO: "Workflow Automation",
  DATA: "Data Infrastructure", TEAM: "Team Leverage", REV: "Revenue Engine",
};
const ROLE: Record<string, string> = {
  owner: "Owner / founder", solo: "Solo operator", team: "Team lead", ic: "Individual contributor",
};
const APPETITE: Record<string, string> = {
  build_now: "Ready to build now", want_help: "Wants help doing it", convince: "Needs convincing", curious: "Just curious",
};

const esc = (t: unknown) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const styleName = (r: any) => (r?.style ? (STYLE[r.style] || r.style) : "");
const rungName = (r: any) => r?.rung_name || (typeof r?.rung === "number" ? (RUNG[r.rung] || "") : "");
const personaName = (r: any) => (r?.persona ? (PERSONA[r.persona] || r.persona) : "");
const dimName = (k: any) => (k ? (DIM[k] || k) : "");
const roleName = (r: any) => (r?.role ? (ROLE[r.role] || r.role) : "");
const appetiteName = (r: any) => (r?.appetite ? (APPETITE[r.appetite] || r.appetite) : "");
const identity = (r: any) => [styleName(r), rungName(r)].filter(Boolean).join(" "); // e.g. "Collaborator Operator"

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

// ── CT lead-notification email (internal, for triage) ──
function subjectFor(r: Record<string, any>): string {
  const who = r.name || r.email || "New lead";
  const bits = [identity(r), personaName(r), r.band ? `${r.band} biz` : ""].filter(Boolean).join(" · ");
  const via = r.via ? ` · via ${r.via}` : "";
  const tag = r.flag === "flagship" ? "★ Flagship" : r.flag === "qualified" ? "◇ Qualified" : "○ Lead";
  return `${tag} · ${who}${bits ? " — " + bits : ""}${via}`;
}

function emailHTML(r: Record<string, any>, id: string): string {
  const accent = "#7BC9C4";
  const flagColor = r.flag === "flagship" ? "#D9B26B" : r.flag === "qualified" ? accent : "#A39E96";
  const flagText = r.flag === "flagship" ? "★ FLAGSHIP LEAD" : r.flag === "qualified" ? "◇ QUALIFIED LEAD" : "○ NEW LEAD";
  const site = Deno.env.get("SITE_URL") || "https://ovae.ai";
  const idn = identity(r);
  const rows: [string, unknown][] = [
    ["Appetite", appetiteName(r)],
    ["Role", roleName(r)],
    ["Industry", r.industry],
    ["Revenue", r.revenue],
    ["Headcount", r.headcount],
    ["Business", r.band ? `${r.band}${r.business_pct != null ? ` · ${r.business_pct}%` : ""}` : null],
    ["Biggest constraint", dimName(r.constraint_dim)],
    ["AI Leverage Index", r.ai_index != null ? `${r.ai_index} / 100` : null],
    ["Referred by", r.via],
    ["Company", r.company],
  ];
  const body = rows.filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `<tr><td style="padding:6px 18px 6px 0;color:#6F6A63;font-size:13px;white-space:nowrap;vertical-align:top;">${k}</td><td style="padding:6px 0;color:#E8E4DC;font-size:13px;font-weight:500;">${esc(v)}</td></tr>`).join("");
  return `<div style="background:#14101A;padding:28px;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;">
    <div style="max-width:540px;margin:0 auto;background:#1A1622;border:1px solid rgba(232,228,220,0.1);border-radius:16px;overflow:hidden;">
      <div style="padding:16px 24px;border-bottom:1px solid rgba(232,228,220,0.08);">
        <span style="color:${accent};font-size:12px;letter-spacing:.18em;font-weight:700;">OVAE</span>
        <span style="float:right;color:${flagColor};font-size:11px;letter-spacing:.1em;font-weight:600;">${flagText}</span>
      </div>
      <div style="padding:22px 24px 6px;">
        <div style="color:#6F6A63;font-size:11px;letter-spacing:.14em;text-transform:uppercase;">AI Leverage Snapshot</div>
        <div style="color:#E8E4DC;font-size:23px;font-weight:700;margin:7px 0 3px;">${esc(r.name || r.email || "New lead")}</div>
        <div style="color:${accent};font-size:15px;font-weight:600;">${esc(idn || "—")}${personaName(r) ? ` <span style="color:#403a48;">·</span> <span style="color:#A39E96;">${esc(personaName(r))}</span>` : ""}</div>
        ${r.email ? `<div style="margin-top:6px;"><a href="mailto:${esc(r.email)}" style="color:#A39E96;font-size:13px;text-decoration:none;">${esc(r.email)}</a></div>` : ""}
      </div>
      <table style="margin:10px 24px 18px;border-collapse:collapse;">${body}</table>
      <div style="padding:0 24px 22px;">
        <a href="${site}/snapshot/?id=${id}" style="display:inline-block;background:${accent};color:#08110f;font-size:13px;font-weight:600;text-decoration:none;padding:10px 18px;border-radius:9px;">Open their result →</a>
      </div>
      <div style="padding:11px 24px;border-top:1px solid rgba(232,228,220,0.06);color:#544f5c;font-size:10px;font-family:ui-monospace,monospace;">id ${id}</div>
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
  const from = Deno.env.get("NOTIFY_FROM") || "Ovae Team <onboarding@resend.dev>";
  const to = (Deno.env.get("NOTIFY_TO") || "ct@ovae.ai").split(",").map((s) => s.trim());
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to, reply_to: r.email || undefined, subject: subjectFor(r), html: emailHTML(r, id) }),
  }).catch((e) => console.error("resend:", e));
}

// ── Taker result email (to the person) — their level + a level-up prompt + a reply invite ──
// NOTE: only delivers once ovae.ai is verified at resend.com/domains; until then
// Resend rejects sends to non-account addresses (caught, never blocks the submit).
async function emailTaker(row: Record<string, any>, promptText: string, emailLine: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY"); if (!apiKey || !row.email) return;
  const from = Deno.env.get("TAKER_FROM") || Deno.env.get("NOTIFY_FROM") || "CT at Ovae <onboarding@resend.dev>";
  const site = Deno.env.get("SITE_URL") || "https://ovae.ai";
  const name = row.name || "there";
  const level = rungName(row);
  const style = styleName(row);
  const idn = identity(row);
  const lvlNum = typeof row.rung === "number" ? ` <span style="color:#6F6A63;font-size:14px;font-weight:400;">level ${row.rung} of 5</span>` : "";
  const url = `${site}/snapshot/?id=${row.id}`;
  const html = `<div style="background:#14101A;padding:28px;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;color:#E8E4DC;">
    <div style="max-width:560px;margin:0 auto;">
      <div style="color:#7BC9C4;font-size:12px;letter-spacing:.18em;font-weight:700;margin-bottom:20px;">OVAE <span style="color:#544f5c;">·</span> <span style="color:#6F6A63;font-weight:600;">AI LEVERAGE SNAPSHOT</span></div>
      <div style="line-height:1.6;">
        <p>Hey ${esc(name)},</p>
        <p>You finished the whole Snapshot — most people bail halfway. Here's where you landed:</p>
        <div style="background:#1A1622;border:1px solid rgba(123,201,196,0.25);border-radius:12px;padding:18px 20px;margin:18px 0;">
          <div style="color:#6F6A63;font-size:11px;letter-spacing:.14em;text-transform:uppercase;">Your AI level</div>
          <div style="color:#E8E4DC;font-size:24px;font-weight:700;margin-top:5px;">${esc(level || "—")}${lvlNum}</div>
          ${style ? `<div style="color:#7BC9C4;font-size:14px;margin-top:6px;"><b>${esc(style)}</b> — your style with AI (how you work, not a rank)</div>` : ""}
        </div>
        ${emailLine ? `<p style="color:#A39E96;">${esc(emailLine)}</p>` : ""}
        <p>Want the full picture — your spot on the map, where you stack up, the parts that don't fit in an email? <a href="${url}" style="color:#7BC9C4;font-weight:600;">See your full Snapshot &rarr;</a></p>
        <p>Now the useful part. A level is just a mirror; what moves you is the next move. So here's a prompt tuned to your level and style — paste it into Claude or ChatGPT and it meets you where you are and pulls you up a rung:</p>
        <pre style="white-space:pre-wrap;background:#1A1622;border:1px solid rgba(232,228,220,0.12);border-radius:10px;padding:16px;font-size:13px;line-height:1.5;color:#E8E4DC;font-family:ui-monospace,SFMono-Regular,monospace;">${esc(promptText)}</pre>
        <p>Paste it in fresh, answer what it asks, and do the first thing it hands back. Ten minutes today beats a saved-for-later tab.</p>
        <p><b>One real ask:</b> hit reply and tell me one thing you learned, or one thing that surprised you. I read every reply myself.</p>
        <p style="margin-top:22px;">— CT<br/><span style="color:#6F6A63;">Ovae</span></p>
      </div>
    </div></div>`;
  const subject = `${name}, your AI level: ${idn || level}${promptText ? " (+ the prompt to level up)" : ""}`.trim();
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

  // GET ?id= -> PII-SAFE public identity for the shareable result page.
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
