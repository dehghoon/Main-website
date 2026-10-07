-- Structural Labeling permission administration.
-- Additive migration. Apply only through the controlled permission-admin migration gate.

create table if not exists public.structural_labeling_permission_audit_events (
  event_id uuid primary key default gen_random_uuid(),
  target_user_id uuid not null,
  actor_id uuid not null,
  permission text not null check (permission in (
    'labeling.workspace','labeling.upload','labeling.annotate','labeling.submit'
  )),
  enabled boolean not null,
  created_at timestamptz not null default now()
);

alter table public.structural_labeling_permission_audit_events enable row level security;

revoke all on public.structural_labeling_permission_audit_events from public, anon, authenticated;

drop trigger if exists structural_labeling_permission_audit_immutable
on public.structural_labeling_permission_audit_events;

create trigger structural_labeling_permission_audit_immutable
before update or delete on public.structural_labeling_permission_audit_events
for each row execute function public.prevent_structural_labeling_audit_mutation();

create or replace function public.labeling_permission_admin_allowed()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and coalesce(public.labeling_base_role(), '') in ('owner', 'admin');
$$;

create or replace function public.labeling_list_employee_permissions()
returns table (
  user_id uuid,
  email text,
  base_role text,
  permissions text[]
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.labeling_permission_admin_allowed() then
    raise exception 'permission_admin_required' using errcode = '42501';
  end if;

  return query
  select
    u.id,
    u.email::text,
    coalesce(u.raw_app_meta_data->>'role', u.raw_app_meta_data->>'user_type')::text,
    coalesce(
      array_agg(p.permission order by p.permission) filter (where p.permission is not null),
      '{}'::text[]
    )
  from auth.users u
  left join public.structural_labeling_permissions p on p.user_id = u.id
  where coalesce(u.raw_app_meta_data->>'role', u.raw_app_meta_data->>'user_type') = 'employee'
  group by u.id, u.email, u.raw_app_meta_data
  order by lower(coalesce(u.email, '')), u.id;
end;
$$;

create or replace function public.labeling_manage_employee_permission(
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
  if not public.labeling_permission_admin_allowed() then
    raise exception 'permission_admin_required' using errcode = '42501';
  end if;

  if p_permission not in (
    'labeling.workspace','labeling.upload','labeling.annotate','labeling.submit'
  ) then
    raise exception 'employee_permission_not_manageable' using errcode = '22023';
  end if;

  if nullif(trim(p_email), '') is null then
    raise exception 'email_required' using errcode = '22023';
  end if;

  select *
  into target
  from auth.users
  where lower(email) = lower(trim(p_email))
  order by created_at
  limit 1;

  if target.id is null then
    raise exception 'employee_not_found' using errcode = 'P0002';
  end if;

  if coalesce(target.raw_app_meta_data->>'role', target.raw_app_meta_data->>'user_type') <> 'employee' then
    raise exception 'target_must_be_employee' using errcode = '42501';
  end if;

  if p_enabled then
    insert into public.structural_labeling_permissions(user_id, permission, granted_by)
    values (target.id, p_permission, auth.uid())
    on conflict (user_id, permission) do nothing;
    get diagnostics changed_count = row_count;
  else
    delete from public.structural_labeling_permissions
    where user_id = target.id and permission = p_permission;
    get diagnostics changed_count = row_count;
  end if;

  if changed_count > 0 then
    insert into public.structural_labeling_permission_audit_events(
      target_user_id, actor_id, permission, enabled
    )
    values (target.id, auth.uid(), p_permission, p_enabled);
  end if;

  return query
  select
    target.id,
    target.email::text,
    p_permission,
    exists(
      select 1
      from public.structural_labeling_permissions current_permission
      where current_permission.user_id = target.id
        and current_permission.permission = p_permission
    );
end;
$$;

revoke all on function public.labeling_permission_admin_allowed() from public, anon;
revoke all on function public.labeling_list_employee_permissions() from public, anon;
revoke all on function public.labeling_manage_employee_permission(text,text,boolean) from public, anon;

grant execute on function public.labeling_permission_admin_allowed() to authenticated;
grant execute on function public.labeling_list_employee_permissions() to authenticated;
grant execute on function public.labeling_manage_employee_permission(text,text,boolean) to authenticated;

drop policy if exists structural_labeling_permission_audit_owner_read
on public.structural_labeling_permission_audit_events;

create policy structural_labeling_permission_audit_owner_read
on public.structural_labeling_permission_audit_events
for select
to authenticated
using (public.labeling_permission_admin_allowed());

-- No direct INSERT/UPDATE/DELETE grants are provided for the permission audit table.
