# Structural Labeling Portal — Milestone 1

## Architecture

This milestone extends the existing Next.js 15 / React 19 / Supabase Main Website architecture.
It does not create a parallel authentication system and does not expose GitHub credentials to Employees.

The current Linkoteq Structural Core repository was re-read before implementation. Its live Core Contract is v0.5.
The Structural Labeling Portal additionally pins the GPT-7 manual-labeling boundary to:

- Repository: `dehghoon/linkoteq-structural-detection`
- Activation commit: `9c3fb7df68f31c7844e8ca357d70fe636d91683a`
- Contract: `contracts/manual-labeling-intake-v0.1.md`
- Validation rules: `contracts/manual-labeling-intake-validation-rules-v0.1.json`

No parallel annotation schema is introduced.

## Permission model

Dedicated permissions are separated from the existing `employee | client` role:

- `labeling.workspace`
- `labeling.upload`
- `labeling.annotate`
- `labeling.submit`
- `labeling.owner_review`
- `labeling.gpt7_export`

Employee role alone does not grant labeling privileges. Owner/reviewer authority and GPT-7 export remain separately grantable.

## Coordinate boundary

Authoritative annotation coordinates are `source-page` / `pdf-point`, effective-page top-left origin, +x right, +y down.
Raster/display tools must carry finite reversible affine transforms, render version and explicit `transform_validation_state = "validated"`.
The implementation blocks GPT-7 export when the transform is missing or unvalidated and validates raster/source-page inverse round trips.

## RegionKit decision

RegionKit was not integrated in Milestone 1.

Reason: public product documentation indicates image/pixel-oriented annotation behavior, but an authoritative open-source repository/license and a deployment/privacy model suitable for authenticated private drawings were not verified. The required PDF-point reversible transform contract is also not natively established by the reviewed evidence.

The architecture therefore remains dependency-neutral rather than weakening the GPT-7 coordinate/privacy boundary.

## Persistence

An additive Supabase migration introduces candidate, annotation-revision, permission and append-only audit tables with RLS foundations.
The migration is committed but is not considered applied until executed in the approved Supabase environment.

## Explicit non-goals

This milestone does not claim:
- GPT-7 dataset admission;
- duplicate/leakage PASS;
- train/validation/test assignment;
- training readiness;
- YOLO authorization;
- deployment success;
- production verification.

`enablesTraining` remains `false`.
