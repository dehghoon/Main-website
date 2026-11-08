# Customer Discovery reward — secure integration contract

Status: integration preparation, NOT production enabled. Applies to Main-website PR #16.

## Reward lifecycle
- `pending`: user claims they completed Customer Discovery; no access.
- `verified`: a trusted administrator has matched an actual complete survey submission to the authenticated user's identity. The reward is RESERVED, not active.
- `granted`: only after official Pro tool launch has been approved and recorded; `granted_at` is assigned by the database trigger and `expires_at = granted_at + interval '2 months'`.
- `rejected`: unverified/invalid claim; no access.
- Launch control defaults to NULL; no reward can be granted before it is explicitly set.
- No client can update the reward status, launch control or entitlement dates.

## Survey matching — current gap
Source survey app: `dehghoon/customer-discovery-platform`, `frontend/app/api/survey/route.ts`. It posts anonymous responses to `survey_responses`, with `contactEmail` optional in the survey UI. Therefore **email alone is not sufficient** for automatic award, and the survey is not currently linked to the Linkoteq Auth user ID.

Required before automated verification:
1. Add a consented, one-time, expiring signed claim identifier to the survey entry flow, bound server-side to the authenticated Linkoteq user; never trust a client-submitted `user_id`.
2. On successful survey persistence, store a server-generated response identifier and verify completeness and duplicate prevention.
3. Securely communicate verified completion to the Linkoteq reward service using a server-to-server authenticated channel. No browser-side service-role key.
4. Use a restricted trusted administrative process to move `pending` to `verified`. Never grant Pro from a thank-you page redirect, client email, or user-submitted claim alone.
5. Validate that the survey is the intended Linkoteq Customer Discovery program before sending users to it; existing survey copy currently targets AI drawing reconstruction.

## Trusted approval and release process
A trusted operator reviews the actual survey response and claim, then sets `status='verified'` via restricted database administration. No `granted_at` or `expires_at` may be supplied by the operator. When Pro features are complete and approved for production, a trusted operator sets `pro_reward_launch_control.launched_at` to the official launch timestamp. Only then may verified rewards be activated. The DB trigger refuses premature activation and calculates the two-month window. Activation is NOT scheduled or automatic yet.

## Entitlement consumption
`GET /api/entitlements/pro` with `Authorization: Bearer <Supabase user access token>` returns `{active:boolean,source:'customer_discovery_reward'}`. It verifies identity with Supabase Auth, then calls `has_active_discovery_pro_reward()` as the user under RLS. 401 for missing/invalid token, 503 for backend errors. It does not reveal other users' status. This endpoint only covers the **discovery reward**, not a general paid subscription or employee access. Do not replace the existing subscription authorization with it.

Each Pro tool must validate entitlements **server-side** for its own actions, and combine this reward with its existing paid subscription and employee authorization checks. A hidden button is not authorization. Do not rely on browser-controlled state.

## Validation checklist before merge
- Unauthenticated request returns 401; expired token returns 401.
- Authenticated non-recipient returns active:false.
- Pending/verified/rejected return false; only granted within window returns true.
- Trigger refuses granted status when launch is NULL.
- Two-month duration is calculated from actual activation, not survey completion.
- No anonymous or authenticated user can set `status`, `launched_at`, `granted_at` or `expires_at`.
- Test actual survey submission + matching + verification; run build, browser and mobile tests.
- Security review by GPT-5, integration review by GPT-3, commercial launch sign-off by owner.

No Pro launch has been approved. No existing subscriptions, billing or production access changed.
