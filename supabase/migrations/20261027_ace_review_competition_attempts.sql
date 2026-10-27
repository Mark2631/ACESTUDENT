create function public.ace_review_challenge_attempt(p_challenge uuid)
returns table(correct_count integer,total_count integer,answers jsonb,explanations jsonb)
language sql stable security definer set search_path='' as $$
select a.correct_count,a.total_count,a.answers,
(select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'correct_index',q.correct_index,'explanation',q.explanation) order by q.sort_order),'[]'::jsonb) from public.ace_questions q where q.quiz_id=c.quiz_id)
from public.ace_challenge_attempts a join public.ace_challenges c on c.id=a.challenge_id
where a.challenge_id=p_challenge and a.user_id=auth.uid() and auth.uid() is not null $$;
revoke all on function public.ace_review_challenge_attempt(uuid) from public,anon;grant execute on function public.ace_review_challenge_attempt(uuid) to authenticated;