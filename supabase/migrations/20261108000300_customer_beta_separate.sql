-- Independent beta access for unfinished tools; completed-tool trials remain in customer_trial_grants.
create table if not exists public.customer_beta_grants (
 id uuid primary key default gen_random_uuid(),
 customer_id uuid not null references auth.users(id),
 tool_key text not null check (length(tool_key) between 1 and 100),
 starts_at timestamptz not null,
 expires_at timestamptz not null,
 revoked_at timestamptz,
 granted_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 check (expires_at > starts_at)
);
create index if not exists customer_beta_grants_lookup on public.customer_beta_grants(customer_id,tool_key,expires_at);
alter table public.customer_beta_grants enable row level security;
revoke all on public.customer_beta_grants from anon,authenticated;
create policy "customer can read own beta grants" on public.customer_beta_grants
 for select to authenticated using (customer_id=(select auth.uid()));
grant select on public.customer_beta_grants to authenticated;
create table if not exists public.customer_beta_audit(
 id bigint generated always as identity primary key,
 grant_id uuid not null references public.customer_beta_grants(id),
 actor_id uuid not null references auth.users(id),
 action text not null check (action in ('grant','revoke')),
 created_at timestamptz not null default now()
);
alter table public.customer_beta_audit enable row level security;
revoke all on public.customer_beta_audit from anon,authenticated;
create or replace function public.owner_manage_customer_beta(
 p_customer_id uuid,p_tool_key text,p_starts_at timestamptz,p_expires_at timestamptz,
 p_action text,p_grant_id uuid default null
) returns uuid language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=auth.uid();v_grant uuid;
begin
 if v_actor is null or not exists(select 1 from auth.users where id=v_actor and lower(email)='dehghani.pmp@gmail.com' and email_confirmed_at is not null) then
 raise exception 'owner_required';end if;
 if p_action not in ('grant','revoke') then raise exception 'invalid_action';end if;
 if p_action='grant' then
  if p_tool_key is null or length(p_tool_key) not between 1 and 100 or p_starts_at is null or p_expires_at<=p_starts_at then raise exception 'invalid_beta_grant';end if;
  if not exists(select 1 from auth.users where id=p_customer_id) then raise exception 'customer_not_found';end if;
  if not exists(select 1 from public.client_beta_preferences where user_id=p_customer_id and beta_opt_in=true) then raise exception 'beta_not_requested';end if;
  insert into public.customer_beta_grants(customer_id,tool_key,starts_at,expires_at,granted_by)
  values(p_customer_id,p_tool_key,p_starts_at,p_expires_at,v_actor) returning id into v_grant;
 else
  update public.customer_beta_grants set revoked_at=now() where id=p_grant_id and customer_id=p_customer_id and revoked_at is null returning id into v_grant;
  if v_grant is null then raise exception 'grant_not_found';end if;
 end if;
 insert into public.customer_beta_audit(grant_id,actor_id,action) values(v_grant,v_actor,p_action);
 return v_grant;
end $$;
revoke all on function public.owner_manage_customer_beta(uuid,text,timestamptz,timestamptz,text,uuid) from public,anon;
grant execute on function public.owner_manage_customer_beta(uuid,text,timestamptz,timestamptz,text,uuid) to authenticated;
create or replace function public.has_active_customer_beta(p_tool_key text)
returns boolean language sql stable security definer set search_path=''
as $$select exists(select 1 from public.customer_beta_grants g
 join public.client_beta_preferences p on p.user_id=g.customer_id and p.beta_opt_in=true
 where g.customer_id=auth.uid() and g.tool_key=p_tool_key and g.revoked_at is null and g.starts_at<=now() and g.expires_at>now())$$;
revoke all on function public.has_active_customer_beta(text) from public,anon;
grant execute on function public.has_active_customer_beta(text) to authenticated;
