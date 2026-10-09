# Structural Labeling to GPT-7 YOLO Artifact Flow

## Scope

This document extends the existing Structural Labeling GPT-7 handoff with the complete artifact requirements for future YOLO dataset materialization. It does not authorize YOLO training.

The active Structural Core is v0.5. The Structural Labeling handoff remains non-canonical AI/dataset workflow state and must not redefine Core engineering entities.

## End-to-End Boundary

```text
Employee Labeling
-> Submit for Owner QA
-> Owner Approve
-> Website builds manual-labeling-intake-v0.1
-> pending-gpt7
-> GPT-7 independent dataset admission
-> admitted source PDF + deterministic raster + YOLO label bundle
-> GPT-7 split / duplicate / export gates
-> future training-readiness decision
```

Owner approval and the website handoff never imply dataset admission or training readiness.

## Complete YOLO Sample

YOLO label text alone is insufficient. After explicit GPT-7 admission, each sample must preserve and bind together:

```text
<sample_id>/
├── intake.json
├── manifest.json
├── source/original.pdf
├── images/<sample_id>.png
└── labels/<sample_id>.txt
```

The PDF is immutable provenance. The PNG is the exact deterministic raster corresponding to the validated source-page transform. The TXT file is YOLO serialization for that exact PNG.

The downstream implementation is owned by `dehghoon/linkoteq-structural-detection`:

- `contracts/manual-labeling-yolo-artifact-bundle-v0.1.md`
- `scripts/build_manual_labeling_yolo_bundle.py`
- `tests/test_manual_labeling_yolo_bundle.py`

## Privacy and GitHub

Website-uploaded structural drawings remain private operational artifacts.

`dehghoon/linkoteq-structural-detection` is currently a public repository, so private website source PDFs, derived rasters, and label bundles must not be written there.

A runtime bundle may be archived to GitHub only after the target repository has been verified as private. Until a dedicated private structural-dataset repository is available, the website handoff remains in the protected Supabase queue and private storage remains the source-artifact boundary.

GitHub should version contracts, manifests, dataset metadata, pipeline code, and release provenance. It must not expose private drawings, signed URLs, credentials, tokens, or cookies.

## Required Provenance

The materialized bundle must preserve:

- candidate, source, page, and project-group IDs;
- source SHA-256;
- deterministic raster SHA-256 and exact pixel dimensions;
- YOLO label SHA-256;
- class mapping `0=column`, `1=beam`, `2=wall`;
- validated transform/rendering version;
- Owner QA state;
- GPT-7 admission state;
- GPT-7 dataset split;
- annotation/adjudication provenance.

## Training Boundary

The current boundary remains:

```text
training_ready = false
training_enabled = false
enablesTraining = false
```

Materializing a complete source/image/label bundle is dataset staging. It is not a training command, model promotion, or Milestone activation.
