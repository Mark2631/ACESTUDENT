-- SBE BBA course discussion: question threads, peer answers, and explicit answer review.
-- Question/answer images are private to signed-in Ace users and are secured by Storage RLS.
-- Model-answer PDFs reuse the existing reviewer workflow in ace_resources.

ALTER TABLE public.ace_resources
  DROP CONSTRAINT IF EXISTS ace_resources_kind_check;

ALTER TABLE public.ace_resources
  ADD CONSTRAINT ace_resources_kind_check
  CHECK (kind = ANY (ARRAY['Notes'::text, 'Past paper'::text, 'Revision guide'::text, 'Slides'::text, 'Model answer'::text]));

ALTER TABLE public.ace_resources
  DROP CONSTRAINT IF EXISTS ace_model_answer_requires_paper;

ALTER TABLE public.ace_resources
  ADD CONSTRAINT ace_model_answer_requires_paper
  CHECK (kind <> 'Model answer' OR related_paper_id IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.ace_course_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code text NOT NULL CHECK (char_length(trim(course_code)) BETWEEN 2 AND 30),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 5 AND 180),
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 5 AND 6000),
  question_type text NOT NULL DEFAULT 'concept'
    CHECK (question_type IN ('concept','calculation','case_study','exam_question','discussion')),
  image_path text,
  is_resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ace_course_question_image_owner CHECK (
    image_path IS NULL OR split_part(image_path, '/', 1) = author_id::text
  )
);

CREATE TABLE IF NOT EXISTS public.ace_course_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.ace_course_questions(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 2 AND 6000),
  image_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ace_course_answer_image_owner CHECK (
    image_path IS NULL OR split_part(image_path, '/', 1) = author_id::text
  )
);

CREATE TABLE IF NOT EXISTS public.ace_course_answer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id uuid NOT NULL UNIQUE REFERENCES public.ace_course_answers(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verdict text NOT NULL CHECK (verdict IN ('correct','partly_correct','needs_revision')),
  feedback text NOT NULL DEFAULT '' CHECK (char_length(feedback) <= 1600),
  reviewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ace_course_questions_code_created_idx
  ON public.ace_course_questions(course_code, created_at DESC);
CREATE INDEX IF NOT EXISTS ace_course_answers_question_created_idx
  ON public.ace_course_answers(question_id, created_at);
CREATE INDEX IF NOT EXISTS ace_course_answer_reviews_answer_idx
  ON public.ace_course_answer_reviews(answer_id);

ALTER TABLE public.ace_course_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ace_course_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ace_course_answer_reviews ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ace_course_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ace_course_answers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ace_course_answer_reviews TO authenticated;

DROP POLICY IF EXISTS ace_course_questions_authenticated_read ON public.ace_course_questions;
CREATE POLICY ace_course_questions_authenticated_read
  ON public.ace_course_questions FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS ace_course_questions_author_insert ON public.ace_course_questions;
CREATE POLICY ace_course_questions_author_insert
  ON public.ace_course_questions FOR INSERT TO authenticated
  WITH CHECK (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS ace_course_questions_author_update ON public.ace_course_questions;
CREATE POLICY ace_course_questions_author_update
  ON public.ace_course_questions FOR UPDATE TO authenticated
  USING (author_id = (SELECT auth.uid()))
  WITH CHECK (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS ace_course_questions_author_delete ON public.ace_course_questions;
CREATE POLICY ace_course_questions_author_delete
  ON public.ace_course_questions FOR DELETE TO authenticated
  USING (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS ace_course_answers_authenticated_read ON public.ace_course_answers;
CREATE POLICY ace_course_answers_authenticated_read
  ON public.ace_course_answers FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS ace_course_answers_author_insert ON public.ace_course_answers;
CREATE POLICY ace_course_answers_author_insert
  ON public.ace_course_answers FOR INSERT TO authenticated
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.ace_course_questions q
      WHERE q.id = question_id AND q.is_resolved = false
    )
  );

DROP POLICY IF EXISTS ace_course_answers_author_update ON public.ace_course_answers;
CREATE POLICY ace_course_answers_author_update
  ON public.ace_course_answers FOR UPDATE TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM public.ace_course_answer_reviews r WHERE r.answer_id = id
    )
  )
  WITH CHECK (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS ace_course_answers_author_or_question_owner_delete ON public.ace_course_answers;
CREATE POLICY ace_course_answers_author_or_question_owner_delete
  ON public.ace_course_answers FOR DELETE TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.ace_course_questions q
      WHERE q.id = question_id AND q.author_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS ace_course_answer_reviews_authenticated_read ON public.ace_course_answer_reviews;
CREATE POLICY ace_course_answer_reviews_authenticated_read
  ON public.ace_course_answer_reviews FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS ace_course_answer_reviews_question_owner_insert ON public.ace_course_answer_reviews;
CREATE POLICY ace_course_answer_reviews_question_owner_insert
  ON public.ace_course_answer_reviews FOR INSERT TO authenticated
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
  WITH CHECK (reviewer_id = (SELECT auth.uid()));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ace-course-media',
  'ace-course-media',
  false,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp']::text[];

DROP POLICY IF EXISTS ace_course_media_insert_own ON storage.objects;
CREATE POLICY ace_course_media_insert_own
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ace-course-media'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS ace_course_media_read_referenced ON storage.objects;
CREATE POLICY ace_course_media_read_referenced
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'ace-course-media'
    AND (
      owner_id = (SELECT auth.uid())::text
      OR EXISTS (
        SELECT 1 FROM public.ace_course_questions q WHERE q.image_path = objects.name
      )
      OR EXISTS (
        SELECT 1 FROM public.ace_course_answers a WHERE a.image_path = objects.name
      )
    )
  );

DROP POLICY IF EXISTS ace_course_media_delete_own_orphan ON storage.objects;
CREATE POLICY ace_course_media_delete_own_orphan
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'ace-course-media'
    AND owner_id = (SELECT auth.uid())::text
    AND NOT EXISTS (
      SELECT 1 FROM public.ace_course_questions q WHERE q.image_path = objects.name
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.ace_course_answers a WHERE a.image_path = objects.name
    )
  );

COMMENT ON TABLE public.ace_course_questions IS
  'MUST School of Business and Economics pilot: unit-level student questions and exam-discussion prompts.';
COMMENT ON TABLE public.ace_course_answers IS
  'Peer answers to course questions. Each starts unreviewed until the question owner or a reviewer evaluates it.';
COMMENT ON TABLE public.ace_course_answer_reviews IS
  'Explicit human review of one peer answer: correct, partly correct, or needs revision.';
