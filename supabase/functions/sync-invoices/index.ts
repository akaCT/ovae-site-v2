// sync-invoices — connector #1: pull Invoice Ninja invoices/payments and enrich
// matching pipeline deals. Server-side pull (no public webhook); token from the
// INVOICE_NINJA_API_TOKEN secret named in the connected_systems registry.
// Matches by company name (IN contacts have no emails yet); stores the IN client id
// for stable matching afterwards. Surfaces fully-paid invoices for MANUAL Won (never
// auto-moves money state). Gated by ADMIN_TOKEN (?k= or x-admin-token); ?dry=1 previews.
import { getSystem, recordSync, pgGet, pgPatch, matchPipeline, logActivity, normName, usd } from "../_shared/connectors.ts";

const SYS = "invoice_ninja";
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } });

// IN status_id: 1 Draft, 2 Sent, 3 Partial, 4 Paid, 5 Cancelled, 6 Reversed.
function invStatus(inv: any): string {
  const amt = Number(inv.amount) || 0, bal = Number(inv.balance) || 0;
  const sid = String(inv.status_id);
  if (sid === "5" || sid === "6") return "cancelled";
  if (amt > 0 && bal <= 0.001) return "paid";
  if (bal > 0 && bal < amt) return "partial";
  if (bal > 0 && inv.due_date && new Date(inv.due_date) < new Date()) return "overdue";
  if (sid === "1") return "draft";
  return "sent";
}
// Roll several invoices for one client into a single status (worst-but-most-advanced wins).
const RANK: Record<string, number> = { overdue: 5, partial: 4, sent: 3, draft: 2, paid: 1, cancelled: 0 };

async function inGet(base: string, token: string, path: string): Promise<any[]> {
  const r = await fetch(`${base}/${path}`, { headers: { "X-API-TOKEN": token, "X-Requested-With": "XMLHttpRequest", "content-type": "application/json" } });
  if (!r.ok) throw new Error(`IN ${path}: ${r.status} ${await r.text()}`);
  return (await r.json()).data || [];
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("k") || req.headers.get("x-admin-token") || "";
  if (!token || token !== Deno.env.get("ADMIN_TOKEN")) return json({ error: "not authorized" }, 403);
  const dry = !!url.searchParams.get("dry");

  try {
    const sys = await getSystem(SYS);
    if (!sys || !sys.base_url || !sys.token_secret_name) throw new Error("invoice_ninja not configured in registry");
    const inToken = Deno.env.get(sys.token_secret_name);
    if (!inToken) throw new Error(`secret ${sys.token_secret_name} not set`);

    const invoices = await inGet(sys.base_url, inToken, "invoices?include=client&per_page=200");
    const pipeline = await pgGet("pipeline?select=id,name,company,email,stage,invoice_ninja_client_id");

    // Group invoices by IN client.
    const byClient = new Map<string, { name: string; invs: any[] }>();
    for (const inv of invoices) {
      const cid = String(inv.client_id);
      const cname = (inv.client && inv.client.name) || "";
      if (!byClient.has(cid)) byClient.set(cid, { name: cname, invs: [] });
      byClient.get(cid)!.invs.push(inv);
    }

    const results: any[] = [];
    let matched = 0, enriched = 0, unmatched = 0, activities = 0;

    for (const [cid, grp] of byClient) {
      const row = matchPipeline(pipeline, { idField: "invoice_ninja_client_id", id: cid, company: grp.name });
      if (!row) { unmatched++; results.push({ client: grp.name, matched: false }); continue; }
      matched++;

      const active = grp.invs.filter((i) => invStatus(i) !== "cancelled");
      const amount_invoiced = active.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const invoice_balance = active.reduce((s, i) => s + (Number(i.balance) || 0), 0);
      const amount_paid = amount_invoiced - invoice_balance;
      const status = active.map(invStatus).sort((a, b) => RANK[b] - RANK[a])[0] || "draft";
      const link = (() => {
        const inv = active[0];
        const inv2 = inv && inv.invitations && inv.invitations[0];
        return inv2 && inv2.link ? inv2.link : null;
      })();
      const lastDate = active.map((i) => i.date).filter(Boolean).sort().slice(-1)[0] || null;

      const patch = {
        invoice_status: status,
        amount_invoiced, amount_paid, invoice_balance,
        invoice_ninja_client_id: cid,
        invoice_url: link,
        last_invoice_at: lastDate ? new Date(lastDate).toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      results.push({ client: grp.name, deal: row.name, status, amount_invoiced, amount_paid, balance: invoice_balance, paid_ready_to_win: status === "paid" && row.stage !== "won" });

      if (!dry) {
        await pgPatch(`pipeline?id=eq.${row.id}`, patch);
        enriched++;
        // Log a per-invoice activity (idempotent by title).
        for (const inv of active) {
          const st = invStatus(inv);
          const title = `Invoice ${inv.number || inv.id} · ${st} · ${usd(Number(inv.amount))}`;
          const body = `Balance ${usd(Number(inv.balance))} of ${usd(Number(inv.amount))}.`;
          if (await logActivity(row.id, "invoice", title, body, inv.invitations?.[0]?.link || null)) activities++;
        }
      }
    }

    const summary = `${matched} matched, ${enriched} enriched, ${unmatched} unmatched, ${activities} activities`;
    if (!dry) await recordSync(SYS, "connected", summary, matched);

    return json({ ok: true, dry, summary, matched, enriched, unmatched, activities, results });
  } catch (e) {
    console.error("sync-invoices error:", e);
    if (!dry) { try { await recordSync(SYS, "error", String(e).slice(0, 300), null); } catch { /* ignore */ } }
    return json({ error: String(e) }, 500);
  }
});
