-- Keep approved/private student resources readable by the right audience without
-- overlapping permissive SELECT policies. Add indexes for the SBE BBA pilot's
-- catalogue, competition, discussion and study-session access paths.

DROP POLICY IF EXISTS ace_resources_read ON public.ace_resources;
DROP POLICY IF EXISTS ace_resources_reviewer_read ON public.ace_resources;
CREATE POLICY ace_resources_read
  ON public.ace_resources FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ace_course_catalog c
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE c.code = ace_resources.course_code
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
    AND (
      status = 'approved'
      OR uploader_id = (SELECT auth.uid())
      OR (
        (SELECT auth.uid()) IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.ace_reviewers reviewer
          WHERE reviewer.user_id = (SELECT auth.uid())
        )
      )
    )
  );

CREATE INDEX IF NOT EXISTS ace_course_catalog_code_idx
  ON public.ace_course_catalog (code);
CREATE INDEX IF NOT EXISTS ace_programmes_school_name_idx
  ON public.ace_programmes (school, name);
CREATE INDEX IF NOT EXISTS ace_quizzes_course_status_created_idx
  ON public.ace_quizzes (course_code, status, created_at DESC);

CREATE INDEX IF NOT EXISTS ace_challenges_creator_created_idx
  ON public.ace_challenges (creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ace_challenges_quiz_ends_idx
  ON public.ace_challenges (quiz_id, ends_at);
CREATE INDEX IF NOT EXISTS ace_challenge_members_user_challenge_idx
  ON public.ace_challenge_members (user_id, challenge_id);
CREATE INDEX IF NOT EXISTS ace_challenge_attempts_challenge_user_idx
  ON public.ace_challenge_attempts (challenge_id, user_id);

CREATE INDEX IF NOT EXISTS ace_spaces_owner_created_idx
  ON public.ace_spaces (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ace_space_posts_space_created_idx
  ON public.ace_space_posts (space_id, created_at);
CREATE INDEX IF NOT EXISTS ace_space_posts_author_idx
  ON public.ace_space_posts (author_id);

CREATE INDEX IF NOT EXISTS ace_quiz_attempts_quiz_id_idx
  ON public.ace_quiz_attempts (quiz_id);
CREATE INDEX IF NOT EXISTS ace_review_cards_question_id_idx
  ON public.ace_review_cards (question_id);
CREATE INDEX IF NOT EXISTS ace_study_sessions_space_starts_idx
  ON public.ace_study_sessions (space_id, starts_at);
CREATE INDEX IF NOT EXISTS ace_study_sessions_host_id_idx
  ON public.ace_study_sessions (host_id);
CREATE INDEX IF NOT EXISTS ace_session_attendees_user_id_idx
  ON public.ace_session_attendees (user_id);
