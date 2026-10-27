begin;
insert into auth.users(id,instance_id,aud,role,email,created_at,updated_at) values('333ebb32-3cf3-43de-ac77-4f7fc9101001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ace-full-course-rollback@example.invalid',now(),now());
set local role authenticated;
set local request.jwt.claim.sub='333ebb32-3cf3-43de-ac77-4f7fc9101001';
do $$
declare x record; selected jsonb; score int;total int;earned int;exam_count int:=0;expected_xp int:=0;actual_xp int;
begin
 for x in select q.id from public.ace_quizzes q where q.course_code in('BFB3200','BFB3201','BFB3202','BFB3203','BFB3205','BFC3227') order by q.title loop
  select jsonb_object_agg(id,0) into selected from public.ace_get_questions(x.id);
  if selected is null then raise exception 'Missing safe client questions for quiz %',x.id;end if;
  select correct_count,total_count,xp_awarded into score,total,earned from public.ace_submit_quiz(x.id,selected);
  if total<>5 or score>total or earned<0 then raise exception 'Invalid graded result for quiz %',x.id;end if;
  expected_xp:=expected_xp+earned;exam_count:=exam_count+1;
 end loop;
 if exam_count<>12 then raise exception 'Expected 12 pilot quizzes, got %',exam_count;end if;
 select xp into actual_xp from public.ace_xp where user_id=auth.uid();
 if actual_xp<>expected_xp then raise exception 'XP ledger drift: expected %, got %',expected_xp,actual_xp;end if;
end $$;
rollback;