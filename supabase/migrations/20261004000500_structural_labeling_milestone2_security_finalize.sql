-- Structural Labeling Milestone 2 final privilege hardening.
revoke all on function public.labeling_audit(uuid,text,text,text,text,text) from public;
revoke all on function public.labeling_validate_payload(jsonb,jsonb) from public;
revoke all on function public.labeling_require(text,text) from public;

grant execute on function public.labeling_base_role() to authenticated;
grant execute on function public.labeling_require(text,text) to authenticated;

drop policy if exists structural_labeling_sources_read on public.structural_labeling_sources;
create policy structural_labeling_sources_read
on public.structural_labeling_sources for select to authenticated
using (
  public.has_structural_labeling_permission('labeling.workspace')
  or public.has_structural_labeling_permission('labeling.owner_review')
  or public.has_structural_labeling_permission('labeling.gpt7_export')
);

-- Audit rows stay append-only: foundation trigger blocks UPDATE/DELETE and direct INSERT is revoked.
