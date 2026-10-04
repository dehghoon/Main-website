-- Structural Labeling Milestone 2 authorization hardening.
-- Direct client workflow mutation is revoked; all changes use authenticated RPCs.

alter table public.structural_labeling_candidates
  add column if not exists source_id uuid,
  add column if not exists page_id text,
  add column if not exists page_index integer,
  add column if not exists original_filename text,
  add column if not exists transform_metadata jsonb,
  add column if not exists provenance jsonb not null default '{}'::jsonb,
  add column if not exists historical_metadata jsonb not null default '{}'::jsonb,
  add column if not exists owner_disposition_reason text;

alter table public.structural_labeling_annotation_revisions
  add column if not exists revision_kind text not null default 'employee-draft'
    check (revision_kind in ('employee-draft','employee-submission','owner-adjudication')),
  add column if not exists supersedes_revision_id uuid references public.structural_labeling_annotation_revisions(id) on delete restrict,
  add column if not exists adjudicates_revision_id uuid references public.structural_labeling_annotation_revisions(id) on delete restrict,
  add column if not exists notes text;

create table if not exists public.structural_labeling_sources (
  source_id uuid primary key default gen_random_uuid(),
  source_sha256 text not null check (source_sha256 ~ '^[0-9a-f]{64}$'),
  original_filename text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0),
  storage_path text not null unique,
  origin_kind text not null check (origin_kind in ('website-upload','qa-run','legacy-zip')),
  origin_ref text not null,
  preserved_artifact boolean not null default true,
  provenance jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.structural_labeling_candidates
  drop constraint if exists structural_labeling_candidates_source_id_fkey;
alter table public.structural_labeling_candidates
  add constraint structural_labeling_candidates_source_id_fkey
  foreign key (source_id) references public.structural_labeling_sources(source_id) on delete restrict;

create or replace function public.labeling_base_role()
returns text language sql stable security definer set search_path=public as $$
  select coalesce(auth.jwt()->'app_metadata'->>'role', auth.jwt()->'app_metadata'->>'user_type');
$$;

create or replace function public.labeling_require(p_permission text, p_actor text)
returns void language plpgsql stable security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if not public.has_structural_labeling_permission(p_permission) then
    raise exception 'permission_denied:%',p_permission using errcode='42501';
  end if;
  if p_actor='employee' and public.labeling_base_role() is distinct from 'employee' then
    raise exception 'employee_role_required' using errcode='42501';
  end if;
  if p_actor='owner' and public.labeling_base_role()='employee' then
    raise exception 'employee_cannot_execute_owner_action' using errcode='42501';
  end if;
end;
$$;

create or replace function public.labeling_audit(
  p_id uuid,p_role text,p_prior text,p_next text,p_reason text default null,p_notes text default null
) returns void language plpgsql security definer set search_path=public as $$
begin
  insert into public.structural_labeling_audit_events(candidate_id,actor_id,actor_role,prior_state,new_state,reason,notes)
  values(p_id,auth.uid(),p_role,p_prior,p_next,p_reason,p_notes);
end;
$$;

create or replace function public.labeling_create_candidate(
  p_hash text,p_filename text,p_mime text,p_bytes bigint,p_storage text,p_origin_kind text,p_origin_ref text,
  p_project_group text,p_page_id text,p_page_index integer,p_transform jsonb,p_provenance jsonb,p_historical jsonb
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_source uuid; v_candidate uuid; v_duplicate uuid;
begin
  perform public.labeling_require('labeling.upload','employee');
  if p_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid_source_hash'; end if;
  if nullif(trim(p_origin_ref),'') is null or nullif(trim(p_project_group),'') is null
     or nullif(trim(p_page_id),'') is null or nullif(trim(p_filename),'') is null then
    raise exception 'malformed_provenance';
  end if;
  insert into public.structural_labeling_sources(
    source_sha256,original_filename,mime_type,byte_size,storage_path,origin_kind,origin_ref,provenance,created_by
  ) values(p_hash,p_filename,p_mime,p_bytes,p_storage,p_origin_kind,p_origin_ref,coalesce(p_provenance,'{}'),auth.uid())
  returning source_id into v_source;
  select id into v_duplicate from public.structural_labeling_candidates
    where source_sha256=p_hash and page_index=p_page_index order by created_at limit 1;
  insert into public.structural_labeling_candidates(
    project_group_id,source_kind,source_ref,source_sha256,duplicate_of,workflow_state,created_by,
    source_id,page_id,page_index,original_filename,transform_metadata,provenance,historical_metadata
  ) values(
    p_project_group,case p_origin_kind when 'qa-run' then 'qa-run' when 'legacy-zip' then 'legacy-zip' else 'website-upload' end,
    p_origin_ref,p_hash,v_duplicate,'candidate',auth.uid(),v_source,p_page_id,p_page_index,p_filename,p_transform,
    coalesce(p_provenance,'{}'),coalesce(p_historical,'{}')
  ) returning id into v_candidate;
  perform public.labeling_audit(v_candidate,'employee',null,'candidate',null,'Source preserved; no dataset admission implied.');
  return v_candidate;
end;
$$;

create or replace function public.labeling_employee_transition(p_id uuid,p_action text,p_reason text default null)
returns text language plpgsql security definer set search_path=public as $$
declare v_prior text; v_next text; v_permission text;
begin
  if p_action in ('mark-suitable','mark-unsuitable','start-labeling') then v_permission:='labeling.annotate';
  elsif p_action='submit-owner-qa' then v_permission:='labeling.submit';
  else raise exception 'unsupported_employee_action'; end if;
  perform public.labeling_require(v_permission,'employee');
  select workflow_state into v_prior from public.structural_labeling_candidates where id=p_id for update;
  if v_prior is null then raise exception 'candidate_not_found'; end if;
  if p_action='mark-suitable' and v_prior='candidate' then v_next:='suitable-for-labeling';
  elsif p_action='mark-unsuitable' and v_prior='candidate' then
    if nullif(trim(p_reason),'') is null then raise exception 'reason_required'; end if;
    v_next:='unsuitable-for-labeling';
  elsif p_action='start-labeling' and v_prior in ('suitable-for-labeling','revision-required') then v_next:='labeling-in-progress';
  elsif p_action='submit-owner-qa' and v_prior='labeling-in-progress' then
    if not exists(select 1 from public.structural_labeling_annotation_revisions where candidate_id=p_id and created_by=auth.uid())
      then raise exception 'annotation_revision_required'; end if;
    update public.structural_labeling_annotation_revisions set revision_kind='employee-submission',submitted_at=now()
      where id=(select id from public.structural_labeling_annotation_revisions
        where candidate_id=p_id and created_by=auth.uid() order by revision_no desc limit 1);
    v_next:='submitted-for-owner-qa';
  else raise exception 'invalid_workflow_transition:%',v_prior; end if;
  update public.structural_labeling_candidates set workflow_state=v_next,
    unsuitable_reason=case when v_next='unsuitable-for-labeling' then p_reason else unsuitable_reason end where id=p_id;
  perform public.labeling_audit(p_id,'employee',v_prior,v_next,p_reason,null);
  return v_next;
end;
$$;

create or replace function public.labeling_save_revision(p_id uuid,p_annotations jsonb,p_transform jsonb,p_notes text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_state text; v_kind text; v_no integer; v_prev uuid; v_employee uuid; v_revision uuid;
begin
  select workflow_state into v_state from public.structural_labeling_candidates where id=p_id for update;
  if v_state='labeling-in-progress' then perform public.labeling_require('labeling.annotate','employee'); v_kind:='employee-draft';
  elsif v_state='submitted-for-owner-qa' then perform public.labeling_require('labeling.owner_review','owner'); v_kind:='owner-adjudication';
  else raise exception 'revision_not_allowed:%',coalesce(v_state,'null'); end if;
  if jsonb_typeof(p_annotations)<>'array' then raise exception 'annotations_must_be_array'; end if;
  if p_transform is null then raise exception 'transform_required'; end if;
  select id into v_prev from public.structural_labeling_annotation_revisions where candidate_id=p_id order by revision_no desc limit 1;
  select id into v_employee from public.structural_labeling_annotation_revisions where candidate_id=p_id
    and revision_kind in ('employee-draft','employee-submission') order by revision_no desc limit 1;
  select coalesce(max(revision_no),0)+1 into v_no from public.structural_labeling_annotation_revisions where candidate_id=p_id;
  insert into public.structural_labeling_annotation_revisions(
    candidate_id,revision_no,created_by,annotations,transform_metadata,revision_kind,supersedes_revision_id,adjudicates_revision_id,notes
  ) values(p_id,v_no,auth.uid(),p_annotations,p_transform,v_kind,v_prev,case when v_kind='owner-adjudication' then v_employee end,p_notes)
  returning id into v_revision;
  perform public.labeling_audit(p_id,case when v_kind='owner-adjudication' then 'owner-reviewer' else 'employee' end,
    v_state,v_state,null,'Annotation revision created: '||v_no);
  return v_revision;
end;
$$;

create or replace function public.labeling_owner_transition(p_id uuid,p_action text,p_reason text default null)
returns text language plpgsql security definer set search_path=public as $$
declare v_prior text; v_next text;
begin
  perform public.labeling_require('labeling.owner_review','owner');
  select workflow_state into v_prior from public.structural_labeling_candidates where id=p_id for update;
  if v_prior<>'submitted-for-owner-qa' then raise exception 'invalid_workflow_transition:%',coalesce(v_prior,'null'); end if;
  if p_action='approve' then v_next:='owner-approved';
  elsif p_action='reject' then v_next:='owner-rejected';
  elsif p_action='request-revision' then v_next:='revision-required';
  else raise exception 'unsupported_owner_operation'; end if;
  if v_next in ('owner-rejected','revision-required') and nullif(trim(p_reason),'') is null then raise exception 'reason_required'; end if;
  update public.structural_labeling_candidates set workflow_state=v_next,
    owner_disposition_reason=case when v_next in ('owner-rejected','revision-required') then p_reason end where id=p_id;
  perform public.labeling_audit(p_id,'owner-reviewer',v_prior,v_next,p_reason,
    case when v_next='owner-approved' then 'Owner Approved; Pending GPT-7 Admission.' end);
  return v_next;
end;
$$;

create or replace function public.labeling_assert_exportable(p_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_state text; v_hash text; v_transform jsonb; v_annotations jsonb;
begin
  perform public.labeling_require('labeling.gpt7_export','owner');
  select c.workflow_state,c.source_sha256,coalesce(r.transform_metadata,c.transform_metadata),r.annotations
    into v_state,v_hash,v_transform,v_annotations
  from public.structural_labeling_candidates c left join lateral(
    select * from public.structural_labeling_annotation_revisions where candidate_id=c.id order by revision_no desc limit 1
  ) r on true where c.id=p_id;
  if v_state<>'owner-approved' then raise exception 'owner_approval_required'; end if;
  if v_hash is null or v_hash !~ '^[0-9a-f]{64}$' then raise exception 'valid_source_hash_required'; end if;
  if v_transform is null or v_transform->>'transform_validation_state'<>'validated' then raise exception 'validated_transform_required'; end if;
  if v_annotations is null then raise exception 'annotation_revision_required'; end if;
  return true;
end;
$$;

drop policy if exists labeling_candidates_insert on public.structural_labeling_candidates;
drop policy if exists labeling_annotations_insert on public.structural_labeling_annotation_revisions;
drop policy if exists labeling_audit_insert on public.structural_labeling_audit_events;
revoke insert,update,delete on public.structural_labeling_candidates from anon,authenticated;
revoke insert,update,delete on public.structural_labeling_annotation_revisions from anon,authenticated;
revoke insert,update,delete on public.structural_labeling_audit_events from anon,authenticated;
revoke insert,update,delete on public.structural_labeling_sources from anon,authenticated;
grant select on public.structural_labeling_candidates,public.structural_labeling_annotation_revisions,
  public.structural_labeling_audit_events,public.structural_labeling_sources to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('structural-labeling-sources','structural-labeling-sources',false,52428800,
 array['application/pdf','image/png','image/jpeg','image/webp'])
on conflict(id) do update set public=false;
drop policy if exists structural_labeling_source_insert on storage.objects;
create policy structural_labeling_source_insert on storage.objects for insert to authenticated with check(
 bucket_id='structural-labeling-sources' and public.has_structural_labeling_permission('labeling.upload')
 and public.labeling_base_role()='employee');
drop policy if exists structural_labeling_source_read on storage.objects;
create policy structural_labeling_source_read on storage.objects for select to authenticated using(
 bucket_id='structural-labeling-sources' and public.has_structural_labeling_permission('labeling.workspace'));
-- No storage UPDATE/DELETE policy: original artifacts are preserved.
