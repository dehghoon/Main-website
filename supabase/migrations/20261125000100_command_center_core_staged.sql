-- Staged only: apply to a preview database and verify RLS/RPC behavior before production.
begin;
create table public.command_center_core_releases (
 id uuid primary key default gen_random_uuid(),
 target_version text not null,
 source_sha text not null check(source_sha ~ '^[0-9a-f]{40}$'),
 status text not null default 'pending' check(status in ('pending','request_changes','rejected','postponed','approved','rolling_out','released','rolled_back','failed')),
 evidence jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 unique(target_version,source_sha)
);
create table public.command_center_core_release_events (
 id uuid primary key default gen_random_uuid(),
 release_id uuid not null references public.command_center_core_releases(id),
 actor_id uuid not null references auth.users(id),
 decision text not null,
 reason text not null,
 source_sha text not null,
 evidence_snapshot jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.command_center_core_releases enable row level security;
alter table public.command_center_core_release_events enable row level security;
revoke all on public.command_center_core_releases, public.command_center_core_release_events from anon, authenticated;
grant select on public.command_center_core_releases, public.command_center_core_release_events to authenticated;
create policy command_center_owner_read on public.command_center_core_releases for select to authenticated using(public.platform_access_is_owner());
create policy command_center_owner_events_read on public.command_center_core_release_events for select to authenticated using(public.platform_access_is_owner());
-- No client insert/update/delete policy. Evidence ingestion is a separate, least-privilege server integration.
create function public.command_center_review_core_release(p_release_id uuid,p_decision text,p_reason text)
returns text language plpgsql security definer set search_path=public,pg_temp as $$
declare candidate public.command_center_core_releases%rowtype; next_status text; gate text;
begin
 if auth.uid() is null or not public.platform_access_is_owner() then raise exception 'forbidden'; end if;
 if p_decision not in ('approve','request_changes','reject','postpone') or p_decision is null or p_reason is null or length(trim(p_reason))<10 or length(p_reason)>2000 then raise exception 'invalid_review'; end if;
 select * into candidate from public.command_center_core_releases where id=p_release_id for update;
 if not found or candidate.status not in ('pending','request_changes','postponed') then raise exception 'release_not_reviewable'; end if;
 if p_decision='approve' then
  if candidate.evidence->>'sourceSha' is distinct from candidate.source_sha then raise exception 'stale_evidence'; end if;
  foreach gate in array array['unit','integration','regression','engineeringReference','schema','security','build','preview','compatibility','rollback'] loop
   if candidate.evidence->'checks'->>gate is distinct from 'passed' then raise exception 'mandatory_gate_missing: %',gate; end if;
   if coalesce(length(candidate.evidence->'evidenceRefs'->>gate),0)<10 then raise exception 'evidence_reference_missing: %',gate; end if;
  end loop;
  if candidate.evidence->>'productionAuthorization' is distinct from 'explicit-owner-review-required' then raise exception 'release_policy_missing'; end if;
 end if;
 next_status:=case p_decision when 'approve' then 'approved' when 'reject' then 'rejected' when 'postpone' then 'postponed' else 'request_changes' end;
 insert into public.command_center_core_release_events(release_id,actor_id,decision,reason,source_sha,evidence_snapshot)
 values(candidate.id,auth.uid(),p_decision,trim(p_reason),candidate.source_sha,candidate.evidence);
 update public.command_center_core_releases set status=next_status where id=candidate.id;
 return next_status;
end $$;
revoke all on function public.command_center_review_core_release(uuid,text,text) from public,anon;
grant execute on function public.command_center_review_core_release(uuid,text,text) to authenticated;
commit;
