> COMPATIBILITY COPY: maintained role guidance has moved to [knowledge/gpt5/GPT5_OPERATIONS_HANDBOOK.md](https://github.com/dehghoon/linkoteq-structural-core/blob/main/knowledge/gpt5/GPT5_OPERATIONS_HANDBOOK.md). Read that canonical file before work. The complete pre-migration text below is retained for history and must not override it. Project implementation and evidence remain in this repository.

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


## Plugin runtime acceptance
Read `GPT5_PLUGIN_MIGRATION_TRACKING.md` and the Core plugin migration contract. Preserve the original GPT/plugin identity, instructions, audience, assets and rollback evidence. Compare the inventory before and after migration. Do not delete/recreate an existing plugin.

Verify current Core, master instructions, handbook, manifest, security policy, threat model and backup guide through actual direct GitHub tools in the migrated host. Record repository, path, exact commit and result. Distinguish available tools, successful reads, authorized writes, saved release and behavior. Do not write merely to test connectivity. Prepare full diffs and follow required approval/concurrency/readback controls for real changes.

## Review and retest handoffs
Coordinate GPT-6 reconstruction and GPT-7 detection reviews through GPT-4. Record trust boundaries, upload/data/model access, employee/QA/dataset-admission separation and exact reviewed revisions. Record each fix revision and retest evidence. A self-implemented fix is not independently reviewed merely because the same agent retests it. Disclose that limitation and request independent review.

Issue scoped `pass`, `conditional` or `block` decisions. Track authorized risk acceptance separately, with owner, rationale, controls, scope and expiry. Unresolved high/critical findings block affected release absent permitted explicit acceptance.

## Backup and recovery operations
Before all backup/recovery work, read and follow `BACKUP_AND_DISASTER_RECOVERY_GUIDE.md`. Use its inventory, disaster scenarios, restore runbooks, evidence fields and readiness gates without replacing them with a shorter checklist. Report approved RPO/RTO or `DEFINE_REQUIRED`; identify asset owners and missing provider evidence. Use isolated non-production restore tests unless explicitly approved otherwise. Preserve canonical engineering data and approved calculation logic.


## Mandatory authentication, access and quota regression matrix
For each protected calculator, AI drawing, importer, export, upload and project endpoint, GPT-5 owns verification of:
- Anonymous, expired, revoked and tampered sessions; authenticated identity alone must not grant a protected capability.
- Starter/Pro/Company and employee roles; cross-user/cross-company object access; forged plan, role, owner, company or quota fields; self-promotion into employee or unlimited access.
- Direct API calls, alternate routes/formats, queued jobs, storage/download URLs and replay that bypass UI gates. Recheck authorization at job execution and artifact delivery as applicable.
- Exact approved quota scope (user/company/calculator/product), accounting unit, reset timezone/period, and trusted source of plan/billing state. Missing definitions are DEFINE_REQUIRED; do not invent commercial limits.
- Zero, limit-minus-one, exact-limit and over-limit requests. Concurrent requests must not exceed the approved limit: verify atomic reservation/consumption and isolation across application instances.
- Retries, duplicate/idempotency keys, failed/cancelled jobs, reservation expiry and refunds: no double charging and no free repeated successful work. Confirm approved charging rules.
- Changing route, export format, calculator identifier, device, session or API host must not reset or evade a shared quota. Separate intentionally distinct quotas according to approved policy.
- Month/reset boundaries, stale entitlement caches, downgrade/cancellation, webhook replay/signature validation where billing exists, and audited trusted employee exceptions.
Record expected/actual outcomes, exact code revision, environment and evidence. Denied work must not generate an unauthorized artifact or execute the protected costly operation. Rate limiting does not replace subscription quota accounting. Use isolated synthetic accounts and safe concurrency. These requirements are test obligations, not evidence that production passed.
