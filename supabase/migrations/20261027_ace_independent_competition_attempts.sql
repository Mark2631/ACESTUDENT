create table public.ace_challenge_attempts(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,challenge_id uuid not null references public.ace_challenges(id) on delete cascade,answers jsonb not null,correct_count integer not null,total_count integer not null,submitted_at timestamptz not null default now(),unique(user_id,challenge_id));
alter table public.ace_challenge_attempts enable row level security;
revoke all on public.ace_challenge_attempts from public,anon,authenticated;
create policy ace_challenge_attempts_own_read on public.ace_challenge_attempts for select to authenticated using(user_id=(select auth.uid()));
grant select on public.ace_challenge_attempts to authenticated;
create function public.ace_submit_challenge(p_challenge uuid,p_answers jsonb)
returns table(correct_count integer,total_count integer,explanations jsonb)
language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_quiz uuid;v_correct integer:=0;v_total integer:=0;v_details jsonb:='[]'::jsonb;v_q record;v_selection text;
begin
 if v_user is null then raise exception 'Sign in required';end if;
 select quiz_id into v_quiz from public.ace_challenges where id=p_challenge and ends_at>now();
 if v_quiz is null then raise exception 'Competition unavailable or ended';end if;
 if not exists(select 1 from public.ace_challenge_members where challenge_id=p_challenge and user_id=v_user) then raise exception 'Join the competition first';end if;
 if exists(select 1 from public.ace_challenge_attempts where challenge_id=p_challenge and user_id=v_user) then raise exception 'Competition already completed';end if;
 if jsonb_typeof(p_answers) is distinct from 'object' then raise exception 'Invalid answers';end if;
 for v_q in select q.id,q.correct_index,q.explanation from public.ace_questions q where q.quiz_id=v_quiz order by q.sort_order loop
 v_total:=v_total+1;v_selection:=p_answers->>v_q.id::text;
 if v_selection is null or v_selection !~ '^[0-3]$' then raise exception 'Answer every question';end if;
 if v_selection::integer=v_q.correct_index then v_correct:=v_correct+1;end if;
 v_details:=v_details||jsonb_build_array(jsonb_build_object('id',v_q.id,'correct_index',v_q.correct_index,'explanation',v_q.explanation));
 end loop;
 if v_total=0 or (select count(*) from jsonb_object_keys(p_answers))<>v_total then raise exception 'Incomplete answer set';end if;
 insert into public.ace_challenge_attempts(user_id,challenge_id,answers,correct_count,total_count) values(v_user,p_challenge,p_answers,v_correct,v_total);
 return query select v_correct,v_total,v_details;
end $$;
revoke all on function public.ace_submit_challenge(uuid,jsonb) from public,anon;
grant execute on function public.ace_submit_challenge(uuid,jsonb) to authenticated;
create or replace function public.ace_challenge_standings(p_challenge uuid)
returns table(participant uuid,display_name text,score integer,total integer,earned_xp integer,completed_at timestamptz)
language sql stable security definer set search_path='' as $$
select m.user_id,coalesce(nullif(trim(p.full_name),''),'Student') as display_name,a.correct_count,a.total_count,0::integer,a.submitted_at
from public.ace_challenge_members m join public.ace_challenges c on c.id=m.challenge_id
left join public.ace_challenge_attempts a on a.user_id=m.user_id and a.challenge_id=c.id
left join public.ace_student_profiles p on p.user_id=m.user_id
where m.challenge_id=p_challenge and (exists(select 1 from public.ace_challenge_members mine where mine.challenge_id=p_challenge and mine.user_id=auth.uid()) or c.creator_id=auth.uid()) and auth.uid() is not null
order by a.correct_count desc nulls last,a.submitted_at asc nulls last,m.joined_at asc limit 200 $$;
revoke all on function public.ace_challenge_standings(uuid) from public,anon;
grant execute on function public.ace_challenge_standings(uuid) to authenticated;
