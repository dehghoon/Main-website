-- PROPOSED MIGRATION — REVIEW BEFORE APPLYING
-- Linkoteq blog publication guard. Does not grant publishing to an AI agent.
-- Authorized approver verified against auth.users in the linked project.
BEGIN;
CREATE OR REPLACE FUNCTION public.enforce_blog_publication_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  approver uuid := '9a3f8ff8-0d2d-43b7-a359-42b5221dd871'::uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'published' AND auth.uid() IS DISTINCT FROM approver THEN
      RAISE EXCEPTION 'Only the designated blog approver may publish an article';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (NEW.status = 'published' OR OLD.status = 'published')
       AND auth.uid() IS DISTINCT FROM approver THEN
      RAISE EXCEPTION 'Only the designated blog approver may change a published article';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS blog_publication_approval_guard ON public.blog_posts;
CREATE TRIGGER blog_publication_approval_guard
BEFORE INSERT OR UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.enforce_blog_publication_approval();

-- Restrict deletion of published articles to the designated approver.
DROP POLICY IF EXISTS "employees can delete blog posts" ON public.blog_posts;
CREATE POLICY "employees can delete draft posts; approver can delete all"
ON public.blog_posts FOR DELETE TO authenticated
USING (
  (auth.uid() = '9a3f8ff8-0d2d-43b7-a359-42b5221dd871'::uuid)
  OR (
    status <> 'published'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('member','manager','admin')
    )
  )
);
COMMIT;
