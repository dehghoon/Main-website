-- Structural Labeling workspace usability: reversible queue removal.
-- "Delete from queue" archives a candidate instead of destroying audit/revision history.

alter table public.structural_labeling_candidates
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id);

create index if not exists structural_labeling_candidates_active_idx
  on public.structural_labeling_candidates(created_at)
  where archived_at is null;

create or replace function public.labeling_archive_candidate(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate public.structural_labeling_candidates%rowtype;
begin
  perform public.labeling_require('labeling.upload', 'employee');

  select *
  into candidate
  from public.structural_labeling_candidates
  where id = p_id
  for update;

  if candidate.id is null then
    raise exception 'candidate_not_found' using errcode = 'P0002';
  end if;

  if candidate.created_by is distinct from auth.uid() then
    raise exception 'candidate_delete_owner_required' using errcode = '42501';
  end if;

  if candidate.archived_at is not null then
    return;
  end if;

  if candidate.workflow_state in (
    'submitted-for-owner-qa',
    'owner-approved',
    'owner-rejected'
  ) then
    raise exception 'candidate_locked_after_owner_submission' using errcode = '42501';
  end if;

  update public.structural_labeling_candidates
  set archived_at = now(),
      archived_by = auth.uid()
  where id = p_id;

  perform public.labeling_audit(
    p_id,
    'employee',
    candidate.workflow_state,
    candidate.workflow_state,
    'removed-from-active-queue',
    'Candidate archived by uploader; source, revisions, and audit history preserved.'
  );
end;
$$;

revoke all on function public.labeling_archive_candidate(uuid) from public, anon;
grant execute on function public.labeling_archive_candidate(uuid) to authenticated;
