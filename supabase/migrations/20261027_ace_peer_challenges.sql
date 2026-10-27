create table public.ace_challenges(id uuid primary key default gen_random_uuid(),creator_id uuid not null references auth.users(id) on delete cascade,quiz_id uuid not null references public.ace_quizzes(id),title text not null check(char_length(trim(title)) between 4 and 100),created_at timestamptz not null default now(),ends_at timestamptz not null default (now()+interval '7 days'),check(ends_at>created_at));
create table public.ace_challenge_members(challenge_id uuid not null references public.ace_challenges(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,joined_at timestamptz not null default now(),primary key(challenge_id,user_id));
alter table public.ace_challenges enable row level security;alter table public.ace_challenge_members enable row level security;
create policy ace_challenges_read on public.ace_challenges for select to authenticated using(true);
create policy ace_challenges_insert on public.ace_challenges for insert to authenticated with check(creator_id=(select auth.uid()) and exists(select 1 from public.ace_quizzes q where q.id=quiz_id and q.status='published') and ends_at<=now()+interval '30 days');
create policy ace_challenges_delete on public.ace_challenges for delete to authenticated using(creator_id=(select auth.uid()));
create policy ace_challenge_members_read on public.ace_challenge_members for select to authenticated using(user_id=(select auth.uid()));
create policy ace_challenge_members_insert on public.ace_challenge_members for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.ace_challenges c where c.id=challenge_id and c.ends_at>now()));
grant select,insert,delete on public.ace_challenges to authenticated;grant select,insert on public.ace_challenge_members to authenticated;
create function public.ace_challenge_standings(p_challenge uuid) returns table(participant uuid,display_name text,score integer,total integer,earned_xp integer,completed_at timestamptz) language sql stable security definer set search_path='' as $$
select m.user_id,coalesce(nullif(trim(p.full_name),''),'Student') as display_name,a.correct_count,a.total_count,a.xp_awarded,a.submitted_at
from public.ace_challenge_members m join public.ace_challenges c on c.id=m.challenge_id
left join public.ace_quiz_attempts a on a.user_id=m.user_id and a.quiz_id=c.quiz_id
left join public.ace_student_profiles p on p.user_id=m.user_id
where m.challenge_id=p_challenge and (exists(select 1 from public.ace_challenge_members mine where mine.challenge_id=p_challenge and mine.user_id=auth.uid()) or c.creator_id=auth.uid()) and auth.uid() is not null
order by a.correct_count desc nulls last, a.submitted_at asc nulls last,m.joined_at asc limit 200
$$;
revoke all on function public.ace_challenge_standings(uuid) from public,anon;grant execute on function public.ace_challenge_standings(uuid) to authenticated;