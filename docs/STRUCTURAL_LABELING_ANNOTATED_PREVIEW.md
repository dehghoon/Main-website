# Structural Labeling Annotated Preview

## Purpose

GPT-7 handoff artifacts keep `annotations.json` as the canonical machine-readable annotation source. The annotated preview is an additional human-QA artifact only.

## Artifact Layout

New handoffs use a readable but still unique export folder:

```text
datasets/manual-labeling-inbox/<drawing-stem>__page-<NNNN>__<candidate-prefix>/
├── original/
├── rendered/
│   └── page-0001.png
├── preview/
│   └── annotated-page-0001.png
├── annotations.json
└── manifest.json
```

Example:

```text
datasets/manual-labeling-inbox/S3.0_ROOF_FRAMING_PLAN__page-0001__5f997e3e/
```

The directory name is presentation metadata only. The full stable `candidate_id` inside the exported artifacts remains authoritative. The short candidate suffix prevents collisions between repeated filenames, pages, or re-uploads.

Legacy UUID-only directories remain supported and are not renamed or deleted.

## Rendering

The preview generator:

- loads the exported GPT-7 raster referenced by `manifest.json`;
- loads the latest approved annotation revision from the Structural Labeling workflow;
- maps source-page coordinates through the validated `source_page_to_raster_affine`;
- supports axis-aligned and oriented bounding boxes;
- uses the existing UI class colors:
  - `column`: `#2563eb`
  - `beam`: `#d97706`
  - `wall`: `#dc2626`
- burns a high-contrast uppercase class badge (`COLUMN`, `BEAM`, or `WALL`) next to each annotation;
- composites the overlay into a PNG with `sharp`.

The preview path is recorded in `manifest.preview_files` with:

```json
{
  "purpose": "human-qa-only",
  "renderer_version": "readable-labels-v2"
}
```

The preview must not be used as the source of truth for downstream training or geometry extraction.

## Authorization

Preview generation requires an authenticated user with the existing `labeling.owner_review` permission. GitHub credentials remain server-only.

## Idempotency and Backward Compatibility

The preview endpoint uses the stored `gpt7_export_path` receipt for each candidate. This lets it support both readable new export paths and legacy UUID-only paths.

A preview is reused only when its manifest entry has `renderer_version: "readable-labels-v2"`. Older previews are regenerated once so the class badges become visible.

## Backfill

The Structural Labeling page includes an owner-only synchronization component. It checks recently exported Owner-approved candidates and creates missing or outdated previews without repeating Owner QA approval or the GPT-7 handoff.
