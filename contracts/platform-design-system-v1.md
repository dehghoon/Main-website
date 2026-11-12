# LINKOTEQ PLATFORM DESIGN SYSTEM CONTRACT
Version: 1.0.0 (2026-11-11)
Status: Mandatory integration specification; implementation adoption is tracked separately.
Owner: Main-website / platform UI. Applies to all current and future Linkoteq tools, including 3D Model, W-Section, Snow Load and Concrete Beam.

## Non-negotiable contract
1. The Main-website repository is the canonical source for global navigation, product registry, brand logo, responsive design tokens and public site shell. Do not invent a new logo, hardcode a stale two-tool menu or fork header markup/CSS in new tools.
2. Canonical stylesheet: `https://linkoteq.com/design-system/linkoteq-shell-v1.css` (source `Main-website/public/design-system/linkoteq-shell-v1.css`). A consumer MUST load the released, reachable version; preview-only branches do not establish production availability. Pin a version, retain a tested fallback, and coordinate releases.
3. Canonical logo: `https://linkoteq.com/linko-logo-final.svg`. Use the actual asset; do not replace it with a text approximation. Verify asset exists and displays correctly on mobile and desktop.
4. Every header MUST expose Home, all published engineering products, Resources/Blog, Pricing and account entry; product status must be accurate. Product navigation should be generated from the canonical registry `Main-website/lib/engineering-tools.ts` or a published equivalent, not manually maintained copies.
5. A *single reusable header implementation* is the end-state: extract and publish a framework-compatible shared UI package or a framework-neutral web component, then consume it in Main-website, 3D Model, Snow Load, W-Section and new tools. Copying the CSS or manually matching JSX/HTML is **not** compliance with this requirement. Until the shared package exists, adapters are temporary and must be flagged as migration debt.
6. Mobile width <=900px MUST use a keyboard-accessible, readable toggle menu, no clipped horizontal nav, and no 7–10px text. Test widths 360, 390, 768, 1024 and 1440px, with focus and touch interactions.
7. Tool-specific editors, model canvases, calculation controls and report layouts may have their own scoped styles; global shell CSS MUST NOT mutate engineering data, calculations, access rules or toolbar behaviors. Avoid global wildcard selectors and unsafe fixed viewport height assumptions.
8. Authentication/Trial/Beta entitlements remain enforced by each approved app backend, not the visual shell. Do not claim that linking to a tool grants access.
9. New tools MUST add a Design System Compliance section to their README, identifying canonical package/version, shell component, product-registry source, logo source, responsive QA evidence, and production deployment evidence.
10. Changes to shared shell require compatibility review for React 18/19, Next 14/15 and Vite, build/typecheck, cross-app visual tests, accessibility checks and a staged deployment. Publish the canonical stylesheet/asset before deploying dependent tools. No automatic merge or deploy without passing gates.

## Implementation tracking — evidence vs intent
- Main-website PR #27: shared stylesheet source and responsive fixes; draft, not production-certified.
- 3D-Model PR #12: references shared stylesheet and logo; retains a temporary local PlatformNavigation React component, **not yet a single shared component**.
- Snow-Calculator branch `design/shared-platform-shell-20261111`: now references shared stylesheet and has three-product mobile navigation; retains temporary local JS shell.
- W-Section: application repository has not yet been positively identified and integrated; treat as NOT DONE.
- Shared versioned UI package/web component and automated conformance tests: NOT DONE.
- Production readiness: requires verified reachable shared asset, CI/build success, mobile/desktop smoke tests and staged deployments.

## Required acceptance checks for each tool
- Official logo identical to site, same source and sizing behavior.
- Three published tools and statuses in desktop and mobile navigation.
- No duplicate headers, missing nav, clipped content or horizontal overflow.
- No regression in canvas, inputs, save, model import, calculations or entitlement gating.
- Tested preview link, commit SHA, CI status and production deployment recorded separately.

## New-tool README snippet
```md
## Linkoteq Design System Compliance
This tool MUST comply with [Platform Design System Contract](https://github.com/dehghoon/Main-website/blob/main/contracts/platform-design-system-v1.md).
Shared shell version: [version / pending].
Shared header package/component: [name / pending].
Product registry: Main-website/lib/engineering-tools.ts (or released equivalent).
Logo: https://linkoteq.com/linko-logo-final.svg
Mobile QA (360/390/768px): [evidence].
Build and production deployment: [links / pending].
No independent global header or logo is permitted.
```
