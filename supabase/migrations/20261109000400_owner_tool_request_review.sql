-- Owner reviews a customer request and issues a grant in one transaction.
-- The existing grant functions remain the sole authority for grant creation.
create or replace function public.owner_review_customer_tool_request(p_request_id uuid,p_decision text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=auth.uid(); v_req public.customer_tool_access_requests%rowtype;
 v_grant uuid; v_start timestamptz:=now(); v_end timestamptz;
begin
 if v_actor is null or not exists(
 select 1 from auth.users u where u.id=v_actor and lower(u.email)='dehghani.pmp@gmail.com'
 and u.email_confirmed_at is not null
 ) then raise exception 'owner_required'; end if;
 if p_decision not in ('approve','reject') or p_decision is null then raise exception 'invalid_decision'; end if;
 select * into v_req from public.customer_tool_access_requests
 where id=p_request_id and status='pending' for update;
 if not found then raise exception 'pending_request_not_found'; end if;
 if p_decision='approve' then
   if v_req.access_type='trial' then
     if not public.has_accepted_customer_tool_disclaimer_for_user(v_req.customer_id,v_req.tool_key) then
       raise exception 'engineering_disclaimer_required';
     end if;
     v_end:=v_start+interval '30 days';
     v_grant:=public.owner_grant_customer_tool_trial(v_req.customer_id,v_req.tool_key,v_start,v_end);
   else
     v_end:=v_start+interval '30 days';
     v_grant:=public.owner_manage_customer_beta(v_req.customer_id,v_req.tool_key,v_start,v_end,'grant',null);
   end if;
 end if;
 update public.customer_tool_access_requests set status=case when p_decision='approve' then 'approved' else 'rejected' end,
 reviewed_by=v_actor,reviewed_at=now() where id=v_req.id;
 return v_grant;
end $$;
-- Internal helper for owner review; does not reveal any customer information.
create or replace function public.has_accepted_customer_tool_disclaimer_for_user(p_customer_id uuid,p_tool_key text)
returns boolean language sql stable security definer set search_path=''
as $$
 select exists(select 1 from public.customer_tool_disclaimer_acceptances
 where customer_id=p_customer_id and tool_key=p_tool_key and disclaimer_version='engineering-trial-v1')
$$;
revoke all on function public.has_accepted_customer_tool_disclaimer_for_user(uuid,text) from public,anon,authenticated;
revoke all on function public.owner_review_customer_tool_request(uuid,text) from public,anon;
grant execute on function public.owner_review_customer_tool_request(uuid,text) to authenticated;
