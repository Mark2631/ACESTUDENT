begin;
insert into auth.users(id,instance_id,aud,role,email,created_at,updated_at) values('a35b9109-8b25-4ee4-b79e-52415a513ff9','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ace-event-rollback@example.invalid',now(),now());
set local role authenticated;set local request.jwt.claim.sub='a35b9109-8b25-4ee4-b79e-52415a513ff9';
do $$
declare q uuid;ans jsonb;challenge1 uuid;challenge2 uuid;v_score integer;verified integer;duplicated boolean:=false;
begin
select id into q from public.ace_quizzes where title='Cost Accounting · Essentials';
select jsonb_object_agg(id,0) into ans from public.ace_get_questions(q);
insert into public.ace_student_profiles(user_id,full_name) values(auth.uid(),'Event QA');
insert into public.ace_challenges(creator_id,quiz_id,title) values(auth.uid(),q,'First Practice Race') returning id into challenge1;
insert into public.ace_challenges(creator_id,quiz_id,title) values(auth.uid(),q,'Second Practice Race') returning id into challenge2;
insert into public.ace_challenge_members(challenge_id,user_id) values(challenge1,auth.uid()),(challenge2,auth.uid());
select correct_count into v_score from public.ace_submit_challenge(challenge1,ans);
begin perform public.ace_submit_challenge(challenge1,ans);exception when others then duplicated:=true;end;
if not duplicated then raise exception 'Repeated competition attempt incorrectly accepted';end if;
select correct_count into verified from public.ace_submit_challenge(challenge2,ans);
if v_score is distinct from verified then raise exception 'Independent event scoring mismatch';end if;
if (select count(*) from public.ace_challenge_standings(challenge1) s where s.score is not null)!=1 then raise exception 'Leaderboard missing verified score';end if;
if exists(select 1 from public.ace_xp where user_id=auth.uid()) then raise exception 'Competition can farm practice XP';end if;
if (select count(*) from public.ace_review_challenge_attempt(challenge1))!=1 then raise exception 'Cannot review own event';end if;
end $$;
rollback;