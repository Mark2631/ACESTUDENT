-- Cloud-backed, private notebooks and study analytics for Ace Student.
-- All tables are deliberately namespaced ace_ because Nexus Co is shared with Looku.
create table if not exists public.ace_study_notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 110),
  course_code text check (course_code is null or char_length(course_code) <= 40),
  source text not null default '' check (octet_length(source) <= 2097152),
  cards jsonb not null default '[]'::jsonb
    check (jsonb_typeof(cards) = 'array' and jsonb_array_length(cards) <= 250),
  tags text[] not null default '{}',
  attempts integer not null default 0 check (attempts >= 0),
  correct integer not null default 0 check (correct >= 0 and correct <= attempts),
  minutes integer not null default 0 check (minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version >= 1),
  unique (id, user_id)
);
create index if not exists ace_study_notebooks_owner_updated_idx
  on public.ace_study_notebooks (user_id, updated_at desc);
create index if not exists ace_study_notebooks_search_idx
  on public.ace_study_notebooks using gin
  (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(source, '')));

create or replace function public.ace_study_notebooks_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  new.version := old.version + 1;
  return new;
end;
$$;
revoke all on function public.ace_study_notebooks_touch() from public, anon, authenticated;
drop trigger if exists ace_study_notebooks_touch_trigger on public.ace_study_notebooks;
create trigger ace_study_notebooks_touch_trigger
before update on public.ace_study_notebooks
for each row execute function public.ace_study_notebooks_touch();

alter table public.ace_study_notebooks enable row level security;
revoke all on table public.ace_study_notebooks from anon, authenticated;
grant select, insert, update, delete on table public.ace_study_notebooks to authenticated;
drop policy if exists ace_study_notebooks_select_own on public.ace_study_notebooks;
create policy ace_study_notebooks_select_own on public.ace_study_notebooks
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists ace_study_notebooks_insert_own on public.ace_study_notebooks;
create policy ace_study_notebooks_insert_own on public.ace_study_notebooks
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists ace_study_notebooks_update_own on public.ace_study_notebooks;
create policy ace_study_notebooks_update_own on public.ace_study_notebooks
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
drop policy if exists ace_study_notebooks_delete_own on public.ace_study_notebooks;
create policy ace_study_notebooks_delete_own on public.ace_study_notebooks
for delete to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.ace_study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notebook_id uuid not null references public.ace_study_notebooks(id, user_id) on delete cascade,
  mode text not null check (mode in ('read', 'cards', 'quiz', 'listen', 'focus')),
  duration_seconds integer not null default 0 check (duration_seconds between 0 and 21600),
  question_count integer not null default 0 check (question_count >= 0),
  correct_count integer not null default 0 check (correct_count between 0 and question_count),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ace_study_sessions_owner_created_idx
  on public.ace_study_sessions (user_id, created_at desc);
alter table public.ace_study_sessions enable row level security;
revoke all on table public.ace_study_sessions from anon, authenticated;
grant select, insert, update, delete on table public.ace_study_sessions to authenticated;
drop policy if exists ace_study_sessions_select_own on public.ace_study_sessions;
create policy ace_study_sessions_select_own on public.ace_study_sessions
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists ace_study_sessions_insert_own on public.ace_study_sessions;
create policy ace_study_sessions_insert_own on public.ace_study_sessions
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists ace_study_sessions_update_own on public.ace_study_sessions;
create policy ace_study_sessions_update_own on public.ace_study_sessions
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
drop policy if exists ace_study_sessions_delete_own on public.ace_study_sessions;
create policy ace_study_sessions_delete_own on public.ace_study_sessions
for delete to authenticated using ((select auth.uid()) = user_id);
