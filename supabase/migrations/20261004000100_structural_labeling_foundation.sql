-- Structural Labeling foundation.
-- Additive migration only. Apply through the approved Supabase deployment process.

create extension if not exists pgcrypto;

create table if not exists public.structural_labeling_permissions (
  user_id uuid not null references auth.users(id) on delete cascade,
  permission text not null check (permission in (
    'labeling.workspace','labeling.upload','labeling.annotate','labeling.submit',
    'labeling.owner_review','labeling.gpt7_export'
  )),
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  primary key (user_id, permission)
);

create table if not exists public.structural_labeling_candidates (
  id uuid primary key default gen_random_uuid(),
  project_group_id text not null,
  source_kind text not null check (source_kind in ('qa-run','legacy-zip','website-upload')),
  source_ref text not null,
  source_sha256 text not null check (source_sha256 ~ '^[0-9a-f]{64}$'),
  duplicate_of uuid references public.structural_labeling_candidates(id),
  workflow_state text not null default 'candidate' check (workflow_state in (
    'candidate','suitable-for-labeling','unsuitable-for-labeling','labeling-in-progress',
    'submitted-for-owner-qa','owner-approved','owner-rejected','revision-required'
  )),
  unsuitable_reason text,
  created_by uuid references auth.users(id),
  assigned_to uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint unsuitable_reason_required check (
    workflow_state <> 'unsuitable-for-labeling' or nullif(trim(unsuitable_reason), '') is not null
  )
);

create index if not exists structural_labeling_candidates_sha_idx
  on public.structural_labeling_candidates(source_sha256);

create table if not exists public.structural_labeling_annotation_revisions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.structural_labeling_candidates(id) on delete restrict,
  revision_no integer not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  annotations jsonb not null default '[]'::jsonb,
  transform_metadata jsonb,
  annotation_spec_version text not null default 'v0.2',
  unique(candidate_id, revision_no)
);

create table if not exists public.structural_labeling_audit_events (
  event_id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.structural_labeling_candidates(id) on delete restrict,
  actor_id uuid not null references auth.users(id),
  actor_role text not null,
  prior_state text,
  new_state text not null,
  reason text,
  notes text,
  created_at timestamptz not null default now()
);

create or replace function public.prevent_structural_labeling_audit_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'structural_labeling_audit_events is append-only';
end;
$$;

drop trigger if exists structural_labeling_audit_immutable on public.structural_labeling_audit_events;
create trigger structural_labeling_audit_immutable
before update or delete on public.structural_labeling_audit_events
for each row execute function public.prevent_structural_labeling_audit_mutation();

alter table public.structural_labeling_permissions enable row level security;
alter table public.structural_labeling_candidates enable row level security;
alter table public.structural_labeling_annotation_revisions enable row level security;
alter table public.structural_labeling_audit_events enable row level security;

create or replace function public.has_structural_labeling_permission(required_permission text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.structural_labeling_permissions p
    where p.user_id = auth.uid() and p.permission = required_permission
  );
$$;

drop policy if exists labeling_candidates_read on public.structural_labeling_candidates;
create policy labeling_candidates_read on public.structural_labeling_candidates
for select using (public.has_structural_labeling_permission('labeling.workspace'));

drop policy if exists labeling_candidates_insert on public.structural_labeling_candidates;
create policy labeling_candidates_insert on public.structural_labeling_candidates
for insert with check (public.has_structural_labeling_permission('labeling.upload'));

drop policy if exists labeling_annotations_read on public.structural_labeling_annotation_revisions;
create policy labeling_annotations_read on public.structural_labeling_annotation_revisions
for select using (public.has_structural_labeling_permission('labeling.workspace'));

drop policy if exists labeling_annotations_insert on public.structural_labeling_annotation_revisions;
create policy labeling_annotations_insert on public.structural_labeling_annotation_revisions
for insert with check (
  public.has_structural_labeling_permission('labeling.annotate')
  or public.has_structural_labeling_permission('labeling.owner_review')
);

drop policy if exists labeling_audit_read on public.structural_labeling_audit_events;
create policy labeling_audit_read on public.structural_labeling_audit_events
for select using (public.has_structural_labeling_permission('labeling.workspace'));

drop policy if exists labeling_audit_insert on public.structural_labeling_audit_events;
create policy labeling_audit_insert on public.structural_labeling_audit_events
for insert with check (auth.uid() = actor_id and public.has_structural_labeling_permission('labeling.workspace'));

-- Intentionally no UPDATE/DELETE policy on the audit table.
-- Owner approval and GPT-7 export are separate permissions.
