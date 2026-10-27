do $$ declare t record; begin for t in select tablename from pg_tables where schemaname='public' and tablename like 'ace_%' loop execute format('revoke all on public.%I from public,anon,authenticated',t.tablename); end loop;end $$;
grant select on public.ace_resources to anon,authenticated;
grant insert,delete on public.ace_resources to authenticated;
grant select,insert,update on public.ace_student_profiles to authenticated;
grant select on public.ace_open_resources,public.ace_quizzes,public.ace_quiz_attempts,public.ace_xp,public.ace_institutions,public.ace_programmes,public.ace_course_catalog,public.ace_reviewers to authenticated;
grant select,insert,delete on public.ace_spaces,public.ace_space_posts,public.ace_challenges to authenticated;
grant select,insert on public.ace_challenge_members to authenticated;
-- Questions intentionally have NO direct client SELECT privilege. Answers only through scoring/review RPCs.
