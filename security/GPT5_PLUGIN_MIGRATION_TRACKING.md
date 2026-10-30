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

## Migration implementation closeout — 2026-10-29

This checkpoint supersedes the preparation status above.
Status: PLUGIN_MIGRATION_IMPLEMENTED. Configuration publication and source preservation verified; fresh-chat activation of the new release remains unverified. Product security remediation and recovery verification are deferred by explicit owner instruction and are not migration implementation work.

### Plugin identity and saved release
- Plugin: `plugin_17b41dcc445c819186ca1f58c55cac8a`.
- Display name: Linkoteq GPT-5 Security.
- Scope/audience: USER / PRIVATE, verified before and after.
- Previous version: `0.2.1+bundle.d1a17412fd80a75fa1a8ee1d29be872b`.
- Previous release: `pluginrel_8a7142a3cd688191b0a8dece9c75e79c`.
- Published version: `0.2.2`.
- Published release: `pluginrel_6ae3f6910a5081919c351f5f7ab528ad`.
- URL: https://chatgpt.com/plugins/plugin_17b41dcc445c819186ca1f58c55cac8a

### Actual configuration changes and preservation
Inspected all five original packaged files. Added only `.app.json` with the existing GitHub connector `connector_76869538009648d5b282a4bb21c3d157`; updated both manifests to reference it and version 0.2.2. Short listing description was normalized to "Linkoteq security verification" to satisfy the package length requirement. Identity, long description, all prompts, ownership and private audience were preserved.
Partial overlay used the observed expected release ID; no files were deleted. All three retained skill, agent metadata and knowledge-index files were read back and matched their previous text exactly. Six resulting files were inventoried. No Gateway, custom MCP endpoint, OAuth binding or credentials were present in the inspected package.
The knowledge index contains no uploaded files. Canonical guides are in GitHub; preservation of unknown historical uploads is not claimed.

### Runtime evidence and limits
The owner's supplied GPT-5 host report records nine successful canonical reads at Core `229487a0b3770b26114f625ebff6d7c3b929bf06` and Website `9a264d8142b02480d45b6de762375d1c78a20cb8`, using github_fetch and github_fetch_file, without writes. This is user-supplied evidence for the previous release.
In this closeout session the installed GPT-5 skill was read through skills.read and direct GitHub reads were repeated after publication, including Website README and the policy/role files. This confirms the current session's reads, not automatic activation of release 0.2.2 in another fresh chat. No connectivity write was performed. The documentation update is an authorized real task, not proof of GPT-5 write access in another host.
The dependency-resolution tool rejected this private plugin because that tool requires a public globally listed plugin. The direct GitHub binding is verified from saved manifests, not that resolver.
Core declares v0.5; Releases API returned an empty list. No released Core baseline is claimed.
Technical repository allowlists and fresh-chat release activation remain unverified. Instructions enforce behavioral boundaries only.

### Preserved behavioral requirements
Authentication does not grant paid/employee access; unknown entitlement denies access. Quota replay/concurrency tests remain required. Backup existence is insufficient for RECOVERY_READY; missing approved RPO/RTO remains DEFINE_REQUIRED. Engineering semantic changes belong to GPT-1/GPT-2; PyNite remains adapter-only. No product security pass, successful restore, deployment or production verification is asserted.
Before any future repository mutation, apply the exact-diff approval workflow in the active migration contract. Product fixes require their own reviewed scope.

### Remaining acceptance item
Owner/GPT-5: open version 0.2.2 in a fresh chat and repeat canonical read and non-mutating scope/approval cases. The previous host report plus unchanged instructions support continuity but do not substitute for this final release-specific behavior check.
GPT-3/GPT-5/GPT-4: retain the previously reported product security findings for later remediation and independent verification; deferral is not risk acceptance or production security approval.
