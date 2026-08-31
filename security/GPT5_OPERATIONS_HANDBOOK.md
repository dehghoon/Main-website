# Linkoteq GPT-5 Security Operations Handbook

## Operating loop

For every repository or feature:

1. Read latest Core Contract.
2. Inspect live GitHub repository state.
3. Identify assets, trust boundaries, identities, roles, plans, entitlements, APIs, data stores, uploads, external services, and deployment targets.
4. Compare implementation against `SECURITY_POLICY.md` and `THREAT_MODEL.md`.
5. Create findings with severity and concrete evidence.
6. Implement safe remediations that stay within GPT-5 ownership.
7. Add negative security tests.
8. Run or verify CI.
9. Verify deployment separately.
10. Verify representative production behavior separately.
11. Record status and handoff in GitHub.

## Finding severity

Use:

- `critical`: immediate compromise of secrets, admin control, broad private data, or production integrity
- `high`: privilege escalation, cross-user private data access, protected feature bypass with meaningful impact, session theft, unsafe service-role exposure
- `medium`: exploitable weakness with meaningful constraints, missing defense-in-depth on sensitive paths, abuse/cost exposure
- `low`: limited-impact hardening gap, weak operational hygiene, non-exploitable configuration concern
- `info`: observation or planned improvement without current exploit path

Do not inflate severity.

## Required finding record

Each finding should contain:

- `id`
- `title`
- `severity`
- `status`
- `repository`
- `affectedAssets`
- `evidence`
- `attackPath`
- `preconditions`
- `impact`
- `recommendedFix`
- `owner`
- `verification`
- `introducedOrObservedAt`
- `resolvedAt` when applicable

## Authorization audit

Build an authorization matrix before changing role logic.

Minimum identities:

- anonymous
- client/starter
- client/pro
- client/company
- employee/member
- employee/manager
- employee/admin

Minimum protected domains:

- calculators
- reports/exports
- 3D Model project creation/storage
- protected uploads
- Blog write/publish/delete
- Timesheet self
- Timesheet team
- Timesheet administrative actions
- employee provisioning
- role changes
- subscription/entitlement changes

Every privileged action must have both a policy decision and a server/data enforcement point.

## Supabase audit

Inspect:

- schema/migrations
- RLS enabled state
- policies by table
- function security mode
- service-role usage
- storage bucket privacy
- signed URL behavior
- role/profile update paths
- client-writable privilege fields
- anonymous/authenticated policy breadth

Add adversarial tests for cross-user IDs and role changes.

## Session audit

Inspect:

- login/signup
- password reset
- magic links/OAuth
- cookie/session storage
- cross-domain handoff
- redirects/callbacks
- logout/revocation
- token logging
- token placement in URL
- privileged account MFA capability

Any access or refresh token in a URL is a finding and must be migrated.

## API audit

For each sensitive API verify:

- authentication
- authorization
- ownership
- entitlement
- schema validation
- body/file size limit
- safe error behavior
- rate/abuse control appropriate to risk
- secret isolation
- auditability where appropriate

Never rely solely on middleware route hiding if the handler/data layer remains permissive.

## Upload audit

Test:

- unauthenticated upload denied
- non-entitled upload denied
- extension spoofing
- content-type mismatch
- oversized file
- excessive file count
- cross-user access
- public bucket exposure
- malicious active content handling
- signed URL expiry if used

## Blog/CMS audit

Verify public read is limited to publishable content.
Verify client users cannot write.
Verify employee permissions for create/edit/publish/delete.
Verify HTML sanitization and XSS regression coverage.
Verify AI-assisted Blog endpoints require employee authorization and cost controls.

## Timesheet audit

Define and test exact RBAC:

- member: own records only unless explicitly granted otherwise
- manager: defined team scope only
- admin: explicitly defined administrative scope

Do not infer team scope from client-supplied employee IDs.
Cross-employee access requires verified server/data policy.

## Entitlement audit

For each paid capability:

1. identify UI gate
2. identify API/server gate
3. identify data/storage gate
4. test direct request bypass
5. test stale/downgraded plan
6. test forged client plan value
7. test quota exhaustion

Unknown entitlement state must deny protected operations.

## Secret audit

Search repository and CI/deployment configuration for secret exposure without printing values.

Track only variable names and locations.
If a real secret is discovered, do not echo it. Recommend rotation and removal from history as appropriate.

## Dependency and supply-chain audit

Review lockfiles, known vulnerability alerts, GitHub Actions permissions, third-party apps, build scripts, and high-risk packages.
Do not apply major dependency upgrades blindly during release closeout.
Separate urgent exploitable fixes from non-blocking hardening.

## Low-cost infrastructure baseline

Prefer low-cost controls first:

- GitHub MFA/passkeys
- branch protection when available
- Dependabot/security alerts when available
- least-privilege GitHub Apps/tokens
- separate Vercel/Render preview and production variables
- Supabase RLS
- server-side authorization
- application rate limits/quotas
- CSP/security headers
- automated negative tests
- documented recovery

Do not recommend paid security products unless free/native controls are insufficient for a concrete risk.

## Security handoff files

Use:

- `security/security-status.json`
- `security/findings/<finding-id>.md`
- `handoffs/gpt5-to-gpt3-security.md`
- `handoffs/gpt5-to-gpt4-security-verification.md`

If a target repository already has a status convention, integrate rather than duplicate unnecessarily.

## Completion rule

Security status may be:

- `NOT_AUDITED`
- `AUDIT_IN_PROGRESS`
- `REMEDIATION_REQUIRED`
- `REMEDIATION_IN_PROGRESS`
- `VERIFICATION_REQUIRED`
- `PRODUCTION_SECURITY_VERIFIED`

Only GPT-5/GPT-4 verification evidence may support the final status, and production verification must remain separate from code/CI evidence.
