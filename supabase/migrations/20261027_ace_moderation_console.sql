create table public.ace_reviewers(user_id uuid primary key references auth.users(id) on delete cascade,assigned_at timestamptz not null default now());alter table public.ace_reviewers enable row level security;create policy ace_reviewers_self_read on public.ace_reviewers for select to authenticated using(user_id=(select auth.uid()));grant select on public.ace_reviewers to authenticated;
alter table public.ace_resources add column reviewer_id uuid references auth.users(id),add column review_note text check(review_note is null or char_length(review_note)<=500);
create policy ace_resources_reviewer_read on public.ace_resources for select to authenticated using(exists(select 1 from public.ace_reviewers r where r.user_id=(select auth.uid())));
create policy ace_storage_reviewer_read on storage.objects for select to authenticated using(bucket_id='ace-submissions' and exists(select 1 from public.ace_reviewers r where r.user_id=(select auth.uid())));
create function public.ace_review_resource(p_resource uuid,p_approval boolean,p_note text default null) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.ace_reviewers where user_id=auth.uid()) then raise exception 'Not authorized to review';end if;
 if p_note is not null and char_length(p_note)>500 then raise exception 'Review note too long';end if;
 update public.ace_resources set status=case when p_approval then 'approved' else 'rejected' end,review_note=nullif(trim(p_note),''),reviewer_id=auth.uid(),reviewed_at=now()
 where id=p_resource and status='pending';
 if not found then raise exception 'Resource unavailable or already reviewed';end if;
 return true;
end $$;
revoke all on function public.ace_review_resource(uuid,boolean,text) from public,anon;grant execute on function public.ace_review_resource(uuid,boolean,text) to authenticated;