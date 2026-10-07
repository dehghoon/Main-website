-- Read-only preflight for the controlled Structural Labeling owner bootstrap.
-- Required psql variable: target_email

SELECT 'target_count=' || count(*)
FROM auth.users
WHERE lower(email) = lower(:'target_email');

SELECT 'existing_owner_count=' || count(*)
FROM auth.users
WHERE coalesce(raw_app_meta_data->>'role', raw_app_meta_data->>'user_type') = 'owner';
