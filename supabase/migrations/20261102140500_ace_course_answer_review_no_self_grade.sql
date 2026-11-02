-- Prevent self-evaluation even when a client calls the table API directly.
DROP POLICY IF EXISTS ace_course_answer_reviews_question_owner_insert
  ON public.ace_course_answer_reviews;
CREATE POLICY ace_course_answer_reviews_question_owner_insert
  ON public.ace_course_answer_reviews FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = (SELECT auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM public.ace_course_answers own_answer
      WHERE own_answer.id = answer_id
        AND own_answer.author_id = (SELECT auth.uid())
    )
    AND (
      EXISTS (
        SELECT 1
        FROM public.ace_course_answers a
        JOIN public.ace_course_questions q ON q.id = a.question_id
        WHERE a.id = answer_id
          AND a.author_id <> (SELECT auth.uid())
          AND q.author_id = (SELECT auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM public.ace_reviewers r
        WHERE r.user_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS ace_course_answer_reviews_question_owner_update
  ON public.ace_course_answer_reviews;
CREATE POLICY ace_course_answer_reviews_question_owner_update
  ON public.ace_course_answer_reviews FOR UPDATE TO authenticated
  USING (
    reviewer_id = (SELECT auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM public.ace_course_answers own_answer
      WHERE own_answer.id = ace_course_answer_reviews.answer_id
        AND own_answer.author_id = (SELECT auth.uid())
    )
    AND (
      EXISTS (
        SELECT 1
        FROM public.ace_course_answers a
        JOIN public.ace_course_questions q ON q.id = a.question_id
        WHERE a.id = ace_course_answer_reviews.answer_id
          AND a.author_id <> (SELECT auth.uid())
          AND q.author_id = (SELECT auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM public.ace_reviewers r
        WHERE r.user_id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    reviewer_id = (SELECT auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM public.ace_course_answers own_answer
      WHERE own_answer.id = ace_course_answer_reviews.answer_id
        AND own_answer.author_id = (SELECT auth.uid())
    )
    AND (
      EXISTS (
        SELECT 1
        FROM public.ace_course_answers a
        JOIN public.ace_course_questions q ON q.id = a.question_id
        WHERE a.id = ace_course_answer_reviews.answer_id
          AND a.author_id <> (SELECT auth.uid())
          AND q.author_id = (SELECT auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM public.ace_reviewers r
        WHERE r.user_id = (SELECT auth.uid())
      )
    )
  );
