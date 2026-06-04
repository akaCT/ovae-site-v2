# The AI Leverage Snapshot — Build Spec (v2, contract for parallel build)

Live target: **https://ovae.ai/snapshot** (new folder `snapshot/`, GitHub Pages, deploys on push).
Leaves existing `/readiness` untouched.

Brand tokens (reuse from readiness): `--bg:#14101A --bg-elev:#1A1622 --ink:#E8E4DC --ink-dim:#A39E96 --ink-mute:#6F6A63 --accent:#7BC9C4 --rust:#C97D5C --warn:#D9B26B --green:#63E084`. Fonts: DM Sans (body), DM Mono (labels). Film-grain + radial-gradient bg. Max-width 880px page.

## North star
Two fused products on ONE engine. **Act 1** = universal, ungated, self-sufficient PERSONAL AI-identity result (works for anyone — intern to CEO, any industry). **Act 2** = opt-in, role-forked BUSINESS leverage diagnostic + Ovae lead-gen, behind a single email wall. The shareable identity is flattering+lateral on the surface, honest+prescriptive underneath. Result is framed as an ownable, dated identity ("AI You — [Month Year]").

## Cold-open hook (LOCKED)
Primary headline: **"AI has 6 levels. Which one are you?"**
Subline: *"90 seconds, no signup. Find your level — and the one habit that gets you to the next."*
CTA button: "Find my level →". A/B variant headline: "Most people use AI like a search engine. Do you?" (subline: "Find out what level you're actually at — 90 seconds, no signup.")
Lead the hook with LEVEL (rung); reveal STYLE/type as the bonus identity in the result. The "search engine" line is demoted to a flattering reveal beat ("you're past where ~60% of people stop"), not the only opener.

## File layout
```
snapshot/
  index.html        # shell: loads fonts, css, modules; mount point
  css/snapshot.css  # design system (reuse tokens)
  data/content.js   # window.SNAP_CONTENT = { questions, lexicon, copy, prompts }
  js/score.js       # window.SnapScore = { scoreActA(answers), scoreActB(role,answers), persona(a,b) }
  js/app.js         # flow state machine, render, living card, result, share-card SVG, submit
  r/index.html      # report-wrapper (fetches snapshot-report fn HTML, document.write) — Phase 2
  u/index.html      # /u/<slug> identity page — Phase 2 (opaque slug; CSO review before PII/re-marketing)
```
All scoring is **client-side**; server is only for lead capture/email.

## The ladder (LOCKED naming)
6 behavioral rungs, tool-agnostic: **0 Unaware · 1 Searcher · 2 Drafter · 3 Operator · 4 Builder · 5 Orchestrator.**
"Orchestrator" = a human who directs a system of AI agents that do multi-step work. (The human conducts; an orchestrator agent is a thing in the system you direct — do NOT rename the rung "Conductor".)
Orthogonal STYLE axis (display names; grounded in Mollick/HBS Centaur/Cyborg): **Delegator** (=Centaur: hand off whole tasks, you/AI split work) · **Collaborator** (=Cyborg: blend turn-by-turn) · **Automator** (build it to run without you). Internal keys stay `centaur`/`cyborg`/`self`. Style is the SHARE HERO, lateral not ranked. Carry the cited nuance: full automation can de-skill.
Headline number: **AI Leverage Index 0–100** (PRIVATE — gated report + in-flow animation only; never on the public share card, where a low number reads as shame).

## Data shapes (content.js → window.SNAP_CONTENT)
```js
{
  scenarios: [               // Act 1 core measurement (recognition, not self-grade)
    { id, stem, options:[ { label, rung:0..5, style:'centaur'|'cyborg'|'self', ceiling?:bool } ] }
  ],
  roleRouter: { id, stem, options:[ {value:'owner'|'team'|'ic'|'solo', label} ] },
  confirmers: [ { id, stem, showIf:(state)=>bool, options:[ {label, rung, style} ] } ], // adaptive
  ceiling: { id, stem, multi:true, options:[ {label, capRung?:number} ] }, // "done WITHOUT you checking"
  mirror: { id, stem, options:[ {value, label} ] }, // NOT scored
  business: {                // Act 2, role-forked, behavioral proxies
    owner:[ {id, dim:'BI'|'KPD'|'AUTO'|'DATA'|'TEAM'|'REV', stem, options:[{label, v:0..3}]} ], // 6-8
    team:[...], ic:[...], solo:[...]
  },
  appetite: { id, stem, options:[ {value:'build_now'|'want_help'|'convince'|'curious', label, hot:bool} ] },
  dollar: { /* optional, skippable bands like readiness C1/C2 */ },
  lexicon: { generic:{...}, 'home-services':{...}, dtc:{...}, agency:{...}, course:{...}, services:{...}, 'b2b-saas':{...} },
  copy: {
    rung:{ 0:{name,blurb}, ... 5:{...} },
    style:{ centaur:{...}, cyborg:{...}, self:{...} },
    persona:{ bottlenecked_builder:{...}, next_at_wheel:{...}, ground_floor:{...}, ai_native:{...} },
    peerMirror:{ /* by role+rung: 3 concrete next-level habits */ },
    unawareDelight:[ '6 places AI already helps you this week...' ],
    flatteringFact:(rung)=>string
  },
  prompts: { /* level-up copy-paste prompt by rung×role, lexicon-rendered; generic fallback */ }
}
```
Lexicon = the universality layer. Same semantic question IDs everywhere; `lexicon[vertical]` swaps stems/examples/result-lines. Vertical #2 = a lexicon copy, NOT a re-build. NEVER key off array indices.

## Scoring (score.js)
- `scoreActA(answers) -> { rung, style, index, leverageLabel }`
  - rung = Guttman gate top-down: Orchestrator requires Builder behavior; Builder requires built AND touches-real-work; Operator requires Drafter behavior. Scenario picks feed the gate; ceiling checklist is a HARD CAP (zero unsupervised actions ⇒ max Operator). Floor = Unaware only if explicit "barely use it" + no higher signal.
  - style = reconcile chosen options' style tags across scenarios/confirmers.
  - index 0–100 = work-split model (rough %AI-of-work) → bounded Index; private.
- `scoreActB(role, answers) -> { band:'Blind'|'Surfacing'|'Leveraged'|'AI-Native', pct, dims:{...}, constraint, coConstraints, fixOrder:[...] }` — reuse readiness weighted-avg math (BI 1.5×, KPD 1.5×, others 1.0). Behavioral proxies, not aspirational.
- `persona(actA, actB) -> { key, label }` — quadrant YOU(low/high cut at Operator+) × BUSINESS(low/high). high/low=bottlenecked_builder, low/high=next_at_wheel, low/low=ground_floor (expected modal — frame "leapfrog"), high/high=ai_native. Narrative only; never routes.
- All cut points are config constants at top of score.js (uncalibrated; retune after ~50 responses). Include inline self-tests asserting no impossible state (Orchestrator-without-Builder, ceiling cap holds).

## Flow (app.js state machine)
ACT 1 (ungated): cold-open → scenario(s) → roleRouter → adaptive confirmer(s) → ceiling → mirror(not scored) → **PERSONAL REVEAL** (identity drop, flattering fact, 2D map SVG share card, mirror-result, peer-mirror "you do 1 of 3", level-up prompt copy button, download-card, fork CTA). Unaware → delight branch.
FORK: "See what this means for your business/team? (2 min)" — owners/team pre-selected; anyone can stop here with a complete result.
EMAIL GATE (Act1→Act2 boundary): business report rendered **blurred behind**; "enter email to unblur" + revenue band + headcount (≤3 fields). Industry chip asked here (or prefilled from `?v=` / UTM).
ACT 2 (opt-in): business questions (role-forked, lexicon-rendered) → appetite → optional dollar-math → **BUSINESS REVEAL**: quadrant+persona, Index hero, constraint + top-3 fix-order, ROI, role-conditioned CTA (owner+fit+hot-appetite→book call; non-founder→forwardable team-gap card; curious/small→playbook+nurture). Home-services → outside-view box (Phase 2 deep scrape; tonight = lighter/peer-percentile).
Progress = the living card assembling + quiet "Section X of 3" (never raw question count). One question per screen, tap-forward, mobile-first.

## Share card (2D map)
SVG, downloadable + OG image. X axis = rung (Searcher→Orchestrator), color/Y = style. Glowing dot = you; faint dots = other archetypes; **empty region ahead reads as opportunity**. Big lateral identity ("Collaborator Operator"), family/tribe line, NO Index number. Must be legible at ~200px thumbnail (verify before final).

## Server (snapshot-submit edge fn + snapshot_submissions table)
Clone readiness-submit pattern. New table `snapshot_submissions` columns: id, created_at, name, email, company, role(scope), industry, rung, style, ai_index, persona, band, business_pct, constraint, appetite, revenue, headcount, dollar bands, answers(jsonb), flag, user_agent, referrer. Insert via service_role; email CT (Resend, send-only to ct@ovae.ai) with subject by appetite/flag. Report wrapper at `/snapshot/r/?id=`. Reuse SUPABASE_URL/SERVICE_ROLE/RESEND/ADMIN_TOKEN secrets.
ROUTING: hot ping only when flag∈{flagship,qualified} AND scope=owner AND appetite hot AND business-gap past buffer; else weekly digest. Appetite is PRIMARY qualifier. scope≠owner caps flag at qualified.

## Tonight scope (must work) vs fast-follow
TONIGHT: Act 1 complete (universal) + Act 2 owner-fork + generic & home-services lexicon + static reveal + downloadable 2D-map card + email gate + snapshot-submit lead capture. Deployed at /snapshot, browser-QA'd desktop+mobile.
FAST-FOLLOW (Phase 2): animated living card, Wrapped-style swipe story, live LLM "show the rung above" demo, /u/ identity URLs + 90-day return loop, prediction share loop, deep outside-view scrape, remaining verticals' lexicons, team/ic/solo Act 2 forks fully fleshed.

## Risks accepted
Self-report outside scrape; Index/cuts uncalibrated until ~50 responses; Ground Floor likely modal (>60%) — style-hero + empty-map-region + level-up must make it feel like leapfrog; /u/ store needs CSO pass before PII/re-marketing.
