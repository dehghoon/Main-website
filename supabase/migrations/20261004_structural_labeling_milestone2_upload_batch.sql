-- Milestone 2 atomic source/page candidate intake.
create or replace function public.labeling_create_source_candidates(
  p_hash text,
  p_filename text,
  p_mime text,
  p_bytes bigint,
  p_storage text,
  p_origin_kind text,
  p_origin_ref text,
  p_project_group text,
  p_pages jsonb,
  p_provenance jsonb default '{}'::jsonb,
  p_historical jsonb default '{}'::jsonb
) returns uuid[]
language plpgsql
security definer
set search_path=public
as $$
declare
  s uuid;
  c uuid;
  d uuid;
  page jsonb;
  ids uuid[] := '{}';
  page_index int;
  page_id text;
begin
  perform public.labeling_require('labeling.upload','employee');
  if p_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid_source_hash'; end if;
  if nullif(trim(p_filename),'') is null or nullif(trim(p_origin_ref),'') is null
     or nullif(trim(p_project_group),'') is null or nullif(trim(p_storage),'') is null then
    raise exception 'malformed_provenance';
  end if;
  if jsonb_typeof(p_pages) <> 'array' or jsonb_array_length(p_pages)=0 then
    raise exception 'source_pages_required';
  end if;

  select source_id into s
  from public.structural_labeling_sources
  where source_sha256=p_hash and storage_path=p_storage
  limit 1;

  if s is null then
    insert into public.structural_labeling_sources(
      source_sha256,original_filename,mime_type,byte_size,storage_path,origin_kind,origin_ref,provenance,created_by
    ) values(
      p_hash,p_filename,p_mime,p_bytes,p_storage,p_origin_kind,p_origin_ref,coalesce(p_provenance,'{}'::jsonb),auth.uid()
    ) returning source_id into s;
  end if;

  for page in select value from jsonb_array_elements(p_pages) loop
    page_index := (page->>'pageIndex')::int;
    page_id := page->>'pageId';
    if page_index < 0 or nullif(trim(page_id),'') is null then raise exception 'invalid_page_identity'; end if;

    select id into d
    from public.structural_labeling_candidates
    where source_sha256=p_hash and page_index=page_index
    order by created_at limit 1;

    insert into public.structural_labeling_candidates(
      project_group_id,source_kind,source_ref,source_sha256,duplicate_of,workflow_state,created_by,
      source_id,page_id,page_index,original_filename,transform_metadata,provenance,historical_metadata
    ) values(
      p_project_group,
      case p_origin_kind when 'qa-run' then 'qa-run' when 'legacy-zip' then 'legacy-zip' else 'website-upload' end,
      p_origin_ref,p_hash,d,'candidate',auth.uid(),s,page_id,page_index,p_filename,page->'transform',
      coalesce(p_provenance,'{}'::jsonb),coalesce(p_historical,'{}'::jsonb)
    ) returning id into c;

    perform public.labeling_audit(c,'employee',null,'candidate',null,'Source preserved; renewed suitability review required; no dataset admission implied.');
    ids := array_append(ids,c);
  end loop;

  return ids;
end;
$$;

revoke all on function public.labeling_create_source_candidates(text,text,text,bigint,text,text,text,text,jsonb,jsonb,jsonb) from public;
grant execute on function public.labeling_create_source_candidates(text,text,text,bigint,text,text,text,text,jsonb,jsonb,jsonb) to authenticated;
