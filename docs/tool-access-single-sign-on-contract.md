# Linkoteq cross-tool single sign-on contract

## User experience
- One Linkoteq sign-in per browser session. Do not show another sign-in or access interstitial when opening an entitled tool.
- Owner and active employees: all engineering tools, including incomplete tools, with no Trial/Beta gate or subscription requirement. Preserve existing working employee routes during rollout.
- Visitors: may see tool names and descriptions but cannot run protected calculations or operations. Offer sign-in/registration and the appropriate access request.
- Customers: a verified per-tool active Trial (released tools) or Beta (unfinished tools) permits direct launch; otherwise show a request action. Submission alone never grants access.
- Starter, Pro, Company: informational only; enrollment disabled.

## Security / implementation
1. Choose and verify a single identity authority across the main site and each independent tool domain. Inventory current authentication in every application before modifying it.
2. Each tool accepts a short-lived, audience-bound handoff token or an OAuth/OIDC authorization-code flow. Never pass reusable Supabase access tokens in query strings. Validate issuer, audience, signature, expiry, nonce/state and session.
3. Tool backends authorize each protected request using trusted employee membership or per-tool customer grants. Never trust a client-provided role, email suffix, query parameter or display-only catalog.
4. Use a shared tool-key registry and audited grant/revoke/expiry records. Revocation must take effect on protected operations; avoid relying only on stale JWT claims.
5. Keep the tool homepage links direct for existing employees until SSO is integrated and tested end-to-end. Then enable customer routing behind a feature flag, without introducing an extra page for entitled users.
6. Test Owner, employee, visitor, customer without grant, pending request, active grant, expired/revoked grant, and direct URL bypass for each tool. Verify separate browser sessions and logout.
7. Do not deploy access restrictions to independent tool apps before proving employee access still works and customers cannot bypass backend authorization.

## Current status
This is an implementation contract, not a claim of functioning SSO. Independent tool backends, identity federation, grant audit logs, and end-to-end authorization remain to be implemented and verified.
