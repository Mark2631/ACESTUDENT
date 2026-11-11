-- Ace Student v1 follow-up: student reports and public reads for approved files.
create table if not exists public.ace_document_flags (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.ace_documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(trim(reason)) between 8 and 600),
  status text not null default 'pending' check (status in ('pending','reviewed','dismissed')),
  created_at timestamptz not null default now(),
  unique (document_id,user_id)
);

alter table public.ace_document_flags enable row level security;
drop policy if exists ace_document_flags_self_read on public.ace_document_flags;
create policy ace_document_flags_self_read on public.ace_document_flags
  for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists ace_document_flags_self_insert on public.ace_document_flags;
create policy ace_document_flags_self_insert on public.ace_document_flags
  for insert to authenticated with check (
    user_id=(select auth.uid()) and exists (
      select 1 from public.ace_documents d
      where d.id=document_id and d.status='approved' and d.uploader_id<>(select auth.uid())
    )
  );
grant select,insert on public.ace_document_flags to authenticated;

drop policy if exists ace_documents_storage_read on storage.objects;
create policy ace_documents_storage_read on storage.objects for select to anon,authenticated using (
  bucket_id='ace-documents' and (
    exists(select 1 from public.ace_documents d where d.storage_path=name and d.status='approved')
    or owner_id=(select auth.uid())::text
  )
);
