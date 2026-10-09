-- Ensure the authenticated platform Owner can always enter Structural Labeling Owner QA.
-- This is idempotent and avoids relying on a one-time bootstrap that only works when
-- the Owner account already exists at migration execution time.

create or replace function public.ensure_structural_labeling_owner_review()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.platform_access_is_owner() then
    return false;
  end if;

  insert into public.structural_labeling_permissions (user_id, permission, granted_by)
  values (auth.uid(), 'labeling.owner_review', auth.uid())
  on conflict (user_id, permission) do nothing;

  return true;
end;
$$;

revoke all on function public.ensure_structural_labeling_owner_review() from public, anon;
grant execute on function public.ensure_structural_labeling_owner_review() to authenticated;
