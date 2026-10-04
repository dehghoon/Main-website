-- Structural Labeling Milestone 2 controlled domain operations.
create or replace function public.labeling_base_role()
returns text language sql stable security definer set search_path=public as $$
 select coalesce(auth.jwt()->'app_metadata'->>'role',auth.jwt()->'app_metadata'->>'user_type');
$$;

create or replace function public.labeling_require(p_permission text,p_actor text)
returns void language plpgsql stable security definer set search_path=public as $$
begin
 if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
 if not public.has_structural_labeling_permission(p_permission) then raise exception 'permission_denied:%',p_permission using errcode='42501'; end if;
 if p_actor='employee' and public.labeling_base_role() is distinct from 'employee' then raise exception 'employee_role_required' using errcode='42501'; end if;
 if p_actor='owner' and public.labeling_base_role()='employee' then raise exception 'employee_cannot_execute_owner_action' using errcode='42501'; end if;
end; $$;

create or replace function public.labeling_audit(p_id uuid,p_role text,p_prior text,p_next text,p_reason text default null,p_notes text default null)
returns void language plpgsql security definer set search_path=public as $$
begin
 insert into public.structural_labeling_audit_events(candidate_id,actor_id,actor_role,prior_state,new_state,reason,notes)
 values(p_id,auth.uid(),p_role,p_prior,p_next,p_reason,p_notes);
end; $$;

create or replace function public.labeling_validate_payload(p_annotations jsonb,p_transform jsonb)
returns void language plpgsql immutable set search_path=public as $$
declare a jsonb; b jsonb; w float8; h float8; x0 float8; y0 float8; x1 float8; y1 float8;
begin
 if p_transform is null or p_transform->>'coordinate_space'<>'source-page' or p_transform->>'unit'<>'pdf-point'
    or p_transform->>'transform_validation_state'<>'validated' then raise exception 'validated_source_page_transform_required'; end if;
 if jsonb_typeof(p_transform->'raster_to_source_page_affine')<>'array'
    or jsonb_array_length(p_transform->'raster_to_source_page_affine')<>6
    or jsonb_typeof(p_transform->'source_page_to_raster_affine')<>'array'
    or jsonb_array_length(p_transform->'source_page_to_raster_affine')<>6 then raise exception 'reversible_affine_required'; end if;
 if (p_transform->>'page_rotation_deg')::int not in (0,90,180,270) then raise exception 'invalid_page_rotation'; end if;
 w:=(p_transform->>'effective_page_width_pt')::float8; h:=(p_transform->>'effective_page_height_pt')::float8;
 if w<=0 or h<=0 then raise exception 'invalid_page_dimensions'; end if;
 if jsonb_typeof(p_annotations)<>'array' then raise exception 'annotations_must_be_array'; end if;
 for a in select * from jsonb_array_elements(p_annotations) loop
   if a->>'class' not in ('column','beam','wall') then raise exception 'invalid_annotation_class'; end if;
   if a->>'annotation_spec_version'<>'v0.2' then raise exception 'invalid_annotation_spec_version'; end if;
   if nullif(a->>'annotation_id','') is null then raise exception 'annotation_id_required'; end if;
   b:=a->'bbox'; if b is null then raise exception 'bbox_required'; end if;
   x0:=(b->>'xmin')::float8; y0:=(b->>'ymin')::float8; x1:=(b->>'xmax')::float8; y1:=(b->>'ymax')::float8;
   if x0<0 or y0<0 or x1>w or y1>h or x0>=x1 or y0>=y1 then raise exception 'invalid_bbox'; end if;
 end loop;
end; $$;

create or replace function public.labeling_create_candidate(
 p_hash text,p_filename text,p_mime text,p_bytes bigint,p_storage text,p_origin_kind text,p_origin_ref text,
 p_project_group text,p_page_id text,p_page_index int,p_transform jsonb,p_provenance jsonb,p_historical jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare s uuid; c uuid; d uuid;
begin
 perform public.labeling_require('labeling.upload','employee');
 if p_hash!~'^[0-9a-f]{64}$' then raise exception 'invalid_source_hash'; end if;
 if nullif(trim(p_filename),'') is null or nullif(trim(p_origin_ref),'') is null or nullif(trim(p_project_group),'') is null or nullif(trim(p_page_id),'') is null
 then raise exception 'malformed_provenance'; end if;
 select source_id into s from public.structural_labeling_sources where source_sha256=p_hash and storage_path=p_storage limit 1;
 if s is null then
   insert into public.structural_labeling_sources(source_sha256,original_filename,mime_type,byte_size,storage_path,origin_kind,origin_ref,provenance,created_by)
   values(p_hash,p_filename,p_mime,p_bytes,p_storage,p_origin_kind,p_origin_ref,coalesce(p_provenance,'{}'),auth.uid()) returning source_id into s;
 end if;
 select id into d from public.structural_labeling_candidates where source_sha256=p_hash and page_index=p_page_index order by created_at limit 1;
 insert into public.structural_labeling_candidates(project_group_id,source_kind,source_ref,source_sha256,duplicate_of,workflow_state,created_by,
  source_id,page_id,page_index,original_filename,transform_metadata,provenance,historical_metadata)
 values(p_project_group,case p_origin_kind when 'qa-run' then 'qa-run' when 'legacy-zip' then 'legacy-zip' else 'website-upload' end,
  p_origin_ref,p_hash,d,'candidate',auth.uid(),s,p_page_id,p_page_index,p_filename,p_transform,coalesce(p_provenance,'{}'),coalesce(p_historical,'{}'))
 returning id into c;
 perform public.labeling_audit(c,'employee',null,'candidate',null,'Source preserved; no dataset admission implied.');
 return c;
end; $$;

create or replace function public.labeling_employee_transition(p_id uuid,p_action text,p_reason text default null)
returns text language plpgsql security definer set search_path=public as $$
declare a text; n text; perm text;
begin
 perm:=case when p_action='submit-owner-qa' then 'labeling.submit' else 'labeling.annotate' end;
 if p_action not in ('mark-suitable','mark-unsuitable','start-labeling','submit-owner-qa') then raise exception 'unsupported_employee_action'; end if;
 perform public.labeling_require(perm,'employee');
 select workflow_state into a from public.structural_labeling_candidates where id=p_id for update;
 if p_action='mark-suitable' and a='candidate' then n:='suitable-for-labeling';
 elsif p_action='mark-unsuitable' and a='candidate' then if nullif(trim(p_reason),'') is null then raise exception 'reason_required'; end if; n:='unsuitable-for-labeling';
 elsif p_action='start-labeling' and a in ('suitable-for-labeling','revision-required') then n:='labeling-in-progress';
 elsif p_action='submit-owner-qa' and a='labeling-in-progress' then
   if not exists(select 1 from public.structural_labeling_annotation_revisions where candidate_id=p_id and created_by=auth.uid()) then raise exception 'annotation_revision_required'; end if;
   update public.structural_labeling_annotation_revisions set revision_kind='employee-submission',submitted_at=now()
   where id=(select id from public.structural_labeling_annotation_revisions where candidate_id=p_id and created_by=auth.uid() order by revision_no desc limit 1);
   n:='submitted-for-owner-qa';
 else raise exception 'invalid_workflow_transition:%',coalesce(a,'null'); end if;
 update public.structural_labeling_candidates set workflow_state=n,
  unsuitable_reason=case when n='unsuitable-for-labeling' then p_reason else unsuitable_reason end where id=p_id;
 perform public.labeling_audit(p_id,'employee',a,n,p_reason,null); return n;
end; $$;
