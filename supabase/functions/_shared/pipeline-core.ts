import { ACCENT, RUST, WARN, GREEN, esc, fmtUsd, flagMeta } from "./readiness.ts";
export { ACCENT, RUST, WARN, GREEN, esc, fmtUsd, flagMeta };

export interface PRow {
  id: string; created_at: string; updated_at: string; name: string; company: string | null; email: string | null;
  stage: string; source: string; source_table: string | null; source_id: string | null; lead_type: string | null;
  readiness_id: string | null; readiness_score: number | null; flag: string | null; constraint_dim: string | null;
  value_low: number | null; value_high: number | null;
  deal_value_low: number | null; deal_value_high: number | null;
  opportunity_low: number | null; opportunity_high: number | null;
  contact_title: string | null; phone: string | null; referred_by: string | null;
  next_step: string | null; next_step_due: string | null; owner: string | null; last_activity: string | null;
  proposal_url: string | null; notes: string | null; details: Record<string, string> | null;
  invoice_status?: string | null; amount_invoiced?: number | string | null; amount_paid?: number | string | null;
  invoice_balance?: number | string | null; invoice_ninja_client_id?: string | null; invoice_url?: string | null;
  last_invoice_at?: string | null; ecosystem?: Record<string, unknown> | null;
}

export interface CNote {
  id: string; pipeline_id: string; created_at: string; kind: string; title: string | null; body: string | null; url: string | null; author: string | null;
}

export const STAGES = [
  { k: "new", label: "New", color: ACCENT, prob: 0.05 },
  { k: "qualified", label: "Qualified", color: WARN, prob: 0.2 },
  { k: "proposal", label: "Proposal", color: "#8FB8FF", prob: 0.4 },
  { k: "negotiation", label: "Negotiation", color: "#E0A488", prob: 0.7 },
  { k: "won", label: "Won", color: GREEN, prob: 1 },
  { k: "lost", label: "Lost", color: "#6F6A63", prob: 0 },
];
export const STAGE_LABEL: Record<string, string> = Object.fromEntries(STAGES.map((s) => [s.k, s.label]));
export const STAGE_PROB: Record<string, number> = Object.fromEntries(STAGES.map((s) => [s.k, s.prob]));
export const STAGE_COLOR: Record<string, string> = Object.fromEntries(STAGES.map((s) => [s.k, s.color]));

export const SRC: Record<string, { label: string; color: string }> = {
  orectic: { label: "ORECTIC", color: "#B89CFF" },
  readiness: { label: "READINESS", color: "#7BC9C4" },
  manual: { label: "DIRECT", color: "#A39E96" },
};
export function srcMeta(s: string) { return SRC[s] || { label: (s || "").toUpperCase(), color: "#A39E96" }; }

export const SCORE_COLOR = (s: number) => (s >= 76 ? GREEN : s >= 51 ? ACCENT : s >= 26 ? WARN : RUST);

// Hot = a lead worth jumping on: completed the snapshot business act, or a flagship-fit readiness lead.
export function isHot(r: PRow): boolean {
  return r.lead_type === "snapshot-business" || r.flag === "flagship";
}
// Unified lead badge across sources (snapshot acts, readiness flag, orectic, manual).
export function leadBadge(r: PRow): { label: string; color: string; dot: string } {
  if (r.lead_type === "snapshot-business") return { label: "AI-LEVEL + BIZ", color: GREEN, dot: "🔥" };
  if (r.lead_type === "snapshot") return { label: "AI-LEVEL", color: "#9AA0A6", dot: "○" };
  if (r.flag) { const fm = flagMeta(r.flag); return { label: fm.label, color: fm.color, dot: fm.dot }; }
  const sm = srcMeta(r.source); return { label: sm.label, color: sm.color, dot: "" };
}

export function dealLowHigh(r: PRow): [number | null, number | null] { return [r.deal_value_low, r.deal_value_high]; }
export function dealMid(r: PRow): number {
  if (r.deal_value_low != null && r.deal_value_high != null) return Math.round((r.deal_value_low + r.deal_value_high) / 2);
  return r.deal_value_high || r.deal_value_low || 0;
}
export function rangeStr(lo: number | null, hi: number | null): string {
  if (lo != null && hi != null) return lo === hi ? fmtUsd(lo) : `${fmtUsd(lo)}–${fmtUsd(hi)}`;
  if (hi != null) return fmtUsd(hi);
  if (lo != null) return fmtUsd(lo);
  return "—";
}
export function dealStr(r: PRow): string { return rangeStr(r.deal_value_low, r.deal_value_high); }
export function oppStr(r: PRow): string { return rangeStr(r.opportunity_low, r.opportunity_high); }

export function daysSince(iso: string | null): number {
  if (!iso) return 0;
  try { return (Date.now() - new Date(iso).getTime()) / 86400000; } catch { return 0; }
}
export function isStale(r: PRow): boolean {
  return r.stage !== "won" && r.stage !== "lost" && r.stage !== "new" && daysSince(r.last_activity || r.created_at) > 7;
}
export function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" }); } catch { return iso; }
}
export function relDate(iso: string | null): string {
  if (!iso) return "";
  let ms: number;
  try { ms = Date.now() - new Date(iso).getTime(); } catch { return ""; }
  if (ms < 0) ms = 0;
  const min = ms / 60000;
  if (min < 1) return "just now";
  if (min < 60) return Math.floor(min) + "m ago";
  const h = min / 60;
  if (h < 24) return Math.floor(h) + "h ago";
  const d = h / 24;
  if (d < 30) return Math.floor(d) + "d ago";
  if (d < 365) return Math.floor(d / 30) + "mo ago";
  return Math.floor(d / 365) + "y ago";
}

// ---- Today / "needs you now" queue (shared by the board and the daily digest) ----
export type DueState = "overdue" | "today" | "soon" | "none" | "ok";
export function dueInfo(due: string | null): { state: DueState; label: string } {
  if (!due) return { state: "none", label: "no follow-up set" };
  const now = new Date();
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(due + "T00:00:00");
  if (isNaN(d.getTime())) return { state: "none", label: "no follow-up set" };
  const diff = Math.round((d.getTime() - t.getTime()) / 86400000);
  if (diff < 0) return { state: "overdue", label: `${-diff}d overdue` };
  if (diff === 0) return { state: "today", label: "due today" };
  if (diff <= 3) return { state: "soon", label: `due in ${diff}d` };
  return { state: "ok", label: fmtDate(due) };
}
export const DUE_COLOR: Record<DueState, string> = {
  overdue: RUST, none: RUST, today: WARN, soon: WARN, ok: ACCENT,
};
const OPEN_STAGES = ["qualified", "proposal", "negotiation"];

// ---- ecosystem enrichment (invoicing) ----
export function num(v: number | string | null | undefined): number {
  const n = typeof v === "string" ? parseFloat(v) : (v ?? 0);
  return isNaN(n) ? 0 : n;
}
export const INVOICE_COLOR: Record<string, string> = {
  paid: GREEN, partial: WARN, sent: ACCENT, draft: "#9AA0A6", overdue: RUST, cancelled: "#6F6A63",
};
export function invoiceBadge(r: PRow): { label: string; color: string } | null {
  if (!r.invoice_status) return null;
  return { label: r.invoice_status.toUpperCase(), color: INVOICE_COLOR[r.invoice_status] || "#9AA0A6" };
}
// A paid invoice on a not-yet-won deal = ready to close (surfaced, never auto-moved).
export function readyToWin(r: PRow): boolean {
  return r.invoice_status === "paid" && r.stage !== "won" && r.stage !== "lost";
}

// Does this row need a human today? Paid-ready-to-win or overdue invoice (top), open deals
// that are overdue / undated / due-soon / stale, plus hot leads still untriaged in the inbox.
export function needsAttention(r: PRow): boolean {
  if (readyToWin(r)) return true;
  if (r.invoice_status === "overdue") return true;
  if (r.stage === "new") return isHot(r);
  if (!OPEN_STAGES.includes(r.stage)) return false;
  return dueInfo(r.next_step_due).state !== "ok" || isStale(r);
}
function todayRank(r: PRow): number {
  if (readyToWin(r)) return -1;             // paid → close it, top priority
  if (r.invoice_status === "overdue") return 0;
  if (r.stage === "new") return 6;          // hot leads after deals
  const s = dueInfo(r.next_step_due).state;
  return s === "overdue" ? 1 : s === "none" ? 2 : s === "today" ? 3 : s === "soon" ? 4 : 5;
}
export function todayItems(rows: PRow[]): PRow[] {
  return rows.filter(needsAttention).sort((a, b) => {
    const d = todayRank(a) - todayRank(b);
    if (d) return d;
    return dealMid(b) - dealMid(a);
  });
}
