# Structural Labeling GPT-7 Handoff

## Purpose

This document defines the automatic handoff from Owner-approved Structural Labeling revisions to the pinned GPT-7 manual-labeling intake boundary.

The active downstream contract is:

- Repository: `dehghoon/linkoteq-structural-detection`
- Activation commit: `9c3fb7df68f31c7844e8ca357d70fe636d91683a`
- Contract: `contracts/manual-labeling-intake-v0.1.md`
- Validation rules: `contracts/manual-labeling-intake-validation-rules-v0.1.json`

This handoff does not perform dataset admission, split assignment, YOLO export, training preparation, or training execution.

## Workflow

```text
Employee labeling
-> Submit for Owner QA
-> Owner visual QA
-> Owner Approve
-> Website creates GPT-7 handoff row
-> Website builds manual-labeling-intake-v0.1 package
-> Website validates the package against the pinned rules
-> Website finalizes the handoff as pending-gpt7
-> GPT-7 may read the pending intake queue
-> GPT-7 independently decides dataset admission
```

Owner approval remains a governance checkpoint. It does not imply GPT-7 dataset admission or training readiness.

## Handoff State

The migration `20261009000100_structural_labeling_gpt7_handoff_queue.sql` adds `structural_labeling_gpt7_handoffs`.

Each candidate has at most one handoff row.

Supported states:

- `build-required`: Owner approval is complete, but the validated intake package has not been finalized.
- `pending-gpt7`: the pinned intake package is validated and available to the GPT-7 boundary.

A finalized handoff must preserve:

```json
{
  "schema_version": "manual-labeling-intake-v0.1",
  "workflow_state": "owner-approved",
  "owner_disposition": "owner-approved",
  "dataset_admission": "pending-gpt7",
  "training_ready": false,
  "dataset_split_assigned": false,
  "boundary": {
    "enablesTraining": false,
    "emitsCanonicalEngineeringGeometry": false
  }
}
```

## Automatic Owner Approval Handoff

`POST /api/structural-labeling/action` keeps the existing Owner `approve` transition.

After the database transition succeeds, the API immediately:

1. obtains the protected candidate, source, latest revision, transform, and audit context;
2. reuses `buildGpt7IntakePackage`;
3. reuses `validateGpt7IntakePackage`;
4. finalizes the queue row through `labeling_finalize_gpt7_handoff`.

A successful response includes:

```json
{
  "state": "owner-approved",
  "handoff": {
    "id": "<uuid>",
    "state": "pending-gpt7",
    "contractVersion": "manual-labeling-intake-v0.1",
    "datasetAdmission": "pending-gpt7",
    "trainingReady": false,
    "datasetSplitAssigned": false
  }
}
```

If package construction or validation fails after Owner approval, the candidate remains `owner-approved`, the queue remains `build-required`, and the API returns HTTP `202` with the handoff error. This avoids rolling back an already completed QA decision while preserving an explicit retry state.

The same action endpoint supports the protected operational retry action:

```json
{
  "candidateId": "<uuid>",
  "action": "retry-gpt7-handoff"
}
```

The retry still requires the existing Owner review authorization inside the database RPCs.

## GPT-7 Intake Queue API

Authenticated users with the existing `labeling.gpt7_export` Owner permission can read finalized pending handoffs:

```http
GET /api/structural-labeling/gpt7-handoffs?limit=50
```

The database RPC `labeling_list_gpt7_handoffs` enforces the permission server-side.

The queue endpoint is a handoff/read boundary only. It does not mark records as admitted, training-ready, split-assigned, exported to YOLO, or consumed.

## Security

- No anonymous access is granted to the handoff table.
- Direct authenticated table access is revoked.
- Owner approval uses `labeling.owner_review`.
- Queue reads use `labeling.gpt7_export`.
- Source and revision data are read through security-definer RPCs after permission checks.
- No service-role key is exposed to the browser.
- No private drawing is published to an external hosted labeling scene.

## Deployment

Apply the migration before deploying code that invokes the new RPCs:

```text
supabase/migrations/20261009000100_structural_labeling_gpt7_handoff_queue.sql
```

Then run:

```bash
npm run test:labeling
npm run typecheck
npm run build
```

Production verification must include:

```text
Owner Approve
-> response handoff.state = pending-gpt7
-> handoff row exists
-> intake_package validates
-> dataset_admission = pending-gpt7
-> training_ready = false
-> dataset_split_assigned = false
-> boundary.enablesTraining = false
-> authorized GPT-7 queue read returns the package
-> unauthorized queue read is denied
```

## Current Boundary

```text
Historical --apply = NOT RUN
Milestone 3 = NOT STARTED
YOLO export = NOT RUN
YOLO training = NOT RUN
enablesTraining = false
```
