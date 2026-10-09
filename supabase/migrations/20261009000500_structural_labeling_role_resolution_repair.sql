-- Resolve Structural Labeling actor role from authoritative Supabase state.
-- This avoids stale JWT app_metadata causing employee_role_required after access has been granted.

create or replace function public.labeling_base_role()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when auth.uid() is null then null
    when exists (
      select 1
      from auth.users u
      where u.id = auth.uid()
        and lower(coalesce(u.email, '')) = 'dehghani.pmp@gmail.com'
    ) then 'owner'
    when exists (
      select 1
      from public.structural_labeling_permissions p
      where p.user_id = auth.uid()
    ) then 'employee'
    else (
      select coalesce(
        u.raw_app_meta_data->>'role',
        u.raw_app_meta_data->>'user_type'
      )
      from auth.users u
      where u.id = auth.uid()
    )
  end;
$$;

revoke all on function public.labeling_base_role() from public, anon;
grant execute on function public.labeling_base_role() to authenticated;

-- Backfill trusted employee role metadata for existing users with labeling permissions.
update auth.users u
set raw_app_meta_data =
  coalesce(u.raw_app_meta_data, '{}'::jsonb) ||
  jsonb_build_object('role', 'employee', 'user_type', 'employee')
where lower(coalesce(u.email, '')) <> 'dehghani.pmp@gmail.com'
  and exists (
    select 1
    from public.structural_labeling_permissions p
    where p.user_id = u.id
  );
