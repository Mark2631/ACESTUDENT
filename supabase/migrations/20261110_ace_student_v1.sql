-- Ace Student v1: additive schema. Existing Ace objects and Storage bucket are intentionally retained.
create extension if not exists pgcrypto;

create table if not exists public.ace_schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 140),
  normalized_name text generated always as (lower(regexp_replace(trim(name), '\s+', ' ', 'g'))) stored,
  education_level text not null check (education_level in ('university','secondary')),
  country text not null default 'Kenya',
  created_by uuid references auth.users(id) on delete set null,
  status text not null default 'approved' check (status in ('approved','pending','rejected')),
  created_at timestamptz not null default now(),
  unique (normalized_name, education_level, country)
);

create table if not exists public.ace_courses (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.ace_schools(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 140),
  code text,
  programme_name text,
  education_level text not null check (education_level in ('university','secondary')),
  level_or_year text,
  created_by uuid references auth.users(id) on delete set null,
  status text not null default 'approved' check (status in ('approved','pending','rejected')),
  created_at timestamptz not null default now(),
  unique (school_id, name, level_or_year)
);

create table if not exists public.ace_student_courses (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.ace_courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

alter table public.ace_student_profiles
  add column if not exists education_level text check (education_level in ('university','secondary')),
  add column if not exists school_id uuid references public.ace_schools(id) on delete set null,
  add column if not exists grade_or_year text,
  add column if not exists onboarding_completed boolean not null default false;

create table if not exists public.ace_documents (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.ace_courses(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 3 and 140),
  description text check (description is null or char_length(description) <= 1200),
  document_type text not null check (document_type in ('note','past_paper','summary')),
  storage_path text not null unique,
  mime_type text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 15728640),
  status text not null default 'pending' check (status in ('pending','approved','flagged')),
  upvotes integer not null default 0 check (upvotes >= 0),
  downloads integer not null default 0 check (downloads >= 0),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint ace_documents_path_owner check (split_part(storage_path,'/',1)=uploader_id::text)
);

create table if not exists public.ace_document_votes (
  document_id uuid not null references public.ace_documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (document_id,user_id)
);

create table if not exists public.ace_karma_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('upload_approved','document_helpful')),
  reference_id uuid,
  points integer not null check (points > 0),
  created_at timestamptz not null default now(),
  unique (user_id,event_type,reference_id)
);

create index if not exists ace_schools_lookup_idx on public.ace_schools(education_level,normalized_name);
create index if not exists ace_courses_school_idx on public.ace_courses(school_id,name);
create index if not exists ace_documents_feed_idx on public.ace_documents(status,created_at desc);
create index if not exists ace_documents_course_idx on public.ace_documents(course_id,status,created_at desc);
create index if not exists ace_documents_uploader_idx on public.ace_documents(uploader_id,created_at desc);

alter table public.ace_schools enable row level security;
alter table public.ace_courses enable row level security;
alter table public.ace_student_courses enable row level security;
alter table public.ace_documents enable row level security;
alter table public.ace_document_votes enable row level security;
alter table public.ace_karma_ledger enable row level security;

drop policy if exists ace_schools_read on public.ace_schools;
create policy ace_schools_read on public.ace_schools for select to anon,authenticated using (true);
drop policy if exists ace_schools_insert on public.ace_schools;
create policy ace_schools_insert on public.ace_schools for insert to authenticated with check (created_by=(select auth.uid()));

drop policy if exists ace_courses_read on public.ace_courses;
create policy ace_courses_read on public.ace_courses for select to anon,authenticated using (true);
drop policy if exists ace_courses_insert on public.ace_courses;
create policy ace_courses_insert on public.ace_courses for insert to authenticated with check (created_by=(select auth.uid()));

drop policy if exists ace_student_courses_self on public.ace_student_courses;
create policy ace_student_courses_self on public.ace_student_courses for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists ace_student_courses_add on public.ace_student_courses;
create policy ace_student_courses_add on public.ace_student_courses for insert to authenticated with check (user_id=(select auth.uid()));
drop policy if exists ace_student_courses_remove on public.ace_student_courses;
create policy ace_student_courses_remove on public.ace_student_courses for delete to authenticated using (user_id=(select auth.uid()));

drop policy if exists ace_profiles_v1_self_read on public.ace_student_profiles;
create policy ace_profiles_v1_self_read on public.ace_student_profiles for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists ace_profiles_v1_self_insert on public.ace_student_profiles;
create policy ace_profiles_v1_self_insert on public.ace_student_profiles for insert to authenticated with check (user_id=(select auth.uid()));
drop policy if exists ace_profiles_v1_self_update on public.ace_student_profiles;
create policy ace_profiles_v1_self_update on public.ace_student_profiles for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

drop policy if exists ace_documents_public_or_owner_read on public.ace_documents;
create policy ace_documents_public_or_owner_read on public.ace_documents for select to anon,authenticated using (status='approved' or uploader_id=(select auth.uid()));
drop policy if exists ace_documents_submit on public.ace_documents;
create policy ace_documents_submit on public.ace_documents for insert to authenticated with check (
  uploader_id=(select auth.uid()) and status='pending' and reviewed_at is null
  and split_part(storage_path,'/',1)=(select auth.uid())::text
);
drop policy if exists ace_documents_vote_read on public.ace_document_votes;
create policy ace_documents_vote_read on public.ace_document_votes for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists ace_documents_vote_insert on public.ace_document_votes;
create policy ace_documents_vote_insert on public.ace_document_votes for insert to authenticated with check (
  user_id=(select auth.uid()) and exists(select 1 from public.ace_documents d where d.id=document_id and d.status='approved' and d.uploader_id<>(select auth.uid()))
);
drop policy if exists ace_documents_vote_delete on public.ace_document_votes;
create policy ace_documents_vote_delete on public.ace_document_votes for delete to authenticated using (user_id=(select auth.uid()));
drop policy if exists ace_karma_self_read on public.ace_karma_ledger;
create policy ace_karma_self_read on public.ace_karma_ledger for select to authenticated using (user_id=(select auth.uid()));

grant select on public.ace_schools,public.ace_courses to anon,authenticated;
grant insert on public.ace_schools,public.ace_courses to authenticated;
grant select,insert,delete on public.ace_student_courses to authenticated;
grant select,insert on public.ace_documents to anon,authenticated;
grant select,insert,delete on public.ace_document_votes to authenticated;
grant select on public.ace_karma_ledger to authenticated;
grant select,insert,update on public.ace_student_profiles to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'ace-documents','ace-documents',false,15728640,
  array[
    'application/pdf','image/jpeg','image/png','image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
) on conflict (id) do nothing;

drop policy if exists ace_documents_storage_contribute on storage.objects;
create policy ace_documents_storage_contribute on storage.objects for insert to authenticated with check (
  bucket_id='ace-documents'
  and (storage.foldername(name))[1]=(select auth.uid())::text
  and lower(storage.extension(name)) in ('pdf','jpg','jpeg','png','webp','docx')
);
drop policy if exists ace_documents_storage_read on storage.objects;
create policy ace_documents_storage_read on storage.objects for select to authenticated using (
  bucket_id='ace-documents' and (
    owner_id=(select auth.uid())::text
    or exists(select 1 from public.ace_documents d where d.storage_path=name and d.status='approved')
  )
);
drop policy if exists ace_documents_storage_delete_own on storage.objects;
create policy ace_documents_storage_delete_own on storage.objects for delete to authenticated using (
  bucket_id='ace-documents' and owner_id=(select auth.uid())::text
  and not exists(select 1 from public.ace_documents d where d.storage_path=name)
);

create or replace function public.ace_vote_document(p_document uuid)
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare v_user uuid:=auth.uid();v_count integer;
begin
  if v_user is null then raise exception 'Sign in required'; end if;
  insert into public.ace_document_votes(document_id,user_id)
  select p_document,v_user where exists(
    select 1 from public.ace_documents where id=p_document and status='approved' and uploader_id<>v_user
  )
  on conflict do nothing;
  if not found then raise exception 'This document cannot be voted on'; end if;
  update public.ace_documents set upvotes=upvotes+1 where id=p_document returning upvotes into v_count;
  return v_count;
end
$$;
revoke all on function public.ace_vote_document(uuid) from public,anon;
grant execute on function public.ace_vote_document(uuid) to authenticated;

create or replace function public.ace_record_download(p_document uuid)
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare v_count integer;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  update public.ace_documents set downloads=downloads+1 where id=p_document and status='approved' returning downloads into v_count;
  if v_count is null then raise exception 'Document unavailable'; end if;
  return v_count;
end
$$;
revoke all on function public.ace_record_download(uuid) from public,anon;
grant execute on function public.ace_record_download(uuid) to authenticated;
