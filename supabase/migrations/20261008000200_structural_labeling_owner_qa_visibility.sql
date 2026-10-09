-- Structural Labeling Owner QA visibility repair.
-- Additive only: keep Employee workspace access unchanged while allowing the approved Owner reviewer to read submitted QA records.

-- Bootstrap only the review permission for the approved production Owner.
-- This does not grant Workspace, Upload, Annotate, Submit, or GPT-7 Export access.
insert into public.structural_labeling_permissions (user_id, permission, granted_by)
select u.id, 'labeling.owner_review', u.id
from auth.users u
where lower(coalesce(u.email, '')) = 'dehghani.pmp@gmail.com'
on conflict (user_id, permission) do nothing;

-- Workspace users keep their existing read behavior. Owner reviewers gain read
-- access only to candidates that have entered or completed Owner QA.
drop policy if exists labeling_candidates_read
on public.structural_labeling_candidates;

create policy labeling_candidates_read
on public.structural_labeling_candidates
for select
to authenticated
using (
  public.has_structural_labeling_permission('labeling.workspace')
  or
  (
    public.has_structural_labeling_permission('labeling.owner_review')
    and workflow_state in (
      'submitted-for-owner-qa',
      'owner-approved',
      'owner-rejected',
      'revision-required'
    )
  )
);

drop policy if exists labeling_annotations_read
on public.structural_labeling_annotation_revisions;

create policy labeling_annotations_read
on public.structural_labeling_annotation_revisions
for select
to authenticated
using (
  public.has_structural_labeling_permission('labeling.workspace')
  or
  (
    public.has_structural_labeling_permission('labeling.owner_review')
    and exists (
      select 1
      from public.structural_labeling_candidates c
      where c.id = structural_labeling_annotation_revisions.candidate_id
        and c.workflow_state in (
          'submitted-for-owner-qa',
          'owner-approved',
          'owner-rejected',
          'revision-required'
        )
    )
  )
);

drop policy if exists labeling_audit_read
on public.structural_labeling_audit_events;

create policy labeling_audit_read
on public.structural_labeling_audit_events
for select
to authenticated
using (
  public.has_structural_labeling_permission('labeling.workspace')
  or
  (
    public.has_structural_labeling_permission('labeling.owner_review')
    and exists (
      select 1
      from public.structural_labeling_candidates c
      where c.id = structural_labeling_audit_events.candidate_id
        and c.workflow_state in (
          'submitted-for-owner-qa',
          'owner-approved',
          'owner-rejected',
          'revision-required'
        )
    )
  )
);
