-- Staged customer trial grants. Review against canonical billing entitlements before deployment.
-- No existing employee/Labeling/Blog/Timesheet permissions are changed.
create table if not exists public.customer_trial_grants (
 id uuid primary key default gen_random_uuid(),
 customer_id uuid not null references auth.users(id),
 starts_at timestamptz not null,
 expires_at timestamptz not null,
 revoked_at timestamptz,
 granted_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint trial_dates_valid check (expires_at > starts_at)
);
create index if not exists customer_trial_grants_customer_idx on public.customer_trial_grants(customer_id, expires_at desc);
alter table public.customer_trial_grants enable row level security;
revoke all on public.customer_trial_grants from anon, authenticated;
grant select on public.customer_trial_grants to authenticated;
drop policy if exists "customer sees own trial" on public.customer_trial_grants;
create policy "customer sees own trial" on public.customer_trial_grants for select to authenticated
using (customer_id = (select auth.uid()));
create table if not exists public.customer_trial_audit (
 id bigint generated always as identity primary key,
 grant_id uuid not null references public.customer_trial_grants(id),
 actor_id uuid not null references auth.users(id),
 action text not null check (action in ('grant','extend','revoke')),
 previous_expiry timestamptz,
 new_expiry timestamptz,
 created_at timestamptz not null default now()
);
alter table public.customer_trial_audit enable row level security;
revoke all on public.customer_trial_audit from anon, authenticated;
create or replace function public.owner_manage_customer_trial(
 p_customer_id uuid, p_starts_at timestamptz, p_expires_at timestamptz,
 p_action text, p_grant_id uuid default null
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_actor uuid := auth.uid(); v_grant uuid; v_old timestamptz;
begin
 if v_actor is null or not exists (
  select 1 from auth.users u where u.id=v_actor and lower(u.email)='dehghani.pmp@gmail.com'
  and u.email_confirmed_at is not null
 ) then raise exception 'owner_required'; end if;
 if p_action not in ('grant','extend','revoke') then raise exception 'invalid_action'; end if;
 if not exists(select 1 from auth.users where id=p_customer_id) then raise exception 'customer_not_found'; end if;
 if p_action='grant' then
  if p_starts_at is null or p_expires_at is null or p_expires_at<=p_starts_at then raise exception 'invalid_dates'; end if;
  if exists(select 1 from public.customer_trial_grants where customer_id=p_customer_id and revoked_at is null and expires_at>now())
   then raise exception 'active_trial_exists'; end if;
  insert into public.customer_trial_grants(customer_id,starts_at,expires_at,granted_by)
  values(p_customer_id,p_starts_at,p_expires_at,v_actor) returning id into v_grant;
 else
  select id,expires_at into v_grant,v_old from public.customer_trial_grants
   where id=p_grant_id and customer_id=p_customer_id for update;
  if v_grant is null then raise exception 'trial_not_found'; end if;
  if p_action='extend' then
   if p_expires_at is null or p_expires_at<=v_old then raise exception 'invalid_extension'; end if;
   update public.customer_trial_grants set expires_at=p_expires_at,updated_at=now()
    where id=v_grant and revoked_at is null;
   if not found then raise exception 'trial_revoked'; end if;
  else
   update public.customer_trial_grants set revoked_at=now(),updated_at=now()
    where id=v_grant and revoked_at is null;
   if not found then raise exception 'trial_already_revoked'; end if;
  end if;
 end if;
 insert into public.customer_trial_audit(grant_id,actor_id,action,previous_expiry,new_expiry)
 values(v_grant,v_actor,p_action,v_old,case when p_action='revoke' then null else p_expires_at end);
 return v_grant;
end $$;
revoke all on function public.owner_manage_customer_trial(uuid,timestamptz,timestamptz,text,uuid) from public,anon;
grant execute on function public.owner_manage_customer_trial(uuid,timestamptz,timestamptz,text,uuid) to authenticated;
create or replace function public.has_active_customer_trial()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.customer_trial_grants t where t.customer_id=auth.uid()
and t.revoked_at is null and t.starts_at<=now() and t.expires_at>now()) $$;
revoke all on function public.has_active_customer_trial() from public,anon;
grant execute on function public.has_active_customer_trial() to authenticated;
