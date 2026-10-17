# Structural Labeling Annotated Preview

## Purpose

GPT-7 handoff artifacts keep `annotations.json` as the canonical machine-readable annotation source. The annotated preview is an additional human-QA artifact only.

## Artifact Layout

For an exported candidate:

```text
datasets/manual-labeling-inbox/<candidate-id>/
├── original/
├── rendered/
│   └── page-0001.png
├── preview/
│   └── annotated-page-0001.png
├── annotations.json
└── manifest.json
```

`preview/annotated-page-0001.png` is a flattened image containing the approved annotation overlay. It must not be used as the source of truth for downstream training or geometry extraction.

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
- burns class names and annotation polygons into a PNG using SVG composition with `sharp`.

The preview path is also recorded in the manifest under `preview_files` with `purpose: "human-qa-only"`.

## Authorization

Preview generation requires an authenticated user with the existing `labeling.owner_review` permission. GitHub credentials remain server-only.

## Idempotency

The preview endpoint checks `manifest.preview_files` before creating a new artifact. If the preview for the candidate page already exists, it returns the existing path and does not create another Git commit.

## Backfill

The Structural Labeling page includes an owner-only synchronization component. It checks recently exported Owner-approved candidates and creates missing previews, allowing previously exported handoffs to receive the new preview artifact without repeating Owner approval or GPT-7 export.
