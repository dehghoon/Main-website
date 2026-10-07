\set ON_ERROR_STOP on

DO $$
DECLARE missing text[];
BEGIN
  SELECT array_agg(name ORDER BY name) INTO missing
  FROM (VALUES
    ('structural_labeling_permissions'),
    ('structural_labeling_sources'),
    ('structural_labeling_candidates'),
    ('structural_labeling_annotation_revisions'),
    ('structural_labeling_audit_events')
  ) required(name)
  WHERE to_regclass('public.' || name) IS NULL;
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Missing required tables: %', missing;
  END IF;
END $$;

DO $$
DECLARE missing text[];
BEGIN
  SELECT array_agg(relname ORDER BY relname) INTO missing
  FROM (
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN (
        'structural_labeling_permissions',
        'structural_labeling_sources',
        'structural_labeling_candidates',
        'structural_labeling_annotation_revisions',
        'structural_labeling_audit_events'
      )
      AND NOT c.relrowsecurity
  ) q;
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'RLS is not enabled on: %', missing;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM (VALUES
      ('structural_labeling_sources'),
      ('structural_labeling_candidates'),
      ('structural_labeling_annotation_revisions'),
      ('structural_labeling_audit_events')
    ) t(name)
    WHERE has_table_privilege('anon', format('public.%I', name), 'INSERT,UPDATE,DELETE')
       OR has_table_privilege('authenticated', format('public.%I', name), 'INSERT,UPDATE,DELETE')
  ) THEN
    RAISE EXCEPTION 'Direct mutation privilege exists on protected tables.';
  END IF;
END $$;

DO $$
DECLARE fn regprocedure;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.labeling_create_candidate(text,text,text,bigint,text,text,text,text,text,integer,jsonb,jsonb,jsonb)'::regprocedure,
    'public.labeling_employee_transition(uuid,text,text)'::regprocedure,
    'public.labeling_save_revision(uuid,jsonb,jsonb,text)'::regprocedure,
    'public.labeling_owner_transition(uuid,text,text)'::regprocedure,
    'public.labeling_assert_exportable(uuid)'::regprocedure
  ]
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE oid = fn AND prosecdef) THEN
      RAISE EXCEPTION 'Function is not SECURITY DEFINER: %', fn;
    END IF;
    IF has_function_privilege('public', fn, 'EXECUTE') THEN
      RAISE EXCEPTION 'PUBLIC can execute protected function: %', fn;
    END IF;
    IF NOT has_function_privilege('authenticated', fn, 'EXECUTE') THEN
      RAISE EXCEPTION 'authenticated cannot execute protected function: %', fn;
    END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'public.structural_labeling_audit_events'::regclass
      AND NOT tgisinternal
      AND (tgtype::int & 2) <> 0
      AND (tgtype::int & 8) <> 0
      AND (tgtype::int & 16) <> 0
  ) THEN
    RAISE EXCEPTION 'Append-only audit BEFORE UPDATE/DELETE trigger is missing.';
  END IF;
END $$;

DO $$
DECLARE bucket record;
BEGIN
  SELECT public, file_size_limit, allowed_mime_types INTO bucket
  FROM storage.buckets
  WHERE id = 'structural-labeling-sources';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Structural Labeling storage bucket is missing.';
  END IF;
  IF bucket.public THEN
    RAISE EXCEPTION 'Structural Labeling storage bucket is public.';
  END IF;
  IF bucket.file_size_limit IS DISTINCT FROM 52428800 THEN
    RAISE EXCEPTION 'Unexpected bucket size limit: %', bucket.file_size_limit;
  END IF;
  IF NOT (
    bucket.allowed_mime_types @> ARRAY[
      'application/pdf','image/png','image/jpeg','image/webp'
    ]::text[]
  ) THEN
    RAISE EXCEPTION 'Storage MIME allowlist is incomplete.';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage'
      AND tablename='objects'
      AND policyname='structural_labeling_source_insert'
  ) THEN
    RAISE EXCEPTION 'Storage INSERT policy is missing.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage'
      AND tablename='objects'
      AND policyname='structural_labeling_source_read'
  ) THEN
    RAISE EXCEPTION 'Storage SELECT policy is missing.';
  END IF;
END $$;

DO $$
DECLARE export_def text;
DECLARE owner_def text;
BEGIN
  SELECT pg_get_functiondef('public.labeling_assert_exportable(uuid)'::regprocedure)
  INTO export_def;
  IF export_def NOT ILIKE '%labeling.gpt7_export%'
     OR export_def NOT ILIKE '%owner-approved%'
     OR export_def NOT ILIKE '%valid_source_hash_required%'
     OR export_def NOT ILIKE '%labeling_validate_payload%' THEN
    RAISE EXCEPTION 'Export RPC is missing required enforcement.';
  END IF;

  SELECT pg_get_functiondef('public.labeling_owner_transition(uuid,text,text)'::regprocedure)
  INTO owner_def;
  IF owner_def NOT ILIKE '%labeling.owner_review%'
     OR owner_def NOT ILIKE '%reason_required%'
     OR owner_def NOT ILIKE '%submitted-for-owner-qa%' THEN
    RAISE EXCEPTION 'Owner review RPC is missing required enforcement.';
  END IF;
END $$;

SELECT
  'schema-security-verification' AS check_name,
  'pass' AS result,
  now() AT TIME ZONE 'utc' AS verified_at_utc;
