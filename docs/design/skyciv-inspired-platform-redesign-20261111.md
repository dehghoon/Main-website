# Linkoteq Platform-Wide Visual Redesign — Implementation Brief
Date: 2026-11-11
Owner: GPT-4 orchestration; implementation: GPT-3 / website maintainers
Reference: https://skyciv.com/ (inspiration only; no copied assets, copy, CSS or proprietary design)

## Verified baseline
- Main-website uses Next.js 15.5.7, React 19, app router.
- Root layout renders `SiteHeader` globally, but homepage also contains legacy `siteHeader` hidden by `app/global-header.css` (`display:none!important`).
- `app/components/site-header.tsx` links all three engineering tools: 3D Model, W-Section and Snow Load. Any two-tool menu is likely from a different application/subdomain or stale deployment, not this header's current source.
- Header CSS uses two stacked bars; at <=560px font sizes shrink to 8px, and <=390px to 7.2px: accessibility and usability concerns.
- Homepage defines product/tool links independently from SiteHeader; duplicate navigation/content sources create drift.
- Main site and tool applications are on distinct subdomains, so a shared navigation requires integration across repositories; a root-layout change alone cannot affect them.
- Core v0.6 contract read; redesign must not modify engineering semantics.

## Target design system
- Independent Linkoteq identity; SkyCiv-inspired clarity, product discoverability, engineering credibility.
- Design tokens: semantic brand, surface, text, border, focus, shadow, radii, spacing and type scale; font licensing and performance review before selection.
- Shared navigation: Home, Software (3D Model, W-Section, Snow Load), Solutions, Resources, Pricing, About, Sign in. Products registry is single source of truth for menu and cards.
- Desktop: prominent but compact sticky header, accessible mega menu; mobile: real menu drawer with readable >=14px labels, keyboard and screen-reader support; avoid tiny compressed horizontal menus.
- Tool application shell: compact brand/navigation bar above workspace, preserve full viewport and keyboard shortcuts; on small screens use collapsed menu.
- Marketing: polished hero, three distinct product cards with accurate Trial/Beta/ready status, workflow illustrations, examples, FAQs, resources, trust/QA evidence, clear registration CTA.
- Product detail pages: scope, code editions, sample outputs, limitations, availability, access request and disclaimer. Never imply certified design or validated capabilities without evidence.
- Blog, knowledge, pricing, customer account and tool pages use consistent tokens, typography and responsive layouts.
- No real staff bios, customer testimonials, code coverage or performance numbers without verification.

## Implementation phases / gates
1. Inventory all pages, shared components, CSS overrides and deployment branches in Main-website, 3D-Model, W-Section and Snow Load. Capture desktop/mobile screenshots and record existing auth flows.
2. Establish centralized products registry and design tokens; implement accessible shared header and mobile navigation in Main-website; remove obsolete duplicate homepage header after verifying no dependencies.
3. Redesign homepage, product cards, tool landing pages, blog/resources and CTA hierarchy; use original engineering imagery and copy.
4. Integrate compact header into each independent tool app without changing analysis, imports, canvas controls, authorization or entitlements. Validate three-tool menu everywhere.
5. Automated build/typecheck, visual regression at 390/768/1440 widths, keyboard/touch menu tests, links, signup, Trial/Beta gating, SEO metadata/sitemap and performance checks.
6. Preview deployment and stakeholder approval; independent security review for any auth changes; staged production rollout and rollback plan.

## Acceptance criteria
- Same three engineering products in every header and product listing, sourced from an authoritative registry.
- No duplicated header on homepage; no absent global navigation in 3D Model.
- W-Section and Snow Load use the same brand shell and current menu, not stale two-product navigation.
- Mobile nav readable, keyboard-accessible, not horizontal microscopic text.
- Fonts, spacing, cards, buttons and color tokens consistent across public site and tool shells.
- No changes to calculation engines, canonical Core mappings or verified access controls.
- CI, deployment and production smoke tests reported separately; do not claim ready from a documentation commit.

## Status
This document starts a scoped design branch. No production code, deployment, or tool subdomain was changed by this brief. Repository-specific implementation and QA remain outstanding.
