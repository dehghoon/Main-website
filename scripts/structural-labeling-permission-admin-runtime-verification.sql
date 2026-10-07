-- Read-only production verification for Structural Labeling permission administration.
-- This script must not mutate Structural Labeling data.

DO $$
DECLARE
  manage_def text;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM supabase_migrations.schema_migrations
    WHERE version = '20261006000200'
  ) THEN
    RAISE EXCEPTION 'permission administration migration is not recorded as applied';
  END IF;

  IF to_regclass('public.structural_labeling_permission_audit_events') IS NULL THEN
    RAISE EXCEPTION 'permission audit table missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'structural_labeling_permission_audit_events'
      AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'permission audit RLS missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'public.structural_labeling_permission_audit_events'::regclass
      AND NOT tgisinternal
      AND (tgtype::int & 8) <> 0
      AND (tgtype::int & 16) <> 0
  ) THEN
    RAISE EXCEPTION 'permission audit immutable trigger missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE oid = 'public.labeling_permission_admin_allowed()'::regprocedure
      AND prosecdef
  ) THEN
    RAISE EXCEPTION 'admin guard function is not SECURITY DEFINER';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE oid = 'public.labeling_list_employee_permissions()'::regprocedure
      AND prosecdef
   ) THEN
    RAISE EXCEPTION 'employee permission list function is not SECURITY DEFINER';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE oid = 'public.labeling_manage_employee_permission(text,text,boolean)'::regprocedure
      AND prosecdef
  ) THEN
    RAISE EXCEPTION 'employee permission mutation function is not SECURITY DEFINER';
  END IF;

  IF has_function_privilege('public', 'public.labeling_permission_admin_allowed()', 'EXECUTE')
    OR has_function_privilege('anon', 'public.labeling_permission_admin_allowed()', 'EXECUTE')
    OR has_function_privilege('public', 'public.labeling_list_employee_permissions()', 'EXECUTE')
    OR has_function_privilege('anon', 'public.labeling_list_employee_permissions()', 'EXECUTE')
    OR has_function_privilege('public', 'public.labeling_manage_employee_permission(text,text,boolean)', 'EXECUTE')
    OR has_function_privilege('anon', 'public.labeling_manage_employee_permission(text,text,boolean)', 'EXECUTE')
  THEN
    RAISE EXCEPTION 'PUBLIC/anon execute privilege is too broad';
  END IF;

  IF NOT has_function_privilege('authenticated', 'public.labeling_permission_admin_allowed()', 'EXECUTE')
    OR NOT has_function_privilege('authenticated', 'public.labeling_list_employee_permissions()', 'EXECUTE')
    OR NOT has_function_privilege('authenticated', 'public.labeling_manage_employee_permission(text,text,boolean)', 'EXECUTE')
  THEN
    RAISE EXCEPTION 'authenticated execute privilege is missing';
  END IF;

  IF has_table_privilege('authenticated', 'public.structural_labeling_permission_audit_events', 'INSERT')
    OR has_table_privilege('authenticated', 'public.structural_labeling_permission_audit_events', 'UPDATE')
    OR has_table_privilege('authenticated', 'public.structural_labeling_permission_audit_events', 'DELETE')
  THEN
    RAISE EXCEPTION 'authenticated has direct permission-audit mutation privilege';
  END IF;

  manage_def := pg_get_functiondef(
    'public.labeling_manage_employee_permission(text,text,boolean)'::regprocedure
  );

  IF manage_def ~ 'labeling\.owner_review|labeling\.gpt7_export' THEN
    RAISE EXCEPTION 'permission manager exposes privileged review/export permissions';
  END IF;

  IF manage_def NOT LIKE '%raw_app_meta_data%'
    OR manage_def NOT LIKE '%employee%'
  THEN
    RAISE EXCEPTION 'employee role guard missing';
  END IF;

  IF manage_def NOT LIKE '%labeling.workspace%'
    OR manage_def NOT LIKE '%labeling.upload%'
    OR manage_def NOT LIKE '%labeling.annotate%'
    OR manage_def NOT LIKE '%labeling.submit%'
  THEN
    RAISE EXCEPTION 'operational permission allowlist missing';
  END IF;
END $$;

SELECT
  'permission-admin-runtime-verification' AS check_name,
  'pass' AS result,
  now() AT TIME ZONE 'utc' AS verified_at_utc;
