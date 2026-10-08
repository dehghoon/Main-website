-- Owner-approved employee access workflow.
-- New employee signups create a pending request only. No feature permission is granted automatically.

create table if not exists public.platform_permission_catalog (
  permission text primary key,
  area text not null,
  label text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.platform_permission_catalog(permission, area, label, description)
values
  ('labeling.workspace','Structural Labeling','Workspace','Open the structural labeling workspace'),
  ('labeling.upload','Structural Labeling','Upload','Upload private structural drawings'),
  ('labeling.annotate','Structural Labeling','Annotate','Create and edit annotations'),
  ('labeling.submit','Structural Labeling','Submit','Submit labeling work for owner QA'),
  ('blog.create','Blog','Create','Create blog drafts'),
  ('blog.edit','Blog','Edit','Edit blog content'),
  ('blog.publish','Blog','Publish','Publish blog content'),
  ('timesheet.view_own','Timesheet','View Own','View own timesheets'),
  ('timesheet.submit_own','Timesheet','Submit Own','Create and submit own timesheets'),
  ('timesheet.review_team','Timesheet','Review Team','Review team timesheets')
on conflict (permission) do update
set area = excluded.area,
    label = excluded.label,
    description = excluded.description,
    active = true;

create table if not exists public.employee_access_requests (
  request_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  employee_email text not null,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  review_note text,
  notification_sent_at timestamptz
);

create unique index if not exists employee_access_requests_one_pending_per_user
on public.employee_access_requests(user_id)
where status = 'pending';

create table if not exists public.platform_employee_permissions (
  user_id uuid not null references auth.users(id) on delete cascade,
  permission text not null references public.platform_permission_catalog(permission),
  granted_by uuid not null references auth.users(id),
  granted_at timestamptz not null default now(),
  primary key (user_id, permission)
);

create table if not exists public.platform_permission_audit_events (
  event_id uuid primary key default gen_random_uuid(),
  target_user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid not null references auth.users(id),
  request_id uuid references public.employee_access_requests(request_id),
  permission text not null,
  enabled boolean not null,
  created_at timestamptz not null default now()
);

alter table public.employee_access_requests enable row level security;
alter table public.platform_permission_catalog enable row level security;
alter table public.platform_employee_permissions enable row level security;
alter table public.platform_permission_audit_events enable row level security;

revoke all on public.employee_access_requests from public, anon, authenticated;
revoke all on public.platform_employee_permissions from public, anon, authenticated;
revoke all on public.platform_permission_audit_events from public, anon, authenticated;
grant select on public.platform_permission_catalog to authenticated;

create or replace function public.platform_access_is_owner()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users u
    where u.id = auth.uid()
      and lower(coalesce(u.email, '')) = 'dehghani.pmp@gmail.com'
  );
$$;

revoke all on function public.platform_access_is_owner() from public, anon;
grant execute on function public.platform_access_is_owner() to authenticated;

create policy platform_permission_catalog_authenticated_read
on public.platform_permission_catalog
for select to authenticated
using (active = true);

create or replace function public.queue_employee_access_request()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  requested_role text;
begin
  requested_role := lower(coalesce(
    new.raw_app_meta_data->>'role',
    new.raw_app_meta_data->>'user_type',
    new.raw_user_meta_data->>'requested_role',
    new.raw_user_meta_data->>'role',
    new.raw_user_meta_data->>'user_type',
    ''
  ));

  if requested_role = 'employee' and nullif(trim(coalesce(new.email, '')), '') is not null then
    insert into public.employee_access_requests(user_id, employee_email)
    values (new.id, lower(trim(new.email)))
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists queue_employee_access_request_on_auth_user on auth.users;
create trigger queue_employee_access_request_on_auth_user
after insert or update of raw_app_meta_data, raw_user_meta_data, email
on auth.users
for each row execute function public.queue_employee_access_request();

create or replace function public.platform_list_access_requests()
returns table (
  request_id uuid,
  user_id uuid,
  employee_email text,
  status text,
  requested_at timestamptz,
  reviewed_at timestamptz,
  review_note text,
  permissions text[]
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.platform_access_is_owner() then
    raise exception 'owner_required' using errcode = '42501';
  end if;

  return query
  select
    r.request_id,
    r.user_id,
    r.employee_email,
    r.status,
    r.requested_at,
    r.reviewed_at,
    r.review_note,
    coalesce(
      array_agg(p.permission order by p.permission) filter (where p.permission is not null),
      '{}'::text[]
    )
  from public.employee_access_requests r
  left join public.platform_employee_permissions p on p.user_id = r.user_id
  group by r.request_id
  order by case when r.status = 'pending' then 0 else 1 end, r.requested_at desc;
end;
$$;

create or replace function public.platform_review_access_request(
  p_request_id uuid,
  p_permissions text[],
  p_note text default null
)
returns table (
  request_id uuid,
  employee_email text,
  status text,
  permissions text[]
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target public.employee_access_requests%rowtype;
  permission_key text;
  selected text[] := coalesce(p_permissions, '{}'::text[]);
  next_status text;
begin
  if not public.platform_access_is_owner() then
    raise exception 'owner_required' using errcode = '42501';
  end if;

  select * into target
  from public.employee_access_requests
  where employee_access_requests.request_id = p_request_id
  for update;

  if target.request_id is null then
    raise exception 'access_request_not_found' using errcode = 'P0002';
  end if;

  if target.status <> 'pending' then
    raise exception 'access_request_already_reviewed' using errcode = '22023';
  end if;

  if exists (
    select 1 from unnest(selected) s(permission)
    where not exists (
      select 1 from public.platform_permission_catalog c
      where c.permission = s.permission and c.active
    )
  ) then
    raise exception 'unknown_permission' using errcode = '22023';
  end if;

  -- Approval establishes the trusted employee role; signup metadata alone never does.
  if cardinality(selected) > 0 then
    update auth.users
    set raw_app_meta_data =
      coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role','employee','user_type','employee')
    where id = target.user_id;
  end if;

  foreach permission_key in array selected loop
    insert into public.platform_employee_permissions(user_id, permission, granted_by)
    values (target.user_id, permission_key, auth.uid())
    on conflict (user_id, permission) do nothing;

    if permission_key in ('labeling.workspace','labeling.upload','labeling.annotate','labeling.submit') then
      insert into public.structural_labeling_permissions(user_id, permission, granted_by)
      values (target.user_id, permission_key, auth.uid())
      on conflict on constraint structural_labeling_permissions_pkey do nothing;

      insert into public.structural_labeling_permission_audit_events(
        target_user_id, actor_id, permission, enabled
      )
      values (target.user_id, auth.uid(), permission_key, true);
    end if;

    insert into public.platform_permission_audit_events(
      target_user_id, actor_id, request_id, permission, enabled
    )
    values (target.user_id, auth.uid(), target.request_id, permission_key, true);
  end loop;

  next_status := case when cardinality(selected) > 0 then 'approved' else 'rejected' end;

  update public.employee_access_requests
  set status = next_status,
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      review_note = nullif(trim(coalesce(p_note,'')), '')
  where employee_access_requests.request_id = target.request_id;

  return query
  select
    target.request_id,
    target.employee_email,
    next_status,
    selected;
end;
$$;

create or replace function public.platform_manage_employee_permission(
  p_email text,
  p_permission text,
  p_enabled boolean
)
returns table (
  user_id uuid,
  email text,
  permission text,
  enabled boolean

)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target auth.users%rowtype;
  changed_count integer := 0;
begin
  if not public.platform_access_is_owner() then
    raise exception 'owner_required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.platform_permission_catalog c
    where c.permission = p_permission and c.active
  ) then
    raise exception 'unknown_permission' using errcode = '22023';
  end if;

  select u.* into target
  from auth.users u
  where lower(u.email) = lower(trim(p_email))
  order by u.created_at
  limit 1;

  if target.id is null then
    raise exception 'employee_not_found' using errcode = 'P0002';
  end if;

  if coalesce(target.raw_app_meta_data->>'role', target.raw_app_meta_data->>'user_type') <> 'employee' then
    raise exception 'target_must_be_employee' using errcode = '42501';
  end if;

  if p_enabled then
    insert into public.platform_employee_permissions(user_id, permission, granted_by)
    values (target.id, p_permission, auth.uid())
    on conflict (user_id, permission) do nothing;
    get diagnostics changed_count = row_count;
  else
    delete from public.platform_employee_permissions p
    where p.user_id = target.id and p.permission = p_permission;
    get diagnostics changed_count = row_count;
  end if;

  if p_permission in ('labeling.workspace','labeling.upload','labeling.annotate','labeling.submit') then
    if p_enabled then
      insert into public.structural_labeling_permissions(user_id, permission, granted_by)
      values (target.id, p_permission, auth.uid())
      on conflict on constraint structural_labeling_permissions_pkey do nothing;
    else
      delete from public.structural_labeling_permissions p
      where p.user_id = target.id and p.permission = p_permission;
    end if;
  end if;

  if changed_count > 0 then
    insert into public.platform_permission_audit_events(
      target_user_id, actor_id, permission, enabled
    )
    values (target.id, auth.uid(), p_permission, p_enabled);
  end if;

  return query
  select target.id, target.email::text, p_permission,
    exists (
      select 1 from public.platform_employee_permissions p
      where p.user_id = target.id and p.permission = p_permission
    );
end;
$$;

create or replace function public.platform_my_permissions()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(p.permission order by p.permission), '{}'::text[])
  from public.platform_employee_permissions p
  where p.user_id = auth.uid();
$$;

revoke all on function public.platform_list_access_requests() from public, anon;
revoke all on function public.platform_review_access_request(uuid,text[],text) from public, anon;
revoke all on function public.platform_manage_employee_permission(text,text,boolean) from public, anon;
revoke all on function public.platform_my_permissions() from public, anon;
grant execute on function public.platform_list_access_requests() to authenticated;
grant execute on function public.platform_review_access_request(uuid,text[],text) to authenticated;
grant execute on function public.platform_manage_employee_permission(text,text,boolean) to authenticated;
grant execute on function public.platform_my_permissions() to authenticated;
