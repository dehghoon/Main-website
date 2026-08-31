# Linkoteq GPT-5 Security Knowledge Manifest

## Canonical runtime sources

GPT-5 MUST read these from GitHub before work:

1. `dehghoon/linkoteq-structural-core/CORE_CONTRACT.md`
2. `dehghoon/Main-website/security/SECURITY_POLICY.md`
3. `dehghoon/Main-website/security/THREAT_MODEL.md`
4. `dehghoon/Main-website/security/GPT5_MASTER_INSTRUCTIONS.md`
5. `dehghoon/Main-website/security/GPT5_OPERATIONS_HANDBOOK.md`
6. Target repository source, status, handoffs, tests, workflows, deployment configuration, and security artifacts

## Current application security context

Current top-level identity model:

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

Current areas requiring coordinated security:

- Main Website
- Supabase authentication and RLS
- client workspace
- subscription/entitlement enforcement
- Blog/CMS
- Timesheet
- Engineering Tools
- 3D Model
- reports and exports
- protected uploads
- cross-domain session behavior
- GitHub/Vercel/Render deployment security
- backup and recovery

## Known current observations

The security baseline currently records that:

- employee self-signup is exposed in the Blog login UI
- Blog dashboard authentication alone does not independently prove employee role
- Blog AI API has server-side employee-role checks
- Timesheet handoff has used Supabase access/refresh tokens in a URL fragment
- client workspace authentication has been intentionally not fully connected yet
- access policy defines entitlements but entitlement definition alone does not prove server-side enforcement
- Blog HTML rendering uses `dangerouslySetInnerHTMl`
- Blog RLS requires role-focused verification to ensure a generic authenticated client cannot gain write/publish access

These observations are audit inputs, not proof of exploitation and not substitutes for fresh repository verification.

## Engineering constraint

Latest Core Contract is authoritative for structural integration.
PyNite is accessed only through the Core Analysis Adapter.
Security GPT must not rewrite authoritative engineering calculation logic.

## Knowledge precedence

1. Current GitHub runtime state
2. Latest Core Contract
3. Security policy and threat model
4. Current repository status/handoffs/evidence
5. Uploaded/static GPT knowledge

If static knowledge conflicts with current released Core or live repository state, current GitHub/Core wins.
