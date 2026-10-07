# Structural Labeling Permission Administration

## Purpose

This extension lets an authenticated LinkoTech Owner/Admin grant or revoke the minimum operational Structural Labeling permissions required by existing employee accounts.

It does not create a new identity system, change engineering logic, enable training, or change the RegionKit external handoff model.

## Manageable Permissions

Only these employee permissions can be managed:

- `labeling.workspace`
- `labeling.upload`
- `labeling.annotate`
- `labeling.submit`

The permission manager deliberately cannot grant:

- `labeling.owner_review`
- `labeling.gpt7_export`

## Authorization and Audit

Permission changes use the existing LinkoTech/Supabase authenticated session. The browser calls the Structural Labeling permission API, which invokes `SECURITY DEFINER` RPCs with the current user's access token.

The database independently verifies that the caller is an `owner` or `admin` and that the target account already exists with the `employee` base role.

Successful state changes create append-only records in `structural_labeling_permission_audit_events`. The audit table has RLS enabled, no direct authenticated mutation grants, and an immutable UPDATE/DELETE trigger.

## Production Migration

Migration:

`20261006000200_structural_labeling_permission_admin.sql`

Apply it only with:

`Structural Labeling Permission Admin Controlled Apply`

The controlled workflow:

1. requires the exact confirmation phrase;
2. verifies this is the only local migration missing from production;
3. performs a Supabase dry run;
4. creates a pre-apply schema backup and checksum;
5. applies the single approved migration;
6. verifies the exact migration-history delta;
7. verifies deployed RLS, execution privileges, `SECURITY DEFINER`, immutable audit behavior, employee-role enforcement, and absence of Owner-review/GPT-7 escalation;
8. uploads evidence artifacts.

## Operator Flow

1. Sign in as an existing Owner/Admin.
2. Open `/structural-labeling/regionkit`.
3. In `Employee labeling permissions`, select an existing employee account.
4. Grant only the required permissions. For source upload, grant `labeling.upload`; normal workflow access also needs `labeling.workspace`.
5. Sign in as the employee who will perform labeling operations.
6. Open `/structural-labeling/regionkit`.
7. Upload the PDF/image source and continue the RegionKit-assisted external manual labeling workflow.

## Current Boundaries

- `Historical --apply = NOT RUN`
- `Milestone 3 = NOT STARTED`
- `enablesTraining=false`
- `YOLO training = NOT RUN`
