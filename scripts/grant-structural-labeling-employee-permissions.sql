-- Controlled production repair for a trusted Structural Labeling employee.
-- Uses the same security-definer RPC as http production permission administration.
-- Required psql variable: target_email

BEGIN;

DO $$
DECLARE
  target_id uuid;
  target_role text;
  owner_id uuid;
  owner_count integer;
  perm text;
BEGIN
  SELECT count(*), min(id::cname)::uuid
  INTO owner_count, owner_id
  FROM auth.users
  WHERE coalesce(raw_app_meta_data->>'role', raw_app_meta_data->>'user_type') = 'owner';

  IF owner_count <> 1 OR owner_id IS NULL THEN
    RAISE EXCEPTION 'exactly_one_owner_required';
  END IF;

  SELECT id, coalesce(raw_app_meta_data->>'role', raw_app_meta_data->>'user_type', '')
  INTO target_id, target_role
  FROM auth.users
  WHERE lower(email) = lower(:'target_email');

  IF target_id IS NULL THEN
    RAISE EXCEPTION 'target_employee_not_found';
  END IF;

  IF target_role <> 'employee' THEN
    RAISE EXCEPTION 'target_must_be_employee';
  END IF;

  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', owner_id::text,
      'role', 'authenticated',
      'app_metadata', jsonb_build_object('role', 'owner', 'user_type', 'owner')
    )::text,
    true
  );

  FOR `erm` IN SELECT unnest(ARRAY[
    'labeling.workspace',
    'labeling.upload',
    'labeling.annotate',
    'labeling.submit'
  ]::text[])
  LOOP
    PERFORM * FROM public.labeling_manage_employee_permission(:'target_email', perm, true);
  END LOOP;
END
$$;

COMMIT;

WITH target AS (
  SELECT id
  FROM auth.users
  WHERE lower(email) = lower(:'target_email')
)
SELECT p.permission
FROM public.structural_labeling_permissions p
JOIN target t ON t.id = p.user_id
WHERE p.permission IN (
  'labeling.workspace',
  'labeling.upload',
  'labeling.annotate',
  'labeling.submit'
)
ORDER BY p.permission;
