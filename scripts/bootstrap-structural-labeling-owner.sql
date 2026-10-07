-- Controlled one-time bootstrap for the first Structural Labeling owner.
-- This script is parameterized; do not hard-code account emails in source control.
-- Required psql variable: target_email

BEGIN;

SELECT set_config('app.bootstrap_target_email', :'target_email', true);

DO $$
DECLARE
  target_email text := lower(trim(current_setting('app.bootstrap_target_email')));
  target_id uuid;
  target_count integer;
  other_owner_count integer;
BEGIN
  IF target_email = '' THEN
    RAISE EXCEPTION 'target_email_required';
  END IF;

  SELECT count(*)
  INTO target_count
  FROM auth.users
  WHERE lower(email) = target_email;

  IF target_count <> 1 THEN
    RAISE EXCEPTION 'target_user_must_exist_exactly_once:%', target_email;
  END IF;

  SELECT id
  INTO target_id
  FROM auth.users
  WHERE lower(email) = target_email;

  SELECT count(*)
  INTO other_owner_count
  FROM auth.users
  WHERE id <> target_id
    AND coalesce(raw_app_meta_data->>'role', raw_app_meta_data->>'user_type') = 'owner';

  IF other_owner_count > 0 THEN
    RAISE EXCEPTION 'existing_owner_detected_bootstrap_refused';
  END IF;

  UPDATE auth.users
  SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', 'owner', 'user_type', 'owner'),
      updated_at = now()
  WHERE id = target_id;

  INSERT INTO public.structural_labeling_permissions(user_id, permission, granted_by)
  VALUES (target_id, 'labeling.owner_review', target_id)
  ON CONFLICT (user_id, permission) DO NOTHING;

  IF NOT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = target_id
      AND raw_app_meta_data->>'role' = 'owner'
      AND raw_app_meta_data->>'user_type' = 'owner'
  ) THEN
    RAISE EXCEPTION 'owner_metadata_verification_failed';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.structural_labeling_permissions
    WHERE user_id = target_id
      AND permission = 'labeling.owner_review'
  ) THEN
    RAISE EXCEPTION 'owner_review_permission_verification_failed';
  END IF;
END
$$;

COMMIT;

SELECT
  email,
  raw_app_meta_data->>'role' AS role,
  raw_app_meta_data->>'user_type' AS user_type,
  EXISTS (
    SELECT 1
    FROM public.structural_labeling_permissions p
    WHERE p.user_id = auth.users.id
      AND p.permission = 'labeling.owner_review') AS has_owner_review
FROM auth.users
WHERE lower(email) = lower(:'target_email');
