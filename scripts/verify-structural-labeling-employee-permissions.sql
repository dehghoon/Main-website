-- Read-only production verification for a Structural Labeling employee.
-- Required psql variable: target_email

WITH target AS (
  SELECT
    id,
    email,
    coalesce(raw_app_meta_data->>'role', raw_app_meta_data->>'user_type', '') AS base_role
  FROM auth.users
  WHERE lower(email) = lower(:'target_email')
)
SELECT
  'target_count=' || count(*)
FROM target;

WITH target AS (
  SELECT
    id,
    email,
    coalesce(raw_app_meta_data->>'role', raw_app_meta_data->>'user_type', '') AS base_role
  FROM auth.users
  WHERE lower(email) = lower(:'target_email')
)
SELECT
  'base_role=' || coalesce(max(base_role), '')
FROM target;

WITH target AS (
  SELECT id
  FROM auth.users
  WHERE lower(email) = lower(:'target_email')
)
SELECT
  'permission=' || p.permission
FROM public.structural_labeling_permissions p
JOIN target t ON t.id = p.user_id
ORDER BY p.permission;

SELECT
  'permissions_rls_enabled=' || c.relrowsecurity::text
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'structural_labeling_permissions';

SELECT
  'permissions_select_policy=' || pol.polname
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'structural_labeling_permissions'
  AND pol.polcmd = 'r'
ORDER BY pol.polname;

SELECT
  'authenticated_select_privilege=' ||
  has_table_privilege('authenticated', 'public.structural_labeling_permissions', 'SELECT')::text;

SELECT
  'has_permission_function_security_definer=' || p.prosecdef::text
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'has_structural_labeling_permission'
ORDER BY p.oid
LIMIT 1;
