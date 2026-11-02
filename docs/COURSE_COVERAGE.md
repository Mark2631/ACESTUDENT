# Academic content coverage · 30 October 2026

## Pilot: Meru University Bachelor of Business Administration

The production catalogue has **65 mapped BBA course records across Years 1–4**: Year 1 has 15 entries, Year 2 has 16, Year 3 has 13 and Year 4 has 21. This is a **partially mapped catalogue, not a claim that the current official BBA curriculum is complete**. It contains 48 common-core records, 8 Finance & Accounting option records and 9 Project Management option records. Common entries are based on the BBA structure published on the MUST School of Business & Economics site, and the official examination archive provides additional evidence for selected units and semester labels. Some specialization entries come from the historical published structure and still require department confirmation. The public curriculum page is historical and must be checked with the department before treating it as the current approved syllabus. Source conflicts were found: the older course-structure page lists Company Law as BFB 3400 while the official 2024/25 exam PDF labels it BFC 3400; it also lists BFC 3429 for different Finance-option subjects in different semesters. The catalogue uses BFC3400 from the exam paper and maps BFC3429 once, with these discrepancies flagged for academic verification.

The six initial Year 2 Semester 1 units remain the original pilot focus:

| Unit | Title | Original pilot quizzes | Original pilot questions |
| --- | --- | ---: | ---: |
| BFB3200 | Human Resource Management | 2 | 10 |
| BFB3201 | Business Law | 2 | 10 |
| BFB3202 | Entrepreneurship | 2 | 10 |
| BFB3203 | Leadership | 2 | 10 |
| BFB3205 | Public Relations | 2 | 10 |
| BFC3227 | Cost Accounting | 2 | 10 |

Fifty-eight additional course-specific practice quizzes now extend the initial six-unit pilot across the wider BBA catalogue. They cover accounting, economics, management, marketing, taxation, procurement, business statistics, communication, computing and e-commerce, sociology and development studies, HIV/AIDS education, environmental and corporate responsibility, governance, research methods, international business and finance, risk management, project appraisal and delivery, and leadership and organisational change. Each additional quiz has five original multiple-choice questions with explanations. These are **Ace Student practice questions**, not official MUST exam questions and not a replacement for lecturer notes or the approved syllabus. All 64 academic course units have at least one published quiz; the sole exception is the experiential eight-week Industrial Attachment unit.

Additionally, **ACC 101** (general introductory financial accounting) and **ECO 101** (general introductory microeconomics) remain general foundational quiz labels, **not verified official university course codes**.

Current content totals: **65 mapped course records, 74 published quizzes, 370 original multiple-choice questions, and 13 links to official MUST examination-archive papers**. This includes the initial 16 quizzes / 80 questions plus 58 newly seeded quizzes / 290 questions. Question answers remain server-side; grading and XP are handled by trusted SQL functions, not browser-submitted marks. The practice seed files are idempotent: rerunning them does not duplicate quizzes or questions.

## Resource sourcing

The live library now has **58 mapped resource records**: 13 MUST examination-archive papers, 9 MIT OpenCourseWare items, 20 OpenStax items, 6 Saylor University open courses, and 10 additional official/open references from Kenya Law, PPRA, KRA, WHO, OECD, the UN Global Compact and open-textbook publishers. All visible resource records are linked to at least one course code. Only the experiential Industrial Attachment unit currently has no reading resource, which is intentional. The catalogue includes publisher-hosted textbooks, lecture notes, exercises and open courses. The mapping is topical rather than a claim that an external source exactly matches the MUST lecturer's syllabus. **MIT papers are not Meru University examinations**. The thirteen resources attributed to the MUST examination archive link to official university-hosted past-paper PDFs; papers may cover multiple programmes, and their stated programme/year/semester should be checked before use. OpenStax and Saylor business-law materials are marked as non-Kenyan legal contexts and should not replace Kenyan statutes or case law. A resource tagged to a unit indicates topical relevance, not confirmation against that lecturer's exact unit outline.

Editorial research references:

- OpenStax, Managerial Accounting, contribution and break-even analysis: https://openstax.org/books/principles-managerial-accounting/pages/3-2-calculate-a-break-even-point-in-units-and-dollars
- OpenStax, Entrepreneurship feasibility: https://openstax.org/books/entrepreneurship/pages/11-3-conducting-a-feasibility-analysis
- OpenStax, Entrepreneurship opportunity recognition: https://openstax.org/books/entrepreneurship/pages/5-1-entrepreneurial-opportunity
- OpenStax, Principles of Management, teamwork: https://openstax.org/books/principles-management/pages/15-1-teamwork-in-the-workplace
- OpenStax, Principles of Management, communication: https://openstax.org/books/principles-management/pages/16-1-the-process-of-managerial-communication
- MIT OpenCourseWare, Introduction to Financial and Managerial Accounting exams: https://ocw.mit.edu/courses/15-501-introduction-to-financial-and-managerial-accounting-spring-2004/pages/exams/

## Student workflow

SBE pilot workflow → choose a BBA year and semester → open a unit → use original Ace guided lessons and knowledge checks → review official MUST archive papers → read or contribute a reviewer-approved model answer attached to that exact paper → practise a course quiz → review secure grading, explanations and missed-question recall → ask or answer questions in a course Study Space. Question threads support a shareable deep link and a copyable AI tutoring prompt. The question author or Study Space host can mark peer answers from 0–10 and provide feedback; this is a human peer/host evaluation, not automated AI grading or an official lecturer mark. Student PDFs stay private until a reviewer approves them.

## Pending before wider academic rollout

1. Lecturer or institution-led validation of exact syllabuses, correct module code mappings and question bank difficulty.
2. Obtain real MUST past papers **with explicit sharing permission** rather than mislabel third-party source documents.
3. Auth/signup testing with real accounts, complete OAuth/redirect validation and confirmation-email policy review for shared Supabase.
4. Device/browser smoke tests of PDF uploads, moderation approval, saved links and peer competitions with multiple participants.
5. Automated link-health checks and media accessibility audits.
6. Larger question banks, rubric-backed answer review, and topic-level mastery data to support sustainable revision.
7. Test the new model-answer moderation and question-thread evaluation flows with at least two real student accounts before general rollout.

The source content and SQL seed scripts are versioned under `supabase/seeds/`. `ace_verified_must_bba_curriculum.sql` seeds the mapped catalogue and official archive links; `ace_original_bba_practice.sql`, `ace_additional_core_practice.sql`, `ace_foundation_pathway_practice.sql`, `ace_final_pathway_practice.sql` and `ace_international_finance_practice.sql` seed original quizzes and explanations. All are idempotent. Both scripts are designed to be idempotent and should remain reproducible and auditable. Avoid inserting fake students, scores, or social engagement for visual effect.


## November 2026 SBE learning additions

The Year 2 Semester 1 workspace now includes fourteen original guided lessons across BFB3200 Human Resource Management I, BFB3201 Business Law, BFB3202 Introduction to Entrepreneurship, BFB3203 Principles of Leadership, BFB3204 Business English, BFB3205 Public Relations and BFC3227 Cost Accounting. Each lesson contains objectives, concept explanations, an applied example and a short knowledge check. These are internal Ace Student study notes and must not be represented as official lecturer notes.

Model-answer PDFs are stored as student contributions with a foreign-key reference to the exact `ace_open_resources` past-paper record. The new database migration only permits the Model answer resource type when it references a visible record whose kind is `Past paper` and whose course mapping includes the same unit code. Files remain pending moderation until an authorised reviewer approves them.

Study Space posts now distinguish messages, questions and answer replies. A question can be shared via a link or copied as a structured prompt for an external AI tutor. Answers may be scored from 0–10 with written feedback by the original question author or the Study Space host. These marks are peer/host feedback only; no automated AI grade or official university mark is claimed. Apply the new migration before using these features.
