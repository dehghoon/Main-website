-- Staged engineering disclaimer acknowledgments. Does not alter employee access.
create table if not exists public.customer_tool_disclaimer_acceptances (
 customer_id uuid not null references auth.users(id),
 tool_key text not null check (tool_key in ('snow_load','w_section')),
 disclaimer_version text not null check (disclaimer_version='engineering-trial-v1'),
 accepted_at timestamptz not null default now(),
 primary key(customer_id,tool_key,disclaimer_version)
);
alter table public.customer_tool_disclaimer_acceptances enable row level security;
revoke all on public.customer_tool_disclaimer_acceptances from anon,authenticated;
grant select on public.customer_tool_disclaimer_acceptances to authenticated;
create policy "customer reads own disclaimer acceptance"
 on public.customer_tool_disclaimer_acceptances for select to authenticated
 using (customer_id=(select auth.uid()));
-- Timestamp is set by database only; clients cannot backdate or impersonate acceptance.
create or replace function public.accept_customer_tool_disclaimer(p_tool_key text,p_version text)
returns boolean language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null then raise exception 'authentication_required'; end if;
 if p_tool_key not in ('snow_load','w_section') or p_tool_key is null
 or p_version is distinct from 'engineering-trial-v1'
 then raise exception 'invalid_disclaimer'; end if;
 insert into public.customer_tool_disclaimer_acceptances(customer_id,tool_key,disclaimer_version)
 values(auth.uid(),p_tool_key,p_version) on conflict do nothing;
 return true;
end $$;
revoke all on function public.accept_customer_tool_disclaimer(text,text) from public,anon;
grant execute on function public.accept_customer_tool_disclaimer(text,text) to authenticated;

create or replace function public.has_accepted_customer_tool_disclaimer(p_tool_key text,p_version text)
returns boolean language sql stable security definer set search_path=''
as $$
 select auth.uid() is not null and exists(
 select 1 from public.customer_tool_disclaimer_acceptances a
 where a.customer_id=auth.uid() and a.tool_key=p_tool_key and a.disclaimer_version=p_version
 )
$$;
revoke all on function public.has_accepted_customer_tool_disclaimer(text,text) from public,anon;
grant execute on function public.has_accepted_customer_tool_disclaimer(text,text) to authenticated;

-- Enforce acknowledgment in the database, including direct REST inserts.
-- Prevents bypassing the client-side checkbox by calling the requests table directly.
create or replace function public.enforce_trial_request_disclaimer()
returns trigger language plpgsql security invoker set search_path=''
as $$
begin
 if new.access_type='trial' and not exists (
   select 1 from public.customer_tool_disclaimer_acceptances a
   where a.customer_id=new.customer_id
     and a.tool_key=new.tool_key
     and a.disclaimer_version='engineering-trial-v1'
 ) then
   raise exception 'engineering_disclaimer_required' using errcode='23514';
 end if;
 return new;
end $$;
drop trigger if exists customer_trial_request_disclaimer_guard on public.customer_tool_access_requests;
create trigger customer_trial_request_disclaimer_guard
before insert on public.customer_tool_access_requests
for each row execute function public.enforce_trial_request_disclaimer();

-- Customer entitlement checks must also fail closed if a current-version
-- acknowledgment is missing, even if a legacy Trial grant already exists.
create or replace function public.has_active_customer_tool_trial(p_tool_key text)
returns boolean language sql stable security definer set search_path=''
as $$
 select auth.uid() is not null and p_tool_key in ('snow_load','w_section')
 and exists(
   select 1 from public.customer_trial_grants t
   where t.customer_id=auth.uid() and t.tool_key=p_tool_key
     and t.revoked_at is null and t.starts_at<=now() and t.expires_at>now()
 )
 and exists(
   select 1 from public.customer_tool_disclaimer_acceptances a
   where a.customer_id=auth.uid() and a.tool_key=p_tool_key
     and a.disclaimer_version='engineering-trial-v1'
 )
$$;
revoke all on function public.has_active_customer_tool_trial(text) from public,anon;
grant execute on function public.has_active_customer_tool_trial(text) to authenticated;
