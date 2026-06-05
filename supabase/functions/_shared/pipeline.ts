import {
  ACCENT, RUST, WARN, GREEN, esc, fmtUsd,
  STAGES, STAGE_PROB, STAGE_COLOR, STAGE_LABEL, srcMeta, SCORE_COLOR,
  dealStr, oppStr, dealMid, isStale, isHot, leadBadge, fmtDate, relDate,
  dueInfo, DUE_COLOR, todayItems, type PRow,
} from "./pipeline-core.ts";

const BOARD_STAGES = STAGES.filter((s) => s.k !== "new"); // 'new' lives in the Inbox

function badge(r: PRow): string {
  const m = leadBadge(r);
  return `<span class="bdg" style="--c:${m.color}">${m.dot ? esc(m.dot) + " " : ""}${esc(m.label)}</span>`;
}
function viaChip(r: PRow): string {
  return r.referred_by ? `<span class="via">↗ via ${esc(r.referred_by)}</span>` : "";
}
function dataAttrs(r: PRow): string {
  const q = (r.name + " " + (r.company || "") + " " + (r.referred_by || "")).toLowerCase();
  return `data-id="${esc(r.id)}" data-q="${esc(q)}" data-src="${esc(r.source)}" data-stage="${esc(r.stage)}" data-hot="${isHot(r) ? 1 : 0}"`;
}

function inboxRow(r: PRow, token: string): string {
  return `<div class="inrow${isHot(r) ? " inrow--hot" : ""}" ${dataAttrs(r)}>
    <a class="cover" href="/pipeline/c/?id=${esc(r.id)}&k=${esc(token)}" aria-label="Open ${esc(r.name)}"></a>
    ${badge(r)}
    <span class="in-name"><b>${esc(r.name)}</b><span class="in-sub">${esc(r.company || "—")}${viaChip(r)}</span></span>
    ${r.readiness_score != null ? `<span class="in-score" style="color:${SCORE_COLOR(r.readiness_score)}">${r.readiness_score}</span>` : `<span class="in-score muted">—</span>`}
    <span class="in-opp"><span class="muted">opp</span> ${oppStr(r)}</span>
    <span class="in-when">${esc(relDate(r.created_at))}</span>
    <span class="in-act">
      <button class="mini mini-go" data-act="promote" data-id="${esc(r.id)}">Qualify →</button>
      <button class="mini" data-act="dismiss" data-id="${esc(r.id)}">Dismiss</button>
    </span>
  </div>`;
}

function card(r: PRow, token: string): string {
  const stageOpts = STAGES.map((s) => `<option value="${s.k}"${s.k === r.stage ? " selected" : ""}>${s.label}</option>`).join("");
  return `<div class="card${isHot(r) ? " card--hot" : ""}${isStale(r) ? " card--stale" : ""}" ${dataAttrs(r)}>
    <a class="cover" href="/pipeline/c/?id=${esc(r.id)}&k=${esc(token)}" aria-label="Open ${esc(r.name)}"></a>
    <div class="c-top">${badge(r)}${isStale(r) ? '<span class="stale" title="No activity in 7+ days">● stale</span>' : ""}</div>
    <div class="c-name">${esc(r.name)}</div>
    <div class="c-co">${esc(r.company || "—")}${viaChip(r)}</div>
    <div class="c-val">${dealStr(r)}<span class="c-val-l"> deal</span></div>
    ${r.next_step ? `<div class="c-next">▸ ${esc(r.next_step)}</div>` : ""}
    <div class="c-links">
      ${r.proposal_url ? `<a class="c-doc" href="${esc(r.proposal_url)}" target="_blank" rel="noopener">📄 Proposal</a>` : ""}
      <a class="c-doc" href="/pipeline/c/?id=${esc(r.id)}&k=${esc(token)}">Open →</a>
    </div>
    <div class="c-act"><select class="c-stage" aria-label="Move stage">${stageOpts}</select></div>
  </div>`;
}

function todayRow(r: PRow, token: string): string {
  const lead = r.stage === "new";
  const di = dueInfo(r.next_step_due);
  const c = lead ? GREEN : DUE_COLOR[di.state];
  const tag = lead ? "hot lead" : (isStale(r) && di.state === "ok" ? "stale" : di.label);
  const meta = lead ? `${esc(STAGE_LABEL[r.stage] || r.stage)} · triage` : `${esc(STAGE_LABEL[r.stage] || r.stage)} · ${dealStr(r)}`;
  return `<div class="td-row">
    <a class="cover" href="/pipeline/c/?id=${esc(r.id)}&k=${esc(token)}" aria-label="Open ${esc(r.name)}"></a>
    <span class="td-flag" style="--c:${c}">${esc(tag)}</span>
    <span class="td-name"><b>${esc(r.name)}</b><span class="td-co">${esc(r.company || "—")}</span></span>
    <span class="td-meta">${meta}</span>
    <span class="td-next">${r.next_step ? "▸ " + esc(r.next_step) : '<span class="muted">set a next step</span>'}</span>
    <a class="td-open" href="/pipeline/c/?id=${esc(r.id)}&k=${esc(token)}">Open →</a>
  </div>`;
}

export function renderPipelineHTML(rows: PRow[], token: string): string {
  const leads = rows.filter((r) => r.stage === "new");
  const today = todayItems(rows);
  const openStages = ["qualified", "proposal", "negotiation"];
  const open = rows.filter((r) => openStages.includes(r.stage));
  const openVal = open.reduce((s, r) => s + dealMid(r), 0);
  const forecast = open.reduce((s, r) => s + dealMid(r) * (STAGE_PROB[r.stage] || 0), 0);
  const wonVal = rows.filter((r) => r.stage === "won").reduce((s, r) => s + dealMid(r), 0);

  const columns = BOARD_STAGES.map((s) => {
    const cs = rows.filter((r) => r.stage === s.k).sort((a, b) => dealMid(b) - dealMid(a));
    const sub = cs.reduce((x, r) => x + dealMid(r), 0);
    return `<section class="col" data-stage="${s.k}" style="--sc:${s.color}">
      <div class="col-h"><span class="col-dot"></span><span class="col-t">${s.label}</span><span class="col-n" data-count="${s.k}">${cs.length}</span>${sub ? `<span class="col-sum">${fmtUsd(sub)}</span>` : ""}</div>
      <div class="col-body">${cs.map((r) => card(r, token)).join("") || '<div class="col-empty">—</div>'}</div>
    </section>`;
  }).join("");

  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>Ovae · Pipeline · ${rows.length} deals</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%2314101A'/%3E%3Ccircle cx='16' cy='16' r='7' fill='none' stroke='%237BC9C4' stroke-width='2.5'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--bg:#14101A;--elev:#1A1622;--soft:#1F1A28;--ink:#E8E4DC;--dim:#A39E96;--mute:#6F6A63;--rule:rgba(232,228,220,.08);--rule2:rgba(232,228,220,.16);--accent:${ACCENT};--rust:${RUST};--warn:${WARN};--green:${GREEN}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:"DM Sans",system-ui,sans-serif;font-size:15px}
.wrap{max-width:1340px;margin:0 auto;padding:0 22px 60px}
.bar{display:flex;align-items:center;justify-content:space-between;padding:20px 0;border-bottom:1px solid var(--rule)}
.wordmark{font-weight:600;letter-spacing:.16em;font-size:13px;text-transform:uppercase}.wordmark span{color:var(--accent)}
.tagchip{font-family:"DM Mono",monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--mute);border:1px solid var(--rule2);border-radius:999px;padding:5px 11px}
h1{font-size:26px;font-weight:500;letter-spacing:-.02em;margin:30px 0 4px}
.subhead{color:var(--dim);font-size:14px;margin-bottom:20px}
.stats{display:flex;flex-wrap:wrap;gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:14px;overflow:hidden;margin-bottom:20px}
.stats>div{flex:1;min-width:120px;background:var(--elev);padding:15px 18px}
.s-l{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);margin-bottom:5px}
.s-v{font-size:22px;font-weight:600}
.toolbar{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:18px}
.chips{display:flex;gap:7px;flex-wrap:wrap}
.chip{font:500 12px "DM Sans";color:var(--dim);background:var(--elev);border:1px solid var(--rule2);border-radius:999px;padding:7px 12px;cursor:pointer}
.chip.active{color:#0F0C14;background:var(--ink);border-color:transparent;font-weight:600}
.rt{display:flex;gap:8px}
.search{font:400 13px "DM Sans";background:var(--elev);border:1px solid var(--rule2);border-radius:9px;padding:9px 13px;color:var(--ink);min-width:200px}
.search::placeholder{color:var(--mute)}.search:focus{outline:none;border-color:var(--accent)}
.btn-add{font:600 13px "DM Sans";border-radius:9px;padding:9px 16px;cursor:pointer;border:none;background:var(--accent);color:#0F0C14}
.cover{position:absolute;inset:0;z-index:2;border-radius:inherit;text-indent:-9999px;overflow:hidden}
.muted{color:var(--mute)}
/* today */
.today{border:1px solid var(--rule2);border-radius:14px;background:rgba(217,178,107,.05);padding:6px 0;margin-bottom:20px}
.today--clear{background:rgba(99,224,132,.05)}
.today-h{display:flex;align-items:center;gap:10px;padding:12px 16px;font:600 12px "DM Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--warn)}
.today--clear .today-h{color:var(--green)}
.today-h .n{background:var(--warn);color:#0F0C14;border-radius:99px;padding:1px 9px;font-size:11px}
.today-h .n--ok{background:var(--green)}
.today-sub{margin-left:auto;font:500 10px "DM Mono",monospace;color:var(--mute);letter-spacing:.04em;text-transform:none}
.today-body{display:flex;flex-direction:column}
.td-row{position:relative;display:grid;grid-template-columns:120px 1.3fr 150px 1.6fr 64px;gap:14px;align-items:center;padding:11px 16px;border-top:1px solid var(--rule)}
.td-row:hover{background:rgba(232,228,220,.02)}
.td-flag{font:600 9.5px "DM Mono",monospace;letter-spacing:.04em;color:var(--c);border:1px solid var(--c);border-radius:999px;padding:3px 7px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;justify-self:start}
.td-name b{font-weight:600;display:block}.td-co{color:var(--dim);font-size:13px}
.td-meta{font-family:"DM Mono",monospace;font-size:12px;color:var(--dim)}
.td-next{font-size:13px;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.td-open{font:500 12px "DM Sans";color:var(--accent);text-decoration:none;position:relative;z-index:3;justify-self:end}.td-open:hover{text-decoration:underline}
@media(max-width:780px){.td-row{grid-template-columns:1fr auto;row-gap:6px}.td-meta,.td-next{display:none}}
/* inbox */
.inbox{border:1px solid var(--rule2);border-radius:14px;background:rgba(123,201,196,.04);padding:6px 0;margin-bottom:26px}
.inbox-h{display:flex;align-items:center;gap:10px;padding:12px 16px;font:600 12px "DM Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--accent)}
.inbox-h .n{background:var(--accent);color:#0F0C14;border-radius:99px;padding:1px 9px;font-size:11px}
.inrow{position:relative;display:grid;grid-template-columns:110px 1fr 44px 150px 70px 180px;gap:14px;align-items:center;padding:12px 16px;border-top:1px solid var(--rule)}
.inrow:hover{background:rgba(232,228,220,.02)}
.in-name b{font-weight:600;display:block}.in-sub{color:var(--dim);font-size:13px}
.in-score{font-family:"DM Mono",monospace;font-size:18px;font-weight:500;text-align:center}
.in-opp{font-family:"DM Mono",monospace;font-size:12.5px;color:var(--ink)}
.in-when{font-family:"DM Mono",monospace;font-size:11.5px;color:var(--mute)}
.in-act{display:flex;gap:6px;position:relative;z-index:3;justify-content:flex-end}
.mini{font:500 11.5px "DM Sans";border:1px solid var(--rule2);background:var(--soft);color:var(--dim);border-radius:7px;padding:6px 10px;cursor:pointer;white-space:nowrap}
.mini:hover{color:var(--ink)}
.mini-go{background:var(--accent);color:#0F0C14;border-color:transparent;font-weight:600}
.bdg{font:600 9.5px "DM Mono",monospace;letter-spacing:.05em;color:var(--c);border:1px solid var(--c);border-radius:999px;padding:3px 7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;justify-self:start}
.inrow--hot{background:rgba(99,224,132,.07);box-shadow:inset 3px 0 0 var(--green)}
.via{display:inline-block;margin-left:8px;font:500 11px "DM Mono",monospace;color:var(--accent);background:rgba(123,201,196,.12);border-radius:99px;padding:1px 8px;white-space:nowrap}
.inbox-sub{margin-left:auto;font:500 10px "DM Mono",monospace;color:var(--mute);letter-spacing:.04em}
.inbox-more{margin:6px 12px 10px;background:var(--soft);border:1px solid var(--rule2);color:var(--dim);border-radius:9px;padding:9px 14px;font:500 12.5px "DM Sans",sans-serif;cursor:pointer;width:calc(100% - 24px)}
.inbox-more:hover{color:var(--ink);border-color:var(--accent)}
/* board */
.board{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(238px,1fr);gap:12px;overflow-x:auto;padding-bottom:14px;align-items:start}
.col{background:rgba(26,22,34,.5);border:1px solid var(--rule);border-radius:14px;min-height:110px}
.col-h{display:flex;align-items:center;gap:8px;padding:13px 14px;border-bottom:1px solid var(--rule);position:sticky;top:0;background:var(--bg);border-radius:14px 14px 0 0;z-index:1}
.col-dot{width:8px;height:8px;border-radius:99px;background:var(--sc)}.col-t{font-weight:600;font-size:13px}
.col-n{font-family:"DM Mono",monospace;font-size:12px;color:var(--mute);background:var(--soft);border-radius:99px;padding:1px 8px}
.col-sum{margin-left:auto;font-family:"DM Mono",monospace;font-size:12px;color:var(--dim)}
.col-body{padding:10px;display:flex;flex-direction:column;gap:10px}.col-empty{color:var(--mute);text-align:center;padding:14px;font-size:13px}
.card{position:relative;background:var(--elev);border:1px solid var(--rule2);border-radius:11px;padding:13px;border-top:2px solid var(--sc)}
.card--hot{box-shadow:0 0 0 1px rgba(99,224,132,.25)}
.card--stale{border-color:rgba(217,178,107,.4)}
.c-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px}
.stale{font:600 9.5px "DM Mono",monospace;color:var(--warn)}
.c-name{font-weight:600;font-size:15px;line-height:1.2}.c-co{color:var(--dim);font-size:13px;margin-top:1px}
.c-val{font-family:"DM Mono",monospace;font-size:14px;color:var(--green);margin-top:8px}.c-val-l{color:var(--mute);font-size:11px}
.c-next{color:var(--dim);font-size:12.5px;margin-top:7px;font-family:"DM Mono",monospace}
.c-links{display:flex;flex-wrap:wrap;gap:10px;margin-top:9px;position:relative;z-index:3}
.c-doc{font:500 12px "DM Sans";color:var(--accent);text-decoration:none}.c-doc:hover{text-decoration:underline}
.c-act{margin-top:11px;padding-top:10px;border-top:1px solid var(--rule);position:relative;z-index:3}
.c-stage{width:100%;font:500 12px "DM Sans";background:var(--soft);border:1px solid var(--rule2);border-radius:7px;padding:6px 8px;color:var(--ink);cursor:pointer}
.c-stage:focus{outline:none;border-color:var(--accent)}
.lfoot{margin-top:24px;padding-top:16px;border-top:1px solid var(--rule);color:var(--mute);font:500 11.5px "DM Mono",monospace;letter-spacing:.04em;text-align:center}
/* add modal */
.ov{position:fixed;inset:0;background:rgba(10,8,14,.7);backdrop-filter:blur(3px);display:none;align-items:center;justify-content:center;z-index:50;padding:18px}
.ov.show{display:flex}
.modal{background:var(--elev);border:1px solid var(--rule2);border-radius:16px;padding:24px;width:100%;max-width:440px}
.modal h2{margin:0 0 16px;font-size:18px}
.fg{margin-bottom:12px}.fg label{display:block;font:500 11px "DM Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);margin-bottom:5px}
.fg input,.fg select{width:100%;font:400 14px "DM Sans";background:var(--soft);border:1px solid var(--rule2);border-radius:8px;padding:9px 11px;color:var(--ink)}
.fg input:focus,.fg select:focus{outline:none;border-color:var(--accent)}
.frow{display:flex;gap:10px}.frow .fg{flex:1}
.m-act{display:flex;gap:10px;margin-top:16px}.m-save{background:var(--accent);color:#0F0C14;border:none;border-radius:9px;padding:9px 16px;font:600 13px "DM Sans";cursor:pointer}
.m-cancel{background:transparent;border:1px solid var(--rule2);color:var(--dim);border-radius:9px;padding:9px 16px;cursor:pointer}
.m-err{color:var(--rust);font-size:13px;min-height:1px;margin-top:8px}
@media(max-width:780px){.board{grid-auto-flow:row;grid-auto-columns:auto}.inrow{grid-template-columns:1fr auto;row-gap:8px}.in-score,.in-opp,.in-when{display:none}}
</style></head>
<body><div class="wrap">
<div class="bar"><div class="wordmark">Ovae<span>.</span> Pipeline</div><div class="tagchip">Pipeline · internal</div></div>
<h1>Pipeline</h1>
<div class="subhead"><span id="vcount">${rows.length}</span> of ${rows.length} ${rows.length === 1 ? "record" : "records"} · ${leads.length} to triage</div>
<div class="stats">
  <div><div class="s-l">Records</div><div class="s-v">${rows.length}</div></div>
  <div><div class="s-l">New leads</div><div class="s-v" style="color:${ACCENT}">${leads.length}</div></div>
  <div><div class="s-l">Open deal value</div><div class="s-v">${openVal ? fmtUsd(openVal) : "—"}</div></div>
  <div><div class="s-l">Weighted forecast</div><div class="s-v" style="color:${GREEN}">${forecast ? fmtUsd(Math.round(forecast)) : "—"}</div></div>
  <div><div class="s-l">Won</div><div class="s-v" style="color:${GREEN}">${wonVal ? fmtUsd(wonVal) : "—"}</div></div>
</div>

${today.length ? `<div class="today">
  <div class="today-h">Today · needs you <span class="n">${today.length}</span><span class="today-sub">open deals to follow up + hot leads</span></div>
  <div class="today-body">${today.map((r) => todayRow(r, token)).join("")}</div>
</div>` : `<div class="today today--clear"><div class="today-h">Today · needs you <span class="n n--ok">0</span><span class="today-sub">nothing overdue — every open deal has a scheduled next step</span></div></div>`}

<div class="toolbar">
  <div class="chips">
    <button class="chip active" data-f="all">All</button>
    <button class="chip" data-f="readiness">Readiness</button>
    <button class="chip" data-f="snapshot">Snapshot</button>
    <button class="chip" data-f="orectic">Orectic</button>
    <button class="chip" data-f="manual">Direct</button>
  </div>
  <div class="rt">
    <input id="q" class="search" type="search" placeholder="Search name or company… ( / )" autocomplete="off">
    <button class="btn-add" id="add">+ Add deal</button>
  </div>
</div>

${leads.length ? `<div class="inbox" id="inbox">
  <div class="inbox-h">Leads to triage <span class="n">${leads.length}</span><span class="inbox-sub">hot leads first</span></div>
  <div id="inbox-rows">${leads.sort((a, b) => { const h = (isHot(b) ? 1 : 0) - (isHot(a) ? 1 : 0); if (h) return h; return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); }).map((r) => inboxRow(r, token)).join("")}</div>
  <button class="inbox-more" id="inbox-more" type="button" style="display:none"></button>
</div>` : ""}

<div class="board" id="board">${columns}</div>
<div class="lfoot">Open ${openVal ? fmtUsd(openVal) : "—"} · forecast ${forecast ? fmtUsd(Math.round(forecast)) : "—"} · won ${wonVal ? fmtUsd(wonVal) : "—"} · ovae.ai/pipeline</div>
</div>

<div class="ov" id="ov"><div class="modal">
  <h2>Add deal</h2>
  <div class="fg"><label>Name *</label><input id="a-name" placeholder="Contact name"></div>
  <div class="fg"><label>Company</label><input id="a-company" placeholder="Company"></div>
  <div class="frow"><div class="fg"><label>Stage</label><select id="a-stage">${STAGES.map((s) => `<option value="${s.k}"${s.k === "qualified" ? " selected" : ""}>${s.label}</option>`).join("")}</select></div>
    <div class="fg"><label>Deal value low</label><input id="a-dvl" type="number" placeholder="5000"></div>
    <div class="fg"><label>Deal value high</label><input id="a-dvh" type="number" placeholder="12000"></div></div>
  <div class="fg"><label>Proposal / doc URL</label><input id="a-url" placeholder="https://…"></div>
  <div class="m-err" id="a-err"></div>
  <div class="m-act"><button class="m-save" id="a-save">Create</button><button class="m-cancel" id="a-cancel">Cancel</button></div>
</div></div>

<script>
(function(){
  var EDIT="https://muguotipixphthfxjssu.supabase.co/functions/v1/pipeline-edit";
  var token=new URLSearchParams(location.search).get("k")||"";
  function el(i){return document.getElementById(i);}
  function post(b){return fetch(EDIT+"?k="+encodeURIComponent(token),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(b)}).then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});});}
  function ok(res){if(res.ok)location.reload();else alert("Failed: "+(res.j.error||"error"));}
  // stage move
  el("board").addEventListener("change",function(e){
    if(!e.target.classList.contains("c-stage"))return;
    post({action:"stage",id:e.target.closest(".card").dataset.id,stage:e.target.value}).then(ok);
  });
  // inbox qualify/dismiss
  document.body.addEventListener("click",function(e){
    var b=e.target.closest(".mini[data-act]"); if(!b)return; e.preventDefault();
    post({action:b.getAttribute("data-act"),id:b.getAttribute("data-id")}).then(ok);
  });
  // add modal
  var ov=el("ov");
  el("add").addEventListener("click",function(){ov.classList.add("show");el("a-name").focus();});
  el("a-cancel").addEventListener("click",function(){ov.classList.remove("show");});
  ov.addEventListener("click",function(e){if(e.target===ov)ov.classList.remove("show");});
  el("a-save").addEventListener("click",function(){
    var name=el("a-name").value.trim(); if(!name){el("a-err").textContent="Name required.";return;}
    function n(id){var v=el(id).value;return v===""?null:parseInt(v,10);}
    post({action:"save",name:name,company:el("a-company").value.trim()||null,stage:el("a-stage").value,deal_value_low:n("a-dvl"),deal_value_high:n("a-dvh"),proposal_url:el("a-url").value.trim()||null}).then(function(res){
      if(res.ok&&res.j.id)location.href="/pipeline/c/?id="+res.j.id+"&k="+encodeURIComponent(token); else ok(res);
    });
  });
  // filter + search
  var filter="all",term="",inboxLimit=8;
  function apply(){
    var counts={},shown=0,inboxSeen=0,inboxHidden=0;
    [].forEach.call(document.querySelectorAll(".card,.inrow"),function(c){
      var okF=filter==="all"||c.dataset.src===filter;
      var okQ=!term||c.dataset.q.indexOf(term)>-1;
      var pass=okF&&okQ, vis=pass;
      if(c.classList.contains("inrow")&&pass){ if(inboxSeen>=inboxLimit){vis=false;inboxHidden++;} inboxSeen++; }
      c.style.display=vis?"":"none";
      if(vis){shown++;if(c.classList.contains("card"))counts[c.dataset.stage]=(counts[c.dataset.stage]||0)+1;}
    });
    [].forEach.call(document.querySelectorAll(".col-n"),function(n){n.textContent=counts[n.dataset.count]||0;});
    el("vcount").textContent=shown;
    var more=el("inbox-more");
    if(more){ if(inboxHidden>0){more.style.display="";more.textContent="Show "+inboxHidden+" more lead"+(inboxHidden>1?"s":"")+" ↓";} else more.style.display="none"; }
    var ib=el("inbox"); if(ib){ib.style.display=inboxSeen>0?"":"none";}
  }
  [].forEach.call(document.querySelectorAll(".chip"),function(c){c.addEventListener("click",function(){
    [].forEach.call(document.querySelectorAll(".chip"),function(x){x.classList.remove("active");});c.classList.add("active");
    filter=c.getAttribute("data-f");inboxLimit=8;apply();
  });});
  var more=el("inbox-more"); if(more){more.addEventListener("click",function(){inboxLimit+=8;apply();});}
  var q=el("q");q.addEventListener("input",function(){term=q.value.trim().toLowerCase();inboxLimit=8;apply();});
  document.addEventListener("keydown",function(e){
    if(e.key==="Escape")ov.classList.remove("show");
    var tag=document.activeElement?document.activeElement.tagName:"";
    if(e.key==="/"&&tag!=="INPUT"&&tag!=="TEXTAREA"&&tag!=="SELECT"){e.preventDefault();q.focus();}
  });
})();
</script>
</body></html>`;
}
