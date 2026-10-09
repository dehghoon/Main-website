-- Owner QA must be able to read the saved annotation revisions and audit history
-- for candidates that are visible through the owner-review queue.

drop policy if exists labeling_annotations_read on public.structural_labeling_annotation_revisions;
create policy labeling_annotations_read
on public.structural_labeling_annotation_revisions
for select
using (
  public.has_structural_labeling_permission('labeling.workspace')
  or public.has_structural_labeling_permission('labeling.owner_review')
);

drop policy if exists labeling_audit_read on public.structural_labeling_audit_events;
create policy labeling_audit_read
on public.structural_labeling_audit_events
for select
using (
  public.has_structural_labeling_permission('labeling.workspace')
  or public.has_structural_labeling_permission('labeling.owner_review')
);
