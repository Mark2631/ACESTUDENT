-- Harden the MUST SBE BBA pilot boundary across discussions, answers, reviews,
-- competitions, quiz RPCs and private question media. This migration removes
-- legacy permissive policies that would otherwise OR together with scoped rules.

-- A legacy read policy used USING (true), which overrides the newer BBA boundary.
DROP POLICY IF EXISTS ace_posts_read ON public.ace_space_posts;

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

DROP POLICY IF EXISTS ace_spaces_delete ON public.ace_spaces;
CREATE POLICY ace_spaces_delete
  ON public.ace_spaces FOR DELETE TO authenticated
  USING (
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

-- Q&A reads are restricted to units belonging to the pilot programme.
DROP POLICY IF EXISTS ace_course_questions_authenticated_read
  ON public.ace_course_questions;
CREATE POLICY ace_course_questions_authenticated_read
  ON public.ace_course_questions FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.ace_course_catalog c
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE c.code = ace_course_questions.course_code
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );

DROP POLICY IF EXISTS ace_course_answers_authenticated_read
  ON public.ace_course_answers;
CREATE POLICY ace_course_answers_authenticated_read
  ON public.ace_course_answers FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.ace_course_questions q
      JOIN public.ace_course_catalog c ON c.code = q.course_code
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE q.id = ace_course_answers.question_id
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );

DROP POLICY IF EXISTS ace_course_answer_reviews_authenticated_read
  ON public.ace_course_answer_reviews;
CREATE POLICY ace_course_answer_reviews_authenticated_read
  ON public.ace_course_answer_reviews FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.ace_course_answers a
      JOIN public.ace_course_questions q ON q.id = a.question_id
      JOIN public.ace_course_catalog c ON c.code = q.course_code
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE a.id = ace_course_answer_reviews.answer_id
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );

-- Keep question creation, edits and deletion inside the BBA catalogue.
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

DROP POLICY IF EXISTS ace_course_questions_author_delete
  ON public.ace_course_questions;
CREATE POLICY ace_course_questions_author_delete
  ON public.ace_course_questions FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ace_course_catalog c
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE c.code = ace_course_questions.course_code
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.ace_reviewers r
        WHERE r.user_id = (SELECT auth.uid())
      )
      OR (
        author_id = (SELECT auth.uid())
        AND NOT EXISTS (
          SELECT 1
          FROM public.ace_course_answers a
          JOIN public.ace_course_answer_reviews r ON r.answer_id = a.id
          WHERE a.question_id = ace_course_questions.id
        )
      )
    )
  );

-- Answers can only be posted, edited or removed inside a BBA unit.
DROP POLICY IF EXISTS ace_course_answers_author_insert
  ON public.ace_course_answers;
CREATE POLICY ace_course_answers_author_insert
  ON public.ace_course_answers FOR INSERT TO authenticated
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.ace_course_questions q
      JOIN public.ace_course_catalog c ON c.code = q.course_code
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE q.id = ace_course_answers.question_id
        AND q.is_resolved = false
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );

DROP POLICY IF EXISTS ace_course_answers_author_update
  ON public.ace_course_answers;
CREATE POLICY ace_course_answers_author_update
  ON public.ace_course_answers FOR UPDATE TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM public.ace_course_answer_reviews r
      WHERE r.answer_id = ace_course_answers.id
    )
    AND EXISTS (
      SELECT 1
      FROM public.ace_course_questions q
      JOIN public.ace_course_catalog c ON c.code = q.course_code
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE q.id = ace_course_answers.question_id
        AND q.is_resolved = false
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  )
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM public.ace_course_answer_reviews r
      WHERE r.answer_id = ace_course_answers.id
    )
    AND EXISTS (
      SELECT 1
      FROM public.ace_course_questions q
      JOIN public.ace_course_catalog c ON c.code = q.course_code
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE q.id = ace_course_answers.question_id
        AND q.is_resolved = false
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );

DROP POLICY IF EXISTS ace_course_answers_author_or_question_owner_delete
  ON public.ace_course_answers;
CREATE POLICY ace_course_answers_author_or_question_owner_delete
  ON public.ace_course_answers FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ace_course_questions q
      JOIN public.ace_course_catalog c ON c.code = q.course_code
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE q.id = ace_course_answers.question_id
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.ace_reviewers r
        WHERE r.user_id = (SELECT auth.uid())
      )
      OR (
        (
          author_id = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1
            FROM public.ace_course_questions q
            WHERE q.id = ace_course_answers.question_id
              AND q.author_id = (SELECT auth.uid())
          )
        )
        AND NOT EXISTS (
          SELECT 1 FROM public.ace_course_answer_reviews r
          WHERE r.answer_id = ace_course_answers.id
        )
      )
    )
  );

-- Only the question owner or an assigned reviewer may evaluate another student's answer.
-- A reviewer may amend an evaluation, but the answer's author can never evaluate it.
DROP POLICY IF EXISTS ace_course_answer_reviews_question_owner_insert
  ON public.ace_course_answer_reviews;
CREATE POLICY ace_course_answer_reviews_question_owner_insert
  ON public.ace_course_answer_reviews FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = (SELECT auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM public.ace_course_answers own_answer
      WHERE own_answer.id = ace_course_answer_reviews.answer_id
        AND own_answer.author_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1
      FROM public.ace_course_answers a
      JOIN public.ace_course_questions q ON q.id = a.question_id
      JOIN public.ace_course_catalog c ON c.code = q.course_code
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE a.id = ace_course_answer_reviews.answer_id
        AND a.author_id <> (SELECT auth.uid())
        AND (q.author_id = (SELECT auth.uid()) OR EXISTS (
          SELECT 1 FROM public.ace_reviewers r
          WHERE r.user_id = (SELECT auth.uid())
        ))
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );

DROP POLICY IF EXISTS ace_course_answer_reviews_question_owner_update
  ON public.ace_course_answer_reviews;
CREATE POLICY ace_course_answer_reviews_question_owner_update
  ON public.ace_course_answer_reviews FOR UPDATE TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.ace_course_answers own_answer
      WHERE own_answer.id = ace_course_answer_reviews.answer_id
        AND own_answer.author_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1
      FROM public.ace_course_answers a
      JOIN public.ace_course_questions q ON q.id = a.question_id
      JOIN public.ace_course_catalog c ON c.code = q.course_code
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE a.id = ace_course_answer_reviews.answer_id
        AND a.author_id <> (SELECT auth.uid())
        AND (q.author_id = (SELECT auth.uid()) OR EXISTS (
          SELECT 1 FROM public.ace_reviewers r
          WHERE r.user_id = (SELECT auth.uid())
        ))
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  )
  WITH CHECK (
    reviewer_id = (SELECT auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM public.ace_course_answers own_answer
      WHERE own_answer.id = ace_course_answer_reviews.answer_id
        AND own_answer.author_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1
      FROM public.ace_course_answers a
      JOIN public.ace_course_questions q ON q.id = a.question_id
      JOIN public.ace_course_catalog c ON c.code = q.course_code
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE a.id = ace_course_answer_reviews.answer_id
        AND a.author_id <> (SELECT auth.uid())
        AND (q.author_id = (SELECT auth.uid()) OR EXISTS (
          SELECT 1 FROM public.ace_reviewers r
          WHERE r.user_id = (SELECT auth.uid())
        ))
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );

-- Private screenshot objects are readable only by their uploader or when attached
-- to an accessible BBA question/answer.
DROP POLICY IF EXISTS ace_course_media_read_referenced ON storage.objects;
CREATE POLICY ace_course_media_read_referenced
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'ace-course-media'
    AND (
      owner_id = (SELECT auth.uid())::text
      OR EXISTS (
        SELECT 1
        FROM public.ace_course_questions q
        JOIN public.ace_course_catalog c ON c.code = q.course_code
        JOIN public.ace_programmes p ON p.id = c.programme_id
        WHERE q.image_path = objects.name
          AND p.name = 'Bachelor of Business Administration'
          AND p.school = 'School of Business and Economics'
      )
      OR EXISTS (
        SELECT 1
        FROM public.ace_course_answers a
        JOIN public.ace_course_questions q ON q.id = a.question_id
        JOIN public.ace_course_catalog c ON c.code = q.course_code
        JOIN public.ace_programmes p ON p.id = c.programme_id
        WHERE a.image_path = objects.name
          AND p.name = 'Bachelor of Business Administration'
          AND p.school = 'School of Business and Economics'
      )
    )
  );

-- The pilot's quiz catalogue and scoring endpoints must not accept future
-- non-BBA quiz records merely because they are published.
DROP POLICY IF EXISTS ace_quizzes_read ON public.ace_quizzes;
CREATE POLICY ace_quizzes_read
  ON public.ace_quizzes FOR SELECT TO authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1
      FROM public.ace_course_catalog c
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE c.code = ace_quizzes.course_code
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );

CREATE OR REPLACE FUNCTION public.ace_get_questions(p_quiz uuid)
RETURNS TABLE(id uuid, quiz_id uuid, prompt text, options jsonb, sort_order smallint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT q.id, q.quiz_id, q.prompt, q.options, q.sort_order
  FROM public.ace_questions q
  JOIN public.ace_quizzes z ON z.id = q.quiz_id
  JOIN public.ace_course_catalog c
    ON upper(regexp_replace(c.code, '\s', '', 'g')) =
       upper(regexp_replace(z.course_code, '\s', '', 'g'))
  JOIN public.ace_programmes p ON p.id = c.programme_id
  WHERE z.status = 'published'
    AND z.id = p_quiz
    AND (SELECT auth.uid()) IS NOT NULL
    AND p.name = 'Bachelor of Business Administration'
    AND p.school = 'School of Business and Economics'
  ORDER BY q.sort_order;
$function$;

CREATE OR REPLACE FUNCTION public.ace_submit_quiz(p_quiz uuid, p_answers jsonb)
RETURNS TABLE(correct_count integer, total_count integer, xp_awarded integer, explanations jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_correct integer := 0;
  v_total integer := 0;
  v_xp integer := 0;
  v_details jsonb := '[]'::jsonb;
  v_q record;
  v_selected text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF jsonb_typeof(p_answers) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Answers must be an object';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.ace_quizzes z
    JOIN public.ace_course_catalog c
      ON upper(regexp_replace(c.code, '\s', '', 'g')) =
         upper(regexp_replace(z.course_code, '\s', '', 'g'))
    JOIN public.ace_programmes p ON p.id = c.programme_id
    WHERE z.id = p_quiz
      AND z.status = 'published'
      AND p.name = 'Bachelor of Business Administration'
      AND p.school = 'School of Business and Economics'
  ) THEN RAISE EXCEPTION 'Quiz not found'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.ace_quiz_attempts
    WHERE user_id = v_user AND quiz_id = p_quiz
  ) THEN RAISE EXCEPTION 'Quiz already submitted'; END IF;

  FOR v_q IN
    SELECT q.id, q.correct_index, q.explanation
    FROM public.ace_questions q
    WHERE q.quiz_id = p_quiz
    ORDER BY q.sort_order
  LOOP
    v_total := v_total + 1;
    v_selected := p_answers ->> v_q.id::text;
    IF v_selected IS NULL OR v_selected !~ '^[0-3]$' THEN
      RAISE EXCEPTION 'Answer every question';
    END IF;
    IF v_selected::integer = v_q.correct_index THEN
      v_correct := v_correct + 1;
    END IF;
    v_details := v_details || jsonb_build_array(jsonb_build_object(
      'id', v_q.id, 'correct_index', v_q.correct_index, 'explanation', v_q.explanation
    ));
  END LOOP;

  IF v_total = 0 OR (SELECT count(*) FROM jsonb_object_keys(p_answers)) <> v_total THEN
    RAISE EXCEPTION 'Invalid answer set';
  END IF;
  v_xp := v_correct * 10 + CASE WHEN v_correct = v_total THEN 20 ELSE 0 END;
  INSERT INTO public.ace_quiz_attempts(user_id, quiz_id, answers, correct_count, total_count, xp_awarded)
  VALUES (v_user, p_quiz, p_answers, v_correct, v_total, v_xp);
  INSERT INTO public.ace_xp(user_id, xp)
  VALUES (v_user, v_xp)
  ON CONFLICT (user_id) DO UPDATE
    SET xp = public.ace_xp.xp + excluded.xp, updated_at = now();

  RETURN QUERY SELECT v_correct, v_total, v_xp, v_details;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ace_review_attempt(p_quiz uuid)
RETURNS TABLE(correct_count integer, total_count integer, xp_awarded integer, answers jsonb, explanations jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT a.correct_count, a.total_count, a.xp_awarded, a.answers,
    (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', q.id, 'correct_index', q.correct_index, 'explanation', q.explanation
      ) ORDER BY q.sort_order), '[]'::jsonb)
      FROM public.ace_questions q WHERE q.quiz_id = a.quiz_id
    )
  FROM public.ace_quiz_attempts a
  JOIN public.ace_quizzes z ON z.id = a.quiz_id
  JOIN public.ace_course_catalog c
    ON upper(regexp_replace(c.code, '\s', '', 'g')) =
       upper(regexp_replace(z.course_code, '\s', '', 'g'))
  JOIN public.ace_programmes p ON p.id = c.programme_id
  WHERE a.quiz_id = p_quiz
    AND a.user_id = (SELECT auth.uid())
    AND (SELECT auth.uid()) IS NOT NULL
    AND p.name = 'Bachelor of Business Administration'
    AND p.school = 'School of Business and Economics';
$function$;

CREATE OR REPLACE FUNCTION public.ace_submit_challenge(p_challenge uuid, p_answers jsonb)
RETURNS TABLE(correct_count integer, total_count integer, explanations jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_quiz uuid;
  v_correct integer := 0;
  v_total integer := 0;
  v_details jsonb := '[]'::jsonb;
  v_q record;
  v_selection text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  SELECT c.quiz_id INTO v_quiz
  FROM public.ace_challenges c
  JOIN public.ace_quizzes z ON z.id = c.quiz_id
  JOIN public.ace_course_catalog cc
    ON upper(regexp_replace(cc.code, '\s', '', 'g')) =
       upper(regexp_replace(z.course_code, '\s', '', 'g'))
  JOIN public.ace_programmes p ON p.id = cc.programme_id
  WHERE c.id = p_challenge AND c.ends_at > now()
    AND z.status = 'published'
    AND p.name = 'Bachelor of Business Administration'
    AND p.school = 'School of Business and Economics';
  IF v_quiz IS NULL THEN RAISE EXCEPTION 'Competition unavailable or ended'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.ace_challenge_members
    WHERE challenge_id = p_challenge AND user_id = v_user
  ) THEN RAISE EXCEPTION 'Join the competition first'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.ace_challenge_attempts
    WHERE challenge_id = p_challenge AND user_id = v_user
  ) THEN RAISE EXCEPTION 'Competition already completed'; END IF;
  IF jsonb_typeof(p_answers) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Invalid answers';
  END IF;

  FOR v_q IN
    SELECT q.id, q.correct_index, q.explanation
    FROM public.ace_questions q
    WHERE q.quiz_id = v_quiz
    ORDER BY q.sort_order
  LOOP
    v_total := v_total + 1;
    v_selection := p_answers ->> v_q.id::text;
    IF v_selection IS NULL OR v_selection !~ '^[0-3]$' THEN
      RAISE EXCEPTION 'Answer every question';
    END IF;
    IF v_selection::integer = v_q.correct_index THEN
      v_correct := v_correct + 1;
    END IF;
    v_details := v_details || jsonb_build_array(jsonb_build_object(
      'id', v_q.id, 'correct_index', v_q.correct_index, 'explanation', v_q.explanation
    ));
  END LOOP;
  IF v_total = 0 OR (SELECT count(*) FROM jsonb_object_keys(p_answers)) <> v_total THEN
    RAISE EXCEPTION 'Incomplete answer set';
  END IF;
  INSERT INTO public.ace_challenge_attempts(user_id, challenge_id, answers, correct_count, total_count)
  VALUES (v_user, p_challenge, p_answers, v_correct, v_total);
  RETURN QUERY SELECT v_correct, v_total, v_details;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ace_review_challenge_attempt(p_challenge uuid)
RETURNS TABLE(correct_count integer, total_count integer, answers jsonb, explanations jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT a.correct_count, a.total_count, a.answers,
    (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', q.id, 'correct_index', q.correct_index, 'explanation', q.explanation
      ) ORDER BY q.sort_order), '[]'::jsonb)
      FROM public.ace_questions q WHERE q.quiz_id = c.quiz_id
    )
  FROM public.ace_challenges c
  JOIN public.ace_challenge_attempts a ON a.challenge_id = c.id
  JOIN public.ace_quizzes z ON z.id = c.quiz_id
  JOIN public.ace_course_catalog cc
    ON upper(regexp_replace(cc.code, '\s', '', 'g')) =
       upper(regexp_replace(z.course_code, '\s', '', 'g'))
  JOIN public.ace_programmes p ON p.id = cc.programme_id
  WHERE c.id = p_challenge
    AND a.user_id = (SELECT auth.uid())
    AND (SELECT auth.uid()) IS NOT NULL
    AND p.name = 'Bachelor of Business Administration'
    AND p.school = 'School of Business and Economics';
$function$;

CREATE OR REPLACE FUNCTION public.ace_challenge_standings(p_challenge uuid)
RETURNS TABLE(
  participant uuid,
  display_name text,
  score integer,
  total integer,
  earned_xp integer,
  completed_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT m.user_id,
    coalesce(nullif(trim(p.full_name), ''), 'Student') AS display_name,
    a.correct_count, a.total_count, 0::integer, a.submitted_at
  FROM public.ace_challenge_members m
  JOIN public.ace_challenges c ON c.id = m.challenge_id
  JOIN public.ace_quizzes z ON z.id = c.quiz_id
  JOIN public.ace_course_catalog cc
    ON upper(regexp_replace(cc.code, '\s', '', 'g')) =
       upper(regexp_replace(z.course_code, '\s', '', 'g'))
  JOIN public.ace_programmes prog ON prog.id = cc.programme_id
  LEFT JOIN public.ace_challenge_attempts a
    ON a.user_id = m.user_id AND a.challenge_id = c.id
  LEFT JOIN public.ace_student_profiles p ON p.user_id = m.user_id
  WHERE m.challenge_id = p_challenge
    AND (SELECT auth.uid()) IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.ace_challenge_members mine
        WHERE mine.challenge_id = p_challenge
          AND mine.user_id = (SELECT auth.uid())
      )
      OR c.creator_id = (SELECT auth.uid())
    )
    AND prog.name = 'Bachelor of Business Administration'
    AND prog.school = 'School of Business and Economics'
  ORDER BY a.correct_count DESC NULLS LAST, a.submitted_at ASC NULLS LAST, m.joined_at ASC
  LIMIT 200;
$function$;

-- Repeated ratings must be limited to a real, due BBA review card.
CREATE OR REPLACE FUNCTION public.ace_rate_review_card(p_question uuid, p_rating smallint)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_due timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF p_rating NOT IN (0,1,2) THEN RAISE EXCEPTION 'Invalid review rating'; END IF;
  UPDATE public.ace_review_cards card
  SET interval_days = CASE
        WHEN p_rating = 0 THEN 0
        WHEN p_rating = 1 THEN greatest(1, least(14, card.interval_days * 2))
        ELSE greatest(3, least(30, card.interval_days * 3))
      END,
      correct_streak = CASE
        WHEN p_rating = 0 THEN 0
        ELSE least(100, card.correct_streak + 1)
      END,
      last_reviewed_at = now(),
      due_at = now() + CASE
        WHEN p_rating = 0 THEN interval '10 minutes'
        WHEN p_rating = 1 THEN make_interval(days => greatest(1, least(14, card.interval_days * 2)))
        ELSE make_interval(days => greatest(3, least(30, card.interval_days * 3)))
      END
  FROM public.ace_questions q
  JOIN public.ace_quizzes z ON z.id = q.quiz_id
  JOIN public.ace_course_catalog cc
    ON upper(regexp_replace(cc.code, '\s', '', 'g')) =
       upper(regexp_replace(z.course_code, '\s', '', 'g'))
  JOIN public.ace_programmes p ON p.id = cc.programme_id
  WHERE card.question_id = q.id
    AND card.user_id = (SELECT auth.uid())
    AND card.question_id = p_question
    AND card.due_at <= now()
    AND p.name = 'Bachelor of Business Administration'
    AND p.school = 'School of Business and Economics'
  RETURNING card.due_at INTO v_due;
  IF v_due IS NULL THEN RAISE EXCEPTION 'Card not due or unavailable'; END IF;
  RETURN v_due;
END;
$function$;

-- Restrict competition discovery and creation to published quizzes in the BBA pilot.
DROP POLICY IF EXISTS ace_challenges_read ON public.ace_challenges;
CREATE POLICY ace_challenges_read
  ON public.ace_challenges FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ace_quizzes z
      JOIN public.ace_course_catalog c
        ON upper(regexp_replace(c.code, '\s', '', 'g')) =
           upper(regexp_replace(z.course_code, '\s', '', 'g'))
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE z.id = ace_challenges.quiz_id
        AND z.status = 'published'
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );

DROP POLICY IF EXISTS ace_challenges_insert ON public.ace_challenges;
CREATE POLICY ace_challenges_insert
  ON public.ace_challenges FOR INSERT TO authenticated
  WITH CHECK (
    creator_id = (SELECT auth.uid())
    AND ends_at > now()
    AND ends_at <= now() + interval '30 days'
    AND EXISTS (
      SELECT 1
      FROM public.ace_quizzes z
      JOIN public.ace_course_catalog c
        ON upper(regexp_replace(c.code, '\s', '', 'g')) =
           upper(regexp_replace(z.course_code, '\s', '', 'g'))
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE z.id = ace_challenges.quiz_id
        AND z.status = 'published'
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );

DROP POLICY IF EXISTS ace_challenges_delete ON public.ace_challenges;
CREATE POLICY ace_challenges_delete
  ON public.ace_challenges FOR DELETE TO authenticated
  USING (
    creator_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.ace_quizzes z
      JOIN public.ace_course_catalog c
        ON upper(regexp_replace(c.code, '\s', '', 'g')) =
           upper(regexp_replace(z.course_code, '\s', '', 'g'))
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE z.id = ace_challenges.quiz_id
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );

DROP POLICY IF EXISTS ace_challenge_members_insert ON public.ace_challenge_members;
CREATE POLICY ace_challenge_members_insert
  ON public.ace_challenge_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.ace_challenges challenge
      JOIN public.ace_quizzes z ON z.id = challenge.quiz_id
      JOIN public.ace_course_catalog c
        ON upper(regexp_replace(c.code, '\s', '', 'g')) =
           upper(regexp_replace(z.course_code, '\s', '', 'g'))
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE challenge.id = ace_challenge_members.challenge_id
        AND challenge.ends_at > now()
        AND z.status = 'published'
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );

DROP POLICY IF EXISTS ace_challenge_members_read ON public.ace_challenge_members;
CREATE POLICY ace_challenge_members_read
  ON public.ace_challenge_members FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.ace_challenges challenge
      JOIN public.ace_quizzes z ON z.id = challenge.quiz_id
      JOIN public.ace_course_catalog c
        ON upper(regexp_replace(c.code, '\s', '', 'g')) =
           upper(regexp_replace(z.course_code, '\s', '', 'g'))
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE challenge.id = ace_challenge_members.challenge_id
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );

DROP POLICY IF EXISTS ace_challenge_attempts_own_read ON public.ace_challenge_attempts;
CREATE POLICY ace_challenge_attempts_own_read
  ON public.ace_challenge_attempts FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.ace_challenges challenge
      JOIN public.ace_quizzes z ON z.id = challenge.quiz_id
      JOIN public.ace_course_catalog c
        ON upper(regexp_replace(c.code, '\s', '', 'g')) =
           upper(regexp_replace(z.course_code, '\s', '', 'g'))
      JOIN public.ace_programmes p ON p.id = c.programme_id
      WHERE challenge.id = ace_challenge_attempts.challenge_id
        AND p.name = 'Bachelor of Business Administration'
        AND p.school = 'School of Business and Economics'
    )
  );
