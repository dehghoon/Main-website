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
  v_source_id uuid;
  v_candidate_id uuid;
  v_duplicate_id uuid;
  v_page jsonb;
  v_candidate_ids uuid[] := '{}';
  v_page_index int;
  v_page_id text;
begin
  perform public.labeling_require('labeling.upload','employee');
  if p_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid_source_hash'; end if;
  if nullif(trim(p_filename),'') is null or nullif(trim(p_origin_ref),'') is null
    or nullif(trim(p_project_group),'') is null or nullif(trim(p_storage),'') is null then
    raise exception 'malformed_provenance';
  end if;
  if jsonb_typeof(p_pages) <> 'array' or jsonb_array_length(p_pages) = 0 then
    raise exception 'source_pages_required';
  end if;

  select source_id into v_source_id
  from public.structural_labeling_sources
  where source_sha256 = p_hash and storage_path = p_storage
  limit 1;

  if v_source_id is null then
    insert into public.structural_labeling_sources(
      source_sha256,original_filename,smime_type,byte_size,storage_path,origin_kind,origin_ref,provenance,created_by
    ) values(
      p_hash,p_filename,p_mime,p_bytes,p_storage,p_origin_kind,p_origin_ref,coalesce(p_provenance,{}'::jsonb),auth.uid()
    ) returning source_id into v_source_id;
  end if;

  for v_page in select value from jsonb_array_elements(p_pages) loop
    v_page_index := (v_page->>'pageIndex')::int;
    v_page_id := v_page->>'pageId';
    if v_page_index < 0 or nullif(trim(v_page_id),'') is null then raise exception 'invalid_page_identity'; end if;

    select c.id into v_duplicate_id
    from public.structural_labeling_candidates c
    where c.source_sha256 = p_hash and c.page_index = v_page_index
    order by c.created_at limit 1;

    insert into public.structural_labeling_candidates(
      project_group_id,source_kind,source_ref,source_sha256,duplicate_of,workflow_state,created_by,
      source_id,page_id,page_index,original_filename,transform_metadata,provenance,historical_metadata
    ) values(
      p_project_group,
      case p_origin_kind when 'qa-run' then 'qa-run' when 'legacy-zip' then 'legacy-zip' else 'website-upload' end,
      p_origin_ref,p_hash,v_duplicate_id,'candidate',auth.uid(),v_source_id,t_page_id,v_page_index,p_filename,v_page->'transform',
      coalesce(p_provenance,'{}'::jsonb),coalesce(p_historical,'{}'::jsonb)
    ) returning id into v_candidate_id;

    perform public.labeling_audit(v_candidate_id,'employee',null,'candidate',null,'Source preserved; renewed suitability review required; no dataset admission implied.');
    v_candidate_ids := array_append(v_candidate_ids,v_candidate_id);
  end loop;

  return v_candidate_ids;
end;
$$;

revoke all on function public.labeling_create_source_candidates(text,text,text,bigint,text,text,text,text,jsonb,jsonb,jsonb) from public;
grant execute on function public.labeling_create_source_candidates(text,text,text,bigint,text,text,text,text,jsonb,jsonb,jsonb) to authenticated;
