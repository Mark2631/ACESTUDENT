# Ace Student curriculum and practice seeds

These scripts target only Ace Student tables in the shared Supabase project. They do not alter global Supabase Auth settings or Looku wardrobe tables. Do not apply them to the CampusTrader project.

## Apply order

1. Apply the repository's existing base schema migrations.
2. Apply `supabase/migrations/20261030_ace_bba_pathways.sql`. This adds the BBA `pathway` field and upserts common-core, Finance & Accounting and Project Management option records.
3. Run `supabase/seeds/ace_verified_must_bba_curriculum.sql`. It upserts the mapped BBA catalogue, 13 official MUST examination-archive papers, and 45 supplementary open resources. It also links each visible resource to relevant course codes and includes explicit jurisdiction caveats for non-Kenyan legal material.
4. Run these practice seeds:
   - `ace_original_bba_practice.sql` — 17 original quizzes / 85 questions.
   - `ace_international_finance_practice.sql` — 1 quiz / 5 questions.
   - `ace_additional_core_practice.sql` — 12 quizzes / 60 questions.
   - `ace_foundation_pathway_practice.sql` — 14 quizzes / 70 questions.
   - `ace_final_pathway_practice.sql` — 14 quizzes / 70 questions.

All practice questions are original Ace Student study material, not copied from official MUST exams. Each new practice quiz has five multiple-choice questions, four options per question and an explanation. Correct answers remain server-side and are returned by the controlled review/grading functions.

## Verified database state at the time of this audit

- 65 mapped BBA course records across Years 1–4.
- 48 common-core records, 8 Finance & Accounting option records and 9 Project Management option records.
- 64 of the 65 academic course records have a published quiz. The eight-week Industrial Attachment is the intentional exception because it is experiential.
- 74 published quizzes / 370 questions overall, including four general foundational quiz records not mapped as official BBA course codes.
- 58 visible resources: 13 MUST examination-archive papers and 45 supplementary open resources.
- Every visible resource is linked to at least one course code.
- No duplicate course codes within the programme, duplicate visible resource URLs, published quizzes without questions, duplicate question order within a quiz, questions with an option count other than four, or practice questions without explanations were found in the checks run.

## Academic verification caveats

The published MUST School of Business & Economics course-structure page is historical, so the catalogue is deliberately described as partially mapped, not a complete current approved curriculum. Some fourth-year options and semester assignments need confirmation from the department.

Source discrepancies were found: the older course-structure page lists Company Law as BFB 3400 while an official 2024/25 exam PDF labels it BFC 3400; the older structure also uses BFC 3429 for different Finance-option subjects in different semesters. The catalogue uses BFC3400 based on the exam paper and maps BFC3429 once as International Finance based on the official examination archive. Confirm these codes with the department before treating them as definitive.

MIT OpenCourseWare materials are not MUST examination papers. OpenStax and Saylor materials are supplementary resources, not claims of exact alignment with a lecturer's syllabus. The US-context business-law resources are explicitly caveated and must not be used as substitutes for Kenyan legislation, cases or regulator guidance.
