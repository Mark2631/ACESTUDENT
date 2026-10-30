-- Public discovery surfaces expose only material intended for browsing.
-- Personal bookmarks, discussion posts and uploads retain existing RLS policies.
create policy ace_open_public_browse on public.ace_open_resources for select to anon using (hidden=false);
grant select on public.ace_open_resources to anon;
create policy ace_course_public_browse on public.ace_course_catalog for select to anon using (true);
grant select on public.ace_course_catalog to anon;
