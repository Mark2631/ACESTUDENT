create table public.ace_study_sessions(
 id uuid primary key default gen_random_uuid(),
 space_id uuid not null references public.ace_spaces(id) on delete cascade,
 host_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(length(trim(title)) between 4 and 140),
 topic text not null default '' check(length(topic)<=500),
 meeting_url text not null check(meeting_url ~ '^https://(meet\.google\.com/|[a-zA-Z0-9.-]*zoom\.us/|teams\.microsoft\.com/)'),
 starts_at timestamptz not null,ends_at timestamptz not null,
 created_at timestamptz not null default now(),
 check(ends_at>starts_at and ends_at<=starts_at+interval '6 hours')
);
create index ace_sessions_upcoming_idx on public.ace_study_sessions(starts_at);
alter table public.ace_study_sessions enable row level security;
revoke all on public.ace_study_sessions from public,anon,authenticated;
create policy ace_sessions_read on public.ace_study_sessions for select to authenticated using(true);
create policy ace_sessions_host_insert on public.ace_study_sessions for insert to authenticated with check(
 host_id=(select auth.uid()) and starts_at>now() and starts_at<now()+interval '180 days'
 and exists(select 1 from public.ace_spaces s where s.id=space_id and s.owner_id=(select auth.uid()))
);
create policy ace_sessions_host_delete on public.ace_study_sessions for delete to authenticated using(host_id=(select auth.uid()));
grant select,insert,delete on public.ace_study_sessions to authenticated;
create table public.ace_session_attendees(
 session_id uuid not null references public.ace_study_sessions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 joined_at timestamptz not null default now(),primary key(session_id,user_id)
);
alter table public.ace_session_attendees enable row level security;
revoke all on public.ace_session_attendees from public,anon,authenticated;
create policy ace_attendee_self_read on public.ace_session_attendees for select to authenticated using(user_id=(select auth.uid()));
create policy ace_attendee_join on public.ace_session_attendees for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.ace_study_sessions s where s.id=session_id and s.ends_at>now()));
create policy ace_attendee_leave on public.ace_session_attendees for delete to authenticated using(user_id=(select auth.uid()));
grant select,insert,delete on public.ace_session_attendees to authenticated;
create function public.ace_session_attendee_count(p_session uuid)
returns integer language sql stable security definer set search_path='' as $$
select case when auth.uid() is null then 0 else (select count(*)::integer from public.ace_session_attendees where session_id=p_session) end
$$;
revoke all on function public.ace_session_attendee_count(uuid) from public,anon;
grant execute on function public.ace_session_attendee_count(uuid) to authenticated;