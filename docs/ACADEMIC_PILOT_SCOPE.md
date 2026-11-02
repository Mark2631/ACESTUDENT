# Ace Student academic pilot · MUST School of Business & Economics

## Pilot boundary

The first institutional pilot is limited to Meru University of Science and Technology (MUST), School of Business and Economics, Bachelor of Business Administration (BBA). Do not surface other MUST schools, other universities or unrelated general learning disciplines as equal catalogue destinations in the pilot experience.

The programme catalogue contains 65 mapped BBA unit records across Years 1–4. It separates common units from the Finance & Accounting and Project Management pathways. This is a working map, not a declaration that the public university curriculum is complete or current. The current MUST SBE undergraduate page lists BBA among the school programmes but does not provide a complete semester-by-semester unit map. The course list must be confirmed with the department before it is treated as the current approved curriculum:
- https://sbe.must.ac.ke/undergraduate/

## Year 2 Semester 1 initial cohort

The six units in the user's supplied 2026 Y2S1 timetable are the initial pilot cohort:

| Code | Unit |
| --- | --- |
| BFB3200 | Human Resource Management I |
| BFB3201 | Business Law |
| BFB3202 | Introduction to Entrepreneurship |
| BFB3203 | Principles of Leadership |
| BFB3205 | Public Relations |
| BFC3227 | Cost Accounting |

The existing BBA catalogue snapshot also lists BFB3204 Business English in Y2S1. It remains visible in the course map but is flagged for current-registration confirmation because it is absent from the supplied 2026 timetable. Do not silently delete it or represent it as registered by every student.

The connected catalogue currently has 7 Y2S1 common-unit records, 13 published practice quizzes across those records, and 11 official MUST past-paper links mapped to those units. The six timetable units each have two published quizzes. Business English currently has one. These are live catalogue counts, not student activity or pass-rate claims.

## The student journey

1. **Choose academic context:** BBA year, semester and (where applicable) Finance & Accounting or Project Management pathway.
2. **Open a unit:** the unit page is the student's home for in-app lessons, practice quizzes, official MUST papers, approved student material, study spaces and a private Study Studio notebook.
3. **Learn a concept:** use original Ace lessons, the student's own uploaded notes and approved resources. Study Studio can extract text from supported PDFs and office documents, build flashcards, run recall practice, schedule reviews with FSRS and search source excerpts.
4. **Practise:** authenticated course quizzes use the existing server-side grading RPC. Answers and marks are not trusted from the browser. Missed questions enter the existing recall/review flow.
5. **Prepare with past papers:** MUST exam archive papers are labelled by source and linked to the relevant unit. The original paper remains the authoritative document; embedded reading has a direct fallback to the original PDF.
6. **Compare model answers:** a student or staff member can upload a PDF answer against one exact past paper. It stays private/pending until the existing reviewer workflow approves it. Approval is content moderation, not proof of lecturer marking or academic correctness. A lecturer-confirmed answer must be labelled separately.
7. **Ask a unit question:** signed-in students can post concept, calculation, case-study, exam-style or discussion questions in the unit board. A question can include a screenshot. Peers post written or image answers. Each answer starts as unreviewed; the question owner or an assigned reviewer evaluates it as Correct, Partly correct or Needs revision and can leave feedback. A question owner can mark the thread resolved. This is explicit human/peer evaluation, not automatic AI grading.
8. **Compete:** quiz-based peer challenges use published BBA quizzes, fresh event attempts, server-side grading and standings. This is the scored competition mode. The question board is for open-ended discussion and human evaluation.
9. **Share questions:** students can share an in-app question link with classmates, send the text prompt to an AI assistant, or hand off an attached screenshot through the device's native share sheet where file sharing is supported. This is a handoff, not an in-app generative AI answer. Study Studio Find mode retrieves relevant excerpts from a student's own source material and does not fabricate generated answers.

## Model-answer data and moderation

The ace_resources.related_paper_id column links a pending/approved student PDF to one ace_open_resources past-paper row. The file uses the existing private ace-submissions bucket, uploader ownership rules and reviewer moderation. Do not make pending files public or bypass review. If a lecturer supplies an official memorandum, preserve its provenance and use a separate verified label; do not conflate it with a student solution.

Migration: 20261102090000_ace_model_answer_paper_link.sql.

## Academic integrity and AI boundary

- Original Ace quizzes are practice material, not official MUST exam questions.
- MUST past papers retain their original attribution and are not presented as Ace-authored.
- A moderator approving a file does not establish that its answers are correct.
- Current app capabilities include source-grounded excerpt retrieval, flashcards, self-assessed written recall, MCQ grading and native share-to-AI handoff. There is no in-app generative model provider configured. Do not market the share action as an integrated AI tutor or say that free-text discussion answers are automatically evaluated.
- For long-answer evaluation, the product needs lecturer-approved rubrics/model answers and a transparent human/peer review workflow or an explicitly selected, budgeted AI provider. Do not fake marks with keyword matching.

## Pilot success criteria

- A new BBA student can select their year/semester and reach a unit in two interactions.
- A student can read at least one in-app lesson, attempt a unit quiz, see server-graded feedback and review a missed question.
- A student can open a mapped MUST past paper and find its provenance.
- A student can upload a model answer to the exact paper; it remains private until moderation; an approved answer can be opened by another eligible student.
- Two real accounts can create/join a course space, share notes and complete a peer challenge.
- Mobile upload, PDF reading, sign-in, privacy/RLS and accessibility are tested with real student accounts before production release.
- Department staff verify the current unit map, past-paper permissions and academic quality before widening the cohort.

## Official university portals

- SBE undergraduate programmes: https://sbe.must.ac.ke/undergraduate/
- Undergraduate programmes: https://sbe.must.ac.ke/undergraduate/
- Official examination archive: https://exampapers.must.ac.ke/
- MUST Library: https://library.must.ac.ke/
- Library past-paper access guide (PDF): https://library.must.ac.ke/wp-content/uploads/2025/04/How-to-Access-Past-papers-compressed.pdf
