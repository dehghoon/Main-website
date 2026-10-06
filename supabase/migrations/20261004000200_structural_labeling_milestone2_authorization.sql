-- Structural Labeling Milestone 2 schema and authorization hardening.
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

alter table public.structural_labeling_sources enable row level security;

drop policy if exists labeling_candidates_insert on public.structural_labeling_candidates;
drop policy if exists labeling_annotations_insert on public.structural_labeling_annotation_revisions;
drop policy if exists labeling_audit_insert on public.structural_labeling_audit_events;
revoke insert,update,delete on public.structural_labeling_candidates from anon,authenticated;
revoke insert,update,delete on public.structural_labeling_annotation_revisions from anon,authenticated;
revoke insert,update,delete on public.structural_labeling_audit_events from anon,authenticated;
revoke insert,update,delete on public.structural_labeling_sources from anon,authenticated;
grant select on public.structural_labeling_candidates,public.structural_labeling_annotation_revisions,
  public.structural_labeling_audit_events,public.structural_labeling_sources to authenticated;

drop policy if exists structural_labeling_permissions_self_read on public.structural_labeling_permissions;
create policy structural_labeling_permissions_self_read
on public.structural_labeling_permissions for select to authenticated
using (user_id=auth.uid());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('structural-labeling-sources','structural-labeling-sources',false,52428800,
 array['application/pdf','image/png','image/jpeg','image/webp'])
on conflict(id) do update set public=false;

-- Mutation policies are intentionally omitted. RPCs in the next migration own writes.
