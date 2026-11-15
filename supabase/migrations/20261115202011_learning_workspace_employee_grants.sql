-- Align Learning with the existing employee approval used by the shared header.
create or replace function public.learning_can_edit()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select auth.uid() is not null and (
    public.learning_can_publish()
    or coalesce(auth.jwt()->'app_metadata'->>'role', auth.jwt()->'app_metadata'->>'user_type', '') = 'employee'
    or public.platform_my_permissions() && array[
      'blog.create', 'blog.edit', 'timesheet.view_own', 'engineering_tools_internal'
    ]
    or exists (select 1 from public.profiles where id = auth.uid() and role::text in ('admin', 'manager'))
  );
$$;

revoke all on function public.learning_can_edit() from public, anon;
grant execute on function public.learning_can_edit() to authenticated;
