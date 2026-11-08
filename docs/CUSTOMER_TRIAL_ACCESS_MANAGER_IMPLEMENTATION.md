# Customer trial access in Access Manager

Status: implementation contract; NOT deployed or enabled.

## Scope
- Customers are separate from employee roles. A customer can have a trial, Starter, or Pro entitlement.
- Owner can grant, extend, revoke, or convert a trial, specifying start and expiry timestamps in UTC.
- Expired trials are denied at request time, not only by a scheduled cleanup job.
- Every write requires server-side verified Owner identity, an existing customer auth user, validated dates, and an audit record in the same transaction.
- Never trust client-supplied role, customer email verification, subscription status, or plan name as authorization.
- Preserve all existing Labeling, Timesheet, and Weblog permissions; customer entitlements must not modify employee permissions.
- Trial and paid entitlement checks must be enforced by each product backend, not only Access Manager UI.

## Data and migration requirements
- Inspect current customer, subscription, billing, and reward tables before adding a new entitlement store. Reuse canonical entitlements where possible; do not create parallel conflicting sources of truth.
- Store customer user ID, entitlement kind, effective start/end, status, issuer, change reason, and audit timestamps. Reject overlapping contradictory active grants.
- RLS: customer may read only their own effective entitlement; only audited Owner-side server RPC can mutate. No direct client write grants.
- Keep discovery Pro rewards distinct from paid Pro and trials; trial conversion must not prematurely start a reserved Pro reward.

## Verification gates
1. Snapshot existing employee and Labeling grants and compare before/after migration.
2. Verify Owner grant, extension, revocation, conversion and audit trail; verify Admin, Manager, Member and customers cannot grant themselves access.
3. Verify expiry at boundary, future start, repeated requests, revoked access, and timezone handling.
4. Verify anonymous/other customers cannot read another customer's entitlement.
5. Verify paid features reject expired trials even when frontend state is stale.
6. Run migration in staging and verify app build, RLS tests and rollback before production merge.

This document does not authorize running migrations or modifying production users.
