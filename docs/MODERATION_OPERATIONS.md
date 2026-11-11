# Ace Student v1 moderation operations

The v1 release accepts student contributions into a private review state. Public search and the home feed return only documents with `status = 'approved'`.

Until the dedicated moderation queue in the later polish milestone is implemented, a trusted operator reviews submissions in the Supabase Dashboard. Do not give ordinary students database update permissions or a service-role key.

## Review queue

In the Supabase SQL Editor, as a trusted project operator:

```sql
select
  id,
  title,
  document_type,
  course_id,
  uploader_id,
  storage_path,
  mime_type,
  file_size,
  created_at
from public.ace_documents
where status = 'pending'
order by created_at asc;
```

Open the corresponding object in the private `ace-documents` Storage bucket and inspect the content before approving it. Check ownership, course tags, copyright concerns, document legibility and whether it is genuinely useful for the course.

Reports submitted by students are in `public.ace_document_flags`. The reporting student can read their own reports; a trusted operator can inspect the complete queue in the Dashboard.

## Approve a document

After the file has been reviewed:

```sql
update public.ace_documents
set status = 'approved',
    reviewed_at = now()
where id = 'DOCUMENT_UUID'::uuid
  and status = 'pending';
```

The approval trigger adds one 10-point `upload_approved` event to `ace_karma_ledger`. The unique ledger key prevents the same document from awarding the same event twice. The profile total is calculated from the ledger; never edit a profile points column.

## Flag a document

When a document is inaccurate, inappropriate or needs investigation:

```sql
update public.ace_documents
set status = 'flagged',
    reviewed_at = now()
where id = 'DOCUMENT_UUID'::uuid
  and status in ('pending', 'approved');
```

Flagged documents are excluded from public discovery and signed file access. Keep the metadata row while investigating; it preserves the report and contribution history.

## Removal

If removal is necessary, use the Supabase Dashboard with trusted operator permissions to remove the object from the new `ace-documents` bucket and then delete its metadata row. Do not remove objects from the historical `ace-submissions` bucket or alter legacy Ace tables as part of this workflow.

## Release boundaries

- This document describes a manual v1 review process, not an in-app moderation console.
- Ordinary clients can submit documents and reports, but cannot approve, flag or delete documents.
- No service-role key is used in browser code.
- The new migrations are committed to GitHub but must be reviewed and applied by an authorised operator before uploads can work.
