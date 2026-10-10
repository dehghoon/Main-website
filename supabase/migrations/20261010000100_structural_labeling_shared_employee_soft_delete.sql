-- Allow any authorized employee to remove any uploaded drawing from the active labeling queue.
-- This remains a soft delete: source artifacts, revisions, audit history, and GPT-7 exports are preserved.

create or replace function public.labeling_soft_delete_uploaded_candidate(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare
  v_state text;
begin
  perform public.labeling_require('labeling.upload','employee');

  select workflow_state
  into v_state
  from public.structural_labeling_candidates
  where id = p_id
    and deleted_at is null
  for update;

  if v_state is null then
    raise exception 'candidate_not_found';
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
    'Removed from active labeling queue by an authorized employee.',
    'Soft delete only. Source artifact, revisions, audit/provenance, and any completed GPT-7 export are preserved.'
  );

  return true;
end;
$$;

revoke all on function public.labeling_soft_delete_uploaded_candidate(uuid) from public, anon;
grant execute on function public.labeling_soft_delete_uploaded_candidate(uuid) to authenticated;
