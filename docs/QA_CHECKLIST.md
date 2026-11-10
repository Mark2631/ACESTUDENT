# Ace Student v1 acceptance checklist

## Environment and database

- [ ] Use a non-production Supabase project or a reviewed change window.
- [ ] Confirm the project reference before applying either migration.
- [ ] Apply 20261110_ace_student_v1.sql, then 20261110_ace_student_reports.sql.
- [ ] Confirm the legacy ace-submissions bucket and the old Ace tables still exist.
- [ ] Confirm the new ace-documents bucket is private and accepts only the declared file types and size.
- [ ] Configure the site URL and email redirect URLs for /auth/callback.
- [ ] Set NEXT_PUBLIC_SUPABASE_URL and either a publishable key or the legacy anon key.

## Authentication and onboarding

- [ ] Create a student account and confirm the email link returns to /onboarding.
- [ ] Sign in and sign out.
- [ ] Complete university onboarding using an existing school and multiple courses.
- [ ] Complete secondary onboarding using a school, form and multiple subjects.
- [ ] Add a school not in the directory and confirm its normalized unique constraint prevents duplicates.
- [ ] Add a course or subject not in the directory.
- [ ] Edit the academic profile and confirm course selections are synchronised.

## Library and search

- [ ] Confirm the guest feed shows only approved documents.
- [ ] Confirm a signed-in home feed is filtered to selected course IDs.
- [ ] Search across schools, then filter by school, course and document type.
- [ ] Confirm an empty search result explains how to broaden the search.
- [ ] Confirm an uploaded pending document does not appear in public discovery.
- [ ] Confirm a document can only be read by its uploader before approval.

## Upload and document review

- [ ] Upload a valid PDF, JPEG, PNG, WebP and DOCX file.
- [ ] Reject files over 15 MB and unsupported file extensions.
- [ ] Confirm file data is stored under the authenticated user's UUID.
- [ ] Simulate a metadata insert failure and confirm the uploaded object is removed.
- [ ] Confirm My Uploads shows the pending state.
- [ ] Approve one document through the trusted moderation path; confirm it appears publicly.
- [ ] Confirm the uploader display name is snapshotted without making other profile rows readable.
- [ ] Confirm a successful approval adds one 10-point karma ledger row only once.
- [ ] Confirm the profile karma total comes from the read-only ledger.
- [ ] Open PDF, image and DOCX previews.
- [ ] Download a file and confirm the download counter increments for a signed-in student.
- [ ] Mark another student's approved document as helpful.
- [ ] Submit a report and confirm duplicate reports from the same student are rejected.
- [ ] Confirm related course material appears beneath the document.

## Responsive and accessibility checks

- [ ] Check phone widths around 360–390 px, tablet and desktop.
- [ ] Confirm all navigation destinations are reachable on phone and desktop.
- [ ] Use keyboard-only navigation through forms and actions.
- [ ] Confirm each field has a visible label and errors use alert/status semantics.
- [ ] Check contrast, visible focus and text zoom at 200%.
- [ ] Confirm no fake counts, fake student activity or non-functional controls appear.

## Release gates

- [ ] GitHub Actions typecheck passes.
- [ ] GitHub Actions lint passes.
- [ ] GitHub Actions production build passes.
- [ ] Review the Supabase migration diff before applying it.
- [ ] Confirm the intended Vercel project and target before deployment.
- [ ] Do not merge to main or deploy production without explicit approval.
