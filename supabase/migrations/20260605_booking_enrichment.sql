-- Booking enrichment (connector #2, Cal.rs at book.ovae.ai).
-- Cal.rs has no HTTP API and stores data in SQLite on nexus-niko, so this connector
-- is push-ingest: a read-only server cron dumps bookings to the sync-bookings edge fn.

alter table pipeline
  add column if not exists next_booking_at  timestamptz,   -- earliest upcoming confirmed call
  add column if not exists last_booking_at  timestamptz,
  add column if not exists booking_status   text;          -- upcoming|completed|cancelled|no_show

create index if not exists pipeline_next_booking_idx on pipeline (next_booking_at);

-- Booking system is reachable only via the server-side pusher (no API token to store).
update connected_systems
   set status = 'connected', base_url = 'https://book.ovae.ai',
       metadata = jsonb_build_object('ingest', 'push', 'event_type', 'strategy-call', 'engine', 'cal.rs'),
       updated_at = now()
 where key = 'booking';
