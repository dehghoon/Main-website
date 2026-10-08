# Employee Access Owner Approval

## Purpose

Employee signup must never grant operational permissions automatically.

The access workflow is:

```text
Employee signup
-> pending access request
-> owner email notification
-> authenticated owner review
-> explicit permission selection
-> server-side grant
-> audit record
```

The configured owner is `dehghani.pmp@gmail.com`.

## Permission Catalog

The initial catalog contains:

- Structural Labeling
  - `labeling.workspace`
  - `labeling.upload`
  - `labeling.annotate`
  - `labeling.submit`
- Blog
  - `blog.create`
  - `blog.edit`
  - `blog.publish`
- Timesheet
  - `timesheet.view_own`
  - `timesheet.submit_own`
  - `timesheet.review_team`

Adding a catalog entry does not by itself authorize a feature. Each application area must enforce the corresponding permission server-side before protected actions are enabled.

Structural Labeling is integrated with the existing `structural_labeling_permissions` table. Blog and Timesheet permissions are stored in the shared platform permission table and are ready for their feature-specific server authorization integration.

## Owner Review

Owner review UI:

```text
/owner/access-requests
```

The page requires an authenticated Supabase session. The database RPC independently verifies that the authenticated email is the configured owner before it lists or changes access requests.

Approval with one or more selected permissions establishes the trusted `employee` app role and grants only the selected permissions.

Rejecting a request grants no permissions.

## Email Notification

Pending requests are created by an `auth.users` trigger when signup metadata requests the `employee` role.

A portable notification endpoint processes pending unsent requests:

```text
GET /api/access-requests/notifications
Authorization: Bearer <CRON_SECRET>
```

Vercel scheduling is isolated in `vercel.json`. Another scheduler can call the same endpoint after migration to another host.

Email delivery uses the Resend HTTPS API without a framework-specific email dependency.

Required server environment variables:

```text
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
ACCESS_REQUEST_FROM_EMAIL=
ACCESS_REQUEST_OWNER_EMAIL=dehghani.pmp@gmail.com
APP_BASE_URL=https://linkoteq.com
CRON_SECRET=
```

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, or `CRON_SECRET` to browser code.

## Database Migration

Apply:

```text
supabase/migrations/20261008000100_employee_access_owner_approval.sql
```

The migration is additive and includes:

- permission catalog
- pending employee access requests
- shared platform employee permissions
- permission audit events
- employee signup request trigger
- owner-only review/list/manage RPCs
- current-user permission lookup RPC

## Security Notes

- Signup metadata is treated only as an access request signal.
- Signup does not grant feature permissions.
- Owner authorization is enforced in database RPCs, not only in the UI.
- Structural Labeling grants are mirrored into its existing permission table so existing server authorization remains authoritative.
- Service-role credentials are restricted to the server-side notification endpoint.
- Permission changes are auditable.
