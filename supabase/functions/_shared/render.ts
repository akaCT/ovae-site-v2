import {
  ACCENT, RUST, WARN, GREEN, DIM_META, OPP_COPY, REC_COPY, BANDS, QUESTIONS,
  PROFILE_LBL, C1_MID, C2_MID, C1_LBL, C2_LBL,
  esc, fmtUsd, fmtDate, derive, flagMeta, type Row,
} from "./readiness.ts";

const SCORE_COLOR = (s: number) => (s >= 76 ? GREEN : s >= 51 ? ACCENT : s >= 26 ? WARN : RUST);

// ============================================================
// RESULTS PAGE. admin=true => internal lead view (flag, ICP,
// recommendation, full data). admin=false => client-safe view.
// ============================================================
export function renderReportHTML(row: Row, admin = false): string {
  const { dims, constraintCode, top3, band } = derive(row);
  const comp = row.company || "your company";
  const fm = flagMeta(row.flag);
  const rec = REC_COPY[row.flag] || REC_COPY.nurture;
  const sc = row.readiness_score;
  const cName = DIM_META[constraintCode].name;
  const cPct = Math.round((dims[constraintCode]?.pct ?? 0) * 100);

  // value math
  const c1 = row.value_band_1, c2 = row.value_band_2;
  let valueBig = "", valueSmall = "";
  if (c1 && c1 !== "unsure" && c2 && c2 !== "unsure") {
    const total = (C1_MID[c1] || 0) + (C2_MID[c2] || 0);
    valueBig = `${fmtUsd(Math.round(total * 0.25))}–${fmtUsd(Math.round(total * 0.40))}`;
    valueSmall = `annual value in reach · from ${esc(C1_LBL[c1] || c1)} lean-able overhead + ${esc(C2_LBL[c2] || c2)} unrealized revenue`;
  } else {
    valueBig = "Sized on the call";
    valueSmall = "they didn't share overhead / upside ranges — quantify it live";
  }

  // dimension bars (high → low)
  const dimRows = derive(row).sortedHighLow.map((d) => {
    const isC = d === constraintCode;
    const pct = Math.round((dims[d]?.pct ?? 0) * 100);
    return `<div class="dim ${isC ? "dim--c" : ""}">
      <div class="dim-name">${esc(DIM_META[d].name)}${isC ? '<span class="fixflag">fix first</span>' : ""}</div>
      <div class="dim-bar"><span style="width:${pct}%"></span></div>
      <div class="dim-meta"><b>${pct}%</b> · ${esc(dims[d]?.label ?? "")}</div>
    </div>`;
  }).join("");

  const oppCards = top3.map((d, i) => {
    const isC = d === constraintCode;
    return `<article class="opp ${isC ? "opp--c" : ""}">
      <div class="opp-rank"><span class="opp-num">${String(i + 1).padStart(2, "0")}</span>
        <span>${esc(DIM_META[d].name)} · ${esc(dims[d]?.label ?? "")}</span>
        ${isC ? '<span class="ctag">constraint</span>' : ""}</div>
      <h3>${esc(OPP_COPY[d].h)}</h3><p>${esc(OPP_COPY[d].b)}</p></article>`;
  }).join("");

  // ---- internal-only blocks ----
  const verdictCard = admin ? `
  <div class="verdict" style="--fc:${fm.color}">
    <div class="v-flag">${fm.dot} ${fm.label}</div>
    <div class="v-head">${esc(rec.head)}</div>
    <div class="v-meaning">${esc(rec.meaning)} · ICP ${row.icp_score} pts</div>
    <p class="v-body">${esc(rec.body)}</p>
    <div class="v-cta">${esc(rec.cta)} →</div>
  </div>` : "";

  const factStrip = admin ? `
  <div class="facts">
    ${[["Role", PROFILE_LBL.respondent_role[row.respondent_role] || row.respondent_role],
       ["Revenue", PROFILE_LBL.revenue[row.revenue] || row.revenue],
       ["Headcount", PROFILE_LBL.headcount[row.headcount] || row.headcount],
       ["Decision-maker", PROFILE_LBL.decision_maker[row.decision_maker] || row.decision_maker],
       ["Audience", PROFILE_LBL.audience[row.audience] || row.audience],
       ["Submitted", fmtDate(row.created_at)]]
      .map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("")}
  </div>` : "";

  const noteBlock = (admin && row.value_note && row.value_note.trim())
    ? `<div class="note"><span class="note-l">In their words — biggest time-eater</span>${esc(row.value_note)}</div>` : "";

  const ansRows = (row.answers || []).map((a, i) => {
    const q = QUESTIONS[i]; if (!q) return "";
    const col = a === null ? "#6F6A63" : a >= 2 ? GREEN : a === 1 ? WARN : RUST;
    const chosen = (a !== null && q.opts[a]) ? q.opts[a] : "—";
    return `<tr><td class="qn">Q${String(i + 1).padStart(2, "0")}</td><td class="qd">${q.dim}</td>
      <td><span class="qbadge" style="background:${col}1f;color:${col};border-color:${col}55">${a ?? "—"}</span></td>
      <td class="qt">${esc(q.text)}<span class="qchosen">${esc(chosen)}</span></td></tr>`;
  }).join("");

  const rawDetails = admin ? `
  <details class="raw"><summary>Full diagnostic data — profile + all 20 answers</summary>
    <table class="kv"><tbody>
      <tr><th>Email</th><td><a href="mailto:${esc(row.email)}">${esc(row.email)}</a></td></tr>
      <tr><th>Lean-able overhead</th><td>${c1 ? esc(C1_LBL[c1] || c1) : "—"}</td></tr>
      <tr><th>12-mo revenue upside</th><td>${c2 ? esc(C2_LBL[c2] || c2) : "—"}</td></tr>
      <tr><th>Center phase</th><td>${row.center_phase} / 3</td></tr>
      <tr><th>Referrer</th><td>${esc(row.referrer || "—")}</td></tr>
    </tbody></table>
    <table class="q"><tbody>${ansRows}</tbody></table>
  </details>` : "";

  // client-side recommendation (non-admin) — softer framing, no flag
  const clientCta = !admin ? `
  <div class="card cta">
    <div class="cta-head">${esc(rec.head.replace(" — talk to them directly.", ".").replace(" — get them on a call.", ".").replace(" — send the playbook.", "."))}</div>
    <p>${esc(rec.body)}</p>
    <div class="v-cta">${esc(rec.cta)} →</div>
  </div>` : "";

  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${esc(row.name)} · ${esc(comp)} — Readiness ${sc}/100</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--bg:#14101A;--elev:#1A1622;--soft:#1F1A28;--ink:#E8E4DC;--dim:#A39E96;--mute:#6F6A63;--rule:rgba(232,228,220,.08);--rule2:rgba(232,228,220,.16);--accent:${ACCENT};--rust:${RUST};--warn:${WARN};--green:${GREEN}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font-family:"DM Sans",system-ui,sans-serif;line-height:1.55;font-size:16px;-webkit-font-smoothing:antialiased}
.wrap{max-width:780px;margin:0 auto;padding:0 22px 90px}
.bar{display:flex;align-items:center;justify-content:space-between;padding:20px 0;border-bottom:1px solid var(--rule);position:sticky;top:0;background:rgba(20,16,26,.85);backdrop-filter:blur(10px);z-index:5}
.wordmark{font-weight:600;letter-spacing:.16em;font-size:13px;text-transform:uppercase}.wordmark span{color:var(--accent)}
.tagchip{font-family:"DM Mono",monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--mute);border:1px solid var(--rule2);border-radius:999px;padding:5px 11px}
.eyebrow{font-family:"DM Mono",monospace;font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:42px 0 12px}
h1{font-size:clamp(25px,5vw,36px);line-height:1.12;font-weight:500;letter-spacing:-.02em;margin:0 0 14px}
h1 strong{font-weight:600;color:#fff}
.sub{color:var(--dim);font-size:16.5px;max-width:60ch;margin:0 0 30px}.sub strong{color:var(--ink);font-weight:500}.sub .rust{color:var(--rust)}
.card{background:var(--elev);border:1px solid var(--rule);border-radius:16px;padding:26px;margin:16px 0}
/* hero: score + value side by side */
.top{display:grid;grid-template-columns:1fr;gap:14px;margin:14px 0}
.scorebox{background:var(--elev);border:1px solid var(--rule);border-radius:16px;padding:24px 26px}
.score{font-family:"DM Mono",monospace;font-size:68px;font-weight:500;line-height:.9;letter-spacing:-.03em}
.score .of{font-size:20px;color:var(--mute)}
.bandline{font-size:20px;font-weight:600;margin:8px 0 2px}
.phase{font-family:"DM Mono",monospace;font-size:12px;color:var(--dim);letter-spacing:.04em;margin-bottom:12px}
.gauge{height:8px;border-radius:99px;background:rgba(232,228,220,.07);overflow:hidden;margin-bottom:12px}
.gauge span{display:block;height:100%;border-radius:99px}
.bandcopy{color:var(--dim);font-size:14.5px;margin:0}
.valuebox{background:linear-gradient(160deg,rgba(123,201,196,.10),rgba(123,201,196,.02));border:1px solid var(--rule2);border-radius:16px;padding:24px 26px;display:flex;flex-direction:column;justify-content:center}
.value-l{font-family:"DM Mono",monospace;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--mute);margin-bottom:8px}
.value-big{font-size:32px;font-weight:600;color:#fff;letter-spacing:-.01em;line-height:1}
.value-small{color:var(--dim);font-size:13.5px;margin-top:9px}
/* verdict */
.verdict{border:1px solid var(--fc);border-radius:16px;padding:24px 26px;margin:16px 0;background:linear-gradient(160deg,color-mix(in srgb,var(--fc) 12%,transparent),transparent)}
.v-flag{display:inline-block;background:var(--fc);color:#0F0C14;font:600 12px "DM Mono",monospace;letter-spacing:.1em;border-radius:999px;padding:5px 12px;margin-bottom:13px}
.v-head{font-size:21px;font-weight:600;color:#fff;letter-spacing:-.01em}
.v-meaning{font-family:"DM Mono",monospace;font-size:12px;color:var(--fc);letter-spacing:.04em;margin:5px 0 12px;text-transform:uppercase}
.v-body{color:var(--dim);font-size:15px;margin:0 0 16px}
.v-cta{display:inline-block;background:var(--fc);color:#0F0C14;font-weight:600;font-size:14.5px;padding:12px 20px;border-radius:10px}
/* fact strip */
.facts{display:flex;flex-wrap:wrap;gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:14px;overflow:hidden;margin:16px 0}
.facts>div{flex:1;min-width:120px;background:var(--elev);padding:13px 16px}
.facts span{display:block;font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);margin-bottom:4px}
.facts b{font-weight:500;font-size:14px}
.note{background:var(--soft);border-left:3px solid var(--rust);border-radius:0 12px 12px 0;padding:16px 18px;margin:16px 0;color:var(--ink);font-size:15px;font-style:italic}
.note-l{display:block;font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);margin-bottom:7px;font-style:normal}
.sec-h{font-family:"DM Mono",monospace;font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--mute);margin:40px 0 12px;padding-bottom:10px;border-bottom:1px solid var(--rule)}
.dim{display:grid;grid-template-columns:1fr;gap:6px;padding:13px 0;border-bottom:1px solid var(--rule)}
.dim-name{font-weight:500;font-size:15px}.fixflag{color:var(--rust);font-size:10.5px;font-family:"DM Mono",monospace;margin-left:10px;letter-spacing:.06em;text-transform:uppercase;border:1px solid var(--rust);border-radius:99px;padding:2px 8px}
.dim-bar{height:7px;border-radius:99px;background:rgba(232,228,220,.07);overflow:hidden}
.dim-bar span{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--accent),#A9E0DC)}
.dim--c .dim-bar span{background:linear-gradient(90deg,var(--rust),#E0A488)}
.dim-meta{font-family:"DM Mono",monospace;font-size:12px;color:var(--dim)}.dim-meta b{color:var(--ink)}
.opp{background:var(--elev);border:1px solid var(--rule);border-left:3px solid var(--accent);border-radius:12px;padding:18px 20px;margin:11px 0}
.opp--c{border-left-color:var(--rust)}
.opp-rank{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-family:"DM Mono",monospace;font-size:12px;color:var(--dim);margin-bottom:8px}
.opp-num{color:var(--accent);font-weight:500}.opp--c .opp-num{color:var(--rust)}
.ctag{background:rgba(201,125,92,.16);color:var(--rust);border-radius:999px;padding:3px 9px;font-size:10px;letter-spacing:.08em;text-transform:uppercase}
.opp h3{margin:0 0 6px;font-size:16.5px;font-weight:600}.opp p{margin:0;color:var(--dim);font-size:14px}
.cta .cta-head{font-size:19px;font-weight:600;color:#fff;margin-bottom:8px}.cta p{color:var(--dim);font-size:14.5px;margin:0 0 15px}
.raw{margin-top:30px;border:1px solid var(--rule);border-radius:14px;background:var(--elev);overflow:hidden}
.raw summary{cursor:pointer;padding:16px 20px;font-family:"DM Mono",monospace;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);user-select:none}
.raw summary:hover{color:var(--ink)}
.raw[open] summary{border-bottom:1px solid var(--rule)}
.raw>table{margin:8px 18px}
table.kv{width:calc(100% - 36px);border-collapse:collapse;font-size:14px}
table.kv th{text-align:left;color:var(--mute);font-weight:400;font-family:"DM Mono",monospace;font-size:11px;letter-spacing:.05em;text-transform:uppercase;padding:10px 14px 10px 0;white-space:nowrap;vertical-align:top;width:160px;border-bottom:1px solid var(--rule)}
table.kv td{padding:10px 0;border-bottom:1px solid var(--rule)}table.kv a{color:var(--accent)}
table.q{width:calc(100% - 36px);border-collapse:collapse;font-size:13px;margin-bottom:16px}
table.q td{padding:9px 8px 9px 0;border-bottom:1px solid var(--rule);vertical-align:top}
.qn{font-family:"DM Mono",monospace;color:var(--mute);white-space:nowrap}.qd{font-family:"DM Mono",monospace;color:var(--dim);font-size:11px}
.qbadge{font-family:"DM Mono",monospace;display:inline-block;min-width:22px;text-align:center;border:1px solid;border-radius:6px;padding:2px 0}
.qt{color:var(--dim)}.qchosen{display:block;color:var(--ink);margin-top:3px;font-size:12.5px}
.foot{margin-top:40px;color:var(--mute);font-family:"DM Mono",monospace;font-size:11px;letter-spacing:.04em;text-align:center}
@media(min-width:620px){.top{grid-template-columns:1.15fr 1fr}.dim{grid-template-columns:200px 1fr 180px;align-items:center;gap:18px}}
</style></head>
<body><div class="wrap">
<div class="bar"><div class="wordmark">Ovae<span>.</span> Readiness</div><div class="tagchip">${admin ? "Internal lead report" : "Your readiness report"}</div></div>

<div class="eyebrow">AI-Native Readiness · ${esc(comp)}</div>
<h1>${esc(row.name)}, here is where <strong>${esc(comp)}</strong> sits today.</h1>
<p class="sub">${admin ? "" : "Across six dimensions, "}the business reads as <strong>${esc(band.name)}</strong>. The single biggest unlock is <strong class="rust">${esc(cName)}</strong> (${cPct}%) — the constraint. Everything else compounds once that's moved.</p>

${verdictCard}
${factStrip}

<div class="top">
  <div class="scorebox">
    <div class="score" style="color:${SCORE_COLOR(sc)}">${sc}<span class="of"> / 100</span></div>
    <div class="bandline">${esc(band.name)}</div>
    <div class="phase">Phase ${row.center_phase} / 3 · ${esc(band.phase)}</div>
    <div class="gauge"><span style="width:${sc}%;background:${SCORE_COLOR(sc)}"></span></div>
    <p class="bandcopy">${esc(band.copy)}</p>
  </div>
  <div class="valuebox">
    <div class="value-l">The opportunity</div>
    <div class="value-big">${esc(valueBig)}</div>
    <div class="value-small">${valueSmall}</div>
  </div>
</div>

${noteBlock}

<div class="sec-h">Where to start — the constraint</div>
${dimRows}

<div class="sec-h">Top 3 moves (lowest first)</div>
${oppCards}

${clientCta}
${rawDetails}

<div class="foot">Ovae · AI-Native Readiness Diagnostic${admin ? " · internal" : ""}</div>
</div></body></html>`;
}

// ============================================================
// LEADS INDEX (admin-only)
// ============================================================
const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%2314101A'/%3E%3Ccircle cx='16' cy='16' r='7' fill='none' stroke='%237BC9C4' stroke-width='2.5'/%3E%3C/svg%3E";

function leadValue(r: Row): { lo: number; hi: number; mid: number } | null {
  const c1 = r.value_band_1, c2 = r.value_band_2;
  if (c1 && c1 !== "unsure" && c2 && c2 !== "unsure") {
    const t = (C1_MID[c1] || 0) + (C2_MID[c2] || 0);
    return { lo: Math.round(t * 0.25), hi: Math.round(t * 0.40), mid: Math.round(t * 0.325) };
  }
  return null;
}
function shortDate(iso: string): string {
  try { return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" }); }
  catch { return iso; }
}
function relDate(iso: string): string {
  try {
    const d = (Date.now() - new Date(iso).getTime()) / 86400000;
    if (d < 1) return "today"; if (d < 2) return "1d ago";
    if (d < 30) return Math.floor(d) + "d ago";
    if (d < 365) return Math.floor(d / 30) + "mo ago";
    return Math.floor(d / 365) + "y ago";
  } catch { return ""; }
}

export function renderLeadsHTML(rows: Row[], token: string): string {
  const n = rows.length;
  const byFlag = (f: string) => rows.filter((r) => r.flag === f).length;
  const avg = n ? Math.round(rows.reduce((s, r) => s + (r.readiness_score || 0), 0) / n) : 0;
  const pipeline = rows.reduce((s, r) => s + (leadValue(r)?.mid || 0), 0);

  const RANK: Record<string, number> = { flagship: 0, qualified: 1, nurture: 2 };
  const sorted = [...rows].sort((a, b) => {
    const r = (RANK[a.flag] ?? 9) - (RANK[b.flag] ?? 9); if (r) return r;
    const vb = (leadValue(b)?.mid || 0) - (leadValue(a)?.mid || 0); if (vb) return vb;
    if (b.readiness_score - a.readiness_score) return b.readiness_score - a.readiness_score;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const rowsHtml = sorted.map((r) => {
    const fm = flagMeta(r.flag);
    const sc = r.readiness_score;
    const v = leadValue(r);
    const q = (r.name + " " + (r.company || "")).toLowerCase();
    const isNew = (Date.now() - new Date(r.created_at).getTime()) < 1.728e8; // < 48h
    return `<div class="lead${r.flag === "flagship" ? " lead--hot" : ""}" data-flag="${esc(r.flag)}" data-q="${esc(q)}" data-score="${sc}" data-val="${v?.mid || 0}" data-date="${new Date(r.created_at).getTime()}">
      <a class="l-cover" href="/readiness/r/?id=${esc(r.id)}&k=${esc(token)}" aria-label="Open report: ${esc(r.name)}, ${esc(r.company || "")}, score ${sc}, ${esc(fm.label)}"></a>
      <span class="l-flag" style="--fc:${fm.color}">${fm.dot} ${esc(fm.label)}</span>
      <span class="l-name"><b>${esc(r.name)}</b><span class="l-sub">${esc(r.company || "—")} · <a class="l-mail" href="mailto:${esc(r.email)}">email</a></span><span class="l-con">▸ ${esc(r.constraint_dim)}</span></span>
      <span class="l-score" style="color:${SCORE_COLOR(sc)}">${sc}</span>
      <span class="l-val">${v ? `${fmtUsd(v.lo)}–${fmtUsd(v.hi)}` : '<span class="dimd">—</span>'}</span>
      <span class="l-icp">${r.icp_score}</span>
      <span class="l-when">${isNew ? '<span class="l-new">NEW</span>' : ""}${esc(shortDate(r.created_at))}<span class="l-rel">${esc(relDate(r.created_at))}</span></span>
      <span class="l-go">→</span>
    </div>`;
  }).join("");

  const top = sorted[0];
  const showHero = top && (top.flag === "flagship" || top.flag === "qualified");
  const tv = top ? leadValue(top) : null;
  const heroHtml = showHero ? `<a class="callnext" data-flag="${esc(top.flag)}" href="/readiness/r/?id=${esc(top.id)}&k=${esc(token)}">
    <span class="cn-l">${flagMeta(top.flag).dot} Call next</span>
    <span class="cn-main"><b>${esc(top.name)}</b> · ${esc(top.company || "—")}</span>
    <span class="cn-meta">${esc(flagMeta(top.flag).label)} · ${top.readiness_score}/100${tv ? ` · ${fmtUsd(tv.lo)}–${fmtUsd(tv.hi)}` : ""} · fix ${esc(top.constraint_dim)}</span>
    <span class="cn-go">Open report →</span>
  </a>` : "";

  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>Readiness leads · ${n} · ${byFlag("flagship")} flagship</title>
<link rel="icon" href="${FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--bg:#14101A;--elev:#1A1622;--soft:#1F1A28;--ink:#E8E4DC;--dim:#A39E96;--mute:#6F6A63;--rule:rgba(232,228,220,.08);--rule2:rgba(232,228,220,.16);--accent:${ACCENT};--rust:${RUST};--warn:${WARN};--green:${GREEN}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:"DM Sans",system-ui,sans-serif;font-size:15px}
.wrap{max-width:960px;margin:0 auto;padding:0 22px 80px}
.bar{display:flex;align-items:center;justify-content:space-between;padding:20px 0;border-bottom:1px solid var(--rule)}
.wordmark{font-weight:600;letter-spacing:.16em;font-size:13px;text-transform:uppercase}.wordmark span{color:var(--accent)}
.tagchip{font-family:"DM Mono",monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--mute);border:1px solid var(--rule2);border-radius:999px;padding:5px 11px}
h1{font-size:26px;font-weight:500;letter-spacing:-.02em;margin:34px 0 4px}
.subhead{color:var(--dim);font-size:14px;margin-bottom:20px}
.stats{display:flex;flex-wrap:wrap;gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:14px;overflow:hidden;margin-bottom:24px}
.stats>div{flex:1;min-width:110px;background:var(--elev);padding:15px 18px}
.stats .s-l{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);margin-bottom:5px}
.stats .s-v{font-size:24px;font-weight:600}
.head,.lead{display:grid;grid-template-columns:118px 1fr 48px 116px 40px 92px 18px;gap:14px;align-items:center}
.head{padding:0 16px 10px;font-family:"DM Mono",monospace;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--mute)}
.lead{position:relative;padding:14px 16px;border:1px solid var(--rule);border-radius:12px;margin-bottom:8px;background:var(--elev);color:var(--ink);transition:background .15s,border-color .15s}
.lead:hover{background:var(--soft);border-color:var(--rule2)}
.lead:hover .l-go{opacity:1;transform:translateX(0)}
.l-cover{position:absolute;inset:0;border-radius:12px;z-index:2;text-indent:-9999px;overflow:hidden}
.l-cover:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.l-mail{color:var(--accent);text-decoration:none;position:relative;z-index:3}
.l-flag{font:600 10.5px "DM Mono",monospace;letter-spacing:.06em;color:var(--fc);border:1px solid var(--fc);border-radius:999px;padding:4px 8px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.l-name b{font-weight:600;display:block}.l-sub{color:var(--dim);font-size:13px}
.l-mail{color:var(--accent);text-decoration:none}.l-mail:hover{text-decoration:underline}
.l-score{font-family:"DM Mono",monospace;font-size:20px;font-weight:500;text-align:right}
.l-val{font-family:"DM Mono",monospace;font-size:13px;color:var(--ink);text-align:right}.l-val .dimd{color:var(--mute)}
.l-icp{font-family:"DM Mono",monospace;font-size:14px;color:var(--dim);text-align:center}
.l-when{font-family:"DM Mono",monospace;font-size:11.5px;color:var(--ink)}.l-rel{display:block;color:var(--mute);font-size:10.5px}
.l-go{color:var(--accent);opacity:0;transform:translateX(-4px);transition:opacity .15s,transform .15s;text-align:center}
.lead--hot{box-shadow:inset 3px 0 0 var(--green)}
.lead{transition:background .15s,border-color .15s,transform .15s}
.lead:hover{transform:translateY(-1px)}
.l-con{display:block;font:500 11px "DM Mono",monospace;color:var(--rust);margin-top:4px;letter-spacing:.02em}
.l-new{display:inline-block;background:var(--green);color:#0F0C14;font:600 8.5px "DM Mono",monospace;letter-spacing:.08em;border-radius:4px;padding:1px 5px;margin-right:6px;vertical-align:middle}
.callnext{position:relative;display:flex;flex-wrap:wrap;align-items:center;gap:6px 16px;background:linear-gradient(120deg,rgba(99,224,132,.13),rgba(99,224,132,.02));border:1px solid rgba(99,224,132,.42);border-radius:14px;padding:18px 22px;margin-bottom:22px;text-decoration:none;color:var(--ink);transition:transform .15s,box-shadow .15s}
.callnext:hover{transform:translateY(-1px);box-shadow:0 8px 30px rgba(99,224,132,.10)}
.callnext[data-flag="qualified"]{background:linear-gradient(120deg,rgba(217,178,107,.13),transparent);border-color:rgba(217,178,107,.42)}
.cn-l{font:600 11px "DM Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--green)}
.callnext[data-flag="qualified"] .cn-l{color:var(--warn)}
.cn-main{font-size:18px;font-weight:600}.cn-main b{color:#fff}
.cn-meta{font:500 12px "DM Mono",monospace;color:var(--dim);flex-basis:100%}
.cn-go{margin-left:auto;font:600 13px "DM Sans",sans-serif;color:var(--green);white-space:nowrap}
.callnext[data-flag="qualified"] .cn-go{color:var(--warn)}
.lfoot{margin-top:30px;padding-top:18px;border-top:1px solid var(--rule);color:var(--mute);font:500 11.5px "DM Mono",monospace;letter-spacing:.04em;text-align:center}
.toolbar{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:16px;position:sticky;top:0;background:var(--bg);z-index:4;padding:10px 0}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chip{font:500 12px "DM Sans",sans-serif;color:var(--dim);background:var(--elev);border:1px solid var(--rule2);border-radius:999px;padding:7px 13px;cursor:pointer;transition:.15s;white-space:nowrap}
.chip:hover{color:var(--ink);border-color:var(--fc,var(--rule2))}
.chip.active{color:#0F0C14;background:var(--fc,var(--ink));border-color:transparent;font-weight:600}
.tools{display:flex;gap:8px}
.search,.sort{font:400 13px "DM Sans",sans-serif;background:var(--elev);border:1px solid var(--rule2);border-radius:9px;padding:8px 12px;color:var(--ink)}
.search{min-width:180px}.search::placeholder{color:var(--mute)}
.sort{cursor:pointer}
.search:focus,.sort:focus{outline:none;border-color:var(--accent)}
.stats>[data-f]{cursor:pointer}.stats>[data-f]:hover{background:var(--soft)}
.empty{color:var(--dim);padding:36px;text-align:center}
@media(max-width:700px){.tools{width:100%}.search{flex:1}.head{display:none}.lead{grid-template-columns:1fr 46px;grid-auto-flow:row}.l-flag{grid-column:1;justify-self:start}.l-score{grid-row:1;grid-column:2}.l-name{grid-column:1/3}.l-val,.l-icp,.l-when{grid-column:1/3;text-align:left}.l-go{display:none}}
</style></head>
<body><div class="wrap">
<div class="bar"><div class="wordmark">Ovae<span>.</span> Readiness</div><div class="tagchip">Leads · internal</div></div>
<h1>Readiness leads</h1>
<div class="subhead"><span id="count">${n}</span> of ${n} ${n === 1 ? "lead" : "leads"} · sorted by priority</div>
${heroHtml}
<div class="stats">
  <div><div class="s-l">Total</div><div class="s-v">${n}</div></div>
  <div data-f="flagship"><div class="s-l">★ Flagship</div><div class="s-v" style="color:${GREEN}">${byFlag("flagship")}</div></div>
  <div data-f="qualified"><div class="s-l">◇ Qualified</div><div class="s-v" style="color:${WARN}">${byFlag("qualified")}</div></div>
  <div data-f="nurture"><div class="s-l">○ Nurture</div><div class="s-v" style="color:${ACCENT}">${byFlag("nurture")}</div></div>
  <div><div class="s-l">Avg score</div><div class="s-v">${avg}</div></div>
  <div><div class="s-l">Pipeline (est.)</div><div class="s-v" style="color:${GREEN}">${pipeline ? fmtUsd(pipeline) : "—"}</div></div>
</div>
<div class="toolbar">
  <div class="chips">
    <button class="chip active" data-f="all">All</button>
    <button class="chip" data-f="flagship" style="--fc:${GREEN}">★ Flagship · ${byFlag("flagship")}</button>
    <button class="chip" data-f="qualified" style="--fc:${WARN}">◇ Qualified · ${byFlag("qualified")}</button>
    <button class="chip" data-f="nurture" style="--fc:${ACCENT}">○ Nurture · ${byFlag("nurture")}</button>
  </div>
  <div class="tools">
    <input id="q" class="search" type="search" placeholder="Search name or company…" autocomplete="off">
    <select id="sort" class="sort" aria-label="Sort leads">
      <option value="priority">Priority</option>
      <option value="newest">Newest</option>
      <option value="score">Score</option>
      <option value="value">Opportunity</option>
    </select>
  </div>
</div>
<div class="head"><span>Flag</span><span>Lead</span><span style="text-align:right">Score</span><span style="text-align:right">Opportunity</span><span style="text-align:center">ICP</span><span>Submitted</span><span></span></div>
<div id="list">${rowsHtml}</div>
<div id="empty" class="empty" style="display:none">No leads match this filter.</div>
${n ? "" : '<div class="empty">No submissions yet.</div>'}
<div class="lfoot">Pipeline (est.) ${pipeline ? fmtUsd(pipeline) : "—"} across ${n} ${n === 1 ? "lead" : "leads"} · ovae.ai/readiness</div>
</div>
<script>
(function(){
  var list=document.getElementById('list'); if(!list)return;
  var rows=[].slice.call(list.querySelectorAll('.lead'));
  var q=document.getElementById('q'), sortSel=document.getElementById('sort');
  var filter='all', term='', RANK={flagship:0,qualified:1,nurture:2};
  function num(el,k){return parseFloat(el.getAttribute('data-'+k))||0;}
  function rank(el){var v=RANK[el.getAttribute('data-flag')];return v==null?9:v;}
  function apply(){
    var key=sortSel.value;
    rows.sort(function(a,b){
      if(key==='newest')return num(b,'date')-num(a,'date');
      if(key==='score')return num(b,'score')-num(a,'score');
      if(key==='value')return num(b,'val')-num(a,'val');
      var r=rank(a)-rank(b); if(r)return r;
      var dv=num(b,'val')-num(a,'val'); if(dv)return dv;
      return num(b,'score')-num(a,'score');
    });
    var shown=0;
    rows.forEach(function(el){
      var okF=filter==='all'||el.getAttribute('data-flag')===filter;
      var okQ=!term||el.getAttribute('data-q').indexOf(term)>-1;
      var vis=okF&&okQ; el.style.display=vis?'':'none'; if(vis)shown++;
      list.appendChild(el);
    });
    var e=document.getElementById('empty'); if(e)e.style.display=shown?'none':'block';
    var c=document.getElementById('count'); if(c)c.textContent=shown;
  }
  function setFilter(f){
    filter=f;
    [].forEach.call(document.querySelectorAll('.chip'),function(c){c.classList.toggle('active',c.getAttribute('data-f')===f);});
    apply();
  }
  [].forEach.call(document.querySelectorAll('[data-f]'),function(c){
    c.addEventListener('click',function(){setFilter(c.getAttribute('data-f'));});
  });
  q.addEventListener('input',function(){term=q.value.trim().toLowerCase();apply();});
  sortSel.addEventListener('change',apply);
  document.addEventListener('keydown',function(e){
    var t=document.activeElement, tag=t?t.tagName:'';
    if(e.key==='/'&&tag!=='INPUT'&&tag!=='TEXTAREA'&&tag!=='SELECT'){e.preventDefault();q.focus();}
    if(e.key==='Escape'&&t===q){q.value='';term='';q.blur();apply();}
  });
  apply();
})();
</script>
</body></html>`;
}

// ============================================================
// NOTIFICATION EMAIL (sent to CT on every submission)
// ============================================================
export function renderEmailHTML(row: Row, reportUrl: string): string {
  const { constraintCode, band } = derive(row);
  const comp = row.company || "—";
  const fm = flagMeta(row.flag);
  const rec = REC_COPY[row.flag] || REC_COPY.nurture;
  const sc = row.readiness_score;
  const note = row.value_note && row.value_note.trim()
    ? `<tr><td style="padding:6px 0;color:#A39E96;font-size:14px"><b style="color:#E8E4DC">Time-eater:</b> ${esc(row.value_note)}</td></tr>` : "";
  const fact = (k: string, v: string) =>
    `<tr><td style="padding:5px 14px 5px 0;color:#6F6A63;font:500 11px 'DM Mono',monospace;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:5px 0;color:#E8E4DC;font-size:14px">${v}</td></tr>`;

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@500&display=swap" rel="stylesheet"></head>
<body style="margin:0;background:#0F0C14;font-family:'DM Sans',Helvetica,Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${fm.label} lead · ${esc(row.name)} · ${esc(comp)} · ${sc}/100 · ${esc(rec.head)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0F0C14"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#14101A;border:1px solid rgba(232,228,220,.1);border-radius:18px;overflow:hidden">

  <tr><td style="padding:22px 30px;border-bottom:1px solid rgba(232,228,220,.08)">
    <span style="font:600 13px 'DM Sans';letter-spacing:.16em;text-transform:uppercase;color:#E8E4DC">Ovae<span style="color:${ACCENT}">.</span> Readiness</span>
  </td></tr>

  <tr><td style="padding:28px 30px 4px">
    <div style="display:inline-block;background:${fm.color};color:#0F0C14;border-radius:999px;padding:5px 12px;font:600 11px 'DM Mono',monospace;letter-spacing:.1em;margin-bottom:14px">${fm.dot} ${fm.label}</div>
    <div style="font:600 24px 'DM Sans';color:#fff;letter-spacing:-.01em">${esc(row.name)}</div>
    <div style="font-size:15px;color:#A39E96;margin-top:3px">${esc(comp)} · <a href="mailto:${esc(row.email)}" style="color:${ACCENT};text-decoration:none">${esc(row.email)}</a></div>
    <div style="font:500 14px 'DM Sans';color:#E8E4DC;margin-top:12px">${esc(rec.head)}</div>
  </td></tr>

  <tr><td style="padding:18px 30px 6px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1A1622;border:1px solid rgba(232,228,220,.1);border-radius:14px"><tr>
      <td style="padding:18px 22px;vertical-align:middle">
        <div style="font:500 48px 'DM Mono',monospace;line-height:.9;color:${SCORE_COLOR(sc)}">${sc}<span style="font-size:16px;color:#6F6A63"> / 100</span></div>
        <div style="font:600 16px 'DM Sans';color:#E8E4DC;margin-top:8px">${esc(band.name)}</div>
      </td>
      <td style="padding:18px 22px;vertical-align:middle;text-align:right">
        <div style="font:500 10px 'DM Mono',monospace;color:#6F6A63;letter-spacing:.1em;text-transform:uppercase">Constraint</div>
        <div style="font:600 16px 'DM Sans';color:${RUST};margin:3px 0 10px">${esc(DIM_META[constraintCode].name)}</div>
        <div style="font:500 10px 'DM Mono',monospace;color:#6F6A63;letter-spacing:.1em;text-transform:uppercase">ICP</div>
        <div style="font:600 16px 'DM Sans';color:#E8E4DC;margin-top:3px">${row.icp_score} pts</div>
      </td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:12px 30px 4px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${fact("Role", esc(PROFILE_LBL.respondent_role[row.respondent_role] || row.respondent_role))}
      ${fact("Revenue", esc(PROFILE_LBL.revenue[row.revenue] || row.revenue))}
      ${fact("Headcount", esc(PROFILE_LBL.headcount[row.headcount] || row.headcount))}
      ${note}
    </table>
  </td></tr>

  <tr><td style="padding:22px 30px 30px">
    <a href="${esc(reportUrl)}" style="display:block;text-align:center;background:${ACCENT};color:#0F0C14;text-decoration:none;font:600 15px 'DM Sans';padding:15px;border-radius:11px">View full lead report →</a>
  </td></tr>

  <tr><td style="padding:16px 30px;border-top:1px solid rgba(232,228,220,.08);text-align:center">
    <span style="font:500 10.5px 'DM Mono',monospace;letter-spacing:.1em;color:#6F6A63;text-transform:uppercase">ovae.ai/readiness · ${esc(fmtDate(row.created_at))}</span>
  </td></tr>

</table></td></tr></table></body></html>`;
}
