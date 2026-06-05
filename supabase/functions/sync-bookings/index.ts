// sync-bookings — connector #2: ingest Cal.rs bookings and enrich matching pipeline deals.
// Cal.rs has no HTTP API (SQLite on nexus-niko), so this is PUSH-ingest: a read-only
// server cron POSTs { bookings: [...] } here. Matches by guest_email -> pipeline, sets
// next_booking_at / last_booking_at / booking_status, logs booking activity. Upcoming
// calls are surfaced in Today/digest. Gated by ADMIN_TOKEN; ?dry=1 previews.
import { getSystem, recordSync, pgGet, pgPatch, matchPipeline, logActivity } from "../_shared/connectors.ts";

const SYS = "booking";
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } });

interface Booking { uid?: string; guest_name?: string; guest_email?: string; start_at?: string; end_at?: string; status?: string; notes?: string; title?: string }

function fmtWhen(iso: string): string {
  try { return new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" }); }
  catch { return iso; }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("k") || req.headers.get("x-admin-token") || "";
  if (!token || token !== Deno.env.get("ADMIN_TOKEN")) return json({ error: "not authorized" }, 403);
  const dry = !!url.searchParams.get("dry");

  try {
    const body = await req.json().catch(() => ({}));
    const bookings: Booking[] = Array.isArray(body.bookings) ? body.bookings : [];
    await getSystem(SYS); // ensure registered
    const pipeline = await pgGet("pipeline?select=id,name,company,email,stage,next_booking_at");
    const now = Date.now();

    // Group bookings by matched pipeline row.
    const perRow = new Map<string, { row: any; bks: Booking[] }>();
    let unmatched = 0;
    for (const b of bookings) {
      const row = matchPipeline(pipeline, { email: b.guest_email });
      if (!row) { unmatched++; continue; }
      if (!perRow.has(row.id)) perRow.set(row.id, { row, bks: [] });
      perRow.get(row.id)!.bks.push(b);
    }

    const results: any[] = [];
    let matched = 0, enriched = 0, activities = 0;

    for (const { row, bks } of perRow.values()) {
      matched++;
      const live = bks.filter((b) => (b.status || "confirmed") !== "cancelled" && b.start_at);
      const future = live.filter((b) => new Date(b.start_at!).getTime() > now).sort((a, b) => +new Date(a.start_at!) - +new Date(b.start_at!));
      const past = live.filter((b) => new Date(b.start_at!).getTime() <= now).sort((a, b) => +new Date(b.start_at!) - +new Date(a.start_at!));
      const next = future[0] || null;
      const last = past[0] || null;
      const status = next ? "upcoming" : (last ? "completed" : (bks.length ? "cancelled" : null));

      const patch = {
        next_booking_at: next ? new Date(next.start_at!).toISOString() : null,
        last_booking_at: last ? new Date(last.start_at!).toISOString() : null,
        booking_status: status,
        updated_at: new Date().toISOString(),
      };
      results.push({ deal: row.name, email: row.email, next: next ? fmtWhen(next.start_at!) : null, status });

      if (!dry) {
        await pgPatch(`pipeline?id=eq.${row.id}`, patch);
        enriched++;
        for (const b of bks) {
          if (!b.start_at) continue;
          const st = (b.status || "confirmed");
          const title = `Call ${st === "cancelled" ? "cancelled" : "booked"}: ${b.title || "strategy call"} · ${fmtWhen(b.start_at)}`;
          const note = [b.guest_name && `Guest: ${b.guest_name}`, b.notes && `Notes: ${b.notes}`].filter(Boolean).join(" — ") || null;
          if (await logActivity(row.id, "call", title, note, "https://book.ovae.ai")) activities++;
        }
      }
    }

    const summary = `${bookings.length} bookings, ${matched} matched, ${enriched} enriched, ${unmatched} unmatched, ${activities} activities`;
    if (!dry) await recordSync(SYS, "connected", summary, matched);
    return json({ ok: true, dry, summary, received: bookings.length, matched, enriched, unmatched, results });
  } catch (e) {
    console.error("sync-bookings error:", e);
    if (!dry) { try { await recordSync(SYS, "error", String(e).slice(0, 300), null); } catch { /* ignore */ } }
    return json({ error: String(e) }, 500);
  }
});
