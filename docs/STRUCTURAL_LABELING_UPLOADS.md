# Structural Labeling Upload Flow

## Purpose

The structural-labeling workspace uses a hybrid upload transport so large source drawings do not pass through the Vercel request-body limit.

## Transport Selection

- Files up to and including 4 MiB use the existing application API upload path.
- Files larger than 4 MiB use an authorized signed upload directly from the browser to the private Supabase Storage bucket.
- The application-level maximum remains 50 MiB.
- Supported source types remain PDF, PNG, JPEG, and WebP.

## Standard API Upload

```text
Browser
  -> Main Website API
  -> Private Supabase Storage
  -> Candidate creation
```

This path preserves the existing behavior for small files.

## Large Direct Upload

```text
Browser
  -> Main Website API: authorize + create signed upload token
  -> Private Supabase Storage: upload original bytes
  -> Main Website API: verify + register
  -> Candidate creation
```

The signed upload path is scoped to:

```text
direct/<authenticated-user-id>/<sha256>/<upload-id>/<safe-filename>
```

The browser cannot choose an arbitrary storage path. The completion endpoint verifies the authenticated user prefix, declared SHA-256, byte size, MIME type, and filename before candidate creation.

## Security

- The source bucket remains private.
- The service-role key remains server-only.
- A user must be authenticated and have `labeling.upload`.
- Signed upload tokens are generated server-side.
- The completion step re-downloads the private object server-side and verifies byte size and SHA-256 before creating source/candidate records.
- Failed completion attempts use best-effort cleanup for the uploaded object.
- No engineering calculation, annotation geometry, QA, or GPT-7 handoff logic is changed by the transport selection.

## Provenance

Candidate creation records the upload transport in provenance:

```text
standard-api
direct-signed-storage
```

The original filename, SHA-256, private storage path, and server-derived source geometry remain part of the canonical source workflow.

## Deployment Requirements

The existing variables are used:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

No new secret is required.

## Verification

Production verification should include:

1. Upload a small drawing below 4 MiB and confirm the standard API path succeeds.
2. Upload a drawing above 4 MiB and confirm the UI reports secure direct upload.
3. Confirm both uploads create candidates with validated geometry where applicable.
4. Confirm the original drawing remains private and can be opened only through the authenticated source route.
5. Submit and approve a large-file candidate and confirm the existing GPT-7 handoff still exports the original source, approved annotations, manifest, and rendered PDF page where applicable.
