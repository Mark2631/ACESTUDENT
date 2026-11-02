-- The pilot's spaced review queue must never surface questions from unrelated programmes.
CREATE OR REPLACE FUNCTION public.ace_due_review_cards()
RETURNS TABLE(
  question_id uuid,
  prompt text,
  correct_answer text,
  explanation text,
  due_at timestamptz,
  interval_days integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT
    c.question_id,
    q.prompt,
    q.options ->> q.correct_index,
    q.explanation,
    c.due_at,
    c.interval_days
  FROM public.ace_review_cards c
  JOIN public.ace_questions q ON q.id = c.question_id
  JOIN public.ace_quizzes z ON z.id = q.quiz_id
  JOIN public.ace_course_catalog cc
    ON upper(regexp_replace(cc.code, '\s', '', 'g')) =
       upper(regexp_replace(z.course_code, '\s', '', 'g'))
  JOIN public.ace_programmes p ON p.id = cc.programme_id
  WHERE c.user_id = (SELECT auth.uid())
    AND (SELECT auth.uid()) IS NOT NULL
    AND c.due_at <= now()
    AND p.name = 'Bachelor of Business Administration'
    AND p.school = 'School of Business and Economics'
  ORDER BY c.due_at
  LIMIT 40;
$function$;
