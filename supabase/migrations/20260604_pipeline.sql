-- Pipeline: unified system of record for all deals/leads.
-- Readiness form leads flow in automatically (source='readiness'); manual and
-- Orectic proposals are added directly. Applied to project muguotipixphthfxjssu.

create table if not exists public.pipeline (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  company text,
  email text,
  stage text not null default 'new',            -- new|qualified|proposal|negotiation|won|lost
  source text not null default 'manual',         -- manual|readiness|orectic
  readiness_id uuid references public.readiness_submissions(id) on delete set null,
  readiness_score int,
  flag text,
  constraint_dim text,
  value_low bigint,
  value_high bigint,
  proposal_url text,
  notes text
);

grant select, insert, update, delete on public.pipeline to service_role;
create index if not exists pipeline_stage_idx on public.pipeline(stage);
create unique index if not exists pipeline_readiness_uidx on public.pipeline(readiness_id) where readiness_id is not null;

create or replace function public.touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists pipeline_touch on public.pipeline;
create trigger pipeline_touch before update on public.pipeline
  for each row execute function public.touch_updated_at();
