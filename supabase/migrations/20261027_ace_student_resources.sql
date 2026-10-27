-- Ace Student v0.1: isolated tables in shared Nexus Supabase project.
-- Do not touch unrelated application schemas or public.profiles.
create table if not exists public.ace_resources (
 id uuid primary key default gen_random_uuid(),
 uploader_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(trim(title)) between 3 and 140),
 description text,
 course_code text not null check (char_length(trim(course_code)) between 2 and 30),
 course_name text not null check (char_length(trim(course_name)) between 3 and 100),
 kind text not null check (kind in ('Notes','Past paper','Revision guide','Slides')),
 storage_path text not null unique,
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 constraint ace_path_user check (split_part(storage_path,'/',1)=uploader_id::text)
);
create index if not exists ace_resources_approved_idx on public.ace_resources(status,created_at desc);
create index if not exists ace_resources_course_idx on public.ace_resources(course_code);
alter table public.ace_resources enable row level security;
create policy ace_resources_read on public.ace_resources for select to anon,authenticated using (status='approved' or (select auth.uid())=uploader_id);
create policy ace_resources_submit on public.ace_resources for insert to authenticated with check ((select auth.uid())=uploader_id and status='pending' and reviewed_at is null);
grant select on public.ace_resources to anon,authenticated;
grant insert on public.ace_resources to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('ace-submissions','ace-submissions',false,15728640,array['application/pdf']) on conflict (id) do nothing;
create policy ace_storage_contribute on storage.objects for insert to authenticated with check(bucket_id='ace-submissions' and (storage.foldername(name))[1]=(select auth.uid())::text and lower(storage.extension(name))='pdf');
create policy ace_storage_read on storage.objects for select to authenticated,anon using(bucket_id='ace-submissions' and (owner_id=(select auth.uid())::text or exists(select 1 from public.ace_resources r where r.storage_path=name and r.status='approved')));
create policy ace_storage_cleanup on storage.objects for delete to authenticated using(bucket_id='ace-submissions' and owner_id=(select auth.uid())::text and not exists(select 1 from public.ace_resources r where r.storage_path=name));
-- Moderation uses Supabase dashboard with trusted admin privileges initially. No public UPDATE policy.
