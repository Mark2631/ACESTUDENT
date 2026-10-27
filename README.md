# Ace Student

A student-powered academic learning web app (installable PWA), built for active learning, course-specific resources, and peer collaboration.

## Current build (v0.1)

- Mobile-first application shell with desktop sidebar and mobile bottom navigation
- Public library of **reviewed** student materials, with search and type filters
- Google OAuth and passwordless email sign-in interfaces (provider and redirect allowlist must be configured in Supabase)
- Authenticated PDF submission from mobile or desktop, limited to 15 MB
- Review queue represented by `pending` records, private storage and strict RLS
- Installable web manifest; a dedicated offline service worker is not yet implemented

**Not yet complete:** question bank, quiz scoring, peer arenas, study spaces, moderation dashboard, notification system, offline document support and automated acceptance tests. No fabricated content has been seeded.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and add the project's public Supabase URL and publishable key
3. Apply `supabase/migrations/20261027_ace_student_resources.sql` exactly once to a database with Supabase Auth and Storage enabled
4. `npm run dev`

See [the product and research foundation](docs/PRODUCT.md) for design principles, research links and rollout strategy.

## Moderation

Only approved materials appear publicly. An authorized project operator can review the submission metadata in Supabase Dashboard and set its status to `approved` or `rejected`. This temporary operational workflow must be replaced with an audited staff moderation interface before scale. Respect intellectual-property rights and remove prohibited/private materials.

## Deployment

The first Vercel deployment is directly uploaded from source because the Nexus Vercel team has no active GitHub login connection. Connect `Mark2631/ACESTUDENT` in Vercel to enable automatic CI builds and preview deployments on future commits. Required Vercel variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never publish service-role keys.
