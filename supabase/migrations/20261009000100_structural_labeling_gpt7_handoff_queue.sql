-- Structural Labeling -> GPT-7 intake handoff queue.
-- Owner approval creates an immutable handoff placeholder. The website then builds and validates
-- the pinned manual-labeling-intake-v0.1 package and finalizes it as pending-gpt7.
-- This boundary never performs GPT-7 admission, split assignment, YOLO export, or training.

create table if not exists public.structural_labeling_gpt7_handoffs (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null unique references public.structural_labeling_candidates(id) on delete restrict,
  contract_version text not null default 'manual-labeling-intake-v0.1'
    check (contract_version = 'manual-labeling-intake-v0.1'),
  handoff_state text not null default 'build-required'
    check (handoff_state in ('build-required', 'pending-gpt7')),
  intake_package jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  ready_at timestamptz,
  constraint structural_labeling_gpt7_handoffs_payload_state check (
    (handoff_state = 'build-required' and intake_package is null and ready_at is null)
    or
    (handoff_state = 'pending-gpt7' and intake_package is not null and ready_at is not null)
  )
);

create index if not exists structural_labeling_gpt7_handoffs_state_idx
  on public.structural_labeling_gpt7_handoffs(handoff_state, created_at);

alter table public.structural_labeling_gpt7_handoffs enable row level security;
revoke all on table public.structural_labeling_gpt7_handoffs from anon, authenticated;

create or replace function public.labeling_owner_transition(
  p_id uuid,
  p_action text,
  p_reason text default null
)
returns text
language plpgsql
security definer
set search_path=public
as $$
declare
  a text;
  n text;
begin
  perform public.labeling_require('labeling.owner_review','owner');

  select workflow_state
  into a
  from public.structural_labeling_candidates
  where id = p_id
  for update;

  if a <> 'submitted-for-owner-qa' then
    raise exception 'invalid_workflow_transition:%', coalesce(a,'null');
  end if;

  if p_action = 'approve' then
    n := 'owner-approved';
  elsif p_action = 'reject' then
    n := 'owner-rejected';
  elsif p_action = 'request-revision' then
    n := 'revision-required';
  else
    raise exception 'unsupported_owner_action';
  end if;

  if n in ('owner-rejected','revision-required')
     and nullif(trim(p_reason),'') is null then
    raise exception 'reason_required';
  end if;

  update public.structural_labeling_candidates
  set workflow_state = n,
      owner_disposition_reason = case
        when n in ('owner-rejected','revision-required')
then p_reason
      end
  where id = p_id;

  perform public.labeling_audit(
    p_id,
    'owner-reviewer',
    a,
    n,
    p_reason,
    case
      when n = 'owner-approved'
      then 'Owner Approved; GPT-7 intake handoff build queued. Dataset admission remains pending GPT-7.'
    end
  );

  if n = 'owner-approved' then
    insert into public.structural_labeling_gpt7_handoffs(
      candidate_id,
      created_by
    )
    values (
      p_id,
      auth.uid()
    )
    on conflict (candidate_id) do nothing;
  end if;

  return n;
end;
$$;

create or replace function public.labeling_get_gpt7_build_context(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  c public.structural_labeling_candidates%rowtype;
  s public.structural_labeling_sources%rowtype;
  r public.structural_labeling_annotation_revisions%rowtype;
  a jsonb;
begin
  perform public.labeling_require('labeling.owner_review','owner');

  select *
  into c
  from public.structural_labeling_candidates
  where id = p_id;

  if c.id is null then
    raise exception 'candidate_not_found';
  end if;

  if c.workflow_state <> 'owner-approved' then
    raise exception 'owner_approval_required';
  end if;

  select *
  into s
  from public.structural_labeling_sources
  where source_id = c.source_id;

  if s.source_id is null or s.preserved_artifact is distinct from true then
    raise exception 'preserved_source_artifact_required';
  end if;

  select *
  into r
  from public.structural_labeling_annotation_revisions
  where candidate_id = p_id
  order by revision_no desc
  limit 1;

  if r.id is null then
    raise exception 'annotation_revision_required';
  end if;

  select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at, e.event_id), '[]'::jsonb)
  into a
  from public.structural_labeling_audit_events e
  where e.candidate_id = p_id;

  return jsonb_build_object(
    'candidate', to_jsonb(c),
    'source', to_jsonb(s),
    'revision', to_jsonb(r),
    'audit', coalesce(a, '[]'::jsonb)
  );
end;
$$;

create or replace function public.labeling_finalize_gpt7_handoff(
  p_id uuid,
  p_package jsonb
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  c_state text;
  h public.structural_labeling_gpt7_handoffs%rowtype;
begin
  perform public.labeling_require('labeling.owner_review','owner');

  select workflow_state
  into c_state
  from public.structural_labeling_candidates
  where id = p_id;

  if c_state <> 'owner-approved' then
    raise exception 'owner_approval_required';
  end if;

  if p_package is null or jsonb_typeof(p_package) <> 'object' then
    raise exception 'gpt7_intake_package_required';
  end if;

  if p_package->>'schema_version' <> 'manual-labeling-intake-v0.1'
     or p_package->>'candidate_id' <> p_id::text
     or p_package->>'workflow_state' <> 'owner-approved'
     or p_package->>'owner_disposition' <> 'owner-approved'
     or p_package->>'dataset_admission' <> 'pending-gpt7'
     or coalesce((p_package->>'training_ready')::boolean, true) is distinct from false
     or coalesce((p_package->>'dataset_split_assigned')::boolean, true) is distinct from false
     or coalesce((p_package ##> '{boundary,enablesTraining}')::boolean, true) is distinct from false
    or coalesce((p_package ##> '{boundary,emitsCanonicalEngineeringGeometry}')::boolean, true) is distinct from false
     or jsonb_typeof(p_package->'annotations') <> 'array' then
    raise exception 'gpt7_intake_boundary_validation_failed';
  end if;

  select *
  into h
  from public.structural_labeling_gpt7_handoffs
  where candidate_id = p_id
  for update;

  if h.id is null then
    insert into public.structural_labeling_gpt7_handoffs(candidate_id, created_by)
    values (p_id, auth.uid())
    returning * into h;
  end if;

  if h.handoff_state = 'pending-gpt7' then
    if h.intake_package = p_package then
      return h.id;
    end if;
    raise exception 'gpt7_handoff_already_finalized';
  end if;

  update public.structural_labeling_gpt7_handoffs
  set handoff_state = 'pending-gpt7',
      intake_package = p_package,
      ready_at = now()
  where id = h.id
  returning * into h;

  perform public.labeling_audit(
    p_id,
   'owner-reviewer',
    'owner-approved',
    'owner-approved',
    null,
    'Validated GPT-7 intake package queued; pending GPT-7 dataset admission. Training remains disabled.'
  );

  return h.id;
end;
$$;

create or replace function public.labeling_list_gpt7_handoffs(p_limit integer default 50)
returns table (
  handoff_id uuid,
  candidate_id uuid,
  contract_version text,
  handoff_state text,
  intake_package jsonb,
  created_at timestamptz,
  ready_at timestamptz
)
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.labeling_require('labeling.gpt7_export','owner');

  if p_limit < 1 or p_limit > 200 then
    raise exception 'invalid_handoff_limit';
  end if;

  return query
  select
    h.id,
    h.candidate_id,
    h.contract_version,
    h.handoff_state,
    h.intake_package,
    h.created_at,
    h.ready_at
  from public.structural_labeling_gpt7_handoffs h
  where h.handoff_state = 'pending-gpt7'
  order by h.ready_at asc, h.created_at asc
  limit p_limit;
end;
$$;

revoke all on function public.labeling_get_gpt7_build_context(uuid) from public;
revoke all on function public.labeling_finalize_gpt7_handoff(uuid,jsonb) from public;
revoke all on function public.labeling_list_gpt7_handoffs(integer) from public;

grant execute on function public.labeling_get_gpt7_build_context(uuid) to authenticated;
grant execute on function public.labeling_finalize_gpt7_handoff(uuid,jsonb) to authenticated;
grant execute on function public.labeling_list_gpt7_handoffs(integer) to authenticated;
