create function public.ace_review_attempt(p_quiz uuid) returns table(correct_count integer,total_count integer,xp_awarded integer,answers jsonb,explanations jsonb) language sql stable security definer set search_path='' as $$
select a.correct_count,a.total_count,a.xp_awarded,a.answers,
(select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'correct_index',q.correct_index,'explanation',q.explanation) order by q.sort_order),'[]'::jsonb) from public.ace_questions q where q.quiz_id=a.quiz_id)
from public.ace_quiz_attempts a where a.quiz_id=p_quiz and a.user_id=auth.uid() and auth.uid() is not null $$;
revoke all on function public.ace_review_attempt(uuid) from public,anon;
grant execute on function public.ace_review_attempt(uuid) to authenticated;