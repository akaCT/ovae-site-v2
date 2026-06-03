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
