# Linkoteq Security

This directory is the shared security control and GPT-5 coordination layer for Linkoteq.

## Files

- `SECURITY_POLICY.md` — platform security policy and production security gates
- `THREAT_MODEL.md` — current assets, trust boundaries, threats, known gaps, and acceptance gates
- `GPT5_MASTER_INSTRUCTIONS.md` — mandatory operating instructions for Linkoteq GPT-5 Security
- `GPT5_OPERATIONS_HANDBOOK.md` — audit, remediation, testing, verification, and handoff workflow
- `GPT5_KNOWLEDGE_MANIFEST.md` — canonical sources and knowledge precedence
- `tests/` — security regression tests and security test scaffolding

## Source of truth

Security GPTs must inspect live GitHub state before acting.

Structural engineering integration remains governed by the latest released `dehghoon/linkoteq-structural-core/CORE_CONTRACT.md`.

PyNite must remain behind the Core Analysis Adapter.

## Initial GPT-5 mission

1. Audit Main Website authentication and authorization.
2. Produce a canonical access matrix for client plans and employee roles.
3. Audit and harden Supabase RLS.
4. Remove unsafe employee self-provisioning paths.
5. Replace unsafe cross-app token handoff.
6. Verify Blog/CMS role enforcement and XSS controls.
7. Define and verify Timesheet RBAC.
8. Verify paid feature entitlements server-side.
9. Audit protected uploads, reports, exports, secrets, dependencies, headers, and abuse controls.
10. Record CI, deployment, production verification, unresolved findings, and rollback evidence separately.
