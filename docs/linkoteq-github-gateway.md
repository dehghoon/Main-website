# Shared Linkoteq GitHub Actions Gateway

Read-only GitHub Actions runs endpoint for approved Linkoteq integrations.

## Endpoint

`GET /api/linkoteq/github/actions/runs?repo=dehghoon/Main-website&per_page=20&page=1`

Optional query: `branch=main`.

Required header: `Authorization: Bearer <LINKOTEQ_GATEWAY_API_KEY>`.

## Vercel environment variables (server-side only)

- `LINKOTEQ_GATEWAY_API_KEY`: a randomly generated, high-entropy secret for callers. Do not commit or paste it into plugin instructions.
- `LINKOTEQ_GITHUB_TOKEN`: GitHub App installation token or fine-grained PAT scoped to the allowed repositories with **Actions: Read** permission.
- `LINKOTEQ_GITHUB_ALLOWED_REPOS`: comma-separated exact repository names, e.g. `dehghoon/Main-website,dehghoon/linkoteq-structural-detection`.

Set these in the Vercel project's Environment Variables before deployment. Do not prefix them with `NEXT_PUBLIC_`.

## Safety

- Fail-closed if secrets or allowlist are missing.
- Read-only GET; no workflow dispatch, commits, merge, or file deletion.
- Strict repository allowlist and bounded pagination.
- GitHub token is only used server-side and never returned.
- Treat the gateway key as a service secret: a plugin must support securely stored authentication to use it. Do not paste secrets into GPT instructions.
- For multi-plugin attribution and different privileges, add an identity-aware authentication layer rather than sharing one static key among all plugins.
- Apply rate limiting and audit logging before exposing the endpoint broadly.

## Integration status

This commit adds the server route only. It does not provision Vercel secrets, deploy to production, register a ChatGPT tool/plugin, or connect migrated GPTs automatically. Those require separate configuration and validation.

## Workflow dispatch (opt-in)

`POST /api/linkoteq/github/actions/dispatch` with the same Bearer authentication.

JSON body: `{"repo":"dehghoon/Main-website","workflow":"example.yml","ref":"main"}`.

Required additional environment variable:
- `LINKOTEQ_GITHUB_DISPATCH_ALLOWLIST`: comma-separated exact `owner/repo:workflow.yml:branch` tuples. **Empty/missing denies all dispatches.** Do not use wildcards. Example (only after review): `dehghoon/Main-website:example.yml:main`.

GitHub token must have **Actions: Read and write** permission for dispatch. A workflow must declare `workflow_dispatch` and be available on the default branch to be manually dispatched.

The endpoint accepts no arbitrary workflow inputs. Add reviewed per-workflow input schemas before enabling inputs. Dispatch returns acceptance, not completion; poll the read-only runs endpoint for results.

**Important:** Workflow code can have broad repository and cloud permissions; review each workflow and its secrets before allowlisting. Require human approval for workflows that deploy to production, mutate data, or access privileged secrets. Add rate limiting, audit logging and per-plugin identities before broad multi-plugin production use. Do not deploy/enable merely because this code exists.
