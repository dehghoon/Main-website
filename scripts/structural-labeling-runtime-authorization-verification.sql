\set ON_ERROR_STOP on
BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.expect_error(test_name text, sql_text text, expected_fragment text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE msg text;
BEGIN
  BEGIN
    EXECUTE sql_text;
    RAISE EXCEPTION 'verification_failed:%:statement_succeeded', test_name;
  EXCEPTION WHEN OTHERS THEN
    msg := SQLERRM;
    IF msg LIKE 'verification_failed:%' THEN
      RAISE;
    END IF;
    IF position(expected_fragment IN msg) = 0 THEN
      RAISE EXCEPTION 'verification_failed:%:expected=%:observed=%', test_name, expected_fragment, msg;
    END IF;
    RAISE NOTICE 'PASS % -> %', test_name, msg;
  END;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users) THEN
    RAISE EXCEPTION 'runtime_verification_requires_existing_auth_user';
  END IF;
END
$$;

SELECT id::text AS u FROM auth.users ORDER BY created_at,id LIMIT 1 \gset
SELECT encode(digest('rt-'||gen_random_uuid()::text,'sha256'),'hex') AS sha \gset
SELECT 'runtime-verification/'||gen_random_uuid()::text||'/source.pdf' AS storage_path \gset

SELECT set_config('request.jwt.claims',
  jsonb_build_object('sub',:'u','role','anon','app_metadata',jsonb_build_object('role','employee'))::text,true);
SET LOCAL ROLE anon;
SELECT pg_temp.expect_error(
  'unauthenticated mutation',
  format('insert into public.structural_labeling_candidates(project_group_id,source_kind,source_ref,source_sha256) values (%L,%L,%L,%L)',
    'runtime-verification','website-upload','runtime',:'sha'),
  'permission denied');
RESET ROLE;

SELECT set_config('request.jwt.claims',
  jsonb_build_object('sub',:'u','role','authenticated','app_metadata',jsonb_build_object('role','employee'))::text,true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.expect_error(
  'authenticated without labeling permission',
  format('select public.labeling_create_candidate(%L,%L,%L,%s,%L,%L,%L,%L,%L,%s,%L::jsonb,%L::jsonb,%L::jsonb)',
    :'sha','runtime.pdf','application/pdf',128,:'storage_path','website-upload','runtime-verification',
    'runtime-verification','page-1',0,
    '{"coordinate_space":"source-page","unit":"pdf-point","transform_validation_state":"validated","page_rotation_deg":0,"effective_page_width_pt":612,"effective_page_height_pt":792,"raster_to_source_page_affine":[1,0,0,1,0,0],"source_page_to_raster_affine":[1,0,0,1,0,0]}',
    '{"runtime_verification":true}','{}'),
  'permission_denied:labeling.upload');
RESET ROLE;

INSERT INTO public.structural_labeling_permissions(user_id,permission,granted_by)
SELECT :'u'::uuid,p,:'u'::uuid
FROM unnest(ARRAY['labeling.upload','labeling.annotate','labeling.submit','labeling.owner_review','labeling.gpt7_export']) p
ON CONFLICT DO NOTHING;

SELECT set_config('request.jwt.claims',
  jsonb_build_object('sub',:'u','role','authenticated','app_metadata',jsonb_build_object('role','employee'))::text,true);
SET LOCAL ROLE authenticated;

SELECT public.labeling_create_candidate(
  :'sha','runtime.pdf','application/pdf',128,:'storage_path','website-upload','runtime-verification',
  'runtime-verification','page-1',0,
  '{"coordinate_space":"source-page","unit":"pdf-point","transform_validation_state":"validated","page_rotation_deg":0,"effective_page_width_pt":612,"effective_page_height_pt":792,"raster_to_source_page_affine":[1,0,0,1,0,0],"source_page_to_raster_affine":[1,0,0,1,0,0]}'::jsonb,
  '{"runtime_verification":true}'::jsonb,'{}'::jsonb
)::text AS c \gset
\echo PASS positive employee candidate creation

SELECT pg_temp.expect_error('employee owner approve',
  format('select public.labeling_owner_transition(%L::uuid,%L,null)',:'c','approve'),
  'employee_cannot_execute_owner_action');
SELECT pg_temp.expect_error('employee owner reject',
  format('select public.labeling_owner_transition(%L::uuid,%L,%L)',:'c','reject','runtime'),
  'employee_cannot_execute_owner_action');
SELECT pg_temp.expect_error('employee revision-required',
  format('select public.labeling_owner_transition(%L::uuid,%L,%L)',:'c','request-revision','runtime'),
  'employee_cannot_execute_owner_action');
SELECT pg_temp.expect_error('employee GPT7 export',
  format('select public.labeling_assert_exportable(%L::uuid)',:'c'),
  'employee_cannot_execute_owner_action');
SELECT pg_temp.expect_error('arbitrary workflow jump',
  format('select public.labeling_employee_transition(%L::uuid,%L,null)',:'c','start-labeling'),
  'invalid_workflow_transition');
SELECT pg_temp.expect_error('direct candidate mutation bypass',
  format('update public.structural_labeling_candidates set workflow_state=%L where id=%L::uuid','owner-approved',:'c'),
  'permission denied');
SELECT pg_temp.expect_error('direct revision mutation bypass',
  format('insert into public.structural_labeling_annotation_revisions(candidate_id,revision_no,created_by) values (%L::uuid,99,%L::uuid)',:'c',:'u'),
  'permission denied');
SELECT pg_temp.expect_error('unsuitable without reason',
  format('select public.labeling_employee_transition(%L::uuid,%L,null)',:'c','mark-unsuitable'),
  'reason_required');

SELECT public.labeling_employee_transition(:'c'::uuid,'mark-suitable',null);
SELECT public.labeling_employee_transition(:'c'::uuid,'start-labeling',null);
SELECT public.labeling_save_revision(
  :'c'::uuid,
  '[{"annotation_id":"rt-1","annotation_spec_version":"v0.2","class":"beam","bbox":{"xmin":10,"ymin":20,"xmax":100,"ymax":80}}]'::jsonb,
  '{"coordinate_space":"source-page","unit":"pdf-point","transform_validation_state":"validated","page_rotation_deg":0,"effective_page_width_pt":612,"effective_page_height_pt":792,"raster_to_source_page_affine":[1,0,0,1,0,0],"source_page_to_raster_affine":[1,0,0,1,0,0]}'::jsonb,
  'runtime employee revision'
)::text AS employee_rev \gset
\echo PASS positive employee revision save
SELECT public.labeling_employee_transition(:'c'::uuid,'submit-owner-qa',null);

SELECT pg_temp.expect_error('submitted employee revision mutation',
  format('select public.labeling_save_revision(%L::uuid,%L::jsonb,%L::jsonb,%L)',
    :'c',
    '[{"annotation_id":"rt-2","annotation_spec_version":"v0.2","class":"beam","bbox":{"xmin":10,"ymin":20,"xmax":100,"ymax":80}}]',
    '{"coordinate_space":"source-page","unit":"pdf-point","transform_validation_state":"validated","page_rotation_deg":0,"effective_page_width_pt":612,"effective_page_height_pt":792,"raster_to_source_page_affine":[1,0,0,1,0,0],"source_page_to_raster_affine":[1,0,0,1,0,0]}',
    'overwrite attempt'),
  'employee_cannot_execute_owner_action');
RESET ROLE;

DELETE FROM public.structural_labeling_permissions
WHERE user_id=:'u'::uuid AND permission='labeling.gpt7_export';

SELECT set_config('request.jwt.claims',
  jsonb_build_object('sub',:'u','role','authenticated','app_metadata',jsonb_build_object('role','owner'))::text,true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.expect_error('owner-review-only GPT7 export',
  format('select public.labeling_assert_exportable(%L::uuid)',:'c'),
  'permission_denied:labeling.gpt7_export');
SELECT pg_temp.expect_error('owner rejection without reason',
  format('select public.labeling_owner_transition(%L::uuid,%L,null)',:'c','reject'),
  'reason_required');
SELECT pg_temp.expect_error('revision-required without reason',
  format('select public.labeling_owner_transition(%L::uuid,%L,null)',:'c','request-revision'),
  'reason_required');
RESET ROLE;

INSERT INTO public.structural_labeling_permissions(user_id,permission,granted_by)
VALUES (:'u'::uuid,'labeling.gpt7_export',:'u'::uuid)
ON CONFLICT DO NOTHING;

SELECT set_config('request.jwt.claims',
  jsonb_build_object('sub',:'u','role','authenticated','app_metadata',jsonb_build_object('role','owner'))::text,true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.expect_error('export state not owner-approved',
  format('select public.labeling_assert_exportable(%L::uuid)',:'c'),
  'owner_approval_required');

SELECT public.labeling_save_revision(
  :'c'::uuid,
  '[{"annotation_id":"rt-owner","annotation_spec_version":"v0.2","class":"beam","bbox":{"xmin":10,"ymin":20,"xmax":100,"ymax":80}}]'::jsonb,
  '{"coordinate_space":"source-page","unit":"pdf-point","transform_validation_state":"validated","page_rotation_deg":0,"effective_page_width_pt":612,"effective_page_height_pt":792,"raster_to_source_page_affine":[1,0,0,1,0,0],"source_page_to_raster_affine":[1,0,0,1,0,0]}'::jsonb,
  'runtime owner revision'
)::text AS owner_rev \gset
SELECT public.labeling_owner_transition(:'c'::uuid,'approve',null);
\echo PASS positive owner approval
RESET ROLE;

UPDATE public.structural_labeling_annotation_revisions
SET transform_metadata = transform_metadata || '{"transform_validation_state":"unvalidated"}'::jsonb
WHERE id=:'owner_rev'::uuid;

SELECT set_config('request.jwt.claims',
  jsonb_build_object('sub',:'u','role','authenticated','app_metadata',jsonb_build_object('role','owner'))::text,true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.expect_error('export unvalidated transform',
  format('select public.labeling_assert_exportable(%L::uuid)',:'c'),
  'validated_source_page_transform_required');
RESET ROLE;

UPDATE public.structural_labeling_annotation_revisions
SET transform_metadata = transform_metadata || '{"transform_validation_state":"validated"}'::jsonb
WHERE id=:'owner_rev'::uuid;

SELECT pg_temp.expect_error('audit update blocked',
  format('update public.structural_labeling_audit_events set notes=%L where candidate_id=%L::uuid','should fail',:'c'),
  'append-only');
SELECT pg_temp.expect_error('audit delete blocked',
  format('delete from public.structural_labeling_audit_events where candidate_id=%L::uuid',:'c'),
  'append-only');
SELECT pg_temp.expect_error('source SHA cannot be removed',
  format('update public.structural_labeling_candidates set source_sha256=null where id=%L::uuid',:'c'),
  'null value');

SELECT set_config('request.jwt.claims',
  jsonb_build_object('sub',:'u','role','authenticated','app_metadata',jsonb_build_object('role','owner'))::text,true);
SET LOCAL ROLE authenticated;
SELECT public.labeling_assert_exportable(:'c'::uuid);
\echo PASS positive GPT7 export authorization
RESET ROLE;

DELETE FROM public.structural_labeling_permissions
WHERE user_id=:'u'::uuid AND permission='labeling.owner_review';

SELECT set_config('request.jwt.claims',
  jsonb_build_object('sub',:'u','role','authenticated','app_metadata',jsonb_build_object('role','owner'))::text,true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.expect_error('GPT7-only owner review denied',
  format('select public.labeling_owner_transition(%L::uuid,%L,null)',:'c','approve'),
  'permission_denied:labeling.owner_review');
RESET ROLE;

ROLLBACK;
\echo ALL DATABASE AUTHORIZATION VERIFICATION TESTS PASSED
