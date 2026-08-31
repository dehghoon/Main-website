# Linkoteq Main Website Threat Model

## Assets
Protect client accounts, employee identities/roles, subscription/entitlement state, engineering projects/models, uploads, reports/exports, Timesheet data, unpublished Blog content, Supabase sessions, API/deployment secrets and administrative accounts.

## Trust boundaries
- public browser -> Main Website
- client browser -> Main Website/Supabase
- employee browser -> Main Website/Supabase
- Main Website -> Timesheet
- Main Website -> engineering tools
- GitHub -> Vercel/Render
- engineering app -> Structural Core
- Core Analysis Adapter -> PyNite

Never trust role, plan, entitlement, ownership or target IDs merely because the browser supplied them.

## Primary threats

### T1 Paid-feature bypass
A Starter/free user calls report/export/upload endpoints directly or edits frontend state.
Control: server-side entitlement + quota checks, deny-by-default.

### T2 Client-to-employee privilege escalation
Public employee signup, editable profile role, weak RLS, client-written role fields.
Control: invitation/admin provisioning, server authorization, RLS preventing self-promotion.

### T3 Employee role overreach
A `member` sees other Timesheets or performs manager/admin actions.
Control: canonical RBAC matrix, backend checks, RLS, audit logs.

### T4 Blog/CMS unauthorized write
Any authenticated client writes/publishes Blog content.
Control: employee-specific RLS and server checks.

### T5 Session theft
Current employee login hands Supabase access/refresh tokens to Timesheet in a URL fragment.
Control: replace with short-lived one-time exchange/server-mediated session. Never put refresh tokens in URLs.

### T6 XSS
Blog dashboard renders HTML via `dangerouslySetInnerHTML`.
Control: allow-list sanitization at a trusted boundary + CSP + regression tests.

### T7 Secret exposure
Keys/tokens committed, logged or exposed through public environment variables.
Control: server-only secrets, secret scanning, key rotation, no secrets in URLs/logs.

### T8 RLS misconfiguration
Broad `authenticated` policies or missing RLS expose cross-user data.
Control: RLS-by-default + adversarial tests for anonymous/client/member/manager/admin.

### T9 Upload abuse
Oversized/malicious PDFs/models, public bucket writes, storage exhaustion.
Control: entitlement, type/content validation, quotas, private storage, signed URLs, isolation/scanning where practical.

### T10 IDOR
Changing project/report/post/Timesheet IDs reveals another user's data.
Control: ownership/role checks at data/API layer.

### T11 API abuse / cost DoS
Repeated AI/report/analysis calls drive cost or availability loss.
Control: rate limits, quotas, request-size limits, monitoring.

### T12 Supply-chain/account compromise
Vulnerable npm package, compromised GitHub token/action, personal GitHub account takeover.
Control: dependency alerts, minimal permissions, MFA/passkeys, branch protection, later organization ownership.

### T13 Production drift
A code fix is not the deployed behavior.
Control: separately verify commit, CI, deployment, healthy deployment, reachable URL and representative production behavior.

### T14 Engineering boundary bypass
Main Website or 3D app calls PyNite directly.
Control: Structural Model -> Core Analysis Adapter -> PyNite -> Canonical Analysis Results.

## Current observed gaps in `Main-website`
- employee self-signup is exposed in `app/blog/login/page.tsx`
- Blog dashboard checks authentication but does not independently establish employee role
- `/api/blog-ai` does check server-side roles `member`, `manager`, `admin`
- Timesheet handoff places Supabase access/refresh tokens in a URL fragment
- client workspace auth is intentionally not yet connected
- `lib/access-policy.ts` defines entitlements but does not prove server-side enforcement
- Blog HTML rendering uses `dangerouslySetInnerHTMl`

These observations are not a penetration test.

## Acceptance gates
Security is not production-complete until tests prove:
- anonymous cannot use protected operations
- Starter cannot use paid report/export/upload operations
- client cannot access employee Blog/Timesheet/admin functions
- member cannot perform manager/admin actions
- role self-promotion is denied
- cross-user object access is denied
- Blog write/publish RLS is verified
- XSS payloads do not execute
- no access/refresh token appears in URLs
- upload restrictions work
- secrets are absent from source/browser/logs
- expensive endpoints have abuse controls
- production smoke tests pass
