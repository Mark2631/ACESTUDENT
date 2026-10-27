# Ace Student

Ace Student is a dark-first, phone-first academic learning application. Students discover legitimate study resources, contribute moderated PDFs, practice authentic course quizzes, earn XP and badges, host peer competitions, and collaborate in Study Spaces.

## Implemented

- First-visit account registration/sign-in, optional institution/programme/year, editable student profile
- Real publisher-hosted OpenStax textbooks and MIT OpenCourseWare past exams, notes and assignments, clearly attributed
- Academic institution/programme/course directory: seven Kenyan institutions and a verified-input MUST BBA pilot
- User-owned PDF uploads (15 MB), moderation queue, status and withdrawal
- Reviewer-only document approval/rejection console with rights/privacy checklist; only explicitly designated users can review
- Original human-authored economics/accounting quizzes with server-authoritative grading, result explanations, one official attempt per question set, XP and badges
- Shareable course quiz competitions, verified participant standings
- Student-created Study Spaces, discussions, learning-resource links, Google Meet/Zoom/Teams links
- Mobile navigation with prominent Create action, light/dark theme switch and responsive design
- Row-level security and restrictive table grants; CI build checks and SQL security assertions

## Content and safety

Source books and exams link to their publishers; third-party PDFs are **not copied into Supabase**. MIT exams are explicitly MIT materials, not Meru University exam papers. User-submitted documents are private until reviewed. No manufactured student accounts, grades or social activity have been inserted. No download paywall is active.

## Supabase configuration

This project currently shares the Nexus Supabase instance with unrelated projects. All tables are prefixed `ace_`, with a private `ace-submissions` storage bucket. Apply migrations in `supabase/migrations` in filename order. Run seed scripts in `supabase/seeds` in date order. Never publish secret/service-role keys in the browser.

Password registration uses Supabase Auth. Hosted projects usually require email confirmation. That configuration is **project-wide**, not toggled by changing this app's login UI. Because the database is shared, carefully review other applications before disabling Confirm Email in Supabase Auth providers. Google OAuth also requires the provider and redirect allowlist to be configured.

To appoint a reviewer **after that person has registered**, the project owner may execute a privileged SQL statement in the Supabase SQL Editor:

```sql
insert into public.ace_reviewers(user_id)
select id from auth.users where email = 'verified-owner-email@example.com'
on conflict do nothing;
```

Replace the example with the intended account's verified email; never allow users to self-appoint. Only authorized reviewers can approve uploaded files. Moderators must inspect the PDF and ensure rights/privacy compliance.

## Develop

```bash
npm install
cp .env.example .env.local
npm run dev
npm run build
```

Required public environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Copy their values from the matching connected project. 

## Testing and limitations

The production compilation and TypeScript checks are run by Vercel. Database security assertions are in `supabase/tests/ace_security_smoke.sql`. Automated browser testing with registered accounts is still required. In particular, complete Google OAuth, password signup confirmation, PDF upload, reviewer approval, and peer challenges with at least two real tester accounts before a general launch.

An individual can only submit one official scored attempt for each published question set. This protects XP integrity but means competitions currently use a shared question bank and a participant's existing score may count; timed live head-to-head matchmaking, isolated per-competition attempts, spaced-repetition review, notifications and native offline downloads are further engineering stages. 
The Vercel GitHub integration has not been linked; updates from GitHub will not automatically deploy until this is repaired.

See [full scope and release plan](docs/FULL_SCOPE_AND_RELEASE_PLAN.md).
