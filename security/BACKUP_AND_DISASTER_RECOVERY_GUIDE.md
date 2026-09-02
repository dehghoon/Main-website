# Linkoteq Backup and Disaster Recovery Guide

## Purpose
This is the canonical operational guide for backup, restore verification, and disaster recovery across Linkoteq. A backup is not recovery-ready until a representative restore has been verified.

## Mandatory principles
1. A deployment is not a backup.
2. Git history is not a database backup.
3. Database backups do not automatically cover Storage objects, DNS, deployment configuration, or external-service configuration.
4. A backup that has never been restored is not verified.
5. Backup copies should be isolated from the primary failure domain where practical.
6. Never commit passwords, tokens, service-role keys, encryption keys, or other secret values.
7. Recovery must preserve authorization, RLS, entitlement boundaries, data integrity, and Core-compatible engineering data.
8. GPT-5 owns backup/recovery security policy, audit, restore verification, findings, and readiness reporting. GPT-3 owns application/deployment implementation changes; GPT-4 coordinates cross-repository and production recovery verification.

## Recovery objectives
For every critical asset maintain: RPO, RTO, retention, backup/copy failure domain, restore-test frequency, and owner. Do not invent RPO/RTO. Until approved, record `DEFINE_REQUIRED`.

## Required backup inventory
### GitHub
Inventory production repositories, default branches, release tags, verified release SHAs, workflows, status/handoff files, and deployment mappings. Preserve full history where practical and maintain an export/mirror strategy appropriate to risk. Never store GitHub tokens in backup artifacts.

### Supabase Database
Inventory production schema, migrations, RLS policies, functions/triggers, authorization/profile data, subscriptions/entitlements, Blog data, Timesheet data, and other critical application data. Determine backup/PITR/snapshot capabilities actually enabled on the current plan. Document real frequency and retention. Test restore in isolated non-production and verify schema, RLS, functions, critical data, and authorization.

### Supabase Storage
Do not assume database backup includes Storage objects. Inventory buckets, privacy, critical objects, ownership metadata, customer/project files, and persistent reports/exports. Define an independent secure copy/export strategy for critical objects and verify representative file integrity and privacy after restore.

### Authentication and identity configuration
Inventory provider configuration, allowed redirects, custom-domain mappings, critical email templates, MFA/passkey policy, session settings, and role/profile schema. Secret values remain only in an authoritative secret store.

### Vercel / Render
Inventory projects/services, repository mappings, production branch, build commands, runtime versions, custom domains, rewrites/redirects, health checks, environment-variable names/scopes, and external dependencies. Preserve enough non-secret configuration to rebuild from source. Record which secrets must be re-provisioned without recording values.

### DNS and domains
Inventory domains, subdomains, DNS record purposes, deployment mappings, TLS dependencies, and authentication/email records where applicable. Never store registrar/DNS credentials in Git.

### Environment variables and secrets
Maintain only variable name, service/repository, environment scope, purpose, whether secret, authoritative secret-store name, and rotation requirement. Never commit secret values.

### Application and structural project data
Classify persistent versus regenerable data. For structural projects preserve project identity, Core schema version, stable canonical IDs, structural model data, load provenance, load cases/combinations, persisted analysis/design results when required, report references, and ownership/authorization references. Canonical Core-compatible data must remain recoverable; solver-native data must not be the only recovery representation.

## Initial operational baseline
Until formal RPO/RTO values are approved:
- Database: verify daily that an actual recoverable native backup/snapshot/PITR mechanism is enabled as applicable; define supplemental export based on provider capability and risk.
- Storage: maintain a daily change inventory for critical objects and define external-copy cadence from approved RPO.
- GitHub: preserve verified release SHA/tag on every release and maintain a periodic export/mirror strategy.
- Deployment configuration: review on every production release.
- DNS/domain inventory: update on change and review quarterly.
- Secret-dependency inventory: update on change and review quarterly.
- Restore testing: at least quarterly for critical database/application paths until a risk-based frequency is approved.
This baseline is provisional and does not replace approved business-continuity objectives.

## Restore test procedure
1. Select and identify a backup recovery point.
2. Record start time.
3. Restore into an isolated non-production environment.
4. Re-provision required secrets from the authoritative secret store without exposing them.
5. Verify schema and migration state.
6. Verify RLS and authorization policies.
7. Verify representative authentication and client/employee separation.
8. Verify subscription/entitlement state.
9. Verify representative customer/application data.
10. Verify critical Storage objects, ownership, privacy, and integrity.
11. Verify a representative structural project where applicable, including Core schema version, stable IDs, provenance, and references without changing authoritative engineering logic.
12. Verify Blog/Timesheet data where applicable.
13. Verify representative API/application behavior.
14. Record end time and actual recovery duration.
15. Compare actual data loss and recovery duration with target RPO/RTO.
16. Capture evidence without secrets.
17. Safely destroy the temporary restore environment after evidence is retained.

## Restore acceptance gates
A restore passes only when required data and references are intact; RLS is enabled; anonymous/client/employee boundaries still hold; entitlements are correct; private Storage remains private; representative files pass integrity checks; application read/write behavior works; production-critical configuration can be reconstructed; Core-compatible engineering data and stable IDs are preserved where applicable; actual RPO/RTO are measured; and no secrets were printed or committed.

## Disaster scenarios
Maintain runbooks for accidental data deletion, bad database migration, corrupted data, compromised privileged account, lost/locked primary GitHub account, repository deletion/corruption, Supabase outage/project loss, deployment-provider outage, environment-variable deletion, secret compromise/rotation, DNS/domain misconfiguration, customer Storage object loss, unsafe production release requiring rollback, and structural-project recovery while preserving Core compatibility.

## Rollback versus restore
Use rollback for safely reversing a recent application/deployment change when required data remains valid. Use restore when data/configuration must be reconstructed from backup. Never automatically roll back database schema/data merely because application code was rolled back; database rollback requires an explicit safe migration/recovery procedure.

## Backup security
Protect backups with encryption in transit/at rest when supported, least privilege, access logging when supported, retention/expiry controls, secret separation, no public share links for private backups, deletion protection/immutability where cost-effective, and periodic access review.

## Evidence and status
For each critical asset record:
- state: `NOT_INVENTORIED`, `INVENTORIED`, `BACKUP_CONFIGURED`, `BACKUP_VERIFIED_EXISTS`, `RESTORE_TEST_REQUIRED`, `RESTORE_VERIFIED`, or `RECOVERY_READY`
- last verified backup
- last restore test
- RPO/RTO
- actual recovery duration
- retention
- failure domain
- security status
- owner
- blocker
- next action
- next restore-test due date

`BACKUP_VERIFIED_EXISTS` does not imply restore capability. Only verified restore plus required security/application evidence may support `RECOVERY_READY`.

## Recommended repository artifacts
Maintain without secret values:
- `security/backup/inventory.json`
- `security/backup/RESTORE_RUNBOOK.md`
- `security/backup/DISASTER_RECOVERY_RUNBOOK.md`
- `security/backup/restore-tests/YYYY-MM-DD.md`

## GPT-5 mandatory workflow
When auditing or managing backup/recovery, GPT-5 MUST:
1. Read the latest Core Contract from GitHub.
2. Read this guide from GitHub.
3. Inspect actual provider/repository configuration where access exists.
4. Build/update the backup inventory.
5. Define or flag missing RPO/RTO.
6. Verify backup existence.
7. Perform or require a safe non-production restore test according to risk and due date.
8. Verify security, RLS, authorization, entitlements, data integrity, Storage privacy, and Core compatibility after restore.
9. Record evidence without secrets.
10. Route implementation blockers to the correct GPT/stage.
11. Never declare an asset recovery-ready until restore is verified.

## Reporting
Backup status reports must state asset, backup state, last verified backup, last restore test, RPO/RTO, actual recovery evidence, security status, blocker, owner, next action, and next restore-test due date. If evidence is missing, report `not verified`; never guess.
