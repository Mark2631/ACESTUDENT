-- Personal study goals for Ace Study Studio. Isolated from shared Nexus Co apps.
create table if not exists public.ace_study_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 weekly_goal_minutes integer not null default 180 check (weekly_goal_minutes between 30 and 1200),
 preferred_study_days integer not null default 5 check (preferred_study_days between 1 and 7),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.ace_study_preferences enable row level security;
revoke all on public.ace_study_preferences from anon, authenticated;
grant select, insert, update on public.ace_study_preferences to authenticated;
drop policy if exists ace_study_preferences_select_own on public.ace_study_preferences;
create policy ace_study_preferences_select_own on public.ace_study_preferences
 for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists ace_study_preferences_insert_own on public.ace_study_preferences;
create policy ace_study_preferences_insert_own on public.ace_study_preferences
 for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists ace_study_preferences_update_own on public.ace_study_preferences;
create policy ace_study_preferences_update_own on public.ace_study_preferences
 for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create or replace function public.ace_touch_study_preferences_updated_at()
returns trigger language plpgsql set search_path=pg_catalog
as $$ begin new.updated_at=now(); return new; end $$;
drop trigger if exists ace_study_preferences_touch_updated_at on public.ace_study_preferences;
create trigger ace_study_preferences_touch_updated_at
 before update on public.ace_study_preferences
 for each row execute function public.ace_touch_study_preferences_updated_at();
