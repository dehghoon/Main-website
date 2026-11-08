-- Owner review is distinct from Pro activation. Existing reward timing trigger remains authoritative.
create table if not exists public.customer_discovery_reward_review_audit (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id),
 actor_id uuid not null references auth.users(id),
 previous_status text not null,
 new_status text not null,
 reason text,
 reviewed_at timestamptz not null default now()
);
alter table public.customer_discovery_reward_review_audit enable row level security;
revoke all on public.customer_discovery_reward_review_audit from anon,authenticated;
create or replace function public.owner_review_discovery_reward(
 p_user_id uuid, p_decision text, p_reason text default null
) returns text language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=auth.uid();v_before text;v_after text;
begin
 if v_actor is null or not exists(select 1 from auth.users where id=v_actor and lower(email)='dehghani.pmp@gmail.com' and email_confirmed_at is not null)
 then raise exception 'owner_required';end if;
 if p_decision not in ('verify','reject','activate') then raise exception 'invalid_decision';end if;
 select status into v_before from public.customer_discovery_rewards where user_id=p_user_id for update;
 if v_before is null then raise exception 'reward_request_not_found';end if;
 if p_decision='verify' and v_before='pending' then v_after:='verified';
 elsif p_decision='reject' and v_before='pending' then v_after:='rejected';
 elsif p_decision='activate' and v_before='verified' then v_after:='granted';
 else raise exception 'invalid_status_transition';end if;
 -- The existing trigger prevents activation until official launch and sets exactly two months.
 update public.customer_discovery_rewards set status=v_after where user_id=p_user_id;
 insert into public.customer_discovery_reward_review_audit(user_id,actor_id,previous_status,new_status,reason)
 values(p_user_id,v_actor,v_before,v_after,left(p_reason,1000));
 return v_after;
end $$;
revoke all on function public.owner_review_discovery_reward(uuid,text,text) from public,anon;
grant execute on function public.owner_review_discovery_reward(uuid,text,text) to authenticated;

create or replace function public.owner_list_discovery_rewards()
returns table(user_id uuid,status text,requested_at timestamptz,verified_at timestamptz,granted_at timestamptz,expires_at timestamptz)
language plpgsql stable security definer set search_path=''
as $$
begin
 if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid() and lower(email)='dehghani.pmp@gmail.com' and email_confirmed_at is not null)
 then raise exception 'owner_required';end if;
 return query select r.user_id,r.status,r.requested_at,r.verified_at,r.granted_at,r.expires_at
 from public.customer_discovery_rewards r order by r.requested_at desc;
end $$;
revoke all on function public.owner_list_discovery_rewards() from public,anon;
grant execute on function public.owner_list_discovery_rewards() to authenticated;
