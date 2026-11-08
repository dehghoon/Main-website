-- STAGED / NOT APPLIED: preserve all existing blog access while preparing permission-based RLS.
-- Existing publication guard (designated approver) is intentionally unchanged.
-- Baseline is captured from existing profiles at migration execution, not from guessed roles.
begin;
create table if not exists public.blog_legacy_access_baseline (
 user_id uuid primary key references auth.users(id) on delete cascade,
 captured_at timestamptz not null default now()
);
alter table public.blog_legacy_access_baseline enable row level security;
revoke all on public.blog_legacy_access_baseline from anon, authenticated;
insert into public.blog_legacy_access_baseline(user_id)
 select id from public.profiles where role in ('member','manager','admin')
 on conflict (user_id) do nothing;

-- A narrowly scoped helper is required because the permission table has no direct
-- authenticated SELECT policy. This function reads only the current caller's grants.
create or replace function public.blog_has_access(p_permission text)
returns boolean language sql stable security definer
set search_path = public, auth
as $$
 select auth.uid() is not null and (
   exists (select 1 from public.blog_legacy_access_baseline b where b.user_id=auth.uid())
   or exists (select 1 from public.platform_employee_permissions p
              where p.user_id=auth.uid() and p.permission=p_permission)
 );
$$;
revoke all on function public.blog_has_access(text) from public, anon;
-- The public SELECT policy may evaluate this helper for anonymous readers.
-- It only inspects auth.uid() and returns false for anonymous requests.
grant execute on function public.blog_has_access(text) to anon, authenticated;

drop policy if exists "employees can create blog posts" on public.blog_posts;
create policy "blog create permission" on public.blog_posts
for insert to authenticated
with check (author_id=auth.uid() and public.blog_has_access('blog.create'));

drop policy if exists "employees can update blog posts" on public.blog_posts;
create policy "blog edit permission" on public.blog_posts
for update to authenticated
using (public.blog_has_access('blog.edit'))
with check (public.blog_has_access('blog.edit'));

drop policy if exists "public can read published blog posts" on public.blog_posts;
create policy "published public and authorized drafts" on public.blog_posts
for select to public
using (status='published' or (auth.uid() is not null and (
 public.blog_has_access('blog.create') or public.blog_has_access('blog.edit')
 or public.blog_has_access('blog.publish'))));

-- Preserve the existing owner-only publication trigger and delete policy.
-- Publication permission alone does not bypass that independent approval guard.
commit;
