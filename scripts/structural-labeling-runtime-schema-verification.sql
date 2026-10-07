\set ON_ERROR_STOP on

DO $$
DECLARE
  missing text[];
BEGIN
  SELECT array_agg(name ORDER BY name)
  INTO missing
  FROM (VALUES
    ('structural_labeling_permissions'),
    ('structural_labeling_sources'),
    ('structural_labeling_candidates'),
    ('structural_labeling_annotation_revisions'),
    ('structural_labeling_audit_events')
  ) AS required(name)
  WHERE to_regclass('public.' || name) IS NULL;

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Missing required Structural Labeling tables: %', missing;
  END IF;
END
$$;

DO $$
DECLARE
  missing text[];
BEGIN
  SELECT array_agg(tablename ORDER BY tablename)
  INTO missing
  FROM (VALUES
    ('structural_labeling_permissions'),
    ('structural_labeling_sources'),
    ('structural_labeling_candidates'),
    ('structural_labeling_annotation_revisions'),
    ('structural_labeling_audit_events')
  ) AS required(tablename)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = required.tablename
      AND c.relrowsecurity
  );

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'RLS is not enabled on required tables: %', missing;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.structural_labeling_candidates'::regclass
      AND contype = 'f'
      AND pg_get_constraintdef(oid) ILIKE '%(source_id)%structural_labeling_sources%'
  ) THEN
    RAISE EXCEPTION 'Candidate source_id foreign key is missing.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.structural_labeling_annotation_revisions'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) ILIKE '%candidate_id%'
      AND pg_get_constraintdef(oid) ILIKE '%revision_no%'
  ) THEN
    RAISE EXCEPTION 'Annotation revision uniqueness constraint is missing.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.structural_labeling_annotation_revisions'::regclass
      AND contype = 'f'
      AND pg_get_constraintdef(oid) ILIKE '%supersedes_revision_id%'
  ) THEN
    RAISE EXCEPTION 'Revision supersedes lineage foreign key is missing.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.structural_labeling_annotation_revisions'::regclass
      AND contype = 'f'
      AND pg_get_constraintdef(oid) ILIKE '%adjudicates_revision_id%'
  ) THEN
    RAISE EXCEPTION 'Revision adjudication lineage foreign key is missing.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'structural_labeling_candidates'
      AND indexdef ILIKE '%source_sha256%'
  ) THEN
    RAISE EXCEPTION 'Candidate source SHA-256 index is missing.';
  END IF;
END
$$;

DO $$
DECLARE
  required_columns text[] := ARRAY[
    'source_id',
    'page_id',
    'page_index',
    'original_filename',
    'transform_metadata',
    'provenance',
    'historical_metadata',
    'owner_disposition_reason'
  ];
  missing text[];
BEGIN
  SELECT array_agg(column_name ORDER BY column_name)
  INTO missing
  FROM unnest(required_columns) AS column_name
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'structural_labeling_candidates'
      AND c.column_name = column_name
  );

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Candidate provenance/transform columns missing: %', missing;
  END IF;
END
$$;

DO $$
DECLARE
  required_columns text[] := ARRAY[
    'revision_kind',
    'supersedes_revision_id',
    'adjudicates_revision_id',
    'notes'
  ];
  missing text[];
BEGIN
  SELECT array_agg(column_name ORDER BY column_name)
  INTO missing
  FROM unnest(required_columns) AS column_name
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'structural_labeling_annotation_revisions'
      AND c.column_name = column_name
  );

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Revision lineage columns missing: %', missing;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM (VALUES
      ('structural_labeling_sources'),
      ('structural_labeling_candidates'),
      ('structural_labeling_annotation_revisions'),
      ('structural_labeling_audit_events')
    ) AS t(name)
    WHERE has_table_privilege('anon', format('public.%I', name), 'INSERT')
       OR has_table_privilege('anon', format('public.%I', name), 'UPDATE')
       OR has_table_privilege('anon', format('public.%I', name), 'DELETE')
       OR has_table_privilege('authenticated', format('public.%I', name), 'INSERT')
       OR has_table_privilege('authenticated', format('public.%I', name), 'UPDATE')
       OR has_table_privilege('authenticated', format('public.%I', name), 'DELETE')
  ) THEN
    RAISE EXCEPTION 'Direct mutation privilege exists on a protected Structural Labeling table.';
  END IF;
END
$$;

DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.labeling_create_candidate(text,text,text,bigint,text,text,text,text,text,integer,jsonb,jsonb,jsonb)'::regprocedure,
    'public.labeling_employee_transition(uuid,text,text)'::regprocedure,
    'public.labeling_save_revision(uuid,jsonb,jsonb,text)'::regprocedure,
    'public.labeling_owner_transition(uuid,text,text)'::regprocedure,
    'public.labeling_assert_exportable(uuid)'::regprocedure
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc WHERE oid = fn AND prosecdef
    ) THEN
      RAISE EXCEPTION 'Required function is not SECURITY DEFINER: %', fn;
    END IF;

    IF has_function_privilege('public', fn, 'EXECUTE') THEN
      RAISE EXCEPTION 'PUBLIC can execute protected function: %', fn;
    END IF;

    IF NOT has_function_privilege('authenticated', fn, 'EXECUTE') THEN
      RAISE EXCEPTION 'authenticated cannot execute required protected function: %', fn;
    END IF;
  END LOOP;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'public.structural_labeling_audit_events'::regclass
      AND NOT tgisinternal
      AND pg_get_triggerdef(oid) ILIKE '%UPDATE OR DELETE%'
  ) THEN
    RAISE EXCEPTION 'Append-only audit UPDATE/DELETE trigger is missing.';
  END IF;
END
$$;

DO $$
DECLARE
  bucket record;
BEGIN
  SELECT id, public, file_size_limit, allowed_mime_types
  INTO bucket
  FROM storage.buckets
  WHERE id = 'structural-labeling-sources';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Structural Labeling private storage bucket is missing.';
  END IF;

  IF bucket.public THEN
    RAISE EXCEPTION 'Structural Labeling source bucket is public.';
  END IF;

  IF bucket.file_size_limit IS DISTINCT FROM 52428800 THEN
    RAISE EXCEPTION 'Unexpected Structural Labeling source bucket size limit: %', bucket.file_size_limit;
  END IF;

  IF NOT X(Š    bucket.allowed_mime_types @> ARRAY['application/pdf','image/png','image/jpeg','image/webp']::text[]
  ) THEN
    RAISE EXCEPTION 'Structural Labeling source bucket MIME allowlist is incomplete: %', bucket.allowed_mime_types;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'structural_labeling_source_insert'
  ) THEN
    RAISE EXCEPTION 'Storage INSERT policy is missing.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'structural_labeling_source_read'
  ) THEN
    RAISE EXCEPTION 'Storage SELECT policy is missing.';
  END IF;
END
$$;

DO $$
DECLARE
  source_sha_nullable text;
  export_def text;
  owner_def text;
BEGIN
  SELECT is_nullable
  INTO source_sha_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'structural_labeling_candidates'
    AND column_name = 'source_sha256';

  IF source_sha_nullable IS DISTINCT FROM 'NO' THEN
    RAISE EXCEPTION 'Candidate source_sha256 must be NOT NULL.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.structural_labeling_candidates'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%source_sha256%'
      AND pg_get_constraintdef(oid) ILIKE '%64%'
  ) THEN
    RAISE EXCEPTION 'Candidate source SHA-256 format constraint is missing.';
  END IF;

  SELECT pg_get_functiondef('public.labeling_assert_exportable(uuid)'::regprocedure)
  INTO export_def;

  IF export_def NOT ILIKE '%labeling.gpt7_export%'
     OR export_def NOT ILIKE '%owner-approved%'
     OR export_def NOT ILIKE '%valid_source_hash_required%'
     OR export_def NOT ILIKE '%labeling_validate_payload%' THEN
    RAISE EXCEPTION 'Export RPC is missing required permission/state/hash/transform enforcement.';
  END IF;

  SELECT pg_get_functiondef('public.labeling_owner_transition(uuid,text,text)'::regprocedure)
  INTO owner_def;

  IF owner_def NOT ILIKE '%labeling.owner_review%'
     OR owner_def NOT ILIKE '%reason_required%'
    OR owner_def NOT ILIKE '%submitted-for-owner-qa%' THEN
    RAISE EXCEPTION 'Owner review RPC is missing required permission/state/reason enforcement.';
  END IF;
END
$$;

SELECT
  'schema-security-verification' AS check_name,
  'pass' AS result,
  current_database() AS database_name,
  now() AT TIME ZONE 'utc' AS verified_at_utc;
