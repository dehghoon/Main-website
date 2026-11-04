# LinkoTech Main Website

Professional public website and platform shell for LinkoTech.

## Stack

- Next.js 15
- React 19
- TypeScript
- Responsive CSS
- Vercel-ready, host-portable architecture

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production

```bash
npm run build
npm run start
```

## Deployment

Production deployments are triggered by commits to the `main` branch in the connected Vercel project. Verify the Vercel build logs and production status after each push.

## Current sections

- LinkoTech platform vision
- Engineering tools
- Customer Discovery
- Team Timesheet
- Steel Member Verification
- 2D drawing intelligence roadmap
- Contact call-to-action

Deployment trigger check: 2026-10-09 after Git reconnect.

Deployment verification trigger: current `main` includes the corrected structural-labeling API error handling.

## Structural Core compatibility target (Revision 6)

Canonical contract: [Linkoteq Structural Core](https://github.com/dehghoon/linkoteq-structural-core/blob/main/CORE_CONTRACT.md).

- Target Core package: `v0.6.0`; target model schema: `0.6`.
- Legacy model schema `0.5` remains supported at the Core contract boundary.
- This declaration is a migration target, not proof that this repository's runtime dependency, API, importer mapping, or deployment has migrated.
- Existing engineering calculation and application behavior is unchanged by this documentation update.
- The Core `v0.6.0` GitHub Release must be verified separately from the version on `main`.
