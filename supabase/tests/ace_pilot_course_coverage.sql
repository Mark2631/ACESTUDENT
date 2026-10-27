do $$
declare bad int;total int;pilot int;
begin
 select count(*) into bad from public.ace_questions where jsonb_array_length(options)<>4 or correct_index not between 0 and 3 or char_length(trim(explanation))<10;
 if bad>0 then raise exception '% questions lack correct choices or adequate explanations',bad;end if;
 select count(*) into bad from (select quiz_id,sort_order,count(*) as n from public.ace_questions group by quiz_id,sort_order having count(*)>1) x;
 if bad>0 then raise exception '% duplicated question positions',bad;end if;
 select count(*) into bad from public.ace_quizzes q where q.status='published' and (select count(*) from public.ace_questions a where a.quiz_id=q.id)<5;
 if bad>0 then raise exception '% published quizzes contain fewer than five questions',bad;end if;
 select count(*) into pilot from (select course_code from public.ace_quizzes where course_code in('BFB3200','BFB3201','BFB3202','BFB3203','BFB3205','BFC3227') group by course_code having count(*)>=2) x;
 if pilot<>6 then raise exception 'One or more pilot courses lacks two quizzes';end if;
 select count(*) into total from public.ace_questions;
 if total<70 then raise exception 'Missing seeded questions';end if;
end $$;