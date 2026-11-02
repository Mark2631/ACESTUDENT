-- Enforce the MUST School of Business and Economics BBA pilot boundary
-- across student documents, study spaces, discussions and shared revision notes.

DROP POLICY IF EXISTS ace_resources_read ON public.ace_resources;
CREATE POLICY ace_resources_read
  ON public.ace_resources FOR SELECT TO anon, authenticated
  USING (
    (status = 'approved' OR uploader_id = (SELECT auth.uid()))
    AND EXISTS (
      SELECT 1
      FROM public.ace_course_catalog c
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE c.code = ace_resources.course_code
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );

DROP POLICY IF EXISTS ace_resources_reviewer_read ON public.ace_resources;
CREATE POLICY ace_resources_reviewer_read
  ON public.ace_resources FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ace_reviewers reviewer
      WHERE reviewer.user_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1
      FROM public.ace_course_catalog c
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE c.code = ace_resources.course_code
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );

DROP POLICY IF EXISTS ace_resources_submit ON public.ace_resources;
CREATE POLICY ace_resources_submit
  ON public.ace_resources FOR INSERT TO authenticated
  WITH CHECK (
    uploader_id = (SELECT auth.uid())
    AND status = 'pending'
    AND reviewed_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.ace_course_catalog c
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE c.code = ace_resources.course_code
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );

DROP POLICY IF EXISTS ace_spaces_read ON public.ace_spaces;
CREATE POLICY ace_spaces_read
  ON public.ace_spaces FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ace_course_catalog c
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE c.code = ace_spaces.course_code
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );

DROP POLICY IF EXISTS ace_spaces_insert ON public.ace_spaces;
CREATE POLICY ace_spaces_insert
  ON public.ace_spaces FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.ace_course_catalog c
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE c.code = ace_spaces.course_code
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );

DROP POLICY IF EXISTS ace_space_posts_read ON public.ace_space_posts;
CREATE POLICY ace_space_posts_read
  ON public.ace_space_posts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ace_spaces s
      JOIN public.ace_course_catalog c ON c.code = s.course_code
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE s.id = ace_space_posts.space_id
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );

DROP POLICY IF EXISTS ace_posts_insert ON public.ace_space_posts;
CREATE POLICY ace_posts_insert
  ON public.ace_space_posts FOR INSERT TO authenticated
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.ace_spaces s
      JOIN public.ace_course_catalog c ON c.code = s.course_code
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE s.id = ace_space_posts.space_id
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );

DROP POLICY IF EXISTS ace_posts_delete ON public.ace_space_posts;
CREATE POLICY ace_posts_delete
  ON public.ace_space_posts FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ace_spaces s
      JOIN public.ace_course_catalog c ON c.code = s.course_code
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE s.id = ace_space_posts.space_id
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
    AND (
      author_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.ace_spaces s
        WHERE s.id = ace_space_posts.space_id
          AND s.owner_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS ace_notes_select ON public.ace_shared_notes;
CREATE POLICY ace_notes_select
  ON public.ace_shared_notes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ace_course_catalog c
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE c.code = ace_shared_notes.course_code
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
    AND (
      owner_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.ace_note_members m
        WHERE m.note_id = ace_shared_notes.id
          AND m.user_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS ace_notes_insert ON public.ace_shared_notes;
CREATE POLICY ace_notes_insert
  ON public.ace_shared_notes FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.ace_course_catalog c
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE c.code = ace_shared_notes.course_code
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );

DROP POLICY IF EXISTS ace_notes_update ON public.ace_shared_notes;
CREATE POLICY ace_notes_update
  ON public.ace_shared_notes FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ace_course_catalog c
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE c.code = ace_shared_notes.course_code
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
    AND (
      owner_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.ace_note_members m
        WHERE m.note_id = ace_shared_notes.id
          AND m.user_id = (SELECT auth.uid())
          AND m.role = 'editor'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.ace_course_catalog c
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE c.code = ace_shared_notes.course_code
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
    AND (
      owner_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.ace_note_members m
        WHERE m.note_id = ace_shared_notes.id
          AND m.user_id = (SELECT auth.uid())
          AND m.role = 'editor'
      )
    )
  );

DROP POLICY IF EXISTS ace_notes_delete ON public.ace_shared_notes;
CREATE POLICY ace_notes_delete
  ON public.ace_shared_notes FOR DELETE TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.ace_course_catalog c
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE c.code = ace_shared_notes.course_code
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );
