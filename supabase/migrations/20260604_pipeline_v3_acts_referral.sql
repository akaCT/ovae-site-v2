-- Pipeline v3: snapshot two-act sync + referral attribution.
-- Applied to project muguotipixphthfxjssu.

alter table public.pipeline add column if not exists referred_by text;

-- Source-agnostic snapshot sync: fires on INSERT (Act 1 = personal) AND UPDATE
-- (Act 2 = business). Act-2 completion promotes lead_type to 'snapshot-business'
-- (hot) and merges business facts; carries `via` referral into referred_by.
create or replace function public.sync_pipeline_from_snapshot() returns trigger as $$
declare biz boolean;
begin
  biz := (NEW.business_pct is not null) or (NEW.revenue is not null and NEW.revenue <> '') or (NEW.appetite is not null and NEW.appetite <> '');
  insert into public.pipeline (name, company, email, stage, source, lead_type, source_table, source_id, readiness_score, flag, constraint_dim, referred_by, details, last_activity)
  values (
    NEW.name, NEW.company, NEW.email, 'new', 'snapshot',
    case when biz then 'snapshot-business' else 'snapshot' end,
    'snapshot_submissions', NEW.id, NEW.ai_index, NEW.flag, NEW.constraint_dim, NEW.via,
    jsonb_strip_nulls(jsonb_build_object(
      'Snapshot stage', case when biz then 'Business (Act 2)' else 'Personal (Act 1)' end,
      'AI rung', NEW.rung_name, 'Persona', NEW.persona, 'Style', NEW.style, 'Role', NEW.role,
      'Industry', NEW.industry, 'Revenue', NEW.revenue, 'Headcount', NEW.headcount, 'Appetite', NEW.appetite,
      'Business readiness', case when NEW.business_pct is not null then NEW.business_pct::text || '%' else null end,
      'Referred by', NEW.via
    )),
    now()
  )
  on conflict (source_table, source_id) where source_id is not null do update set
    lead_type = excluded.lead_type,
    flag = excluded.flag,
    readiness_score = excluded.readiness_score,
    constraint_dim = coalesce(excluded.constraint_dim, public.pipeline.constraint_dim),
    referred_by = coalesce(excluded.referred_by, public.pipeline.referred_by),
    company = coalesce(public.pipeline.company, excluded.company),
    details = public.pipeline.details || excluded.details,
    last_activity = now();
  return NEW;
end; $$ language plpgsql security definer;

drop trigger if exists trg_pipeline_snapshot on public.snapshot_submissions;
drop trigger if exists trg_pipeline_snapshot_upd on public.snapshot_submissions;
create trigger trg_pipeline_snapshot after insert on public.snapshot_submissions for each row execute function public.sync_pipeline_from_snapshot();
create trigger trg_pipeline_snapshot_upd after update on public.snapshot_submissions for each row execute function public.sync_pipeline_from_snapshot();
