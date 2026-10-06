-- Allow authorized reviewers/exporters to read preserved private sources.
drop policy if exists structural_labeling_source_read on storage.objects;
create policy structural_labeling_source_read on storage.objects
for select to authenticated using (
  bucket_id='structural-labeling-sources'
  and (
    public.has_structural_labeling_permission('labeling.workspace')
    or public.has_structural_labeling_permission('labeling.owner_review')
    or public.has_structural_labeling_permission('labeling.gpt7_export')
  )
);
