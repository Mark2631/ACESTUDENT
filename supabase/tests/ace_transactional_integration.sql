begin;
insert into auth.users(id,instance_id,aud,role,email,created_at,updated_at) values('f29b9109-8b25-4ee4-b79e-52415a513ff8','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ace-qa-rollback@example.invalid',now(),now());
set local role authenticated;set local request.jwt.claim.sub='f29b9109-8b25-4ee4-b79e-52415a513ff8';
do $$
declare v_user uuid:=auth.uid();v_quiz uuid;v_answers jsonb;v_correct int;v_total int;v_xp int;v_saved int;v_space uuid;v_challenge uuid;v_resource uuid;v_duplicate boolean:=false;
begin
 if v_user is distinct from 'f29b9109-8b25-4ee4-b79e-52415a513ff8'::uuid then raise exception 'Auth simulation failed';end if;
 insert into public.ace_student_profiles(user_id,full_name,institution) values(v_user,'Transactional QA','MUST');
 select id into v_quiz from public.ace_quizzes where status='published' order by title limit 1;
 select jsonb_object_agg(id,0) into v_answers from public.ace_get_questions(v_quiz);
 if v_answers is null or v_answers='{}'::jsonb then raise exception 'Question RPC returned zero questions';end if;
 select correct_count,total_count,xp_awarded into v_correct,v_total,v_xp from public.ace_submit_quiz(v_quiz,v_answers);
 select xp into v_saved from public.ace_xp where user_id=v_user;
 if v_total!=5 or v_saved is distinct from v_xp then raise exception 'Scoring or XP mismatch';end if;
 begin perform public.ace_submit_quiz(v_quiz,v_answers);exception when others then v_duplicate:=true;end;
 if not v_duplicate then raise exception 'Duplicate quiz submission succeeded';end if;
 insert into public.ace_spaces(owner_id,title,course_code,description) values(v_user,'QA Study Space','QA100','Temporary rollback test') returning id into v_space;
 insert into public.ace_space_posts(space_id,author_id,body,link_url) values(v_space,v_user,'Temporary academic group message','https://ocw.mit.edu/');
 insert into public.ace_challenges(creator_id,quiz_id,title) values(v_user,v_quiz,'QA Challenge') returning id into v_challenge;
 insert into public.ace_challenge_members(challenge_id,user_id) values(v_challenge,v_user);
 if not exists(select 1 from public.ace_challenge_standings(v_challenge)) then raise exception 'Challenge standings empty';end if;
 insert into public.ace_resources(uploader_id,title,course_code,course_name,kind,storage_path) values(v_user,'QA PDF submission','QA100','QA course','Notes',v_user::text||'/qa.pdf') returning id into v_resource;
 delete from public.ace_resources where id=v_resource and status='pending';
 if exists(select 1 from public.ace_resources where id=v_resource) then raise exception 'Pending withdrawal failed';end if;
end $$;
rollback;