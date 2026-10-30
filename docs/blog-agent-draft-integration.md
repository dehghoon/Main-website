# Blog agent draft integration (candidate)

This endpoint is **draft-only** and must not be deployed until reviewed and tested. It does not publish posts, upload image bytes, or grant ChatGPT direct access.

## Required server-side settings
- `BLOG_AGENT_TOKEN_SHA256`: SHA-256 hex digest of a high-entropy machine token. Never place raw token in GitHub or chat.
- `BLOG_AGENT_AUTHOR_ID`: dedicated authorized Supabase user UUID, provisioned by an administrator.
- `SUPABASE_SERVICE_ROLE_KEY`: server-side secret only; never use in client code.
- `NEXT_PUBLIC_SUPABASE_URL`: existing project URL.
- `BLOG_AGENT_IMAGE_HOSTS`: comma-separated approved public HTTPS image hosts (e.g. the existing Supabase Storage host).

## Request
POST `/api/blog-agent/drafts` with `Authorization: Bearer <machine-token>` and JSON containing `external_id` (stable idempotency key), `title`, `body_html`, and optional `excerpt`, `seo_title`, `seo_description`, `social_media_copy`, `tags`, `cover_image_url`, `image_alt`, `image_title`, `image_caption`, `image_meta`.

Returns draft id/status/slug. Repeating `external_id` returns the existing record. Publishing remains a manual action in Employee Workspace.

## Security/release gates
- Confirm database RLS, service-role policy, unique slug constraint, and author identity.
- Add rate limiting, audit logs, strong HTML sanitization on ingestion and render, and tests before merging. The simple unsafe-HTML check is **not** a complete sanitizer.
- Test invalid/expired tokens, cross-tenant access, replay/concurrent submissions, slug collisions, large payloads, unauthorized image URLs, and publication permission boundaries.
- Public image URLs are references only. **No image upload exists yet.** Build a separate signed-upload flow with MIME/type/size verification, image optimization, and malware screening before claiming automated Media Studio upload.
- No API credentials are stored in the repo. Keep the branch unmerged until security review and end-to-end staging verification.

## Candidate image upload endpoint

POST `/api/blog-agent/images` with the same bearer token and raw JPEG, PNG or WebP bytes (maximum 3 MiB). The endpoint checks declared MIME and magic bytes and uploads under a random path in the existing `blog-media` bucket. The response contains a public `image_url` suitable for the draft endpoint. The caller must resize/compress the image to the intended social/blog dimensions, typically 1200×630, before uploading. The API does not yet resize or decode images. Do not enable production use until image decoding, dimensions, rate limits, abuse scanning, authorization scope, and integration tests are complete. Storage bucket and public-read configuration must be verified in staging. No upload or draft has been attempted against production.
