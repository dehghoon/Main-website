-- GitHub handoff receipt + employee soft-delete support for Structural Labeling.
-- Source artifacts remain preserved in private storage for audit/provenance; deleting removes them
-- from the active employee queue without destroying immutable history.

alter table public.structural_labeling_candidates
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id),
  add column if not exists gpt7_repository text,
  add column if not exists gpt7_commit_sha text,
  add column if not exists gpt7_export_path text,
  add column if not exists gpt7_exported_at timestamptz;

create or replace function public.labeling_soft_delete_uploaded_candidate(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare
  v_state text;
  v_created_by uuid;
begin
  perform public.labeling_require('labeling.upload','employee');

  select workflow_state, created_by
  into v_state, v_created_by
  from public.structural_labeling_candidates
  where id = p_id
  for update;

  if v_state is null then
    raise exception 'candidate_not_found';
  end if;

  if v_created_by is distinct from auth.uid() then
    raise exception 'candidate_delete_not_owner';
  end if;

  if v_state not in (
    'candidate',
    'suitable-for-labeling',
    'unsuitable-for-labeling',
    'labeling-in-progress',
    'revision-required'
  ) then
    raise exception 'candidate_delete_locked:%', v_state;
  end if;

  update public.structural_labeling_candidates
  set deleted_at = now(),
      deleted_by = auth.uid()
  where id = p_id
    and deleted_at is null;

  perform public.labeling_audit(
    p_id,
    'employee',
    v_state,
    v_state,
    'Removed from active labeling queue by uploader.',
    'Soft delete only. Source artifact and immutable audit/provenance are preserved.'
  );

  return true;
end;
$$;

revoke all on function public.labeling_soft_delete_uploaded_candidate(uuid) from public, anon;
grant execute on function public.labeling_soft_delete_uploaded_candidate(uuid) to authenticated;

create or replace function public.labeling_record_gpt7_github_export(
  p_id uuid,
  p_repository text,
  p_commit_sha text,
  p_export_path text
)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.labeling_require('labeling.owner_review','owner');

  if nullif(trim(p_repository),'') is null
     or p_commit_sha !~ '^[0-9a-f]{40}$'
    or nullif(trim(p_export_path),'') is null then
    raise exception 'invalid_gpt7_export_receipt';
  end if;

  update public.structural_labeling_candidates
  set gpt7_repository = p_repository,
      gpt7_commit_sha = p_commit_sha,
      gpt7_export_path = p_export_path,
      gpt7_exported_at = now()
  where id = p_id
    and workflow_state = 'owner-approved';

  if not found then
    raise exception 'owner_approved_candidate_required';
  end if;

  perform public.labeling_audit(
    p_id,
    'owner-reviewer',
    'owner-approved',
    'owner-approved',
    null,
     'Exported approved source + annotations JSON to GPT-7 GitHub repository at ' ||
      p_repository || '@' || p_commit_sha || ':' || p_export_path
  );

  return true;
end;
$$;

revoke all on function public.labeling_record_gpt7_github_export(uuid,text,text,text) from public, anon;
grant execute on function public.labeling_record_gpt7_github_export(uuid,text,text,text) to authenticated;
