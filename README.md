# Ace Student

A student-run learning community with two pillars: a shared library of notes, past papers and course materials; and live collaboration and competition added in later milestones on the same school/course foundation.

## First release

The first release focuses on the content core: authentication, academic onboarding, upload, discovery, document viewing, personal uploads and profile.

## Product principles

- University and secondary-school onboarding use one shared school/course taxonomy.
- School affiliation is self-reported in v1.
- Student contributions are submitted for review before public discovery.
- Every document is connected to a school and a course or subject.
- Every visible action must work or explain what is missing.
- No seeded fake activity, fake download counts, placeholder dashboards or decorative feature cards.

## Stack

Next.js 16 App Router, React 19 and TypeScript; Tailwind CSS 4 with an explicit visual system in app/globals.css; Supabase Auth, Postgres and Storage; Vercel hosting.

Supabase sessions use cookie-based SSR. Next.js 16 uses proxy.ts for session refresh. Server identity checks use auth.getUser() and the request proxy uses auth.getClaims().

## Local setup

1. Use Node.js 22 or later.
2. Install with npm install.
3. Copy .env.example to .env.local.
4. Add the Supabase project URL and publishable key.
5. Start with npm run dev.

## Database boundary

The previous database setup contains legacy ace_resources, ace_student_profiles, ace_institutions, ace_programmes and ace_course_catalog tables and the private ace-submissions bucket.

The new schema is in supabase/migrations/20261110_ace_student_v1.sql. It is additive: it creates taxonomy, document, vote and karma objects; adds profile columns; and creates a separate ace-documents bucket. It does not drop, rename or truncate any legacy object.

The migration is not applied. No Supabase data, tables, policies or Storage objects are changed by this repository build.

## Quality checks

- npm run typecheck
- npm run lint
- npm run build

GitHub Actions runs all three checks on pushes and pull requests. This branch does not intentionally deploy to production.