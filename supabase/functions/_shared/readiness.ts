// ============================================================
// Shared readiness model + renderers
// Mirrors the scoring/report copy in /readiness/index.html so the
// stored row can be re-rendered server-side without drift.
// ============================================================

export const ACCENT = "#7BC9C4";
export const RUST = "#C97D5C";
export const WARN = "#D9B26B";
export const GREEN = "#63E084";

export const DIM_META: Record<string, { name: string; weight: number }> = {
  BI: { name: "Business Intelligence", weight: 1.5 },
  AUTO: { name: "Workflow Automation", weight: 1.0 },
  DATA: { name: "Data Infrastructure", weight: 1.0 },
  TEAM: { name: "Team Leverage", weight: 1.0 },
  FNDR: { name: "Founder Bottleneck", weight: 1.5 },
  REV: { name: "Revenue Engine", weight: 1.0 },
};
export const TIE_BREAK = ["BI", "DATA", "FNDR", "AUTO", "TEAM", "REV"];
export const DIM_PHASE_LABEL = ["Blind / Manual", "Visible / Starting", "Working / Leveraged", "AI-Native"];

export const BANDS = [
  { min: 0, max: 25, name: "Blind", phase: "Phase 0 — Manual / Blind",
    copy: "You're running on yourself. The business lives in your head and a pile of disconnected tools. The single highest-leverage move is visibility — before any AI." },
  { min: 26, max: 50, name: "Surfacing", phase: "Phase 0 → 1",
    copy: "You can see some of the business but not trust it yet. You're one solid BI layer away from making faster, safer decisions — the foundation everything else stacks on." },
  { min: 51, max: 75, name: "Leveraged", phase: "Phase 1 → 2",
    copy: "You can see the business and you've started to automate. The opportunity now is validated automation on your highest-value workflows — turning visibility into leverage." },
  { min: 76, max: 100, name: "AI-Native", phase: "Phase 2 → 3",
    copy: "You're operating ahead of nearly everyone. The work now is connecting plan→see→act into one loop and getting you fully out of the bottleneck — Founder-to-System." },
];

export const OPP_COPY: Record<string, { h: string; b: string }> = {
  BI: { h: "Give yourself a single source of truth",
    b: "You can't automate or grow what you can't see. The first move is one trusted dashboard wired to your source systems — the foundation every later gain stacks on." },
  AUTO: { h: "Automate your highest-value workflow — validated first",
    b: "You have visibility; now turn it into leverage. We hand-run your top workflow, prove the before/after, then build it as an agent you can trust." },
  DATA: { h: "Connect your systems so data flows without hands",
    b: "Your tools don't talk, so your team re-keys data and your AI has nothing clean to act on. Connecting them unlocks both visibility and automation." },
  TEAM: { h: "Turn headcount into supervised leverage",
    b: "Output is tied to heads. Documenting and automating core processes lets the team supervise systems instead of executing tasks — output rises without hiring." },
  FNDR: { h: "Get yourself out of the bottleneck",
    b: "Most decisions still route through you. Moving you out of the critical path is the deepest transformation — Founder-to-System — and it compounds everything else." },
  REV: { h: "Put your revenue engine on a system",
    b: "Revenue runs on heroics and you see it only after the fact. Instrumenting and partly automating the engine makes growth repeatable and visible." },
};

export const REC_COPY: Record<string, { head: string; body: string; cta: string; meaning: string }> = {
  flagship: {
    head: "Flagship-fit — talk to them directly.",
    body: "Founder-led, decisive buyer, room to install, audience or distribution attached. Recommend a 30-minute call with the principals before anything else.",
    cta: "Book a 30-min call with CT & Isaiah",
    meaning: "founder-led · ICP · room to install",
  },
  qualified: {
    head: "Strong fit — get them on a call.",
    body: "Most of the signals line up. A 30-minute discovery call routes them to the right rung — Spark, Build, or Embed — based on what their numbers actually show.",
    cta: "Book a 30-min discovery call",
    meaning: "most ICP signals present",
  },
  nurture: {
    head: "Stay close — send the playbook.",
    body: "An Embed isn't the highest-leverage move yet. The Brain-first playbook plus The Operator's AI Digest keeps them moving — revisit when revenue, role, or buying structure shifts.",
    cta: "Send the playbook + Digest",
    meaning: "not yet ICP — nurture",
  },
};

export const C1_MID: Record<string, number> = { "<250k": 125000, "250k-1m": 625000, "1m-3m": 2000000, "3m+": 5000000 };
export const C2_MID: Record<string, number> = { "<500k": 250000, "500k-2m": 1250000, "2m-5m": 3500000, "5m+": 8000000 };
export const C1_LBL: Record<string, string> = { "<250k": "under $250K", "250k-1m": "$250K–$1M", "1m-3m": "$1M–$3M", "3m+": "$3M+", "unsure": "unsure" };
export const C2_LBL: Record<string, string> = { "<500k": "under $500K", "500k-2m": "$500K–$2M", "2m-5m": "$2M–$5M", "5m+": "$5M+", "unsure": "unsure" };

export const PROFILE_LBL: Record<string, Record<string, string>> = {
  respondent_role: { founder: "Founder / CEO / Owner", csuite: "C-suite (non-founder)", vp: "VP / Director", other: "Other" },
  revenue: { "<3m": "Under $3M", "3-5m": "$3–5M", "5-10m": "$5–10M", "10-25m": "$10–25M", "25-50m": "$25–50M", "50m+": "$50M+" },
  decision_maker: { me: "Me alone", partner: "Me + one partner", team: "A small leadership team", board: "A board / committee / PE sponsor" },
  headcount: { "1-10": "1–10", "11-25": "11–25", "26-75": "26–75", "76-200": "76–200", "200+": "200+" },
  overhead: { lean: "Lean — every role is essential", patch: "Some roles exist to patch broken process", bloated: "We've grown headcount faster than output", unsure: "Not sure" },
  audience: { sizable: "Yes, sizable (10k+)", small: "Yes, small / growing", no: "No", na: "Not relevant to us" },
};

export const QUESTIONS: { dim: string; text: string; opts: string[] }[] = [
  { dim: "BI", text: 'When you want to know "how is the business doing right now?", how do you find out?', opts: ["I ask someone to pull numbers, or I check my gut — there's no single place", "I open a few spreadsheets or tools and assemble the picture myself", "I open one dashboard the team maintains and trust most of it", "I glance at one live dashboard I fully trust; it's how we run"] },
  { dim: "BI", text: "Is there a single source of truth — one dashboard or BI layer — that you, the CEO, actually look at?", opts: ["No", "Sort of — it exists but I don't trust it or rarely open it", "Yes, and I reference it weekly", "Yes, and the whole leadership team runs off it daily"] },
  { dim: "BI", text: "How are your core metrics assembled?", opts: ["They aren't defined; numbers live in people's heads or scattered files", "Defined, but someone hand-assembles them into a report", "Defined and pulled automatically from source systems into one view", "Defined, automatic, and they drive decisions and trigger work"] },
  { dim: "BI", text: "Do you have an operating cadence — a recurring meeting or scoreboard that keeps the company on track?", opts: ["No real rhythm; planning is annual or reactive", "We've tried; it doesn't reliably stick", "Yes — a real weekly meeting with a metric scoreboard", "Yes — a connected BHAG→annual→quarterly→weekly rhythm that holds"] },
  { dim: "AUTO", text: "How many meaningful workflows (not toy demos) currently run on automation or AI agents?", opts: ["None", "One, and it's brittle / experimental", "Two or more, running reliably with humans supervising", "Several, and they're a maintained system we keep improving"] },
  { dim: "AUTO", text: "When you automate something, do you prove it works by hand first?", opts: ["We don't automate anything yet", "We jump straight to building; results are hit or miss", "Usually — we hand-run the workflow, then automate the proven version", "Always — validate-before-automate is just how we operate"] },
  { dim: "AUTO", text: "For work that AI/automation does, what's your team's role?", opts: ["The team does all the work manually", "A few people use AI tools for personal tasks", "The team supervises the automations rather than executing the work", "The team owns and evolves the automated system itself"] },
  { dim: "AUTO", text: "Are your automations maintained, or do they quietly break?", opts: ["We have none", "We built some things that are now half-broken / abandoned", "They're owned and monitored; someone fixes them when they drift", "They're a living system that adapts as the AI models change"] },
  { dim: "DATA", text: "Do your core systems (CRM, finance, ops, marketing) talk to each other?", opts: ["No — everything is a silo; data is re-keyed by hand", "A couple are connected; most aren't", "Most core systems feed one central place automatically", "Everything is connected; data flows without anyone moving it"] },
  { dim: "DATA", text: "If you wanted to answer a new question about the business, could you get clean data to do it?", opts: ["No — the data is messy, scattered, or untrusted", "With significant manual cleanup and a few days", "Yes, mostly — the data is consolidated and reasonably clean", "Yes, immediately — and an agent could query it for me"] },
  { dim: "DATA", text: "Is your data ready for AI to act on (not just to look at)?", opts: ["Haven't thought about it / no", "Some data is structured, but not for automation", "Our key workflows have clean data feeding them", "Our planning, metrics, and automations all run off one connected data layer"] },
  { dim: "TEAM", text: "Over the last two years, how has output moved relative to headcount?", opts: ["We added people to keep up; output barely moved", "Output grew, but only by adding proportional headcount", "Output rose faster than headcount on at least one function", "We've grown output meaningfully without adding heads — and can prove it"] },
  { dim: "TEAM", text: "Are your important processes documented, or do they live in people's heads?", opts: ["In people's heads; if someone leaves, knowledge leaves", "A few are written down; most aren't", "Core processes are documented and followed", "Documented, and increasingly run by agents the team supervises"] },
  { dim: "TEAM", text: "Could you point to a cost line that fell, or output that rose, because of AI/automation — with a number?", opts: ["No", "We think so, but we can't put a number on it", "Yes — one clear before/after with a real number", "Yes — multiple, and we track the leverage continuously"] },
  { dim: "FNDR", text: "How many important decisions get made without you in the room?", opts: ["Almost none — most decisions route through me", "Some routine ones; the important ones still need me", "Many — the team decides within clear guardrails", "Nearly all — I'd only step in on the truly strategic"] },
  { dim: "FNDR", text: "If you disappeared for two weeks with no contact, what happens to the core operation?", opts: ["It stalls within days — I'm the integration layer", "It limps; several things wait for me", "It runs fine on the routine; a few decisions queue up", "It runs and even improves — the system, not me, runs the company"] },
  { dim: "FNDR", text: "How much of your week is spent in the business (operating) vs. on the business (growth/vision)?", opts: ["Almost entirely in the business — I'm firefighting", "Mostly in the business", "A real split — I've reclaimed time for growth", "Mostly on the business — operations run without me"] },
  { dim: "REV", text: "How does your revenue engine (marketing/sales/fulfillment) run?", opts: ["On heroics — specific people hustling; no system", "Some playbooks exist, but it depends on individuals", "It runs on documented, repeatable systems", "It's instrumented and partly automated; the system finds and converts demand"] },
  { dim: "REV", text: "Do you have visibility into what's actually driving revenue?", opts: ["No — revenue is a surprise each month", "Lagging only — we see it after the fact", "Yes — we see the leading indicators on the dashboard", "Yes — and the system acts on them automatically"] },
  { dim: "REV", text: "Is there obvious room to grow revenue with the customers/market you already have?", opts: ["Not sure — we can't see the opportunity clearly", "Probably, but we're not equipped to capture it", "Yes, and we're starting to systematically pursue it", "Yes, and our AI-native engine is already capturing it"] },
];

// ---- types ----
export interface DimStat { raw: number; max: number; pct: number; count: number; label: string; phase: number }
export interface Row {
  id: string; created_at: string; name: string; email: string; company: string | null;
  respondent_role: string; revenue: string; decision_maker: string; headcount: string; overhead: string; audience: string;
  value_band_1: string | null; value_band_2: string | null; value_note: string | null;
  readiness_score: number; band: string; phase: string; center_phase: number; constraint_dim: string;
  dimensions: Record<string, DimStat>; answers: number[]; icp_score: number; flag: string;
  user_agent: string | null; referrer: string | null;
}

// ---- helpers ----
export function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
export function fmtUsd(n: number): string {
  if (n >= 1000000) return "$" + (Math.round(n / 100000) / 10).toFixed(n >= 10000000 ? 0 : 1) + "M";
  if (n >= 1000) return "$" + Math.round(n / 1000) + "K";
  return "$" + n;
}
export function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" }) + " CT";
  } catch { return iso; }
}
function codeFromConstraintName(name: string): string {
  for (const k of Object.keys(DIM_META)) if (DIM_META[k].name === name) return k;
  return "BI";
}
export function derive(row: Row) {
  const dims = row.dimensions || {};
  const constraintCode = codeFromConstraintName(row.constraint_dim);
  const top3 = TIE_BREAK
    .map((d) => ({ d, pct: dims[d]?.pct ?? 0, tieIdx: TIE_BREAK.indexOf(d) }))
    .sort((a, b) => (a.pct === b.pct ? a.tieIdx - b.tieIdx : a.pct - b.pct))
    .slice(0, 3)
    .map((x) => x.d);
  const band = BANDS.find((b) => b.name === row.band) || BANDS[0];
  const sortedHighLow = Object.keys(dims).sort((a, b) => (dims[b].pct - dims[a].pct));
  return { dims, constraintCode, top3, band, sortedHighLow };
}
export function flagMeta(flag: string): { label: string; color: string; dot: string } {
  if (flag === "flagship") return { label: "FLAGSHIP-FIT", color: GREEN, dot: "★" };
  if (flag === "qualified") return { label: "QUALIFIED", color: WARN, dot: "◇" };
  return { label: "NURTURE", color: "#A39E96", dot: "○" };
}

// ---- read a row server-side (service role) ----
export async function fetchRow(id: string): Promise<Row | null> {
  const base = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!base || !key) throw new Error("missing SUPABASE env");
  const res = await fetch(
    `${base}/rest/v1/readiness_submissions?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  if (!res.ok) throw new Error(`read failed: ${res.status} ${await res.text()}`);
  const rows = await res.json();
  return Array.isArray(rows) && rows.length ? rows[0] as Row : null;
}
