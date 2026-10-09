-- Repair employee access request creation and preserve owner-controlled approval.
-- Any authenticated account may request employee access, but no permission is granted
-- until the configured owner approves the pending request.

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

create or replace function public.platform_request_employee_access()
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text;
  pending_request_id uuid;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  select lower(trim(u.email))
  into current_email
  from auth.users u
  where u.id = current_user_id;

  if nullif(current_email, '') is null then
    raise exception 'employee_email_required' using errcode = '22023';
  end if;

  if current_email = 'dehghani.pmp@gmail.com' then
    return null;
  end if;

  select r.request_id
  into pending_request_id
  from public.employee_access_requests r
  where r.user_id = current_user_id
    and r.status = 'pending'
  order by r.requested_at desc
  limit 1;

  if pending_request_id is not null then
    return pending_request_id;
  end if;

  insert into public.employee_access_requests(user_id, employee_email)
  values (current_user_id, current_email)
  returning request_id into pending_request_id;

  return pending_request_id;
end;
$$;

revoke all on function public.platform_request_employee_access() from public, anon;
grant execute on function public.platform_request_employee_access() to authenticated;

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

  if requested_role = 'employee'
     and nullif(trim(coalesce(new.email, '')), '') is not null
     and lower(trim(new.email)) <> 'dehghani.pmp@gmail.com' then
    insert into public.employee_access_requests(user_id, employee_email)
    values (new.id, lower(trim(new.email)))
    on conflict do nothing;
  end if;

  return new;
end;
$$;

insert into public.employee_access_requests(user_id, employee_email)
select
  u.id,
  lower(trim(u.email))
from auth.users u
where nullif(trim(coalesce(u.email, '')), '') is not null
  and lower(trim(u.email)) <> 'dehghani.pmp@gmail.com'
  and lower(coalesce(
    u.raw_app_meta_data->>'role',
    u.raw_app_meta_data->>'user_type',
    u.raw_user_meta_data->>'requested_role',
    u.raw_user_meta_data->>'role',
    u.raw_user_meta_data->>'user_type',
    ''
  )) = 'employee'
  and not exists (
    select 1
    from public.employee_access_requests r
    where r.user_id = u.id
      and r.status = 'pending'
  );
