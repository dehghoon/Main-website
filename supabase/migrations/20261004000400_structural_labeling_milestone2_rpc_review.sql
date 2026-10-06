-- Structural Labeling Milestone 2 revision, owner QA, export and storage policies.
create or replace function public.labeling_save_revision(p_id uuid,p_annotations jsonb,p_transform jsonb,p_notes text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare s text; k text; n int; prev uuid; emp uuid; r uuid;
begin
 select workflow_state into s from public.structural_labeling_candidates where id=p_id for update;
 if s='labeling-in-progress' then perform public.labeling_require('labeling.annotate','employee'); k:='employee-draft';
 elsif s='submitted-for-owner-qa' then perform public.labeling_require('labeling.owner_review','owner'); k:='owner-adjudication';
 else raise exception 'revision_not_allowed:%',coalesce(s,'null'); end if;
 perform public.labeling_validate_payload(p_annotations,p_transform);
 select id into prev from public.structural_labeling_annotation_revisions where candidate_id=p_id order by revision_no desc limit 1;
 select id into emp from public.structural_labeling_annotation_revisions where candidate_id=p_id
   and revision_kind in ('employee-draft','employee-submission') order by revision_no desc limit 1;
 select coalesce(max(revision_no),0)+1 into n from public.structural_labeling_annotation_revisions where candidate_id=p_id;
 insert into public.structural_labeling_annotation_revisions(candidate_id,revision_no,created_by,annotations,transform_metadata,
   revision_kind,supersedes_revision_id,adjudicates_revision_id,notes)
 values(p_id,n,auth.uid(),p_annotations,p_transform,k,prev,case when k='owner-adjudication' then emp end,p_notes)
 returning id into r;
 perform public.labeling_audit(p_id,case when k='owner-adjudication' then 'owner-reviewer' else 'employee' end,s,s,null,'Annotation revision created: '||n);
 return r;
end; $$;

create or replace function public.labeling_owner_transition(p_id uuid,p_action text,p_reason text default null)
returns text language plpgsql security definer set search_path=public as $$
declare a text; n text;
begin
 perform public.labeling_require('labeling.owner_review','owner');
 select workflow_state into a from public.structural_labeling_candidates where id=p_id for update;
 if a<>'submitted-for-owner-qa' then raise exception 'invalid_workflow_transition:%',coalesce(a,'null'); end if;
 if p_action='approve' then n:='owner-approved';
 elsif p_action='reject' then n:='owner-rejected';
 elsif p_action='request-revision' then n:='revision-required';
 else raise exception 'unsupported_owner_action'; end if;
 if n in ('owner-rejected','revision-required') and nullif(trim(p_reason),'') is null then raise exception 'reason_required'; end if;
 update public.structural_labeling_candidates set workflow_state=n,
  owner_disposition_reason=case when n in ('owner-rejected','revision-required') then p_reason end where id=p_id;
 perform public.labeling_audit(p_id,'owner-reviewer',a,n,p_reason,
  case when n='owner-approved' then 'Owner Approved; Pending GPT-7 Admission.' end);
 return n;
end; $$;

create or replace function public.labeling_assert_exportable(p_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare s text; h text; t jsonb; a jsonb;
begin
 perform public.labeling_require('labeling.gpt7_export','owner');
 select c.workflow_state,c.source_sha256,coalesce(r.transform_metadata,c.transform_metadata),r.annotations
 into s,h,t,a from public.structural_labeling_candidates c
 left join lateral(select * from public.structural_labeling_annotation_revisions where candidate_id=c.id order by revision_no desc limit 1) r on true
 where c.id=p_id;
 if s<>'owner-approved' then raise exception 'owner_approval_required'; end if;
 if h is null or h!~'^[0-9a-f]{64}$' then raise exception 'valid_source_hash_required'; end if;
 perform public.labeling_validate_payload(a,t);
 return true;
end; $$;

revoke all on function public.labeling_create_candidate(text,text,text,bigint,text,text,text,text,text,int,jsonb,jsonb,jsonb) from public;
revoke all on function public.labeling_employee_transition(uuid,text,text) from public;
revoke all on function public.labeling_save_revision(uuid,jsonb,jsonb,text) from public;
revoke all on function public.labeling_owner_transition(uuid,text,text) from public;
revoke all on function public.labeling_assert_exportable(uuid) from public;
grant execute on function public.labeling_create_candidate(text,text,text,bigint,text,text,text,text,text,int,jsonb,jsonb,jsonb) to authenticated;
grant execute on function public.labeling_employee_transition(uuid,text,text) to authenticated;
grant execute on function public.labeling_save_revision(uuid,jsonb,jsonb,text) to authenticated;
grant execute on function public.labeling_owner_transition(uuid,text,text) to authenticated;
grant execute on function public.labeling_assert_exportable(uuid) to authenticated;

drop policy if exists structural_labeling_source_insert on storage.objects;
create policy structural_labeling_source_insert on storage.objects for insert to authenticated with check(
 bucket_id='structural-labeling-sources' and public.has_structural_labeling_permission('labeling.upload')
 and public.labeling_base_role()='employee');
drop policy if exists structural_labeling_source_read on storage.objects;
create policy structural_labeling_source_read on storage.objects for select to authenticated using(
 bucket_id='structural-labeling-sources' and public.has_structural_labeling_permission('labeling.workspace'));
-- No source UPDATE/DELETE policy: original artifacts remain preserved.
