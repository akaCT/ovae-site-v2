// readiness-submit — persist a submission + email CT a branded notification.
// Body: either a full submission payload (inserts a new row) OR { notify_id }
// to (re)send the notification for an existing row (used for testing).
// Deploy with --no-verify-jwt; called cross-origin from ovae.ai.
import { fetchRow, flagMeta, C1_MID, C2_MID, type Row } from "../_shared/readiness.ts";
import { renderEmailHTML } from "../_shared/render.ts";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization, apikey",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...CORS, "content-type": "application/json" } });

function subjectFor(row: Row): string {
  const f = flagMeta(row.flag);
  const co = row.company || "—";
  if (row.flag === "flagship") return `${f.dot} [FLAGSHIP] ${row.name} · ${co} · ${row.band} (${row.readiness_score}/100)`;
  if (row.flag === "qualified") return `${f.dot} [Qualified] ${row.name} · ${co} · ${row.band} (${row.readiness_score}/100)`;
  return `${f.dot} [Nurture] ${row.name} · ${co} · send playbook`;
}

async function insertRow(payload: Record<string, unknown>): Promise<Row> {
  const base = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(`${base}/rest/v1/readiness_submissions`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "content-type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`insert failed: ${res.status} ${await res.text()}`);
  return (await res.json())[0] as Row;
}

async function upsertPipeline(row: Row): Promise<void> {
  const base = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const c1 = row.value_band_1, c2 = row.value_band_2;
  let lo: number | null = null, hi: number | null = null;
  if (c1 && c1 !== "unsure" && c2 && c2 !== "unsure") {
    const t = (C1_MID[c1] || 0) + (C2_MID[c2] || 0);
    lo = Math.round(t * 0.25); hi = Math.round(t * 0.40);
  }
  const entry = {
    name: row.name, company: row.company, email: row.email, stage: "new", source: "readiness",
    readiness_id: row.id, readiness_score: row.readiness_score, flag: row.flag,
    constraint_dim: row.constraint_dim, value_low: lo, value_high: hi,
  };
  const res = await fetch(`${base}/rest/v1/pipeline?on_conflict=readiness_id`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "content-type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error(`pipeline upsert failed: ${res.status} ${await res.text()}`);
}

async function sendEmail(row: Row, reportUrl: string): Promise<string> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY not set");
  const from = Deno.env.get("NOTIFY_FROM") || "Ovae Readiness <onboarding@resend.dev>";
  const to = (Deno.env.get("NOTIFY_TO") || "ct@ovae.ai").split(",").map((s) => s.trim());
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to, reply_to: row.email, subject: subjectFor(row), html: renderEmailHTML(row, reportUrl) }),
  });
  const out = await res.json();
  if (!res.ok) throw new Error(`resend failed: ${res.status} ${JSON.stringify(out)}`);
  return out.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const base = Deno.env.get("SUPABASE_URL")!;

    let row: Row | null;
    if (body.notify_id) {
      row = await fetchRow(String(body.notify_id));
      if (!row) return json({ error: "row not found" }, 404);
    } else {
      if (!body.name || !body.email) return json({ error: "name and email required" }, 400);
      row = await insertRow(body);
      try { await upsertPipeline(row); } catch (e) { console.error("pipeline upsert failed:", e); }
    }

    const SITE = Deno.env.get("SITE_URL") || "https://ovae.ai";
    const token = Deno.env.get("ADMIN_TOKEN");
    const publicUrl = `${SITE}/readiness/r/?id=${row.id}`;
    const adminUrl = token ? `${publicUrl}&k=${token}` : publicUrl;

    let emailId: string | null = null;
    try { emailId = await sendEmail(row, adminUrl); }
    catch (e) { console.error("email send failed:", e); } // never fail the submission on email

    return json({ ok: true, id: row.id, report_url: publicUrl, admin_url: adminUrl, email_id: emailId });
  } catch (e) {
    console.error("readiness-submit error:", e);
    return json({ error: String(e) }, 500);
  }
});
