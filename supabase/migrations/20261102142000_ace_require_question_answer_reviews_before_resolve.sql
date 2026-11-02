-- A question cannot be marked resolved while any answer is still awaiting evaluation.
DROP POLICY IF EXISTS ace_course_questions_author_update ON public.ace_course_questions;
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
    AND (
      is_resolved = false
      OR NOT EXISTS (
        SELECT 1
        FROM public.ace_course_answers a
        WHERE a.question_id = ace_course_questions.id
          AND NOT EXISTS (
            SELECT 1
            FROM public.ace_course_answer_reviews r
            WHERE r.answer_id = a.id
          )
      )
    )
  );
