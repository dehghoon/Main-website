# Linkoteq Main Website Security Policy

## Scope
Applies to authentication, authorization, Supabase RLS, client plans, employee roles, Blog/CMS, Timesheet, engineering-tool access, uploads, exports/reports, secrets, GitHub, Vercel and Render.

This policy must not redefine structural engineering logic. Structural integration remains governed by the released Linkoteq Structural Core v0.5 contract. PyNite must remain behind the Core Analysis Adapter.

## Identity and authorization
Current top-level identities:
- `client`
- `employee`

Current client plans:
- `starter`
- `pro`
- `company`

Current employee roles observed in server-side Blog authorization:
- `member`
- `manager`
- `admin`

Rules:
1. Authentication alone never grants employee privilege.
2. Every privileged action must be authorized server-side.
3. UI hiding is not authorization.
4. Supabase RLS must enforce ownership and role boundaries.
5. Client users must never self-promote to employee/admin.
6. Employee role changes require a trusted administrative path.
7. Paid capabilities must fail closed when entitlement cannot be verified.
8. Timesheet broader-than-self access must be explicitly role-based.
9. Blog create/edit/publish/delete must require approved employee roles.
10. Unknown role/plan/entitlement => deny.

## Client entitlement security
Free/Starter users may use allowed tools but must not obtain restricted capabilities by direct API calls, browser-state modification, request replay or guessed artifact URLs.

Server-side enforcement is required for:
- PDF/Word reports
- printing
- DXF/IFC exports
- PDF/model uploads
- private project/model storage
- quota-controlled operations

## Employee security
- Public employee self-signup is not acceptable for production.
- Prefer invitation/admin-provisioned employee accounts.
- `member`, `manager`, and `admin` permissions must be defined centrally and enforced in APIs and RLS.
- Client identities must never obtain Blog or Timesheet employee access.

## Session security
- Never place access or refresh tokens in URLs.
- Cross-application SSO must use a reviewed short-lived exchange/server-mediated flow.
- Never log session tokens.
- Admin and employee-admin accounts should use MFA where available.

## Supabase
- RLS on all private/user/employee/client/project/subscription/blog/timesheet/upload/report tables.
- Test as anonymous, client, member, manager, admin.
- Service-role keys are server-only.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is public by design; data security must come from RLS/authorization.
- Privilege-bearing role/plan fields must not be client-writable.

## API baseline
Privileged APIs should implement authentication, authorization, entitlement checks, input validation, size limits, rate/abuse controls, safe errors and no trust in client-supplied role/ownership fields.

## Upload baseline
Before enabling PDF/model uploads:
- authenticate
- check entitlement
- enforce file/count/size quotas
- allow-list expected types
- validate content, not only extension
- keep private files private
- use signed/short-lived access where appropriate
- never execute uploaded content

## Blog/CMS
- Public users read only published content.
- Client auth must not grant Blog write.
- Sanitize untrusted HTML before rendering.
- Add CSP and XSS regression coverage.
- Do not expose API keys in browser-visible content.

## Secrets
Never commit passwords, service-role keys, API keys, GitHub tokens, deployment credentials, database passwords, refresh tokens or signing secrets. Use environment variables and placeholders only.

## GitHub/Vercel/Render low-cost controls
Using a personal GitHub owner account is not automatically insecure, but compromise has a large blast radius.
- enable passkey/MFA
- use unique passwords
- review recovery methods
- remove unused OAuth/GitHub Apps
- least privilege
- protect `main` with CI/review when practical
- enable dependency/secret alerts where available
- separate production and preview environment variables
- later migrate critical systems to organization/team ownership

## Backups and recovery
Git history is not a database backup. Maintain recoverable Supabase data/schema/storage as appropriate, deployment/DNS documentation, environment-variable inventory by name (never values), and repository history. Periodically test restore procedures.

## Production security completion gate
Do not mark Production Security Verification complete until unauthorized client/employee/admin access, role escalation, entitlement bypass, Blog RLS, Timesheet RBAC, upload/export controls, qasp, secrets, dependencies, headers/CORS/session behavior, production smoke tests and recovery are independently verified.

A commit is not proof of deployment or production security.
