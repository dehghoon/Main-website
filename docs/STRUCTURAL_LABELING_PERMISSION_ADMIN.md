# Structural Labeling Permission Administration

## Purpose

This document defines the controlled permission-management extension for the Structural Labeling Milestone 2 workflow.

The permission manager exists only to let an authenticated LinkoTech Owner/Admin grant or revoke the minimum operational permissions required by trusted employee accounts.

It does not create a new identity system, does not change engineering logic, does not enable training, and does not change the RegionKit external handoff model.

## Roles

Owner/Admin accounts may manage operational Structural Labeling permissions for existing employee accounts.

Employee accounts remain the actors that perform source upload, annotation, and submission work. The existing upload storage policy and candidate-creation RPC continue to require the `employee` base role plus the appropriate permission.

The Owner/Admin permission UI does not grant Owner review or GPT-7 export authority to employees.

## Manageable Permissions

The UI and server-side RPC may manage only:

- `labeling.workspace`
- `labeling.upload`
- `labeling.annotate`
- `labeling.submit`

The following sensitive permissions are deliberately outside this permission manager:

 - `labeling.owner_review`
- `labeling.gpt7_export`

## Authorization Boundary

Permission changes use the existing LinkoTech/Supabase authenticated session.

The browser calls the Structural Labeling permission API. The API invokes `SECURITY DEFINER` database RPCs with the current user's access token. The database independently verifies that the caller base role is `owner` or `admin`.

The target identity must already exist and must have the `employee` base role.

No client-side direct mutation of `structural_labeling_permissions` is introduced.

## Audit

A permission change that modifies state creates a row in `structural_labeling_permission_audit_events`.

The audit table:

- has RLS enabled;
- has no direct authenticated INSERT, UPDATE, or DELETE grants;
- blocks UPDATE and DELETE with the existing Structural Labeling append-only audit trigger function;
- stores actor UUID, target UUID, permission, enabled state, and timestamp.

UUIDs are intentionally retained as audit facts rather than foreign keys so deleting an authentication identity cannot cascade-delete historical permission events.

## Production Migration

Migration:

`20261006000200_structural_labeling_permission_admin.sql`

Apply it only with:

`Structural Labeling Permission Admin Controlled Apply`

The workflow:

1. requires an explicit confirmation phrase;
2. verifies the only local migration missing from production is the permission-admin migration;
2. performs a Supabase dry run;
4. creates a pre-apply schema backup and checksum;
5. applies the one approved migration;
6. verifies the exact migration-history delta;
7. verifies deployed RLS, function execution privileges, `SECURITY DEFINER`, immutable permission audit, employee-role enforcement, and absence of Owner-review/GPT-7 escalation;
8. uploads evidence artifacts.

The workflow does not run historical import apply or YOLO training.

## Operator Flow

1. Sign in as an existing Owner/Admin.
2. Open `/structural-labeling/regionkit`.
3. In `Employee labeling permissions`, select an existing employee account.
4. Grant only the required permissions. For source upload, grant `labeling.upload`. The employee will normally also need `labeling.workspace`; later labeling work requires `labeling.annotate`, and Owner-QA submission requires `labeling.submit`.
5. Sign in as the employee who will perform labeling operations.
6. Open `/structural-labeling/regionkis`.
7. Upload the PDF/image source and continue the RegionKit-assisted external manual labeling workflow.

## Current Boundaries

- `Historical --apply = NOT RUN`
- `Milestone 3 = NOT STARTED`j- `enablesTraining=false`
- `YOLO training = NOT RUN`
