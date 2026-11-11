# Database migration notes

The previous app already deployed isolated Ace objects in a shared Nexus Supabase project. These existing objects are retained:

- ace_resources
- ace_student_profiles (legacy columns remain)
- ace_institutions, ace_programmes and ace_course_catalog
- private ace-submissions Storage bucket and its existing files/policies

The fresh app adds its own v1 objects. It does not rename or drop any legacy object.

## New migration order

1. 20261110_ace_student_v1.sql
2. 20261111_ace_student_reports.sql

The first migration creates ace_schools, ace_courses, ace_student_courses, ace_documents, ace_document_votes and ace_karma_ledger; adds new columns to ace_student_profiles; and creates the separate private ace-documents bucket.

The follow-up migration adds ace_document_flags and permits read access to approved documents in the new bucket.

The reputation ledger is the only source of truth for karma. Students can read their own ledger entries but cannot write or edit points. The profile total is calculated from ledger rows; it is not stored in the editable profile record.

## Important boundary

These migrations are committed to GitHub but have not been executed. The connected database has not been modified by this rebuild. Review the SQL and confirm the exact Supabase project before applying either migration.

Never re-run the historical migrations in docs from the previous repository against the shared project. Its documentation records that those migrations were already applied.

## Storage

The new ace-documents bucket is separate from the historical ace-submissions bucket. It accepts PDF, JPEG, PNG, WebP and DOCX files up to 15 MB. Objects are stored under the authenticated user's UUID. Public discovery remains limited to approved document metadata and approved file objects.

No service-role key is used by the app.
