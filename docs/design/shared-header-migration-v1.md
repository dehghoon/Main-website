# Linkoteq shared header migration v1

Canonical implementation: `public/design-system/linkoteq-header-v1.js` in Main-website.
Canonical tag: `<linkoteq-header></linkoteq-header>`.
This is a framework-neutral Web Component with Shadow DOM to prevent calculator/editor CSS from leaking into global navigation. All navigation links and the official logo are defined once. Do not duplicate markup in consumer repositories.

## Consumer integration
1. Publish and verify the canonical JS URL at `https://linkoteq.com/design-system/linkoteq-header-v1.js` on a staging domain first. Pin to an immutable version for production.
2. Load it with `<script defer src="..."></script>` and render `<linkoteq-header></linkoteq-header>` once at the root.
3. Remove existing global headers and their global-header CSS. Retain only engineering-specific toolbars.
4. Preserve authentication and access checks: the header only links to sign-in and never grants access.
5. Verify mobile widths 360, 390, 768, 1440; keyboard navigation; no duplicate headers; no horizontal scrolling; no editor viewport overlap; engineering calculations and login flows unchanged.

## Migration inventory
- Main-website: `app/components/site-header.tsx` (includes employee session/sign-out behavior; preserve functionality when replacing).
- 3D-Model: `components/PlatformNavigation` and `app/platform-navigation.css`.
- Snow-Calculator: `web/public/linkoteq-shell.js`, `web/public/platform-shell-overrides.css`.
- steel-verification: `web/components/SiteHeader.tsx`, `web/public/platform-shell-overrides.css`.

## Release gate
No consumer migration is complete until its old header is removed, the shared component is visibly loaded from the same versioned source, its build and UI checks pass, and preview screenshots are reviewed. Publish shared asset before consumer changes; never merge incomplete consumer replacements to production.
