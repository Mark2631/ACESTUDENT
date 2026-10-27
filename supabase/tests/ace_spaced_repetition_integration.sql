begin;
insert into auth.users(id,instance_id,aud,role,email,created_at,updated_at) values('f29b9109-8b25-4ee4-b79e-52415a513ff9','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ace-review-rollback@example.invalid',now(),now());
set local role authenticated;set local request.jwt.claim.sub='f29b9109-8b25-4ee4-b79e-52415a513ff9';
do $$
declare quiz uuid; answers jsonb; correct int; total int; cards int; first_card uuid; due timestamptz;
begin
 select id into quiz from public.ace_quizzes where title='Cost Accounting · Essentials' limit 1;
 select jsonb_object_agg(id,3) into answers from public.ace_get_questions(quiz);
 select correct_count,total_count into correct,total from public.ace_submit_quiz(quiz,answers);
 select count(*) into cards from public.ace_due_review_cards();
 if cards!=total-correct then raise exception 'Expected % wrong-answer review cards; got %',total-correct,cards;end if;
 if cards<1 then raise exception 'No missed questions to review';end if;
 select question_id into first_card from public.ace_due_review_cards() limit 1;
 select public.ace_rate_review_card(first_card,1::smallint) into due;
 if due<=now() then raise exception 'Repetition scheduler failed to defer card';end if;
 if exists(select 1 from public.ace_due_review_cards() where question_id=first_card) then raise exception 'Rated card still due';end if;
end $$;
rollback;