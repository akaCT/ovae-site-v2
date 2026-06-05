// Shared framework for Ovae ecosystem connectors.
// Every sync-<system> edge function reuses this: registry read/write, PostgREST
// helpers, fuzzy matching of external records to pipeline rows, idempotent activity log.
// Adding a new system = a new sync fn + one connected_systems row — this file doesn't change.

const SB = () => Deno.env.get("SUPABASE_URL")!;
const KEY = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const H = () => ({ apikey: KEY(), Authorization: `Bearer ${KEY()}`, "content-type": "application/json" });

export async function pgGet(path: string): Promise<any[]> {
  const r = await fetch(`${SB()}/rest/v1/${path}`, { headers: H() });
  if (!r.ok) throw new Error(`GET ${path}: ${r.status} ${await r.text()}`);
  return await r.json();
}
export async function pgPatch(path: string, body: unknown): Promise<any[]> {
  const r = await fetch(`${SB()}/rest/v1/${path}`, { method: "PATCH", headers: { ...H(), Prefer: "return=representation" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`PATCH ${path}: ${r.status} ${await r.text()}`);
  return await r.json();
}
export async function pgPost(path: string, body: unknown): Promise<any[]> {
  const r = await fetch(`${SB()}/rest/v1/${path}`, { method: "POST", headers: { ...H(), Prefer: "return=representation" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`POST ${path}: ${r.status} ${await r.text()}`);
  return await r.json();
}

export interface ConnectedSystem {
  key: string; name: string; category: string; base_url: string | null;
  token_secret_name: string | null; status: string; enrich: boolean; metadata: Record<string, unknown>;
}
export async function getSystem(key: string): Promise<ConnectedSystem | null> {
  const r = await pgGet(`connected_systems?key=eq.${key}&select=*`);
  return r[0] || null;
}
export async function recordSync(key: string, status: string, result: string, count: number | null): Promise<void> {
  await pgPatch(`connected_systems?key=eq.${key}`, {
    status, last_result: result, last_synced_count: count,
    last_sync_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  });
}

// Normalize a company name for fuzzy matching (drop punctuation, suffixes, parentheticals).
export function normName(s: string | null | undefined): string {
  return (s || "").toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/\b(llc|inc|co|ltd|the|company)\b/g, " ")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}
// Match an external record to a pipeline row: stored external id first, then email, then company.
export function matchPipeline(
  rows: any[],
  opts: { idField?: string; id?: string | null; company?: string | null; email?: string | null },
): any | null {
  if (opts.idField && opts.id) { const m = rows.find((r) => r[opts.idField!] && String(r[opts.idField!]) === String(opts.id)); if (m) return m; }
  if (opts.email) { const e = opts.email.toLowerCase(); const m = rows.find((r) => (r.email || "").toLowerCase() === e); if (m) return m; }
  if (opts.company) { const c = normName(opts.company); if (c.length >= 3) { const m = rows.find((r) => normName(r.company) === c); if (m) return m; } }
  return null;
}

// Append an activity note, idempotently (skip if same title already logged for this client).
export async function logActivity(
  pipelineId: string, kind: string, title: string, body: string | null, url: string | null, author = "ecosystem",
): Promise<boolean> {
  const existing = await pgGet(`client_notes?pipeline_id=eq.${pipelineId}&title=eq.${encodeURIComponent(title)}&select=id`);
  if (existing.length) return false;
  await pgPost(`client_notes`, { pipeline_id: pipelineId, kind, title, body, url, author });
  return true;
}

export const usd = (n: number | null | undefined): string =>
  n == null ? "—" : "$" + Math.round(n).toLocaleString("en-US");
