-- Pipeline v2: CRM/dossier model + source-agnostic auto-ingest.
-- Applied to project muguotipixphthfxjssu.

-- 1) Deal value (to us) vs client opportunity (their value-at-stake), + CRM fields + facts.
alter table public.pipeline
  add column if not exists deal_value_low bigint,
  add column if not exists deal_value_high bigint,
  add column if not exists opportunity_low bigint,
  add column if not exists opportunity_high bigint,
  add column if not exists lead_type text,
  add column if not exists contact_title text,
  add column if not exists phone text,
  add column if not exists next_step text,
  add column if not exists next_step_due date,
  add column if not exists owner text,
  add column if not exists last_activity timestamptz default now(),
  add column if not exists details jsonb not null default '{}'::jsonb,
  add column if not exists source_id uuid,
  add column if not exists source_table text;

create unique index if not exists pipeline_source_uidx on public.pipeline(source_table, source_id) where source_id is not null;

-- 2) Per-client activity + artifacts (calls, notes, emails, documents/transcripts).
create table if not exists public.client_notes (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.pipeline(id) on delete cascade,
  created_at timestamptz not null default now(),
  kind text not null default 'note',      -- note|call|email|artifact
  title text, body text, url text, author text
);
grant select, insert, update, delete on public.client_notes to service_role;
create index if not exists client_notes_pid_idx on public.client_notes(pipeline_id, created_at desc);

-- 3) Source-agnostic auto-ingest: any quiz that writes to its table creates a pipeline lead.
create or replace function public.pipeline_from_readiness() returns trigger as $$
declare lo bigint; hi bigint; t bigint;
begin
  if NEW.value_band_1 in ('<250k','250k-1m','1m-3m','3m+') and NEW.value_band_2 in ('<500k','500k-2m','2m-5m','5m+') then
    t := (case NEW.value_band_1 when '<250k' then 125000 when '250k-1m' then 625000 when '1m-3m' then 2000000 when '3m+' then 5000000 else 0 end)
       + (case NEW.value_band_2 when '<500k' then 250000 when '500k-2m' then 1250000 when '2m-5m' then 3500000 when '5m+' then 8000000 else 0 end);
    lo := round(t*0.25); hi := round(t*0.40);
  end if;
  insert into public.pipeline (name, company, email, stage, source, lead_type, source_table, source_id, readiness_id, readiness_score, flag, constraint_dim, opportunity_low, opportunity_high)
  values (NEW.name, NEW.company, NEW.email, 'new','readiness','readiness','readiness_submissions', NEW.id, NEW.id, NEW.readiness_score, NEW.flag, NEW.constraint_dim, lo, hi)
  on conflict (source_table, source_id) where source_id is not null do nothing;
  return NEW;
end; $$ language plpgsql security definer;
drop trigger if exists trg_pipeline_readiness on public.readiness_submissions;
create trigger trg_pipeline_readiness after insert on public.readiness_submissions for each row execute function public.pipeline_from_readiness();

create or replace function public.pipeline_from_snapshot() returns trigger as $$
begin
  insert into public.pipeline (name, company, email, stage, source, lead_type, source_table, source_id, readiness_score, flag, constraint_dim, details)
  values (NEW.name, NEW.company, NEW.email, 'new','snapshot','snapshot','snapshot_submissions', NEW.id, NEW.ai_index, NEW.flag, NEW.constraint_dim,
    jsonb_strip_nulls(jsonb_build_object('AI rung',NEW.rung_name,'Persona',NEW.persona,'Style',NEW.style,'Role',NEW.role,'Industry',NEW.industry,'Revenue',NEW.revenue,'Headcount',NEW.headcount,'Appetite',NEW.appetite)))
  on conflict (source_table, source_id) where source_id is not null do nothing;
  return NEW;
end; $$ language plpgsql security definer;
drop trigger if exists trg_pipeline_snapshot on public.snapshot_submissions;
create trigger trg_pipeline_snapshot after insert on public.snapshot_submissions for each row execute function public.pipeline_from_snapshot();
