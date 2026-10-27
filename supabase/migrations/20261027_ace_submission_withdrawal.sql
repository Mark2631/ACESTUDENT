-- Allow a student to withdraw their own unreviewed submission.
create policy ace_resources_withdraw on public.ace_resources for delete to authenticated using (uploader_id=(select auth.uid()) and status='pending');
grant delete on public.ace_resources to authenticated;
-- Users can list their own pending submissions with the existing read policy.
create index if not exists ace_resources_uploader_status_idx on public.ace_resources(uploader_id,status,created_at desc);