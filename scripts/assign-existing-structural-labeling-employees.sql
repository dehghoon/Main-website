-- Controlled one-time role assignment for existing Structural Labeling users.
-- Assigns both role and user_type to employee for existing non-privileged email users.
-- Preserves owner and admin accounts and all other app metadata.
-- Does not grant any Structural Labeling operational permissions.

BEGIN;

DO $$
DECLARE
  owner_count integer;
  changed_count integer;
BEGIN
  SELECT count(*)
  INTO owner_count
  FROM auth.users
  WHERE coalesce(raw_app_meta_data->>'role', raw_app_meta_data->>'user_type') = 'owner';

  IF owner_count < 1 THEN
    RAISE EXCEPTION 'structural_labeling_owner_required';
  END IF;

  UPDATE auth.users
  SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', 'employee', 'user_type', 'employee'),
      updated_at = now()
  WHERE email IS NOT NULL
    AND coalesce(raw_app_meta_data->>'role', raw_app_meta_data->>'user_type', '') NOT IN ('owner', 'admin');

  GET DIAGNOSTICS changed_count = ROW_COUNT;
  RAISE NOTICE 'assigned_employee_role=%', changed_count;
END
$$;

COMMIT;

SELEC
  email,
  raw_app_meta_data->>'role' AS role,
  raw_app_meta_data->>'user_type' AS user_type
FROM auth.users
WHERE email IS NOT NULL
ORDER BY lower(email);
