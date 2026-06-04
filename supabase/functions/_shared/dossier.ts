import {
  ACCENT, RUST, WARN, GREEN, esc, fmtUsd,
  STAGES, STAGE_LABEL, STAGE_COLOR, srcMeta, SCORE_COLOR, dealStr, oppStr, fmtDate, relDate,
  type PRow, type CNote,
} from "./pipeline-core.ts";
import { DIM_META, flagMeta } from "./readiness.ts";

const KIND = { note: "Note", call: "Call", email: "Email", artifact: "Artifact" };
const KIND_COLOR: Record<string, string> = { note: "#A39E96", call: "#7BC9C4", email: "#8FB8FF", artifact: "#B89CFF" };

export function renderClientHTML(row: PRow, readiness: any | null, notes: CNote[], token: string): string {
  const fm = row.flag ? flagMeta(row.flag) : null;
  const sm = srcMeta(row.source);
  const stageColor = STAGE_COLOR[row.stage] || ACCENT;
  const details = row.details || {};
  const factKeys = Object.keys(details);
  const activity = notes.filter((n) => n.kind !== "artifact");
  const artifacts = notes.filter((n) => n.kind === "artifact");

  const stageOpts = STAGES.map((s) => `<option value="${s.k}"${s.k === row.stage ? " selected" : ""}>${s.label}</option>`).join("");

  const factRows = factKeys.length
    ? factKeys.map((k) => `<div class="fact"><div class="fact-k">${esc(k)}</div><div class="fact-v">${esc(details[k])}</div><button class="fact-x" data-key="${esc(k)}" title="Remove">×</button></div>`).join("")
    : '<div class="muted">No facts yet — add what you know about this client.</div>';

  // diagnostic (readiness)
  let diag = "";
  if (readiness && readiness.dimensions) {
    const dims = readiness.dimensions;
    const order = Object.keys(dims).sort((a, b) => (dims[b].pct - dims[a].pct));
    const bars = order.map((d) => {
      const pct = Math.round((dims[d]?.pct ?? 0) * 100);
      const isC = DIM_META[d] && DIM_META[d].name === row.constraint_dim;
      return `<div class="dbar"><span class="dbar-n">${esc(DIM_META[d]?.name || d)}</span><span class="dbar-t"><i style="width:${pct}%;background:${isC ? RUST : ACCENT}"></i></span><span class="dbar-p">${pct}%</span></div>`;
    }).join("");
    diag = `<section class="sec"><h2>Readiness diagnostic</h2>
      <div class="diag-top">
        <div class="diag-score" style="color:${SCORE_COLOR(row.readiness_score || 0)}">${row.readiness_score}<span>/100</span></div>
        <div><div class="muted">Band</div><b>${esc(readiness.band || "—")}</b></div>
        <div><div class="muted">Constraint</div><b style="color:${RUST}">${esc(row.constraint_dim || "—")}</b></div>
        <a class="btn-ghost" href="/readiness/r/?id=${esc(row.readiness_id || "")}&k=${esc(token)}">Open full report →</a>
      </div>${bars}</section>`;
  } else if (row.readiness_score != null) {
    diag = `<section class="sec"><h2>Diagnostic</h2><div class="diag-top">
      <div class="diag-score" style="color:${SCORE_COLOR(row.readiness_score)}">${row.readiness_score}<span>/100</span></div>
      <div><div class="muted">Constraint</div><b style="color:${RUST}">${esc(row.constraint_dim || "—")}</b></div></div></section>`;
  }

  const noteRow = (n: CNote) => `<div class="note" data-id="${esc(n.id)}">
    <div class="note-h"><span class="note-kind" style="--kc:${KIND_COLOR[n.kind] || "#A39E96"}">${esc(KIND[n.kind as keyof typeof KIND] || n.kind)}</span>
      ${n.title ? `<span class="note-title">${esc(n.title)}</span>` : ""}
      <span class="note-date">${esc(fmtDate(n.created_at))} · ${esc(relDate(n.created_at))}</span>
      <button class="note-x" data-id="${esc(n.id)}" title="Delete">×</button></div>
    ${n.body ? `<div class="note-body">${esc(n.body).replace(/\n/g, "<br>")}</div>` : ""}
    ${n.url ? `<a class="note-url" href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.url)}</a>` : ""}
  </div>`;

  const artifactRow = (n: CNote) => `<div class="art" data-id="${esc(n.id)}">
    <span class="art-i">📄</span>
    <div class="art-main"><b>${esc(n.title || "Artifact")}</b>${n.body ? `<div class="art-body">${esc(n.body.slice(0, 240))}${n.body.length > 240 ? "…" : ""}</div>` : ""}${n.url ? `<a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.url)}</a>` : ""}</div>
    <button class="note-x" data-id="${esc(n.id)}" title="Delete">×</button></div>`;

  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(row.name)} · ${esc(row.company || "")} — Ovae</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%2314101A'/%3E%3Ccircle cx='16' cy='16' r='7' fill='none' stroke='%237BC9C4' stroke-width='2.5'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--bg:#14101A;--elev:#1A1622;--soft:#1F1A28;--ink:#E8E4DC;--dim:#A39E96;--mute:#6F6A63;--rule:rgba(232,228,220,.08);--rule2:rgba(232,228,220,.16);--accent:${ACCENT};--rust:${RUST};--warn:${WARN};--green:${GREEN}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:"DM Sans",system-ui,sans-serif;font-size:15px;line-height:1.5}
.wrap{max-width:880px;margin:0 auto;padding:0 22px 160px}
.bar{display:flex;align-items:center;justify-content:space-between;padding:18px 0;border-bottom:1px solid var(--rule)}
.back{color:var(--dim);text-decoration:none;font:500 13px "DM Sans";display:inline-flex;gap:7px}.back:hover{color:var(--ink)}
.wordmark{font-weight:600;letter-spacing:.16em;font-size:12px;text-transform:uppercase}.wordmark span{color:var(--accent)}
.hd{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin:30px 0 6px}
h1{font-size:30px;font-weight:600;letter-spacing:-.02em;margin:0}
.sub{color:var(--dim);font-size:16px;margin-top:3px}
.badges{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 0}
.bdg{font:600 10.5px "DM Mono",monospace;letter-spacing:.08em;border-radius:999px;padding:4px 10px;border:1px solid}
.btn{font:600 13px "DM Sans";border-radius:9px;padding:9px 15px;cursor:pointer;border:1px solid transparent;text-decoration:none;display:inline-block}
.btn-edit{background:var(--accent);color:#0F0C14}
.btn-ghost{background:transparent;border:1px solid var(--rule2);color:var(--dim);font:500 12px "DM Sans";border-radius:8px;padding:7px 12px;text-decoration:none}
.btn-ghost:hover{color:var(--ink);border-color:var(--accent)}
.refbar{display:flex;align-items:center;gap:9px;margin:16px 0 4px;padding:11px 16px;background:linear-gradient(120deg,rgba(123,201,196,.14),rgba(123,201,196,.03));border:1px solid rgba(123,201,196,.45);border-radius:12px;font-size:15px}
.refbar-i{color:var(--accent);font-weight:700}
.refbar-l{font:600 10.5px "DM Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--mute)}
.refbar b{color:#fff;font-weight:600}
.kpis{display:flex;flex-wrap:wrap;gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:14px;overflow:hidden;margin:16px 0}
.kpi{flex:1;min-width:130px;background:var(--elev);padding:15px 18px}
.kpi .l{font:500 10px "DM Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);margin-bottom:5px}
.kpi .v{font-size:19px;font-weight:600}
.nextstep{background:linear-gradient(120deg,rgba(123,201,196,.10),transparent);border:1px solid var(--rule2);border-radius:12px;padding:14px 18px;margin:14px 0;display:flex;gap:10px;align-items:center}
.nextstep .l{font:600 10px "DM Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
.contacts{display:flex;gap:16px;flex-wrap:wrap;margin:12px 0 8px}
.contacts a,.contacts span{color:var(--accent);text-decoration:none;font-size:14px}.contacts .muted{color:var(--mute)}
.sec{margin-top:34px}
.sec h2{font:600 12px "DM Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--mute);margin:0 0 14px;padding-bottom:10px;border-bottom:1px solid var(--rule);display:flex;justify-content:space-between;align-items:center}
.sec h2 .add{font:600 11px "DM Sans";color:var(--accent);cursor:pointer;text-transform:none;letter-spacing:0}
.facts{display:grid;grid-template-columns:1fr;gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:12px;overflow:hidden}
.fact{display:grid;grid-template-columns:200px 1fr 28px;background:var(--elev);padding:11px 14px;align-items:center;gap:10px}
.fact-k{font:500 12px "DM Mono",monospace;color:var(--dim);text-transform:uppercase;letter-spacing:.04em}
.fact-v{font-size:14.5px}
.fact-x{background:none;border:none;color:var(--mute);font-size:17px;cursor:pointer;line-height:1}.fact-x:hover{color:var(--rust)}
.muted{color:var(--mute);font-size:14px;padding:8px 0}
.diag-top{display:flex;align-items:center;gap:26px;flex-wrap:wrap;margin-bottom:16px}
.diag-score{font:500 40px "DM Mono",monospace;line-height:1}.diag-score span{font-size:15px;color:var(--mute)}
.dbar{display:grid;grid-template-columns:180px 1fr 44px;gap:12px;align-items:center;padding:7px 0;font-size:13.5px}
.dbar-t{height:6px;background:rgba(232,228,220,.07);border-radius:99px;overflow:hidden}.dbar-t i{display:block;height:100%;border-radius:99px}
.dbar-p{font-family:"DM Mono",monospace;font-size:12px;color:var(--dim);text-align:right}
.addform{background:var(--soft);border:1px solid var(--rule2);border-radius:11px;padding:14px;margin-bottom:14px;display:none}
.addform.show{display:block}
.addform .row{display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap}
.addform input,.addform select,.addform textarea{font:400 13px "DM Sans";background:var(--bg);border:1px solid var(--rule2);border-radius:8px;padding:8px 10px;color:var(--ink);flex:1;min-width:120px}
.addform textarea{width:100%;min-height:60px;resize:vertical}
.addform input:focus,.addform select:focus,.addform textarea:focus{outline:none;border-color:var(--accent)}
.note{border:1px solid var(--rule);border-radius:11px;padding:13px 15px;margin-bottom:9px;background:var(--elev)}
.note-h{display:flex;align-items:center;gap:10px}
.note-kind{font:600 9.5px "DM Mono",monospace;letter-spacing:.06em;color:var(--kc);border:1px solid var(--kc);border-radius:99px;padding:2px 8px}
.note-title{font-weight:600;font-size:14px}
.note-date{margin-left:auto;font:500 11px "DM Mono",monospace;color:var(--mute)}
.note-x{background:none;border:none;color:var(--mute);font-size:16px;cursor:pointer}.note-x:hover{color:var(--rust)}
.note-body{margin-top:8px;color:var(--ink);font-size:14px}
.note-url{display:inline-block;margin-top:7px;color:var(--accent);font-size:12.5px;text-decoration:none;word-break:break-all}
.art{display:flex;gap:12px;align-items:flex-start;border:1px solid var(--rule);border-radius:11px;padding:13px 15px;margin-bottom:9px;background:var(--elev)}
.art-i{font-size:18px}.art-main{flex:1}.art-main a{color:var(--accent);font-size:12.5px;text-decoration:none;word-break:break-all;display:inline-block;margin-top:4px}
.art-body{color:var(--dim);font-size:13px;margin-top:4px}
.soon{color:var(--mute);font-size:12px;border:1px dashed var(--rule2);border-radius:8px;padding:9px 12px;margin-top:8px}
/* smart composer */
.composer{position:fixed;left:0;right:0;bottom:0;z-index:40;background:linear-gradient(to top,var(--bg) 72%,transparent);padding:14px 22px 18px}
.composer-in{max-width:880px;margin:0 auto;background:var(--elev);border:1px solid var(--rule2);border-radius:14px;padding:10px 12px;box-shadow:0 12px 44px rgba(0,0,0,.45)}
.composer textarea{width:100%;border:none;background:transparent;color:var(--ink);font:400 14px "DM Sans",sans-serif;resize:none;min-height:42px;max-height:180px;padding:6px 4px;outline:none}
.composer textarea::placeholder{color:var(--mute)}
.composer-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:4px 2px 0}
.composer-hint{font-size:11.5px;color:var(--mute)}
.composer-go{background:var(--accent);color:#0F0C14;border:none;border-radius:9px;padding:9px 16px;font:600 13px "DM Sans",sans-serif;cursor:pointer;white-space:nowrap}
.composer-go:disabled{opacity:.6;cursor:default}
.composer-status{font-size:12px;color:var(--accent);padding:0 4px 5px;min-height:1px}
/* modal */
.ov{position:fixed;inset:0;background:rgba(10,8,14,.72);backdrop-filter:blur(3px);display:none;align-items:center;justify-content:center;z-index:50;padding:18px}
.ov.show{display:flex}
.modal{background:var(--elev);border:1px solid var(--rule2);border-radius:16px;padding:24px;width:100%;max-width:520px;max-height:92vh;overflow:auto}
.modal h2{margin:0 0 16px;font-size:19px}
.fg{margin-bottom:12px}.fg label{display:block;font:500 11px "DM Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);margin-bottom:5px}
.fg input,.fg select,.fg textarea{width:100%;font:400 14px "DM Sans";background:var(--soft);border:1px solid var(--rule2);border-radius:8px;padding:9px 11px;color:var(--ink)}
.fg textarea{min-height:54px;resize:vertical}.fg input:focus,.fg select:focus,.fg textarea:focus{outline:none;border-color:var(--accent)}
.frow{display:flex;gap:10px}.frow .fg{flex:1}
.m-act{display:flex;gap:10px;align-items:center;margin-top:16px}
.m-save{background:var(--accent);color:#0F0C14}.m-cancel{background:transparent;border:1px solid var(--rule2);color:var(--dim)}
.m-del{margin-left:auto;background:transparent;border:1px solid rgba(201,125,92,.5);color:var(--rust)}
.m-err{color:var(--rust);font-size:13px;min-height:1px;margin-top:8px}
</style></head>
<body><div class="wrap">
<div class="bar"><a class="back" href="/pipeline/?k=${esc(token)}">← Pipeline</a><div class="wordmark">Ovae<span>.</span></div></div>

<div class="hd">
  <div>
    <h1>${esc(row.name)}</h1>
    <div class="sub">${row.contact_title ? esc(row.contact_title) + " · " : ""}${esc(row.company || "—")}</div>
    <div class="badges">
      <span class="bdg" style="color:${stageColor};border-color:${stageColor}">${esc(STAGE_LABEL[row.stage] || row.stage)}</span>
      ${fm ? `<span class="bdg" style="color:${fm.color};border-color:${fm.color}">${fm.dot} ${esc(fm.label)}</span>` : ""}
      <span class="bdg" style="color:${sm.color};border-color:${sm.color}">${esc(sm.label)}</span>
    </div>
  </div>
  <button class="btn btn-edit" id="edit">Edit</button>
</div>

${row.referred_by ? `<div class="refbar"><span class="refbar-i">↗</span><span class="refbar-l">Referred by</span><b>${esc(row.referred_by)}</b></div>` : ""}

<div class="kpis">
  <div class="kpi"><div class="l">Deal value (to us)</div><div class="v" style="color:${GREEN}">${dealStr(row)}</div></div>
  <div class="kpi"><div class="l">Client opportunity</div><div class="v">${oppStr(row)}</div></div>
  ${row.readiness_score != null ? `<div class="kpi"><div class="l">Score</div><div class="v" style="color:${SCORE_COLOR(row.readiness_score)}">${row.readiness_score}</div></div>` : ""}
  <div class="kpi"><div class="l">Owner</div><div class="v" style="font-size:15px">${esc(row.owner || "—")}</div></div>
</div>

${row.next_step ? `<div class="nextstep"><span class="l">Next step</span><span>${esc(row.next_step)}${row.next_step_due ? ` <span style="color:var(--mute)">· due ${esc(row.next_step_due)}</span>` : ""}</span></div>` : ""}

<div class="contacts">
  ${row.email ? `<a href="mailto:${esc(row.email)}">✉ ${esc(row.email)}</a>` : '<span class="muted">No email</span>'}
  ${row.phone ? `<a href="tel:${esc(row.phone)}">☎ ${esc(row.phone)}</a>` : ""}
  ${row.proposal_url ? `<a href="${esc(row.proposal_url)}" target="_blank" rel="noopener">📄 Proposal</a>` : ""}
</div>

<section class="sec"><h2>Key facts <span class="add" data-add="fact">+ Add fact</span></h2>
  <div class="addform" id="add-fact">
    <div class="row"><input id="fk" placeholder="Label (e.g. Revenue)"><input id="fv" placeholder="Value (e.g. \$17.5M)"></div>
    <button class="btn-ghost" id="fk-save">Add fact</button>
  </div>
  <div class="facts">${factRows}</div>
</section>

${diag}

<section class="sec"><h2>Activity <span class="add" data-add="note">+ Log activity</span></h2>
  <div class="addform" id="add-note">
    <div class="row"><select id="nk"><option value="note">Note</option><option value="call">Call</option><option value="email">Email</option></select><input id="nt" placeholder="Title (optional)"></div>
    <textarea id="nb" placeholder="What happened? Paste call notes or a transcript excerpt…"></textarea>
    <button class="btn-ghost" id="nb-save">Save activity</button>
  </div>
  ${activity.length ? activity.map(noteRow).join("") : '<div class="muted">No activity logged yet.</div>'}
</section>

<section class="sec"><h2>Artifacts <span class="add" data-add="art">+ Add artifact</span></h2>
  <div class="addform" id="add-art">
    <div class="row"><input id="at" placeholder="Title (e.g. Discovery call transcript)"><input id="au" placeholder="Link (optional) — Drive, Vercel, etc."></div>
    <textarea id="ab" placeholder="Or paste text / markdown / transcript here…"></textarea>
    <button class="btn-ghost" id="ab-save">Add artifact</button>
    <div class="soon">⬆ Direct file upload + automatic transcript ingestion is coming next. For now paste text or a link.</div>
  </div>
  ${artifacts.length ? artifacts.map(artifactRow).join("") : '<div class="muted">No artifacts yet — attach proposals, transcripts, or docs.</div>'}
</section>

</div>

<div class="composer">
  <div class="composer-in">
    <div class="composer-status" id="ci-status"></div>
    <textarea id="ci-text" placeholder="Drop anything about ${esc(row.name)} — paste a call transcript, notes, or an email (or dictate with Wispr Flow). AI files it as an artifact and updates the dossier."></textarea>
    <div class="composer-bar">
      <span class="composer-hint">✦ AI extracts key facts + logs activity · raw is saved as an artifact · ⌘⏎ to send</span>
      <button class="composer-go" id="ci-go">Process with AI</button>
    </div>
  </div>
</div>

<div class="ov" id="ov"><div class="modal">
  <h2>Edit client</h2>
  <div class="frow"><div class="fg"><label>Name *</label><input id="e-name" value="${esc(row.name)}"></div><div class="fg"><label>Title</label><input id="e-title" value="${esc(row.contact_title || "")}"></div></div>
  <div class="fg"><label>Company</label><input id="e-company" value="${esc(row.company || "")}"></div>
  <div class="frow"><div class="fg"><label>Email</label><input id="e-email" value="${esc(row.email || "")}"></div><div class="fg"><label>Phone</label><input id="e-phone" value="${esc(row.phone || "")}"></div></div>
  <div class="frow"><div class="fg"><label>Stage</label><select id="e-stage">${stageOpts}</select></div><div class="fg"><label>Owner</label><input id="e-owner" value="${esc(row.owner || "")}"></div></div>
  <div class="frow"><div class="fg"><label>Deal value low</label><input id="e-dvl" type="number" value="${row.deal_value_low ?? ""}"></div><div class="fg"><label>Deal value high</label><input id="e-dvh" type="number" value="${row.deal_value_high ?? ""}"></div></div>
  <div class="frow"><div class="fg"><label>Opportunity low</label><input id="e-ol" type="number" value="${row.opportunity_low ?? ""}"></div><div class="fg"><label>Opportunity high</label><input id="e-oh" type="number" value="${row.opportunity_high ?? ""}"></div></div>
  <div class="frow"><div class="fg"><label>Next step</label><input id="e-next" value="${esc(row.next_step || "")}"></div><div class="fg"><label>Due</label><input id="e-due" type="date" value="${esc(row.next_step_due || "")}"></div></div>
  <div class="fg"><label>Proposal / doc URL</label><input id="e-url" value="${esc(row.proposal_url || "")}"></div>
  <div class="fg"><label>Referred by</label><input id="e-ref" value="${esc(row.referred_by || "")}" placeholder="Who referred this lead?"></div>
  <div class="m-err" id="e-err"></div>
  <div class="m-act"><button class="btn m-save" id="e-save">Save</button><button class="btn m-cancel" id="e-cancel">Cancel</button><button class="btn m-del" id="e-del">Delete client</button></div>
</div></div>

<script>
(function(){
  var EDIT="https://muguotipixphthfxjssu.supabase.co/functions/v1/pipeline-edit";
  var ID=${JSON.stringify(row.id)};
  var token=new URLSearchParams(location.search).get("k")||"";
  function el(i){return document.getElementById(i);}
  function post(b){return fetch(EDIT+"?k="+encodeURIComponent(token),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(b)}).then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});});}
  function reloadOk(res){ if(res.ok)location.reload(); else alert("Failed: "+(res.j.error||"error")); }
  // smart ingest composer
  var ci=el("ci-text"), cig=el("ci-go"), cis=el("ci-status");
  if(cig){
    cig.addEventListener("click",function(){
      var t=ci.value.trim(); if(!t){ci.focus();return;}
      cig.disabled=true; cig.textContent="Processing…"; cis.textContent="";
      fetch("https://muguotipixphthfxjssu.supabase.co/functions/v1/pipeline-ingest?k="+encodeURIComponent(token),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({pipeline_id:ID,text:t})})
        .then(function(r){return r.json();}).then(function(j){
          if(j.ok){ cis.textContent = j.extracted ? ("✓ Filed · "+j.facts_added+" fact(s) added to the dossier") : "✓ Saved as an artifact"; setTimeout(function(){location.reload();},700); }
          else { cig.disabled=false; cig.textContent="Process with AI"; cis.textContent="Failed: "+(j.error||"error"); }
        }).catch(function(){cig.disabled=false;cig.textContent="Process with AI";cis.textContent="Network error";});
    });
    ci.addEventListener("keydown",function(e){ if((e.metaKey||e.ctrlKey)&&e.key==="Enter")cig.click(); });
  }
  // toggle add forms
  [].forEach.call(document.querySelectorAll("[data-add]"),function(b){b.addEventListener("click",function(){
    var t=b.getAttribute("data-add"); var map={fact:"add-fact",note:"add-note",art:"add-art"};
    var f=el(map[t]); f.classList.toggle("show"); if(f.classList.contains("show")){var inp=f.querySelector("input,select,textarea");if(inp)inp.focus();}
  });});
  // facts
  el("fk-save").addEventListener("click",function(){
    var k=el("fk").value.trim(), v=el("fv").value.trim(); if(!k){el("fk").focus();return;}
    post({action:"set-fact",id:ID,key:k,value:v}).then(reloadOk);
  });
  [].forEach.call(document.querySelectorAll(".fact-x"),function(b){b.addEventListener("click",function(){
    post({action:"del-fact",id:ID,key:b.getAttribute("data-key")}).then(reloadOk);
  });});
  // notes + artifacts
  el("nb-save").addEventListener("click",function(){
    var body=el("nb").value.trim(); if(!body){el("nb").focus();return;}
    post({action:"add-note",pipeline_id:ID,kind:el("nk").value,title:el("nt").value.trim()||null,body:body}).then(reloadOk);
  });
  el("ab-save").addEventListener("click",function(){
    var t=el("at").value.trim(), u=el("au").value.trim(), b=el("ab").value.trim();
    if(!t&&!u&&!b){el("at").focus();return;}
    post({action:"add-note",pipeline_id:ID,kind:"artifact",title:t||"Artifact",url:u||null,body:b||null}).then(reloadOk);
  });
  [].forEach.call(document.querySelectorAll(".note-x"),function(b){b.addEventListener("click",function(){
    if(!confirm("Delete this item?"))return;
    post({action:"delete-note",note_id:b.getAttribute("data-id")}).then(reloadOk);
  });});
  // edit modal
  var ov=el("ov");
  el("edit").addEventListener("click",function(){ov.classList.add("show");el("e-name").focus();});
  el("e-cancel").addEventListener("click",function(){ov.classList.remove("show");});
  ov.addEventListener("click",function(e){if(e.target===ov)ov.classList.remove("show");});
  el("e-save").addEventListener("click",function(){
    var name=el("e-name").value.trim(); if(!name){el("e-err").textContent="Name required.";return;}
    function n(id){var v=el(id).value;return v===""?null:parseInt(v,10);}
    el("e-save").textContent="Saving…";
    post({action:"save",id:ID,name:name,company:el("e-company").value.trim()||null,contact_title:el("e-title").value.trim()||null,
      email:el("e-email").value.trim()||null,phone:el("e-phone").value.trim()||null,stage:el("e-stage").value,owner:el("e-owner").value.trim()||null,
      deal_value_low:n("e-dvl"),deal_value_high:n("e-dvh"),opportunity_low:n("e-ol"),opportunity_high:n("e-oh"),
      next_step:el("e-next").value.trim()||null,next_step_due:el("e-due").value||null,proposal_url:el("e-url").value.trim()||null,
      referred_by:el("e-ref").value.trim()||null
    }).then(function(res){el("e-save").textContent="Save";if(res.ok)location.reload();else el("e-err").textContent="Save failed: "+(res.j.error||"");});
  });
  el("e-del").addEventListener("click",function(){
    if(!confirm("Delete this client and all its activity? Cannot be undone."))return;
    post({action:"delete",id:ID}).then(function(res){if(res.ok)location.href="/pipeline/?k="+encodeURIComponent(token);else alert("Delete failed");});
  });
  document.addEventListener("keydown",function(e){if(e.key==="Escape")ov.classList.remove("show");});
})();
</script>
</body></html>`;
}
