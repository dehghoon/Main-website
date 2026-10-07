# Structural Labeling Visual QA Workflow

## Scope

This document defines the Milestone 2 operational workflow for RegionKit-assisted external manual labeling and LinkoTech visual QA.

RegionKit remains an external drawing tool. There is no RegionKit API integration, no embedded RegionKit editor, and no server-to-RegionKit publish path.

The workflow does not enable model training. `enablesTraining=false`. Historical import apply and YOLO training remain outside this scope.

## Operator Flow

1. Open `/structural-labeling/regionkit`.
2. Select a Structural Labeling candidate.
3. Download the authenticated private source drawing.
4. Open the local source file in RegionKit.
5. Draw rectangles and use only these labels:
   - `column`
   - `beam`
   - `wall`
6. Export RegionKit Native JSON.
7. Import the JSON back into the LinkoTech RegionKit handoff page.
8. The existing adapter validates shapes, classes, page identity, and the validated raster-to-source-page transform.
9. Save the resulting website annotation revision.
10. Continue to `/structural-labeling` for LinkoTech visual QA.

## Visual QA

`AnnotationEditor.tsx` remains the single visual overlay implementation. The workflow deliberately reuses it instead of creating a second viewer.

The editor:

- fetches the authenticated private source through the existing Structural Labeling source endpoint;
- renders PDF or supported image sources;
- requires a validated reversible transform before labeling or GPT-7 handoff;
- renders authoritative annotation boxes in source-page PDF points;
- maps source-page coordinates to the display raster deterministically;
- supports zoom, pan, selection, and editable bounding boxes when the current workflow state permits editing;
- becomes read-only when the current role or workflow state does not permit annotation changes.

Visual QA is performed against the same private source associated with the candidate. A valid JSON structure alone is not sufficient for owner approval.

## Owner QA

Employees submit completed revisions using the existing `Submit for Owner QA` transition.

Owners review the source overlay and revision history before choosing one of the existing dispositions:

- Approve
- Reject
- Revision Required

Reject and Revision Required require a reason.

Owner approval is a governance checkpoint only. It does not imply dataset admission, training readiness, or training execution.

## Authority and Coordinates

Authoritative annotation coordinates are source-page PDF points.

A raster-only or unvalidated coordinate transform blocks the workflow from being treated as exportable. The website remains the validation and governance boundary even when RegionKit was used to draw the initial rectangles.

## Authentication and Authorization

This change introduces no new identity system and no RegionKit authorization model.

The existing LinkoTech/Supabase authentication, permissions, RLS, RPC controls, source access rules, revision controls, owner-review rules, and GPT-7 export authorization remain authoritative.

The production database and REST authorization boundaries were verified separately before this UI workflow was added.

## Routes

- RegionKit-assisted manual labeling: `/structural-labeling/regionkit`
- LinkoTech visual QA and Owner QA: `/structural-labeling`

## Validation

Run the existing Structural Labeling quality gate:

```bash
npm run test:labeling
npm run typecheck
npm run build
```

The Structural Labeling CI workflow runs these checks for relevant changes on `main`.

## Current Boundaries

- `Historical --apply = NOT RUN`
- `Milestone 3 = NOT STARTED`
- `enablesTraining=false`
- `YOLO training = NOT RUN`

No engineering calculation logic is introduced or modified by this workflow.
