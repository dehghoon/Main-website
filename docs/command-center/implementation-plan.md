# Linkoteq Command Center implementation plan

Canonical application: Main-website, Next.js 15 App Router, React 19, Supabase Auth/Postgres. Entry remains `/admin/access-manager`. Existing customer discovery, employee permissions, Timesheet, Labeling, tool trials and rewards stay in place. No second application or public management API is introduced.

## Inspection and reuse

The 2026-11-25 repository inventory returned no Command Center repository. Main-website main contained no Command Center contract; its remote branch inventory contained no Command Center/workflow branch. Existing Access Manager API verifies JWT through Supabase and a confirmed Owner email. Reuse this policy without granting new administrators. Additional roles require explicit authorization and consistent API, RPC and RLS changes. Existing permission grants alone must not silently grant administration.

Shared navigation is the `linkoteq-header` web component plus HeaderAuthBridge/header-account. The older React SiteHeader is also retained. Both now use a server `/me` authorization result to display the canonical link. Link visibility is presentation only: every Core API operation independently verifies the JWT and Owner. Cross-origin tool header expansion is deferred; no administrative session data is broadcast to tool origins.

A dedicated `dehghoon/Linkoteq-Command-Center` governance repository is required if creation access becomes available. Connected GitHub tools do not expose repository creation, gh has no authenticated session, and the browser fallback reached a GitHub sign-in wall with no signed-in account. Do not create a replacement dashboard. Move or reference the contracts/docs/workflow definitions from that governance repository while keeping the application solely in Main-website. Do not duplicate application source.

## Core source of truth

Authoritative repository: `dehghoon/linkoteq-structural-core`. Read CORE_CONTRACT, plugin migration contract, v0.5→v0.6 guide, compatibility manifest and the orchestration migration matrix. The inspected package is 0.6.0; latest GitHub release observed is v0.6.0. Source/manifest declarations do not establish current deployed versions or engineering correctness.

`lib/command-center/repository-snapshot.json` records inspected tool SHAs and boundary evidence. Core's existing matrix records historical approved production migration for 3D, importer, Snow and W-Section; it leaves independent analytical fidelity/physical-device reviews open. This change does not re-certify those tools. Wind uses Core climate catalogs. No canonical runtime boundary was established for Seismic or Wood in the inspected sources. Private Concrete Beam clone/read was unavailable. Audit gateway, drawing reconstruction, detection, analysis adapters and any future consumers before declaring the inventory exhaustive.

## Implemented initial slice

- Canonical Command Center title and sections, preserving Access Manager controls.
- Authorized desktop/mobile links using the existing header design.
- Structural Core source/production/latest status, commit-scoped compatibility matrix, component dependency cards, release evidence and review interface.
- Owner inbox routes to existing access approval controls and Core candidates.
- Core GET/POST APIs with independent server authentication, no-store responses and generic backend errors.
- Staged release/event tables, RLS, audited atomic review RPC and mandatory exact-SHA evidence gates. No client writes to evidence or audit rows.
- Versioned integration contract, workflow and evidence schema.
- Proposed GitHub monitor detects releases, tags, main changes and relevant public-interface PRs. Deduplicated GitHub review tasks are the initial task transport; it never publishes or deploys. Historical candidates create initial baseline tasks on first activation.

## Remaining stages and acceptance gates

1. Create governance repository when supported permissions are available; retain canonical application placement.
2. Apply staged SQL to an isolated Supabase preview database. Verify real JWT/RLS authorization, reject non-Owner, missing evidence, duplicate and concurrent review, and evidence replacement. Database emulator checks do not replace hosted Supabase validation.
3. Implement trusted ingestion of GitHub check runs/reference-case artifacts, exact source SHAs, dependency inventory, signed event deduplication and deployed revision evidence. No service-role secrets in clients or source. Current Core snapshot is manual and dated, not a live status feed.
4. Connect GitHub review tasks to durable Command Center tasks and expose event history. The initial interface shows release records; review event history is shown; deployment/incident history needs ingestion and UI.
5. Issue per-tool agent handoffs only after verified impact. Include target version, tool, migration, repository/branch, acceptance criteria, engineering references/tolerances, tests and deliverables. Use GitHub/verified APIs; plugin names are not assumed callable services.
6. Owner approval must bind the exact source SHA, evidence and rollout plan. Recheck all mandatory CI/security and per-tool evidence immediately before release. Any SHA/evidence change requires a new candidate/review. No capability removal.
7. Implement an explicitly approved rollout executor with least privilege, controlled tool order, runtime monitoring, smoke/reference regressions and tested rollback to prior artifacts. Keep disabled until approved and verified.
8. Continue development, AI agents, content, social, Muse/Flow, educational video and monitoring workflows via existing integrations and approval policies. Operations cards describe integration state; they do not claim those automations are connected. Existing marketing contracts remain authoritative; content production has no hard dependency on the latest Core.

## Preview/deployment

Use the existing Git-linked Vercel Main-website project with `target=preview` only. Never promote, alias production, merge, apply production SQL or publish Core without explicit Owner approval. Preview must not apply database migrations automatically. Owner should review canonical route, mobile navigation, access controls and real preview database behavior before release.

Rollback this application slice by reverting its PR and restoring the prior website deployment. Database migration is additive; preserve release and event records, disable the new RPC rather than deleting audit history. Core rollback is separately governed by the integration contract and requires per-tool artifact and database compatibility evidence.
