alter table public.ace_open_resources add column hidden boolean not null default false;
create or replace function public.ace_moderate_reported_item(p_report uuid,p_note text default null)
returns boolean language plpgsql security definer set search_path='' as $$
declare r public.ace_content_reports%rowtype;
begin
 if auth.uid() is null or not exists(select 1 from public.ace_reviewers where user_id=auth.uid()) then raise exception 'Not a reviewer';end if;
 if p_note is not null and length(p_note)>500 then raise exception 'Note too long';end if;
 select * into r from public.ace_content_reports where id=p_report and state='open' for update;
 if not found then raise exception 'Report already closed or missing';end if;
 if r.document_id is not null then
  update public.ace_resources set status='rejected',reviewer_id=auth.uid(),review_note=coalesce(nullif(trim(p_note),''),'Removed following moderation'),reviewed_at=now() where id=r.document_id;
 elsif r.resource_id is not null then
  update public.ace_open_resources set hidden=true where id=r.resource_id;
 elsif r.post_id is not null then
  delete from public.ace_space_posts where id=r.post_id;
 elsif r.space_id is not null then
  delete from public.ace_spaces where id=r.space_id;
 end if;
 update public.ace_content_reports set state='resolved',reviewer_id=auth.uid(),reviewed_at=now() where id=p_report;
 return true;
end $$;
revoke all on function public.ace_moderate_reported_item(uuid,text) from public,anon;
grant execute on function public.ace_moderate_reported_item(uuid,text) to authenticated;