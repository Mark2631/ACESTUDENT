-- Keep Q&A read policies stable under load and index the new author/reviewer foreign keys.
DROP POLICY IF EXISTS ace_course_questions_authenticated_read ON public.ace_course_questions;
CREATE POLICY ace_course_questions_authenticated_read
  ON public.ace_course_questions FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS ace_course_answers_authenticated_read ON public.ace_course_answers;
CREATE POLICY ace_course_answers_authenticated_read
  ON public.ace_course_answers FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS ace_course_answer_reviews_authenticated_read ON public.ace_course_answer_reviews;
CREATE POLICY ace_course_answer_reviews_authenticated_read
  ON public.ace_course_answer_reviews FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE INDEX IF NOT EXISTS ace_course_questions_author_idx
  ON public.ace_course_questions(author_id);
CREATE INDEX IF NOT EXISTS ace_course_answers_author_idx
  ON public.ace_course_answers(author_id);
CREATE INDEX IF NOT EXISTS ace_course_answer_reviews_reviewer_idx
  ON public.ace_course_answer_reviews(reviewer_id);
