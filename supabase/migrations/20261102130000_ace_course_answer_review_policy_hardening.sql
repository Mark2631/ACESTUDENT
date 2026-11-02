-- Tighten update checks so answer records cannot be moved after review.
DROP POLICY IF EXISTS ace_course_answers_author_update ON public.ace_course_answers;
CREATE POLICY ace_course_answers_author_update
  ON public.ace_course_answers FOR UPDATE TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM public.ace_course_answer_reviews r WHERE r.answer_id = id
    )
  )
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.ace_course_questions q
      WHERE q.id = question_id AND q.is_resolved = false
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.ace_course_answer_reviews r WHERE r.answer_id = id
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
        WHERE a.id = answer_id AND q.author_id = (SELECT auth.uid())
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
        WHERE a.id = answer_id AND q.author_id = (SELECT auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM public.ace_reviewers r WHERE r.user_id = (SELECT auth.uid())
      )
    )
  );
