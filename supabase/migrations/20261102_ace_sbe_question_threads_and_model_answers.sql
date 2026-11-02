-- Add paper-linked student model answers and structured Study Space Q&A.
-- Existing notes, uploads, quizzes and discussion messages are preserved.

alter table public.ace_resources
  add column if not exists reference_open_resource_id uuid
  references public.ace_open_resources(id) on delete restrict;

alter table public.ace_resources
  drop constraint if exists ace_resources_kind_check;
alter table public.ace_resources
  add constraint ace_resources_kind_check
  check (kind in ('Notes','Past paper','Revision guide','Slides','Model answer'));

create index if not exists ace_resources_paper_answer_idx
  on public.ace_resources(reference_open_resource_id,status)
  where reference_open_resource_id is not null;

create or replace function public.ace_validate_model_answer_reference()
returns trigger language plpgsql set search_path=''
as $$
declare v_kind text; v_hidden boolean; v_codes text[];
begin
  if new.kind='Model answer' then
    if new.reference_open_resource_id is null then
      raise exception 'A model answer must be attached to a specific past paper';
    end if;
    select r.kind,r.hidden,r.related_codes into v_kind,v_hidden,v_codes
      from public.ace_open_resources r where r.id=new.reference_open_resource_id;
    if not found or v_kind is distinct from 'Past paper' or v_hidden is distinct from false then
      raise exception 'The selected reference is not a visible past paper';
    end if;
    if not exists (
      select 1 from unnest(coalesce(v_codes,array[]::text[])) as mapped(code)
      where upper(regexp_replace(mapped.code,'\s','','g')) =
            upper(regexp_replace(new.course_code,'\s','','g'))
    ) then
      raise exception 'The model answer course code must match the past paper mapping';
    end if;
  elsif new.reference_open_resource_id is not null then
    raise exception 'Only model answers may reference a past paper';
  end if;
  return new;
end;
$$;
revoke all on function public.ace_validate_model_answer_reference() from public,anon,authenticated;

drop trigger if exists ace_model_answer_reference_guard on public.ace_resources;
create trigger ace_model_answer_reference_guard
before insert or update of kind,course_code,reference_open_resource_id
on public.ace_resources for each row
execute function public.ace_validate_model_answer_reference();

alter table public.ace_space_posts
  add column if not exists post_type text not null default 'message',
  add column if not exists parent_post_id uuid references public.ace_space_posts(id) on delete cascade,
  add column if not exists score smallint,
  add column if not exists evaluation_feedback text,
  add column if not exists evaluated_by uuid references auth.users(id) on delete set null,
  add column if not exists evaluated_at timestamptz;

alter table public.ace_space_posts
  drop constraint if exists ace_space_posts_post_type_check,
  drop constraint if exists ace_space_posts_parent_shape_check,
  drop constraint if exists ace_space_posts_evaluation_score_check,
  drop constraint if exists ace_space_posts_evaluation_feedback_check,
  drop constraint if exists ace_space_posts_evaluation_state_check;

alter table public.ace_space_posts
  add constraint ace_space_posts_post_type_check
    check(post_type in ('message','question','answer')),
  add constraint ace_space_posts_parent_shape_check
    check((post_type='answer' and parent_post_id is not null) or (post_type in ('message','question') and parent_post_id is null)),
  add constraint ace_space_posts_evaluation_score_check
    check(score is null or score between 0 and 10),
  add constraint ace_space_posts_evaluation_feedback_check
    check(evaluation_feedback is null or char_length(evaluation_feedback)<=1000),
  add constraint ace_space_posts_evaluation_state_check
    check(
      (score is null and evaluation_feedback is null and evaluated_by is null and evaluated_at is null)
      or (post_type='answer' and score is not null and evaluated_by is not null and evaluated_at is not null)
    );

create index if not exists ace_space_posts_thread_idx
  on public.ace_space_posts(space_id,parent_post_id,created_at);

create or replace function public.ace_validate_space_post_thread()
returns trigger language plpgsql set search_path=''
as $$
declare v_parent_space uuid; v_parent_type text;
begin
  if tg_op='INSERT' and
     (new.score is not null or new.evaluation_feedback is not null or new.evaluated_by is not null or new.evaluated_at is not null) then
    raise exception 'Answers must be evaluated after they are submitted';
  end if;
  if new.post_type='answer' then
    if new.parent_post_id is null then raise exception 'An answer must belong to a question'; end if;
    select p.space_id,p.post_type into v_parent_space,v_parent_type
      from public.ace_space_posts p where p.id=new.parent_post_id;
    if not found or v_parent_space is distinct from new.space_id or v_parent_type is distinct from 'question' then
      raise exception 'An answer must reply to a question in the same study space';
    end if;
  elsif new.parent_post_id is not null then
    raise exception 'Only answers may have a parent question';
  end if;
  if new.post_type<>'answer' and
     (new.score is not null or new.evaluation_feedback is not null or new.evaluated_by is not null or new.evaluated_at is not null) then
    raise exception 'Only answers can be evaluated';
  end if;
  return new;
end;
$$;
revoke all on function public.ace_validate_space_post_thread() from public,anon,authenticated;

drop trigger if exists ace_space_post_thread_guard on public.ace_space_posts;
create trigger ace_space_post_thread_guard
before insert or update on public.ace_space_posts
for each row execute function public.ace_validate_space_post_thread();

drop policy if exists ace_posts_evaluate_answer on public.ace_space_posts;
create policy ace_posts_evaluate_answer on public.ace_space_posts
for update to authenticated
using (
  post_type='answer' and exists (
    select 1 from public.ace_space_posts q
    join public.ace_spaces s on s.id=q.space_id
    where q.id=ace_space_posts.parent_post_id and q.post_type='question'
      and (q.author_id=(select auth.uid()) or s.owner_id=(select auth.uid()))
  )
)
with check (
  post_type='answer' and score between 0 and 10
  and evaluated_by=(select auth.uid()) and evaluated_at is not null
  and exists (
    select 1 from public.ace_space_posts q
    join public.ace_spaces s on s.id=q.space_id
    where q.id=ace_space_posts.parent_post_id and q.post_type='question'
      and (q.author_id=(select auth.uid()) or s.owner_id=(select auth.uid()))
  )
);

grant update(score,evaluation_feedback,evaluated_by,evaluated_at)
  on public.ace_space_posts to authenticated;
