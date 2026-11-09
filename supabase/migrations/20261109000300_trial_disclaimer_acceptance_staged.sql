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
