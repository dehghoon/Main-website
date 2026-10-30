# Linkoteq Blog + Windsor.ai publishing workflow (proposed)

## Scope

`POST /api/blog-automation/drafts` saves a **draft only**. It never publishes, and it never calls LinkedIn. It requires `Authorization: Bearer <BLOG_AUTOMATION_SECRET>` and a server-only Supabase service role key. Configure `BLOG_AUTOMATION_AUTHOR_ID` to a real authorized `auth.users.id` before enabling. Never expose these secrets to browsers, GitHub, or generated articles.

## Request

JSON keys: `title`, `body_html`, `slug`, `excerpt`, `seo_title`, `seo_description`, `linkedin_copy`, `tags`, `cover_image_url`, `cover_image_alt`, `cover_image_caption`. The caller must validate and sanitize generated HTML before submission; **this endpoint does not sanitize HTML**. Do not expose it to untrusted writers until HTML sanitization and abuse/rate limits are implemented. A duplicate slug returns the existing record, without modifying it. Concurrent inserts rely on the existing unique slug index.

## Media

Generate an original technically accurate engineering image, optimize blog hero to 1200×630 JPEG/WebP and a LinkedIn visual to 1200×1200 JPEG/PNG. Store the approved hero in public `blog-media` storage using a secure authenticated upload process; supply its public HTTPS URL. Add useful alt text. Verify actual dimensions and media before publication.

## Review and publication

The designated approver logs into `/blog/dashboard` and reviews technical claims, citations, images, title and SEO. Publishing is restricted by the installed Supabase trigger to the designated approver. Do not automate the approver's login or use the service-role key to publish. Check that the public canonical URL `https://www.linkoteq.com/blog/<slug>` loads and that the image is publicly accessible.

## LinkedIn through Windsor.ai

Connected connector: `linkedin_organic`; connected company page account ID `10945024`. After blog publication and explicit social approval, call `mcp__Windsor_ai__execute_action` with action `create_image_post`, `image_url` set to a publicly accessible image URL and `commentary` containing a concise technical summary plus the canonical article URL. This image action has no separate link field; put the URL in commentary. Alternatively `create_post` accepts `link`, `link_title` and commentary, but it is a link card, not a native image post. Do not retry an uncertain write without checking whether the LinkedIn post was created.

## Remaining production work

This proposal is NOT a full automatic scheduler. Needs deployment and env configuration; safe HTML sanitization; image generation/storage integration; a server-side scheduler or orchestration runner; an approval record and LinkedIn publication status/idempotency log; end-to-end auth and permission tests. Windsor.ai cannot be assumed to run from a Next.js server without a separately supported authenticated integration.
