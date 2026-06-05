-- Ovae Ecosystem Integration Layer
-- A registry of connected systems + normalized enrichment on the pipeline, so the
-- board/Today/digest/dashboards pull valuable data from every system as it comes online.
-- Connector #1 = Invoice Ninja; the rest are seeded as 'planned' and drop in later.

create table if not exists connected_systems (
  key               text primary key,            -- 'invoice_ninja', 'booking', 'crm', ...
  name              text not null,
  category          text not null,                -- invoicing|booking|crm|support|analytics|delivery|ads
  base_url          text,
  token_secret_name text,                          -- name of the Supabase secret holding the API token
  status            text not null default 'planned', -- planned|connected|error|disabled
  enrich            boolean not null default true,   -- does the connector write back to pipeline?
  last_sync_at      timestamptz,
  last_result       text,                            -- 'ok: 5 matched, 4 invoices' or an error
  last_synced_count integer,
  metadata          jsonb not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Pipeline enrichment from the invoicing system (amounts in dollars, matching deal_value_*).
alter table pipeline
  add column if not exists invoice_status          text,        -- draft|sent|partial|paid|overdue
  add column if not exists amount_invoiced          numeric,
  add column if not exists amount_paid              numeric,
  add column if not exists invoice_balance          numeric,
  add column if not exists invoice_ninja_client_id  text,
  add column if not exists invoice_url              text,
  add column if not exists last_invoice_at          timestamptz,
  -- generic per-system enrichment bag for everything that doesn't earn its own column yet
  add column if not exists ecosystem                jsonb not null default '{}';

create index if not exists pipeline_invoice_status_idx on pipeline (invoice_status);
create index if not exists pipeline_inj_client_idx on pipeline (invoice_ninja_client_id);

-- Seed the registry = the living map of the Ovae stack. Live systems 'connected', rest 'planned'.
insert into connected_systems (key, name, category, base_url, token_secret_name, status, enrich) values
  ('invoice_ninja', 'Invoice Ninja',  'invoicing', 'https://invoices.ovae.ai/api/v1', 'INVOICE_NINJA_API_TOKEN', 'connected', true),
  ('booking',       'Cal.rs Booking',  'booking',   'https://book.ovae.ai',            null,                      'planned',   true),
  ('crm',           'CRM',             'crm',       null,                              null,                      'planned',   true),
  ('support',       'Support',         'support',   null,                              null,                      'planned',   true),
  ('analytics',     'Analytics',       'analytics', null,                              null,                      'planned',   true),
  ('delivery',      'Delivery',        'delivery',  null,                              null,                      'planned',   true),
  ('ads',           'Ads',             'ads',       null,                              null,                      'planned',   true)
on conflict (key) do nothing;
