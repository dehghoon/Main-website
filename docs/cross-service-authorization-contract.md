# Linkoteq cross-service authorization contract (staged; not certified)

## Public discovery vs. protected execution
- Public pages may show tool names, descriptions and a sign-up/request CTA.
- No anonymous user may calculate, import, edit, upload or export through an engineering tool.
- Starter (including free), Pro and Company are inactive; signing in must not grant plan entitlement.
- Customer Trial: Snow Load / W-Section only, 30 days, owner-approved and versioned disclaimer accepted.
- Customer Beta: 3D Model / Wind Load / Earthquake only, owner-approved and time-limited.
- Owner and active employees retain their existing access through **server-verified** membership, never client role claims.

## Enforcement boundary
1. Authenticate the user's Supabase JWT using a trusted issuer and audience, and validate expiry. A static service API token alone is **not** a user entitlement.
2. Resolve the canonical tool key and a trusted server-side principal (owner, active employee or customer).
3. For customers, verify the tool-scoped active Trial/Beta grant, expiry/revocation, and required disclaimer on the server. Deny on errors or missing records.
4. Enforce at **every** backend calculation, model operation, import, upload and export entry point. Do not rely on a frontend gate or website entitlement lookup alone.
5. Forward to Render/private calculators only after authorization. Keep inter-service tokens in server-side environment variables, never browser bundles. Render should independently authenticate trusted calling services where applicable.
6. Do not broaden employee bypass until the existing Timesheet/Weblog/Labeling membership source and SSO flow are verified.
7. Log denied requests without leaking tokens, uploaded engineering files, or personal data.

## Observed platform state (Nov 2026)
- Supabase customer entitlement RPCs exist; reviewed function EXECUTE grants do not include anon.
- Main website has a customer-only entitlement API, but it is not proof of enforcement by standalone tool backends.
- Render workspace contains linkoteq-structural-importer and steel-verification. Both have publicly routable hosts; importer checks a static SAP2000_IMPORTER_API_TOKEN. The upstream user-entitlement check is not yet proven.
- Vercel main-website is linked to GitHub main. Deployment protection on previews does not protect public custom domains.
- Snow proxy route in 3D-Model forwards to a calculator without an observed user-entitlement guard.

## Mandatory acceptance tests before production rollout
- Anonymous and invalid/expired JWT: 401 at every execution endpoint, including direct URLs.
- Customer with no grant, wrong tool, revoked grant, expired grant or missing disclaimer: 403.
- Approved Trial customer: only the approved Trial tool; approved Beta customer: only approved Beta tool.
- Owner and active employee: expected existing access; suspended employee: denied.
- Importer with missing/invalid service token: 401; browser must never receive service token.
- Confirm each deployed service points to the intended Supabase project and environment (without printing secrets).
- Validate production and preview independently, plus regression tests for Timesheet/Weblog/Labeling.

**Status: not certified.** Do not mark access controls complete or enable plans until all tool backends and identity federation pass these tests.
