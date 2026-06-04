import { ACCENT, RUST, WARN, GREEN, esc, fmtUsd, flagMeta } from "./readiness.ts";

export interface PRow {
  id: string; created_at: string; name: string; company: string | null; email: string | null;
  stage: string; source: string; readiness_id: string | null; readiness_score: number | null;
  flag: string | null; constraint_dim: string | null; value_low: number | null; value_high: number | null;
  proposal_url: string | null; notes: string | null;
}

export const STAGES = [
  { k: "new", label: "New", color: ACCENT },
  { k: "qualified", label: "Qualified", color: WARN },
  { k: "proposal", label: "Proposal", color: "#8FB8FF" },
  { k: "negotiation", label: "Negotiation", color: "#E0A488" },
  { k: "won", label: "Won", color: GREEN },
  { k: "lost", label: "Lost", color: "#6F6A63" },
];
const STAGE_LABEL: Record<string, string> = Object.fromEntries(STAGES.map((s) => [s.k, s.label]));

const SRC: Record<string, { label: string; color: string }> = {
  orectic: { label: "ORECTIC", color: "#B89CFF" },
  manual: { label: "DIRECT", color: "#A39E96" },
  readiness: { label: "LEAD", color: "#A39E96" },
};

function mid(r: PRow): number {
  if (r.value_low != null && r.value_high != null) return Math.round((r.value_low + r.value_high) / 2);
  return r.value_high || r.value_low || 0;
}
function valueStr(r: PRow): string {
  if (r.value_low != null && r.value_high != null) return `${fmtUsd(r.value_low)}–${fmtUsd(r.value_high)}`;
  if (r.value_high != null) return fmtUsd(r.value_high);
  if (r.value_low != null) return fmtUsd(r.value_low);
  return "—";
}
const SCORE_COLOR = (s: number) => (s >= 76 ? GREEN : s >= 51 ? ACCENT : s >= 26 ? WARN : RUST);

function card(r: PRow, token: string): string {
  const fm = r.flag ? flagMeta(r.flag) : null;
  const src = SRC[r.source] || { label: r.source.toUpperCase(), color: "#A39E96" };
  const reportUrl = r.readiness_id ? `/readiness/r/?id=${esc(r.readiness_id)}&k=${esc(token)}` : "";
  const q = (r.name + " " + (r.company || "")).toLowerCase();
  const stageOpts = STAGES.map((s) => `<option value="${s.k}"${s.k === r.stage ? " selected" : ""}>${s.label}</option>`).join("");
  const attrs = `data-id="${esc(r.id)}" data-q="${esc(q)}" data-name="${esc(r.name)}" data-company="${esc(r.company || "")}" data-email="${esc(r.email || "")}" data-stage="${esc(r.stage)}" data-vlow="${r.value_low ?? ""}" data-vhigh="${r.value_high ?? ""}" data-url="${esc(r.proposal_url || "")}" data-notes="${esc(r.notes || "")}"`;
  return `<div class="card${r.flag === "flagship" ? " card--hot" : ""}" ${attrs}>
    <div class="c-top">
      ${fm ? `<span class="c-flag" style="--fc:${fm.color}">${fm.dot} ${esc(fm.label)}</span>` : `<span class="c-flag" style="--fc:${src.color}">${esc(src.label)}</span>`}
      ${r.readiness_score != null ? `<span class="c-score" style="color:${SCORE_COLOR(r.readiness_score)}">${r.readiness_score}</span>` : ""}
    </div>
    <div class="c-name">${esc(r.name)}</div>
    <div class="c-co">${esc(r.company || "—")}</div>
    <div class="c-val">${valueStr(r)}</div>
    <div class="c-links">
      ${r.proposal_url ? `<a class="c-doc" href="${esc(r.proposal_url)}" target="_blank" rel="noopener">📄 Proposal</a>` : ""}
      ${reportUrl ? `<a class="c-doc" href="${reportUrl}">Report →</a>` : ""}
      ${r.email ? `<a class="c-doc c-mail" href="mailto:${esc(r.email)}">Email</a>` : ""}
    </div>
    <div class="c-act">
      <select class="c-stage" aria-label="Move stage">${stageOpts}</select>
      <button class="c-edit" type="button" aria-label="Edit">Edit</button>
    </div>
  </div>`;
}

export function renderPipelineHTML(rows: PRow[], token: string): string {
  const open = rows.filter((r) => r.stage !== "won" && r.stage !== "lost");
  const openSum = open.reduce((s, r) => s + mid(r), 0);
  const wonSum = rows.filter((r) => r.stage === "won").reduce((s, r) => s + mid(r), 0);

  const columns = STAGES.map((s) => {
    const cards = rows.filter((r) => r.stage === s.k).sort((a, b) => mid(b) - mid(a));
    const sub = cards.reduce((x, r) => x + mid(r), 0);
    return `<section class="col" data-stage="${s.k}" style="--sc:${s.color}">
      <div class="col-h"><span class="col-dot"></span><span class="col-t">${s.label}</span><span class="col-n" data-count="${s.k}">${cards.length}</span>${sub ? `<span class="col-sum">${fmtUsd(sub)}</span>` : ""}</div>
      <div class="col-body">${cards.map((r) => card(r, token)).join("") || '<div class="col-empty">—</div>'}</div>
    </section>`;
  }).join("");

  const stageOptsForm = STAGES.map((s) => `<option value="${s.k}">${s.label}</option>`).join("");

  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>Ovae · Pipeline · ${rows.length} deals</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%2314101A'/%3E%3Ccircle cx='16' cy='16' r='7' fill='none' stroke='%237BC9C4' stroke-width='2.5'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--bg:#14101A;--elev:#1A1622;--soft:#1F1A28;--ink:#E8E4DC;--dim:#A39E96;--mute:#6F6A63;--rule:rgba(232,228,220,.08);--rule2:rgba(232,228,220,.16);--accent:${ACCENT};--rust:${RUST};--warn:${WARN};--green:${GREEN}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:"DM Sans",system-ui,sans-serif;font-size:15px}
.wrap{max-width:1320px;margin:0 auto;padding:0 22px 60px}
.bar{display:flex;align-items:center;justify-content:space-between;padding:20px 0;border-bottom:1px solid var(--rule)}
.wordmark{font-weight:600;letter-spacing:.16em;font-size:13px;text-transform:uppercase}.wordmark span{color:var(--accent)}
.tagchip{font-family:"DM Mono",monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--mute);border:1px solid var(--rule2);border-radius:999px;padding:5px 11px}
h1{font-size:26px;font-weight:500;letter-spacing:-.02em;margin:30px 0 4px}
.subhead{color:var(--dim);font-size:14px;margin-bottom:20px}
.stats{display:flex;flex-wrap:wrap;gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:14px;overflow:hidden;margin-bottom:20px}
.stats>div{flex:1;min-width:120px;background:var(--elev);padding:15px 18px}
.s-l{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);margin-bottom:5px}
.s-v{font-size:23px;font-weight:600}
.toolbar{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:18px}
.search{font:400 13px "DM Sans",sans-serif;background:var(--elev);border:1px solid var(--rule2);border-radius:9px;padding:9px 13px;color:var(--ink);min-width:220px}
.search::placeholder{color:var(--mute)}.search:focus{outline:none;border-color:var(--accent)}
.btn{font:600 13px "DM Sans",sans-serif;border-radius:9px;padding:9px 16px;cursor:pointer;border:1px solid transparent}
.btn-add{background:var(--accent);color:#0F0C14}
.btn-add:hover{filter:brightness(1.08)}
.board{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(228px,1fr);gap:12px;overflow-x:auto;padding-bottom:14px;align-items:start}
.col{background:rgba(26,22,34,.5);border:1px solid var(--rule);border-radius:14px;min-height:120px}
.col-h{display:flex;align-items:center;gap:8px;padding:13px 14px;border-bottom:1px solid var(--rule);position:sticky;top:0;background:var(--bg);border-radius:14px 14px 0 0;z-index:1}
.col-dot{width:8px;height:8px;border-radius:99px;background:var(--sc)}
.col-t{font-weight:600;font-size:13px}
.col-n{font-family:"DM Mono",monospace;font-size:12px;color:var(--mute);background:var(--soft);border-radius:99px;padding:1px 8px}
.col-sum{margin-left:auto;font-family:"DM Mono",monospace;font-size:12px;color:var(--dim)}
.col-body{padding:10px;display:flex;flex-direction:column;gap:10px}
.col-empty{color:var(--mute);text-align:center;padding:14px;font-size:13px}
.card{position:relative;background:var(--elev);border:1px solid var(--rule2);border-radius:11px;padding:13px;border-top:2px solid var(--sc)}
.card--hot{box-shadow:0 0 0 1px rgba(99,224,132,.25)}
.c-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px}
.c-flag{font:600 9.5px "DM Mono",monospace;letter-spacing:.05em;color:var(--fc);border:1px solid var(--fc);border-radius:999px;padding:3px 7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px}
.c-flag--m{color:var(--mute);border-color:var(--rule2)}
.c-score{font-family:"DM Mono",monospace;font-size:17px;font-weight:500}
.c-name{font-weight:600;font-size:15px;line-height:1.2}
.c-co{color:var(--dim);font-size:13px;margin-top:1px}
.c-val{font-family:"DM Mono",monospace;font-size:13px;color:var(--ink);margin-top:8px}
.c-links{display:flex;flex-wrap:wrap;gap:10px;margin-top:9px}
.c-doc{font:500 12px "DM Sans",sans-serif;color:var(--accent);text-decoration:none}.c-doc:hover{text-decoration:underline}
.c-mail{color:var(--dim)}
.c-act{display:flex;gap:7px;margin-top:11px;padding-top:10px;border-top:1px solid var(--rule)}
.c-stage{flex:1;font:500 12px "DM Sans",sans-serif;background:var(--soft);border:1px solid var(--rule2);border-radius:7px;padding:6px 8px;color:var(--ink);cursor:pointer}
.c-stage:focus{outline:none;border-color:var(--accent)}
.c-edit{font:500 12px "DM Sans",sans-serif;background:transparent;border:1px solid var(--rule2);border-radius:7px;padding:6px 11px;color:var(--dim);cursor:pointer}
.c-edit:hover{color:var(--ink);border-color:var(--rule2)}
/* modal */
.ov{position:fixed;inset:0;background:rgba(10,8,14,.7);backdrop-filter:blur(3px);display:none;align-items:center;justify-content:center;z-index:50;padding:20px}
.ov.show{display:flex}
.modal{background:var(--elev);border:1px solid var(--rule2);border-radius:16px;padding:24px;width:100%;max-width:440px;max-height:90vh;overflow:auto}
.modal h2{margin:0 0 16px;font-size:19px;font-weight:600}
.fg{margin-bottom:13px}
.fg label{display:block;font:500 11px "DM Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);margin-bottom:5px}
.fg input,.fg select,.fg textarea{width:100%;font:400 14px "DM Sans",sans-serif;background:var(--soft);border:1px solid var(--rule2);border-radius:8px;padding:9px 11px;color:var(--ink)}
.fg textarea{min-height:64px;resize:vertical}
.fg input:focus,.fg select:focus,.fg textarea:focus{outline:none;border-color:var(--accent)}
.frow{display:flex;gap:10px}.frow .fg{flex:1}
.m-act{display:flex;gap:10px;align-items:center;margin-top:18px}
.m-save{background:var(--accent);color:#0F0C14}
.m-cancel{background:transparent;border:1px solid var(--rule2);color:var(--dim)}
.m-del{margin-left:auto;background:transparent;border:1px solid rgba(201,125,92,.5);color:var(--rust)}
.m-err{color:var(--rust);font-size:13px;margin-top:10px;min-height:1px}
.lfoot{margin-top:22px;padding-top:16px;border-top:1px solid var(--rule);color:var(--mute);font:500 11.5px "DM Mono",monospace;letter-spacing:.04em;text-align:center}
@media(max-width:760px){.board{grid-auto-flow:row;grid-auto-columns:auto}}
</style></head>
<body><div class="wrap">
<div class="bar"><div class="wordmark">Ovae<span>.</span> Pipeline</div><div class="tagchip">Pipeline · internal</div></div>
<h1>Pipeline</h1>
<div class="subhead"><span id="vcount">${rows.length}</span> of ${rows.length} ${rows.length === 1 ? "deal" : "deals"} across ${STAGES.length} stages</div>
<div class="stats">
  <div><div class="s-l">Deals</div><div class="s-v">${rows.length}</div></div>
  <div><div class="s-l">Open pipeline</div><div class="s-v" style="color:${ACCENT}">${openSum ? fmtUsd(openSum) : "—"}</div></div>
  <div><div class="s-l">Won</div><div class="s-v" style="color:${GREEN}">${wonSum ? fmtUsd(wonSum) : "—"}</div></div>
  <div><div class="s-l">In proposal+</div><div class="s-v">${rows.filter((r) => ["proposal", "negotiation"].includes(r.stage)).length}</div></div>
</div>
<div class="toolbar">
  <input id="q" class="search" type="search" placeholder="Search name or company… ( / )" autocomplete="off">
  <button class="btn btn-add" id="add" type="button">+ Add entry</button>
</div>
<div class="board" id="board">${columns}</div>
<div class="lfoot">Ovae pipeline · open ${openSum ? fmtUsd(openSum) : "—"} · ${rows.length} ${rows.length === 1 ? "deal" : "deals"} · ovae.ai</div>
</div>

<div class="ov" id="ov">
  <div class="modal">
    <h2 id="m-title">Add entry</h2>
    <input type="hidden" id="f-id">
    <div class="fg"><label>Name *</label><input id="f-name" placeholder="Contact name"></div>
    <div class="fg"><label>Company</label><input id="f-company" placeholder="Company"></div>
    <div class="fg"><label>Email</label><input id="f-email" type="email" placeholder="name@company.com"></div>
    <div class="frow">
      <div class="fg"><label>Stage</label><select id="f-stage">${stageOptsForm}</select></div>
      <div class="fg"><label>Value low ($)</label><input id="f-vlow" type="number" inputmode="numeric" placeholder="250000"></div>
      <div class="fg"><label>Value high ($)</label><input id="f-vhigh" type="number" inputmode="numeric" placeholder="500000"></div>
    </div>
    <div class="fg"><label>Proposal / doc URL</label><input id="f-url" placeholder="https://…"></div>
    <div class="fg"><label>Notes</label><textarea id="f-notes" placeholder="Context, next step…"></textarea></div>
    <div class="m-err" id="m-err"></div>
    <div class="m-act">
      <button class="btn m-save" id="m-save" type="button">Save</button>
      <button class="btn m-cancel" id="m-cancel" type="button">Cancel</button>
      <button class="btn m-del" id="m-del" type="button" style="display:none">Delete</button>
    </div>
  </div>
</div>

<script>
(function(){
  var EDIT="https://muguotipixphthfxjssu.supabase.co/functions/v1/pipeline-edit";
  var token=new URLSearchParams(location.search).get("k")||"";
  var ov=document.getElementById("ov"), err=document.getElementById("m-err");
  var F={id:"f-id",name:"f-name",company:"f-company",email:"f-email",stage:"f-stage",vlow:"f-vlow",vhigh:"f-vhigh",url:"f-url",notes:"f-notes"};
  function el(id){return document.getElementById(id);}
  function openModal(data){
    err.textContent="";
    el("m-title").textContent=data?"Edit entry":"Add entry";
    el(F.id).value=data?data.id:"";
    el(F.name).value=data?data.name:"";
    el(F.company).value=data?data.company:"";
    el(F.email).value=data?data.email:"";
    el(F.stage).value=data?data.stage:"new";
    el(F.vlow).value=data?data.vlow:"";
    el(F.vhigh).value=data?data.vhigh:"";
    el(F.url).value=data?data.url:"";
    el(F.notes).value=data?data.notes:"";
    el("m-del").style.display=data?"":"none";
    ov.classList.add("show"); el(F.name).focus();
  }
  function closeModal(){ov.classList.remove("show");}
  function post(body){
    return fetch(EDIT+"?k="+encodeURIComponent(token),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});});
  }
  // add
  el("add").addEventListener("click",function(){openModal(null);});
  // edit (delegate)
  document.getElementById("board").addEventListener("click",function(e){
    var b=e.target.closest(".c-edit"); if(!b)return;
    var c=b.closest(".card");
    openModal({id:c.dataset.id,name:c.dataset.name,company:c.dataset.company,email:c.dataset.email,stage:c.dataset.stage,vlow:c.dataset.vlow,vhigh:c.dataset.vhigh,url:c.dataset.url,notes:c.dataset.notes});
  });
  // stage move (delegate change)
  document.getElementById("board").addEventListener("change",function(e){
    if(!e.target.classList.contains("c-stage"))return;
    var c=e.target.closest(".card");
    post({action:"stage",id:c.dataset.id,stage:e.target.value}).then(function(res){
      if(res.ok)location.reload(); else alert("Move failed: "+(res.j.error||""));
    });
  });
  el("m-cancel").addEventListener("click",closeModal);
  ov.addEventListener("click",function(e){if(e.target===ov)closeModal();});
  el("m-save").addEventListener("click",function(){
    var name=el(F.name).value.trim();
    if(!name){err.textContent="Name is required.";return;}
    var payload={action:"save",id:el(F.id).value||null,name:name,
      company:el(F.company).value.trim()||null,email:el(F.email).value.trim()||null,
      stage:el(F.stage).value,
      value_low:el(F.vlow).value?parseInt(el(F.vlow).value,10):null,
      value_high:el(F.vhigh).value?parseInt(el(F.vhigh).value,10):null,
      proposal_url:el(F.url).value.trim()||null,notes:el(F.notes).value.trim()||null};
    el("m-save").textContent="Saving…";
    post(payload).then(function(res){
      el("m-save").textContent="Save";
      if(res.ok)location.reload(); else err.textContent="Save failed: "+(res.j.error||"unknown");
    });
  });
  el("m-del").addEventListener("click",function(){
    if(!confirm("Delete this entry? This cannot be undone."))return;
    post({action:"delete",id:el(F.id).value}).then(function(res){
      if(res.ok)location.reload(); else err.textContent="Delete failed: "+(res.j.error||"");
    });
  });
  // search
  var q=el("q");
  function applySearch(){
    var t=q.value.trim().toLowerCase(), shown=0;
    var counts={};
    [].forEach.call(document.querySelectorAll(".card"),function(c){
      var vis=!t||c.dataset.q.indexOf(t)>-1; c.style.display=vis?"":"none";
      if(vis){shown++;counts[c.dataset.stage]=(counts[c.dataset.stage]||0)+1;}
    });
    [].forEach.call(document.querySelectorAll(".col-n"),function(n){n.textContent=counts[n.dataset.count]||0;});
    el("vcount").textContent=shown;
  }
  q.addEventListener("input",applySearch);
  document.addEventListener("keydown",function(e){
    if(e.key==="Escape"){closeModal();}
    var tag=document.activeElement?document.activeElement.tagName:"";
    if(e.key==="/"&&tag!=="INPUT"&&tag!=="TEXTAREA"&&tag!=="SELECT"){e.preventDefault();q.focus();}
  });
})();
</script>
</body></html>`;
}
