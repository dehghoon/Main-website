-- Structural Labeling permission administration RPC ambiguity repair.
-- Additive repair migration. Do not edit previously applied permission-admin migrations.

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

  select u.*
  into target
  from auth.users as u
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
    insert into public.structural_labeling_permissions(user_id, permission, granted_by)
    values (target.id, p_permission, auth.uid())
    on conflict on constraint structural_labeling_permissions_pkey do nothing;
    get diagnostics changed_count = row_count;
  else
    delete from public.structural_labeling_permissions as slp
    where slp.user_id = target.id
      and slp.permission = p_permission;
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
      from public.structural_labeling_permissions as current_permission
      where current_permission.user_id = target.id
        and current_permission.permission = p_permission
    );
end;
$$;

revoke all on function public.labeling_manage_employee_permission(text,text,boolean) from public, anon;
grant execute on function public.labeling_manage_employee_permission(text,text,boolean) to authenticated;
