do $$ declare secure_tables boolean;resources_count integer;questions_count integer;
begin
 select bool_and(rowsecurity) into secure_tables from pg_tables where schemaname='public' and tablename like 'ace_%';
 if secure_tables is distinct from true then raise exception 'RLS missing';end if;
 if has_table_privilege('authenticated','public.ace_questions','SELECT') then raise exception 'Question keys exposed';end if;
 if has_table_privilege('authenticated','public.ace_xp','UPDATE') then raise exception 'Client can edit XP';end if;
 if has_table_privilege('authenticated','public.ace_quiz_attempts','INSERT') then raise exception 'Client can forge attempt';end if;
 if has_table_privilege('authenticated','public.ace_reviewers','INSERT') then raise exception 'Can self-appoint reviewer';end if;
 if has_function_privilege('anon','public.ace_submit_quiz(uuid,jsonb)','EXECUTE') then raise exception 'Anonymous quiz submission';end if;
 if has_function_privilege('anon','public.ace_challenge_standings(uuid)','EXECUTE') then raise exception 'Anonymous can read standings';end if;
 if has_function_privilege('anon','public.ace_review_resource(uuid,boolean,text)','EXECUTE') then raise exception 'Anonymous can moderate';end if;
 select count(*) into resources_count from public.ace_open_resources;
 select count(*) into questions_count from public.ace_questions;
 if resources_count<10 or questions_count<10 then raise exception 'Seed content missing';end if;
 if exists(select 1 from public.ace_quizzes z where z.status='published' and not exists(select 1 from public.ace_questions q where q.quiz_id=z.id)) then raise exception 'Empty quiz';end if;
end $$;