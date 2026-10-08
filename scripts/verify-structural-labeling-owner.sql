-- Read-only verification for the controlled Structural Labeling owner bootstrap.
-- Required psql variable: target_email

SELECT CASE
  WHEN
    raw_app_meta_data->>'role' = 'owner'
    AND raw_app_meta_data->>'user_type' = 'owner'
    AND EXISTS (
      SELECT 1
      FROM public.structural_labeling_permissions p
      WHERE p.user_id = auth.users.id
        AND p.permission = 'labeling.owner_review'
    )
  THEN 'pass'
  ELSE 'fail'
END AS owner_bootstrap_verification
FROM auth.users
WHERE lower(email) = lower(:'target_email');
