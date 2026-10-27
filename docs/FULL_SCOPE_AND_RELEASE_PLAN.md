# Ace Student — recovered product scope and phased execution

## Mission
An academic learning operating system that turns material discovery into actual learning: **discover → understand → practice → compete → collaborate → improve**. Downloads alone are not the outcome.

## Source of requirements
This scope reconciles the user's original Ace Student / AcaFlux / eStudent descriptions, their later refinements, and the supplied Gemini conceptual architecture. It is a product backlog, not a claim that every feature has shipped.

## Full intended experience
1. **Academic graph:** Country → Institution → School → Programme → Year → Semester → Course / Unit → Topic. These filters are optional at signup but help personalize learning later.
2. **Learning library:** User-contributed lecture notes, textbooks only when sharing is permitted, past papers, assignments for study (not plagiarism), slides, curated YouTube tutorials, PDF reading and downloads subject to rights. Moderation, reporting and removal are essential.
3. **Study tools:** Flashcards, topic quizzes, past-paper practice, revision plans, spaced repetition and review of missed questions. Initial questions are assistant-drafted, with human academic verification required before institutional rollout; no paid AI integration at runtime.
4. **Peer competition:** Course-based challenges between real students, async first, verified scores, XP, provisional leaderboards and later university competitions. Do not trust browser-submitted scores or reveal answer keys before completion.
5. **Study Spaces:** Course communities, topic discussions, student and lecturer-led sessions using externally provided Google Meet/Zoom links. Moderation and consent before open group sharing.
6. **Progress:** Learning activity, weak topics, question accuracy, study consistency and goal setting; XP rewards meaningful learning rather than indiscriminate uploading.
7. **Creator layer:** Students can upload, categorize, edit their pending submissions, receive moderation feedback and see contribution history. No fake activity or invented contributors.
8. **Later capabilities:** Projects, source-grounded AI notebook when affordable, low-data/offline modes, career pathway support, deeper collaboration, advanced content recommendations.

## UX contract
- Dark navy/charcoal as default, reversible light theme.
- First-visit sign-in/create-account gate, with name, email, password; institution, programme and year optional.
- YouTube-like prominent centre Create control on mobile; it opens upload and eventually challenge/space creation.
- Homepage surfaces Library, Arena, Spaces, recent genuine scores, upcoming real sessions, and learning progress.
- Mobile-first PWA; familiar bottom navigation, content cards, restrained color, no fabricated testimonials, counters or decorative dashboards.
- Study and collaboration features must work before appearing as active actions.

## Authentication constraint
The shared Nexus Supabase project may serve other apps. Removing Ace Student's email magic-link interface does **not** disable Supabase email confirmation globally. Confirmation is a project-wide auth setting and must not be changed without reviewing effects on other apps. Password-based login can coexist with email confirmation. For a truly immediate no-email-verification signup, move Ace Student to its own Supabase project or explicitly approve the shared project's global setting change.

## Implementation order
1. [x] Core shell, public resources, private moderated uploads, RLS
2. [x] First-visit registration UI, optional academic details, dark theme, visible Create tab, mission-oriented homepage
3. [ ] Verify password auth and OAuth redirects with a test user; test signup/confirmation requirements
4. [ ] Student profile persistence for Google-auth users; robust profile editing
5. [ ] Moderation dashboard, content report flow, copyright policy, searchable academic taxonomy
6. [x] Database-side practice scoring and separated competition scoring; [ ] independent educator review and reliable timed exams
7. [ ] Asynchronous student challenges, verified scores and XP
8. [ ] Study Spaces, discussion permissions and session scheduling
9. [ ] Analytics, automated QA, performance/accessibility audit and pilot

## Acceptance tests before wider pilot
- New user can register and sign in, or gets an accurate explanation of confirmation requirement.
- Optional academic fields never block signup.
- Signed-out users cannot read private student profiles or pending resources.
- Unauthorized students cannot approve content or write other users' resources.
- A real student uploads a PDF, sees pending status, and it becomes visible only after approval.
- Public approved PDF opens; private unapproved PDF cannot be opened by a stranger.
- All five navigation actions function on a small Android screen; dark/light persist.
- Empty scores/sessions never masquerade as real data.
- No production deploy is claimed successful without Vercel READY state and smoke testing.
