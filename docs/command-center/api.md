# Command Center API v1

All routes remain under `/api/admin/access-manager`. `Authorization: Bearer <Supabase access token>` is required. Server verifies current user and confirmed Owner identity. No customer or employee metadata grants access. Responses use private/no-store and Vary Authorization.

GET `/core`: `{snapshot, releases, storageReady, storageMessage}`. Snapshot is commit-scoped source evidence. Unknown production versions remain null. Missing database storage is explicitly reported and produces no synthetic release records.

POST `/core`: `{releaseId: UUID, decision: approve|request_changes|reject|postpone, reason: string(10..2000)}`. Decisions use the caller's authenticated Supabase client and transactional RPC. Approval requires each mandatory check and evidence reference, bound to candidate source SHA. It records an immutable client-facing event snapshot. No release publication or deployment is performed. Invalid input 400; absent/invalid auth 401; forbidden identity 403; blocked review 409; backend unavailable 503.

Trusted evidence ingestion and release creation are deliberately absent from the public API. Only a future authenticated, least-privilege backend may create candidates. No fake candidates are seeded. Event retention, deployment reporting and notifications require a verified integration before production readiness.
