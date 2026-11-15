# Calculation Workbooks

The searchable catalogue is available under Learning & Resources. The initial
entries describe sections observed in privately inspected workbooks. Matching
worked guides and workbook pages link in both directions. The catalogue stores
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
access to the private workbook repository. Set `WORKBOOK_CLIENT_IDS` as
a comma-separated list of the user IDs of authorized client accounts.
The download route verifies the authenticated user and confirmed email
before consulting that list. Add and remove IDs when download access changes.
The client receives the attachment from the site, with private no-store
headers. Private object paths and GitHub credentials belong in server
configuration only.

Before enabling production assets, verify a signed-out request is rejected,
an authenticated account outside the list is denied and an authorized client
receives the intended file. Workbook content and calculations, including VBA
behavior and applicable code editions, need separate engineering validation.
