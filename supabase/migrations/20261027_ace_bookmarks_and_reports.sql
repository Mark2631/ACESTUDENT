-- Requires ace_open_resources, ace_spaces, ace_space_posts, ace_resources and ace_reviewers.
create table public.ace_bookmarks(user_id uuid not null references auth.users(id) on delete cascade,resource_id uuid not null references public.ace_open_resources(id) on delete cascade,created_at timestamptz not null default now(),primary key(user_id,resource_id));
alter table public.ace_bookmarks enable row level security;
revoke all on public.ace_bookmarks from public,anon,authenticated;
create policy ace_bookmarks_read on public.ace_bookmarks for select to authenticated using(user_id=(select auth.uid()));
create policy ace_bookmarks_add on public.ace_bookmarks for insert to authenticated with check(user_id=(select auth.uid()));
create policy ace_bookmarks_remove on public.ace_bookmarks for delete to authenticated using(user_id=(select auth.uid()));
grant select,insert,delete on public.ace_bookmarks to authenticated;
create table public.ace_content_reports(
 id uuid primary key default gen_random_uuid(),reporter_id uuid not null references auth.users(id) on delete cascade,
 document_id uuid references public.ace_resources(id) on delete cascade,
 resource_id uuid references public.ace_open_resources(id) on delete cascade,
 space_id uuid references public.ace_spaces(id) on delete cascade,
 post_id uuid references public.ace_space_posts(id) on delete cascade,
 reason text not null check(reason in ('Copyright','Private information','Inappropriate content','Incorrect material','Broken link','Other')),
 details text not null default '' check(length(details)<=1000),
 state text not null default 'open' check(state in ('open','resolved','dismissed')),
 reviewed_at timestamptz,reviewer_id uuid references auth.users(id),
 created_at timestamptz not null default now(),
 constraint ace_report_one_target check(num_nonnulls(document_id,resource_id,space_id,post_id)=1)
);
create unique index ace_reports_doc_once on public.ace_content_reports(reporter_id,document_id) where document_id is not null and state='open';
create unique index ace_reports_open_once on public.ace_content_reports(reporter_id,resource_id) where resource_id is not null and state='open';
create unique index ace_reports_space_once on public.ace_content_reports(reporter_id,space_id) where space_id is not null and state='open';
create unique index ace_reports_post_once on public.ace_content_reports(reporter_id,post_id) where post_id is not null and state='open';
alter table public.ace_content_reports enable row level security;
revoke all on public.ace_content_reports from public,anon,authenticated;
create policy ace_reports_own_read on public.ace_content_reports for select to authenticated using(reporter_id=(select auth.uid()) or exists(select 1 from public.ace_reviewers where user_id=(select auth.uid())));
create policy ace_reports_create on public.ace_content_reports for insert to authenticated with check(reporter_id=(select auth.uid()) and state='open' and reviewed_at is null and reviewer_id is null);
grant select,insert on public.ace_content_reports to authenticated;
create function public.ace_resolve_report(p_report uuid,p_resolution text)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.ace_reviewers where user_id=auth.uid()) then raise exception 'Not authorized';end if;
 if p_resolution not in('resolved','dismissed') then raise exception 'Invalid resolution';end if;
 update public.ace_content_reports set state=p_resolution,reviewed_at=now(),reviewer_id=auth.uid()
 where id=p_report and state='open';
 if not found then raise exception 'Report already processed or missing';end if;
 return true;
end $$;
revoke all on function public.ace_resolve_report(uuid,text) from public,anon;
grant execute on function public.ace_resolve_report(uuid,text) to authenticated;
