-- Correct review-row correlation and restrict discussion creation to the BBA pilot.
-- Keep reviewed answers and their evaluations immutable for ordinary users.
DROP POLICY IF EXISTS ace_course_questions_author_insert ON public.ace_course_questions;
CREATE POLICY ace_course_questions_author_insert
  ON public.ace_course_questions FOR INSERT TO authenticated
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.ace_course_catalog c
      WHERE c.code = ace_course_questions.course_code
        AND c.programme_id = 'b93bfd2c-ce49-479e-8c17-e12b321e9dd9'::uuid
    )
  );

DROP POLICY IF EXISTS ace_course_questions_author_update ON public.ace_course_questions;
CREATE POLICY ace_course_questions_author_update
  ON public.ace_course_questions FOR UPDATE TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.ace_course_catalog c
      WHERE c.code = ace_course_questions.course_code
        AND c.programme_id = 'b93bfd2c-ce49-479e-8c17-e12b321e9dd9'::uuid
    )
  )
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.ace_course_catalog c
      WHERE c.code = ace_course_questions.course_code
        AND c.programme_id = 'b93bfd2c-ce49-479e-8c17-e12b321e9dd9'::uuid
    )
  );

DROP POLICY IF EXISTS ace_course_questions_author_delete ON public.ace_course_questions;
CREATE POLICY ace_course_questions_author_delete
  ON public.ace_course_questions FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.ace_reviewers r WHERE r.user_id = (SELECT auth.uid()))
    OR (
      author_id = (SELECT auth.uid())
      AND NOT EXISTS (
        SELECT 1
        FROM public.ace_course_answers a
        JOIN public.ace_course_answer_reviews r ON r.answer_id = a.id
        WHERE a.question_id = ace_course_questions.id
      )
    )
  );

DROP POLICY IF EXISTS ace_course_answers_author_update ON public.ace_course_answers;
CREATE POLICY ace_course_answers_author_update
  ON public.ace_course_answers FOR UPDATE TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM public.ace_course_answer_reviews r
      WHERE r.answer_id = ace_course_answers.id
    )
  )
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.ace_course_questions q
      WHERE q.id = ace_course_answers.question_id AND q.is_resolved = false
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.ace_course_answer_reviews r
      WHERE r.answer_id = ace_course_answers.id
    )
  );

DROP POLICY IF EXISTS ace_course_answers_author_or_question_owner_delete ON public.ace_course_answers;
CREATE POLICY ace_course_answers_author_or_question_owner_delete
  ON public.ace_course_answers FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.ace_reviewers r WHERE r.user_id = (SELECT auth.uid()))
    OR (
      (
        author_id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.ace_course_questions q
          WHERE q.id = ace_course_answers.question_id
            AND q.author_id = (SELECT auth.uid())
        )
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.ace_course_answer_reviews r
        WHERE r.answer_id = ace_course_answers.id
      )
    )
  );

DROP POLICY IF EXISTS ace_course_answer_reviews_question_owner_update ON public.ace_course_answer_reviews;
CREATE POLICY ace_course_answer_reviews_question_owner_update
  ON public.ace_course_answer_reviews FOR UPDATE TO authenticated
  USING (
    reviewer_id = (SELECT auth.uid())
    AND (
      EXISTS (
        SELECT 1
        FROM public.ace_course_answers a
        JOIN public.ace_course_questions q ON q.id = a.question_id
        WHERE a.id = ace_course_answer_reviews.answer_id
          AND q.author_id = (SELECT auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM public.ace_reviewers r WHERE r.user_id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    reviewer_id = (SELECT auth.uid())
    AND (
      EXISTS (
        SELECT 1
        FROM public.ace_course_answers a
        JOIN public.ace_course_questions q ON q.id = a.question_id
        WHERE a.id = ace_course_answer_reviews.answer_id
          AND q.author_id = (SELECT auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM public.ace_reviewers r WHERE r.user_id = (SELECT auth.uid())
      )
    )
  );
