-- Ace Student native collaborative notes. All tables are ace_ prefixed.
create table if not exists public.ace_shared_notes (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(char_length(trim(title)) between 3 and 140),
 content text not null default '' check(char_length(content) <= 50000),
 course_code text not null default '' check(char_length(course_code)<=30),
 invite_token uuid not null default gen_random_uuid(),
 version int not null default 1 check(version>=1),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.ace_note_members (
 note_id uuid not null references public.ace_shared_notes(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null default 'editor' check(role in ('editor','viewer')),
 joined_at timestamptz not null default now(),
 primary key(note_id,user_id)
);
create table if not exists public.ace_note_revisions (
 id uuid primary key default gen_random_uuid(),
 note_id uuid not null references public.ace_shared_notes(id) on delete cascade,
 changed_by uuid references auth.users(id) on delete set null,
 previous_version int not null,
 previous_title text not null,
 previous_content text not null,
 created_at timestamptz not null default now()
);
create index if not exists ace_notes_owner_order on public.ace_shared_notes(owner_id,updated_at desc);
create index if not exists ace_note_members_user on public.ace_note_members(user_id,note_id);
create index if not exists ace_note_revisions_lookup on public.ace_note_revisions(note_id,created_at desc);
alter table public.ace_shared_notes enable row level security;
alter table public.ace_note_members enable row level security;
alter table public.ace_note_revisions enable row level security;
revoke all on public.ace_shared_notes,public.ace_note_members,public.ace_note_revisions from anon,authenticated;
grant select,insert,delete on public.ace_shared_notes to authenticated;
grant update(title,content,version,updated_at) on public.ace_shared_notes to authenticated;
grant select on public.ace_note_members,public.ace_note_revisions to authenticated;
create policy ace_notes_select on public.ace_shared_notes for select to authenticated
 using(owner_id=(select auth.uid()) or exists(select 1 from public.ace_note_members m where m.note_id=id and m.user_id=(select auth.uid())));
create policy ace_notes_insert on public.ace_shared_notes for insert to authenticated with check(owner_id=(select auth.uid()));
create policy ace_notes_update on public.ace_shared_notes for update to authenticated
 using(owner_id=(select auth.uid()) or exists(select 1 from public.ace_note_members m where m.note_id=id and m.user_id=(select auth.uid()) and m.role='editor'))
 with check(owner_id=(select auth.uid()) or exists(select 1 from public.ace_note_members m where m.note_id=id and m.user_id=(select auth.uid()) and m.role='editor'));
create policy ace_notes_delete on public.ace_shared_notes for delete to authenticated using(owner_id=(select auth.uid()));
create policy ace_note_members_read on public.ace_note_members for select to authenticated using(user_id=(select auth.uid()));
create policy ace_note_revisions_read on public.ace_note_revisions for select to authenticated
 using(exists(select 1 from public.ace_shared_notes n where n.id=note_id));
-- Only people who possess a current invite token can join. Never return note contents to callers of this function.
create or replace function public.ace_join_shared_note(p_note uuid,p_token uuid) returns boolean
 language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();
begin
 if v_user is null then raise exception 'Sign in required';end if;
 if not exists(select 1 from public.ace_shared_notes n where n.id=p_note and n.invite_token=p_token) then return false;end if;
 insert into public.ace_note_members(note_id,user_id,role) values(p_note,v_user,'editor') on conflict(note_id,user_id) do nothing;
 return true;
end $$;
revoke all on function public.ace_join_shared_note(uuid,uuid) from public,anon;
grant execute on function public.ace_join_shared_note(uuid,uuid) to authenticated;
create or replace function public.ace_rotate_note_invite(p_note uuid) returns uuid
 language plpgsql security definer set search_path='' as $$
declare v_token uuid;
begin
 update public.ace_shared_notes set invite_token=gen_random_uuid()
 where id=p_note and owner_id=auth.uid()
 returning invite_token into v_token;
 if v_token is null then raise exception 'Not the note owner';end if;
 return v_token;
end $$;
revoke all on function public.ace_rotate_note_invite(uuid) from public,anon;
grant execute on function public.ace_rotate_note_invite(uuid) to authenticated;
create or replace function public.ace_record_note_revision() returns trigger
 language plpgsql security definer set search_path='' as $$
begin
 if old.title is distinct from new.title or old.content is distinct from new.content then
  insert into public.ace_note_revisions(note_id,changed_by,previous_version,previous_title,previous_content)
  values(old.id,auth.uid(),old.version,old.title,old.content);
 end if;
 return new;
end $$;
revoke all on function public.ace_record_note_revision() from public,anon,authenticated;
drop trigger if exists ace_note_revision_history on public.ace_shared_notes;
create trigger ace_note_revision_history after update of title,content on public.ace_shared_notes
 for each row execute function public.ace_record_note_revision();
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime')
 and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='ace_shared_notes')
 then alter publication supabase_realtime add table public.ace_shared_notes;end if;
end $$;
