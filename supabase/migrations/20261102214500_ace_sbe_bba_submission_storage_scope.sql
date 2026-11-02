-- Scope the private Ace submission bucket to the BBA pilot.
-- A storage policy is independent of ace_resources RLS, so it must repeat
-- the programme boundary when deciding who can download the actual object.

DROP POLICY IF EXISTS ace_storage_read ON storage.objects;
CREATE POLICY ace_storage_read
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'ace-submissions'
    AND EXISTS (
      SELECT 1
      FROM public.ace_resources r
      JOIN public.ace_course_catalog c ON c.code = r.course_code
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE r.storage_path = objects.name
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
        AND (
          r.status = 'approved'
          OR r.uploader_id = (SELECT auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS ace_storage_reviewer_read ON storage.objects;
CREATE POLICY ace_storage_reviewer_read
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'ace-submissions'
    AND EXISTS (
      SELECT 1
      FROM public.ace_resources r
      JOIN public.ace_course_catalog c ON c.code = r.course_code
      JOIN public.ace_programmes p ON p.id = c.programme_id
      JOIN public.ace_reviewers reviewer ON reviewer.user_id = (SELECT auth.uid())
      WHERE r.storage_path = objects.name
        AND r.status = 'pending'
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );
