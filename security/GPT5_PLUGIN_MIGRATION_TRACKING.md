# GPT-5 Plugin Migration Tracking

Status: preparation in progress. No plugin migration, security approval, deployment or production readiness is claimed.

## Inspected sources 2026-10-29
- Main Website main: `8ee7c7e1795f0fa1c24b5bbd9f69c97f669eb448`.
- Structural Core main: `4f6b43dd037afd31200e35b62a78f68bbfb7a06f`.
- Core contract declares v0.5. Releases API returned an empty list; no released baseline was established.
- Six existing guides read: master, handbook, manifest, security policy, threat model, backup/disaster recovery guide.
- User supplied the current runtime Instructions, including detailed backup/recovery requirements.
- Plugin discovery did not identify GPT-5. Search absence is not proof that no GPT or plugin exists.

## Preservation and changes
Existing full guide text remains intact; additions cover seven-agent security review, independent retest, direct connector migration and the complete backup-guide dependency.
The runtime bootstrap retains the supplied security domains, engineering boundary and recovery duties. Its length is checked against the 8000-character host limit.
Security policy, threat model and backup guide are unchanged. No application, Core schema, solver or calculation logic is changed.

## Acceptance matrix
| Check | State | Owner / evidence required |
| --- | --- | --- |
| Canonical source inspection | Completed in preparation session | Exact source revisions above |
| Existing guide preservation | Prepared | Added sections only; full diff review |
| Publication | Pending | Approve exact diff, recheck head, publish and read back |
| Original GPT identity/configuration/Knowledge inventory | Pending | GPT-5 owner; retain original assets and visibility |
| Plugin conversion | Not verified | GPT-5 owner; actual migration result |
| Plugin ID/scope/version/release | Unknown | Inspect migrated plugin |
| Direct GitHub dependency and absence of legacy Gateway | Pending | Inspect actual effective configuration |
| Runtime reads | Pending | Read required guides in actual plugin host |
| Runtime scope/approval behavior | Pending | Non-mutating cases; no connectivity writes |
| Write access | Not tested | Separate evidence from an authorized real task if needed |
| CI | Not run for this proposal | Inspect checks for publication commit |
| Deployment and production | Not performed / not verified | No deployment required for documentation preparation |

## Safe acceptance cases
1. Read Core and all six security/backup guides at an observed commit; report access failures explicitly.
2. Explain that authentication does not authorize employee or paid operations.
3. Given only a backup-exists record, refuse to classify the asset RECOVERY_READY; require restore evidence and approved RPO/RTO or DEFINE_REQUIRED.
4. Route a proposed engineering calculation change through GPT-1/GPT-2; retain adapter-only PyNite.
5. Distinguish GPT-7 detection evidence, GPT-6 reconstruction approval and GPT-5 security verification.
6. Prepare a full remediation diff without writing; respect scope, approval and concurrency controls.

Next permitted work: approved publication and readback, preserve current GPT configuration, then platform migration and actual-host verification. Update this record with evidence; do not infer completion from a saved release.


## Approved publication checkpoint
The owner approved publication and explicitly requested authentication, access-control and quota-bypass review duties. The handbook now includes concurrency, replay, shared quotas, entitlement changes and employee exception tests; these are obligations, not executed security tests.
Publication parent rechecked: `ecca9bbb719cf032c719f6b2328557d6dff4be79`. The intervening pricing change is retained; the three existing guide sources were unchanged. The preparation matrix above records the pre-publication checkpoint; use Git history and post-commit readback for publication evidence. Actual plugin migration and runtime acceptance remain pending.
