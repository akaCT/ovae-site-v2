import { ACCENT, RUST, WARN, GREEN, esc, fmtUsd } from "./readiness.ts";
export { ACCENT, RUST, WARN, GREEN, esc, fmtUsd };

export interface PRow {
  id: string; created_at: string; updated_at: string; name: string; company: string | null; email: string | null;
  stage: string; source: string; lead_type: string | null;
  readiness_id: string | null; readiness_score: number | null; flag: string | null; constraint_dim: string | null;
  value_low: number | null; value_high: number | null;
  deal_value_low: number | null; deal_value_high: number | null;
  opportunity_low: number | null; opportunity_high: number | null;
  contact_title: string | null; phone: string | null;
  next_step: string | null; next_step_due: string | null; owner: string | null; last_activity: string | null;
  proposal_url: string | null; notes: string | null; details: Record<string, string> | null;
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
