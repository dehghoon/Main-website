-- Allow an uploader to remove any of their own Structural Labeling candidates from the active queue.
-- This remains a soft delete: source files, revisions, approvals, exports, and audit history are preserved.

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
    'Soft delete only. Source artifact, revisions, approvals, exports, and immutable audit/provenance are preserved.'
  );

  return true;
end;
$$;

revoke all on function public.labeling_soft_delete_uploaded_candidate(uuid) from public, anon;
grant execute on function public.labeling_soft_delete_uploaded_candidate(uuid) to authenticated;
