-- Staged only: customer-initiated per-tool access requests.
-- Does not modify existing employee, Owner, or tool authorization.
create table if not exists public.customer_tool_access_requests (
 id uuid primary key default gen_random_uuid(),
 customer_id uuid not null references auth.users(id),
 tool_key text not null check (tool_key in ('snow_load','3d_model','w_section','wind_load','earthquake')),
 access_type text not null check (access_type in ('trial','beta')),
 status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid references auth.users(id),
 constraint request_tool_type check ((tool_key='snow_load' and access_type='trial') or (tool_key<>'snow_load' and access_type='beta'))
);
create unique index if not exists customer_tool_one_pending_request
 on public.customer_tool_access_requests(customer_id,tool_key) where status='pending';
create index if not exists customer_tool_request_customer_idx
 on public.customer_tool_access_requests(customer_id,created_at desc);
alter table public.customer_tool_access_requests enable row level security;
revoke all on public.customer_tool_access_requests from anon,authenticated;
grant select,insert on public.customer_tool_access_requests to authenticated;
drop policy if exists customer_tool_requests_own_read on public.customer_tool_access_requests;
create policy customer_tool_requests_own_read on public.customer_tool_access_requests
 for select to authenticated using (customer_id=(select auth.uid()));
drop policy if exists customer_tool_requests_own_insert on public.customer_tool_access_requests;
create policy customer_tool_requests_own_insert on public.customer_tool_access_requests
 for insert to authenticated with check (
 customer_id=(select auth.uid()) and status='pending' and reviewed_at is null and reviewed_by is null
);
-- Owner approval and grant issuance must be implemented in a separate audited
-- server-authorized transaction. A pending request is never an entitlement.
