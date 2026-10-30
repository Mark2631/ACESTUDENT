create table if not exists public.ace_user_subjects (
 user_id uuid not null references auth.users(id) on delete cascade,
 subject_slug text not null references public.ace_learning_areas(slug) on delete cascade,
 weekly_target_minutes integer not null default 90 check (weekly_target_minutes between 15 and 840),
 created_at timestamptz not null default now(),
 primary key (user_id,subject_slug)
);
create index if not exists ace_user_subjects_subject_idx on public.ace_user_subjects(subject_slug);
alter table public.ace_user_subjects enable row level security;
revoke all on public.ace_user_subjects from anon,authenticated;
grant select,insert,update,delete on public.ace_user_subjects to authenticated;
drop policy if exists ace_user_subjects_select_own on public.ace_user_subjects;
create policy ace_user_subjects_select_own on public.ace_user_subjects
for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists ace_user_subjects_insert_own on public.ace_user_subjects;
create policy ace_user_subjects_insert_own on public.ace_user_subjects
for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists ace_user_subjects_update_own on public.ace_user_subjects;
create policy ace_user_subjects_update_own on public.ace_user_subjects
for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists ace_user_subjects_delete_own on public.ace_user_subjects;
create policy ace_user_subjects_delete_own on public.ace_user_subjects
for delete to authenticated using ((select auth.uid())=user_id);
