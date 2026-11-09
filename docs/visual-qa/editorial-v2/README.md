# Editorial SVG engine v2 — visual acceptance

Baseline: `010b40b11590eb3487242d745ad7f83eec6ff7de` (2026-11-09).
Both Main-website marketing contracts were read from GitHub main before implementation and remain unchanged. These fixtures are synthetic editorial examples, not reported news or structural results. No production Supabase request, publish, paid image API or historical asset replacement was performed during development.

## Evidence

- [Six before/after covers](comparison.jpg): old SVG renderer rerun with exactly the same six titles/subtitles, versus the new renderer. Original published media was not modified.
- [All 30 square slides](all-carousels.jpg); [bridge storyboard](carousel-overview.jpg).
- Six full-size `qa-*-after.jpg` covers (1200×630).
- Thirty full-size `qa-*-slide-N.jpg` carousel images (1200×1200).
- Six bespoke `qa-*-collage.jpg` images (1600×1200), for Facebook/LinkedIn.
- Six `qa-*-before.jpg` baseline covers, plus three review sheets: 51 JPEG files total.
- [Manifest](manifest.json) records subjects and shot assignments.

| Topic | Content-specific visual evidence | Composition review |
|---|---|---|
| Bridge inspection | River crossing, piers, railings, drone, crack close-up | Survey, isolated crack, mapping station, engineering review, planning table |
| Timber fabrication | Robot joints, cutting head, slatted timber bench, fasteners | Indoor cell, connection detail, processing station, review, assembly handoff |
| Concrete trials | Ingredient trays, specimens, testing station | Lab, expanded specimen detail, batch context, review table, next trial |
| BIM coordination | Frame, contrasting intersecting duct/pipe services | Cutaway, isolated clash, model station, coordination table, issue handoff |
| Flood paths | Water channel, city blocks, drainage grate | Catchment, inlet close-up, modelling station, assumptions review, intervention planning |
| Drawing extraction | Plan linework, scanner, source sheet | Drafting table, enlarged geometry, extraction station, comparison table, handoff |

Visual review was performed on all six covers and all thirty carousel scenes, including a 300 px-wide per-slide overview. A full-size collage was inspected for aspect ratio and caption handling. Corrections after the first render: bundled sans-serif fonts to prevent serif substitution; separate indoor walls from outdoor vegetation; replace repeated generic chart icons with subject diagrams; isolate detail shots; distinguish processing, review and handoff composition; increase slide detail copy from 30 to 36 px; use three cover arrangements; preserve art aspect ratio in collage rather than stretching square slides. Captions use measured font widths and fail on overflow. Fine engineering detail is illustrative, not a precise technical diagram.

## Validation (local)

| Check | Result |
|---|---|
| `npm run test:editorial` | 8/8 passed, including six subjects / 30 slides and mocked worker integration |
| Blog contract validator | Passed, v1.0.0 |
| AI news contract validator | Passed, v1.0.0 |
| `npm run test:blog-agent` | 4/4 passed |
| `npm run typecheck` | Passed |
| `npm run build` | Passed |
| Actual blog CLI → JPEG | Passed |
| `npm run test:labeling` | 23/26 passed; three existing failures, also reproduced on the baseline commit |

The three baseline failures are `annotated preview uses explicit readable class badges and stored export paths`, `visual QA reuses the existing private-source overlay editor`, and `RegionKit labeling page exposes the existing authenticated upload path for an empty queue`. No labeling implementation or tests were changed. **Merge is withheld because the requested all-tests-success condition is not met.**

## Implementation boundaries

`editorial-vector-scenes.mjs` plans a supported engineering subject from weighted title/body/visual evidence, or an explicit `scene` in the creative brief. Generic AI/software wording is not enough. `editorial-media.mjs` is a pure local renderer; it imports no worker and performs no network requests. Scheduled blog jobs now pass the full article body through a temporary file. Each news slide may explicitly choose `scene` and `shot` (`context`, `detail`, `process`, `review`, `outcome`); by default all five retain the story subject and advance through those five views. Unsupported subjects fail explicitly instead of inventing an unrelated scene. The procedural renderer is bounded to supported subjects, not a general natural-language image model. New specialties require authored scene functions.

All five slides and the collage render before uploads. A job with any non-pending publication history is blocked before writes. Public JPEG responses are decoded and dimension-checked. Existing publisher approval gates, pending-only mutations, schedules and blog manual publication policy remain in place. The offline worker test verifies the exact five Instagram URLs and one collage URL for each other platform, zero writes on published history and zero uploads on rendering failure. Live publishing was intentionally not exercised.

Reproduce with `npm install --no-package-lock --no-audit --no-fund`, `npm run test:editorial`, then `node scripts/preview-editorial-media.mjs`. Fonts and their license are included for reproducible typography. GitHub Actions runs the image acceptance suite and uploads full JPEG evidence.
