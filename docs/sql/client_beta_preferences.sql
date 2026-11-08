-- Client beta preferences; run after reviewing production auth configuration.
create table if not exists public.client_beta_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  beta_opt_in boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.client_beta_preferences enable row level security;
revoke all on public.client_beta_preferences from anon;
grant select, insert, update on public.client_beta_preferences to authenticated;
drop policy if exists "client beta preferences select own" on public.client_beta_preferences;
create policy "client beta preferences select own" on public.client_beta_preferences
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "client beta preferences insert own" on public.client_beta_preferences;
create policy "client beta preferences insert own" on public.client_beta_preferences
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "client beta preferences update own" on public.client_beta_preferences;
create policy "client beta preferences update own" on public.client_beta_preferences
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
-- This preference is only a UI choice. Every experimental app must independently
-- enforce access server-side; never use this table as proof of paid entitlement.
