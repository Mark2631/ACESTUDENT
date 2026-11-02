-- Run after 20261102_ace_sbe_question_threads_and_model_answers.sql.
-- Read-only catalogue/security assertions; does not create test users or records.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='ace_resources'
      and column_name='reference_open_resource_id'
  ) then raise exception 'Paper reference column missing'; end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='ace_space_posts'
      and column_name='post_type'
  ) then raise exception 'Question post type missing'; end if;

  if not has_table_privilege('anon','public.ace_course_catalog','SELECT')
     or not has_table_privilege('anon','public.ace_open_resources','SELECT') then
    raise exception 'Public course catalogue and open resource reads are not granted';
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ace_open_resources' and policyname='ace_open_resources_public_read') then
    raise exception 'Public read policy for visible open resources is missing';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='ace_space_posts'
      and column_name='parent_post_id'
  ) then raise exception 'Answer parent reference missing'; end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='ace_space_posts'
      and policyname='ace_posts_evaluate_answer' and cmd='UPDATE'
  ) then raise exception 'Restricted answer evaluation policy missing'; end if;

  if has_column_privilege('authenticated','public.ace_space_posts','body','UPDATE') then
    raise exception 'Authenticated users must not be able to edit existing post bodies';
  end if;
  if not has_column_privilege('authenticated','public.ace_space_posts','score','UPDATE') then
    raise exception 'Answer evaluator cannot update score';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname='ace_model_answer_reference_guard' and not tgisinternal
  ) then raise exception 'Model answer paper-reference trigger missing'; end if;

  if not exists (
    select 1 from pg_trigger
    where tgname='ace_space_post_thread_guard' and not tgisinternal
  ) then raise exception 'Question-answer thread trigger missing'; end if;
end $$;
