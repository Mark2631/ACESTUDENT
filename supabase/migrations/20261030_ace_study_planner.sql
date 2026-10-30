-- Private student study planner. Each task is accessible only to its owner.
create table if not exists public.ace_study_tasks(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(char_length(trim(title)) between 3 and 140),
 course_code text not null default '' check(char_length(course_code)<=30),
 due_at timestamptz,
 completed_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists ace_tasks_owner_due on public.ace_study_tasks(user_id,due_at,created_at desc);
alter table public.ace_study_tasks enable row level security;
revoke all on public.ace_study_tasks from anon,authenticated;
grant select,insert,delete on public.ace_study_tasks to authenticated;
grant update(title,course_code,due_at,completed_at) on public.ace_study_tasks to authenticated;
create policy ace_tasks_own_select on public.ace_study_tasks for select to authenticated using(user_id=(select auth.uid()));
create policy ace_tasks_own_insert on public.ace_study_tasks for insert to authenticated with check(user_id=(select auth.uid()));
create policy ace_tasks_own_update on public.ace_study_tasks for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy ace_tasks_own_delete on public.ace_study_tasks for delete to authenticated using(user_id=(select auth.uid()));
