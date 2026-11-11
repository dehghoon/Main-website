-- Staged per-tool Trial authorization. Run after existing customer trial and request migrations.
-- No employee or existing grants are modified. Legacy global trial is NOT accepted for W-Section.
alter table public.customer_trial_grants add column if not exists tool_key text;
alter table public.customer_trial_grants drop constraint if exists customer_trial_tool_key_valid;
alter table public.customer_trial_grants add constraint customer_trial_tool_key_valid
 check (tool_key is null or tool_key in ('snow_load','w_section'));
-- Existing grants remain Snow Load grants for backward compatibility.
update public.customer_trial_grants set tool_key='snow_load' where tool_key is null;
alter table public.customer_trial_grants alter column tool_key set default 'snow_load';
alter table public.customer_trial_grants alter column tool_key set not null;
create index if not exists customer_trial_by_tool_idx
 on public.customer_trial_grants(customer_id,tool_key,expires_at desc);

create or replace function public.has_active_customer_tool_trial(p_tool_key text)
returns boolean language sql stable security definer set search_path = ''
as $$
 select p_tool_key in ('snow_load','w_section') and exists(
  select 1 from public.customer_trial_grants t
  where t.customer_id=auth.uid() and t.tool_key=p_tool_key
    and t.revoked_at is null and t.starts_at<=now() and t.expires_at>now()
 )
$$;
revoke all on function public.has_active_customer_tool_trial(text) from public,anon;
grant execute on function public.has_active_customer_tool_trial(text) to authenticated;

-- Keep legacy RPC scoped to Snow Load, never implicitly grant W-Section.
create or replace function public.has_active_customer_trial()
returns boolean language sql stable security definer set search_path = ''
as $$ select public.has_active_customer_tool_trial('snow_load') $$;

-- Owner-only tool-scoped grant with immutable audit trail, distinct from legacy grant RPC.
create or replace function public.owner_grant_customer_tool_trial(
 p_customer_id uuid,p_tool_key text,p_starts_at timestamptz,p_expires_at timestamptz
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_actor uuid:=auth.uid(); v_id uuid;
begin
 if v_actor is null or not exists (
  select 1 from auth.users u where u.id=v_actor
  and lower(u.email)='dehghani.pmp@gmail.com' and u.email_confirmed_at is not null
 ) then raise exception 'owner_required'; end if;
 if p_tool_key not in ('snow_load','w_section') or p_tool_key is null then raise exception 'invalid_tool'; end if;
 if p_starts_at is null or p_expires_at is null
 or p_expires_at<>p_starts_at+interval '30 days' then raise exception 'trial_must_be_30_days'; end if;
 if not exists(select 1 from auth.users where id=p_customer_id) then raise exception 'customer_not_found'; end if;
 perform pg_advisory_xact_lock(hashtext(p_customer_id::text),hashtext(p_tool_key));
 if exists(select 1 from public.customer_trial_grants
 where customer_id=p_customer_id and tool_key=p_tool_key and revoked_at is null and expires_at>now())
 then raise exception 'active_tool_trial_exists'; end if;
 insert into public.customer_trial_grants(customer_id,tool_key,starts_at,expires_at,granted_by)
 values(p_customer_id,p_tool_key,p_starts_at,p_expires_at,v_actor) returning id into v_id;
 insert into public.customer_trial_audit(grant_id,actor_id,action,previous_expiry,new_expiry)
 values(v_id,v_actor,'grant',null,p_expires_at);
 return v_id;
end $$;
revoke all on function public.owner_grant_customer_tool_trial(uuid,text,timestamptz,timestamptz) from public,anon;
grant execute on function public.owner_grant_customer_tool_trial(uuid,text,timestamptz,timestamptz) to authenticated;

alter table public.customer_tool_access_requests drop constraint if exists request_tool_type;
alter table public.customer_tool_access_requests add constraint request_tool_type
 check ((tool_key in ('snow_load','w_section') and access_type='trial')
 or (tool_key in ('3d_model','wind_load','earthquake') and access_type='beta'));
