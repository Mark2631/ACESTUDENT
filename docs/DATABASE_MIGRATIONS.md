# Ace Student database deployment order

Supabase project: the isolated Ace Student tables live in the existing shared Nexus project. These migrations are **not alphabetically sortable** because they were incrementally developed on the same date. Apply the following in dependency order on a fresh database. All migrations have already been applied to the connected project. Do not re-run against that database.

1. `20261027_ace_student_resources.sql`
2. `20261027_ace_student_profiles.sql`
3. `20261027_ace_learning_and_spaces.sql`
4. `20261027_ace_peer_challenges.sql`
5. `20261027_ace_submission_withdrawal.sql`
6. `20261027_ace_academic_taxonomy.sql`
7. `20261027_ace_review_attempt.sql`
8. `20261027_ace_moderation_console.sql`
9. `20261027_ace_restrict_client_table_grants.sql`
10. `20261027_ace_realtime_space_discussions.sql`
11. `20261027_ace_independent_competition_attempts.sql`
12. `20261027_ace_review_competition_attempts.sql`
13. `20261027_ace_spaced_repetition.sql`
14. `20261027_ace_bookmarks_and_reports.sql`
15. `20261027_ace_report_item_removal.sql`
16. `20261027_ace_scheduled_study_sessions.sql`
17. `20261027_ace_safe_meeting_url_constraints.sql`
18. `20261027_ace_verified_business_resources_and_mapping.sql`

Then run these seed scripts once, in order:

1. `20261027_ace_learning_seed.sql` — OpenStax resources and introductory quizzes.
2. `20261027_ace_verified_ocw.sql` — MIT OpenCourseWare links and corrected OpenStax URLs.
3. `20261027_ace_academic_catalog.sql` — institutions and MUST BBA course codes.
4. `20261027_ace_bba_question_sets.sql` — independently authored BBA revision quizzes.
5. Any later verified resource seed scripts.

Test with SQL in `supabase/tests`. Transactional integration scripts use `BEGIN` / `ROLLBACK` and must leave no test accounts, attempts, groups, or reported content.

## Additional requirements

- Supabase Auth and Storage must be enabled before installing the first migration.
- Existing unrelated `public` tables should not be altered.
- The dedicated bucket `ace-submissions` is private and accepts PDFs no larger than 15 MB.
- App clients use only the publishable key; no service-role key should appear in source.
- Reviewers are intentionally not seeded. A trusted operator appoints real registered reviewers.
- RLS policy checks are not a replacement for real OAuth/password, storage upload, and multi-user browser tests.

## Next improvement

Normalize migrations into new incremental date/version files before any new production-like database is created. Avoid squashing/reordering migrations on the active shared production Supabase project.
