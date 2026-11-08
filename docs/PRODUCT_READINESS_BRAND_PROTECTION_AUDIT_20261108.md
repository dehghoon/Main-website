# Linkoteq Product Readiness and Brand Protection — Initial Audit
Date: 2026-11-08
Scope: source-code inspection only; no live authenticated journey or mobile browser verification has been completed.
Repository: dehghoon/Main-website
Core contract: dehghoon/linkoteq-structural-core, CORE_CONTRACT.md schema v0.6.

## Evidence-backed findings

| Severity | Location | Evidence | Risk | Recommended owner |
|---|---|---|---|---|
| Critical | app/customer-login/page.tsx | submit() prevents default and displays a message; the UI offers Sign Up, Log In and Create Client Account but does not create or authenticate an account. | A visitor may reasonably believe registration is possible and lose trust. | GPT-3 implementation, GPT-4 review, GPT-5 security |
| High | app/pricing/page.tsx | Published plan grid lists import quotas, IFC/DXF and calculation exports, while text says subscription enforcement, roles, quotas and billing are not connected. | Commercial capability and availability expectations are misleading. | GPT-4 commercial copy review, GPT-3 UI |
| High | app/page.tsx | 3D Model link is presented as Open 3D Model; hero says Create A 3D Structural Model, while the 3D-Model project-status.json explicitly lists runtime verification NOT_RUN, production verification REBUILD_PENDING and production smoke-test blockers. | Unverified engineering workflow appears generally available. | GPT-3 product owner, GPT-4 gate |
| Medium | app/page.tsx | Tool cards describe W-Section and Snow Load outputs without linked current runtime verification evidence in this audit. | Potential overclaim; status remains unknown pending tests. | GPT-4/GPT-3 |

No assertion is made here that any live endpoint is broken; these are source-code and project-status observations.

## Recommended strategy (pending approval and live testing)
1. Keep public homepage, blog, educational content, metadata and search indexing accessible.
2. Keep interest capture distinct from account creation: do not present a nonfunctional signup form as a real account registration. Prefer a truthful Early Access interest path with explicit consent and a verified working submission backend.
3. Gate unverified engineering tools for ordinary users, with transparent Beta / In Development labels based on functional evidence; avoid treating a successful build as product readiness.
4. Preserve existing authenticated user entitlements and production behavior until reviewed and approved.
5. Preserve published blog URLs, canonical tags, structured data and internal links; avoid empty Coming Soon pages.
6. Coordinate GPT-8 SEO and qualified lead acquisition with GPT-3 functionality and GPT-5 privacy/security review.

## Acceptance criteria
- Visitor can distinguish account creation from waitlist interest without ambiguity.
- Signup/login either complete a tested end-to-end flow or are clearly disabled with a working alternative.
- Every advertised engineering capability is backed by a tested environment, build/version and functional scenario.
- Desktop and mobile checks cover home -> blog -> tool -> signup -> dashboard -> support; use test accounts, not real customer credentials.
- Early Access submission records consent, timestamp and purpose, has spam protection and a privacy notice; do not collect engineering models unnecessarily.
- Analytics measures visits, qualified leads and verified form submissions separately; no invented conversion counts.
- No changes to auth, billing, pricing, entitlements or production without explicit approval.

## 30-day execution plan
Days 1-7: live browser walkthrough, evidence capture, claim inventory, product capability matrix, security/privacy handoff, SEO baseline and broken-link review.
Days 8-14: reviewable UX/copy prototype and functional Early Access proposal, regression tests and accessibility/mobile checks.
Days 15-21: approved implementation in isolated branch; integrate form backend only after security approval; instrument GA4 consent-respecting events.
Days 22-30: controlled beta usability tests, SEO/content iteration with GPT-8, measure verified interest and feedback, prepare production go/no-go with rollback.

## Required handoffs
GPT-3: verify 3D Model, W-Section, Snow Load runtime and mobile journeys; supply commits, deployments and representative scenarios.
GPT-5: assess authentication, lead capture, privacy/retention, anti-abuse and authorization boundaries.
GPT-8: map search intent to honest capability claims and early-access CTA, maintain editorial SEO.
GPT-4: reconcile evidence, coordinate gates and produce owner decision memo.

## Verification and change log
- Source files inspected: app/page.tsx, app/customer-login/page.tsx, app/pricing/page.tsx; 3D-Model/project-status.json; Core contract v0.6.
- Live Playwright / mobile / authenticated / GA4 / GSC tests: NOT RUN.
- Production changes: NONE.
- This file is a planning/audit artifact only, not a deployed UX fix.
