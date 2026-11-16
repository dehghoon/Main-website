# Calculation Workbooks

The searchable catalogue is available under Learning & Resources. The catalogue
covers the 139 uploaded spreadsheet files, including archived variants and
duplicates. Guides describe visible worksheets and operating notes when
available. Files with unreadable or insufficient worksheet content show an
availability message. Matching worked guides show related workbook summaries
and link to the workbook pages, which link back to the guides. The catalogue stores
titles, descriptions and keywords. It has no original workbook files or
individual source paths.

## Deploy files separately

The catalogue loads without asset configuration. For each workbook approved
for redistribution, add a server-side entry to `WORKBOOK_ASSETS` keyed by the
public catalogue ID. The `workbook` member contains a private repository path
and the exact 40-character commit SHA. The optional `preview` member points to
a PNG under `approved-previews/` in the same private repository. The preview
endpoint is public and sends only the approved image. Review PNGs for private
data and rights before registering them. Images generated from conversion
should be checked visually against the original or exported from desktop Excel
with links and macro execution disabled.

Set `WORKBOOK_GITHUB_TOKEN` as a server-side secret with read-only Contents
access to the private workbook repository. Staff with existing Learning workspace authorization can download
configured workbooks. After approving a customer's workbook-specific trial
request, set `app_metadata.workbook_trial_approved_at` on that account using the
server-side Supabase Auth admin interface. Use a UTC ISO timestamp including
milliseconds. Access starts at that time and expires after three calendar months
in UTC, clamped to the last day of the target month when needed. Remove the field
to revoke access. Pending requests and other tool trials do not grant downloads.
The previous `WORKBOOK_CLIENT_IDS` list is no longer consulted.

The button uses a server entitlement check. The download route revalidates access
and serves the attachment with private no-store headers. Private object paths and
GitHub credentials belong in server configuration only.

Before enabling production assets, verify signed-out, unauthorized and expired
trial accounts are denied, and that staff and approved trial accounts receive the
intended file. Workbook content and calculations, including VBA
behavior and applicable code editions, need separate engineering validation.

Each catalogue card and workbook page uses a static PNG under
`public/learning/workbook-previews/`. Images show reviewed worksheet excerpts,
redacted reconstructions of worksheet grids, illustrated guides based on selected
worksheet labels, or illustrated topic overviews for files without usable worksheet
labels. The latter two are identified in `lib/workbooks/preview-kinds.json`
and labeled on the page. An approved image from the private repository may replace an
illustrated guide or overview. The static image remains available if fetching the
approved image fails. Preview display is independent of workbook download access.

Production includes the catalog and all detail pages in the main sitemap.
Each detail page uses its own canonical URL, title, summary and visible topics.
Preview deployments keep the Learning noindex policy.
