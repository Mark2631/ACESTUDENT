-- Avoid depending on a generated programme UUID in BBA pilot policies.
-- Scope question creation and author edits by the named programme and school.
DROP POLICY IF EXISTS ace_course_questions_author_insert
  ON public.ace_course_questions;
CREATE POLICY ace_course_questions_author_insert
  ON public.ace_course_questions FOR INSERT TO authenticated
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.ace_course_catalog c
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE c.code = ace_course_questions.course_code
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );

DROP POLICY IF EXISTS ace_course_questions_author_update
  ON public.ace_course_questions;
CREATE POLICY ace_course_questions_author_update
  ON public.ace_course_questions FOR UPDATE TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.ace_course_catalog c
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE c.code = ace_course_questions.course_code
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  )
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.ace_course_catalog c
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE c.code = ace_course_questions.course_code
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );
