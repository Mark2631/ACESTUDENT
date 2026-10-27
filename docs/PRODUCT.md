# Ace Student — product foundation

## Mission
Help students become excellent learners through discovery, active recall and supportive peer interaction. A resource download is an entry point, not the success metric.

## Research-informed design
- **YouTube / Google Play**: familiar search-first exploration, horizontally browsable course collections, clear metadata and one primary action per item. Inspiration only; no copies of proprietary branding.
- **Quizlet**: activity-first studying and feedback, not passive reading. Quizlet uses distinct Learn, Flashcards, Test and Match modes (https://quizlet.com/features/study-modes).
- **Studocu**: course-specific student uploads, classification and moderation. In June 2026 its support documentation stated uploads were desktop-only (https://help.studocu.com/hc/en-us/articles/22163198385298-Can-I-upload-documents-via-the-Mobile-App), so mobile uploading is central to Ace Student.
- **Android guidance**: 3–5 primary bottom-navigation destinations on mobile; adaptive rail on larger screens (https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns).
- **Okwasem / Akwaafem**: included in competitive research backlog; exact public product and metrics have not been independently verified. Do not manufacture reviews or ratings.

## User experience principles
1. Phone-first **application**, not marketing page. No hero billboard, meaningless gradients, fake counters or placeholder reviews.
2. Explore content before signing in; require sign-in only for contributions, saved material or practice progress.
3. Short loop: Find course → open resource → practice recall → review explanation → share or return.
4. Context at all times: university, course code, topic, content type, uploader and moderation status.
5. Separate *documents uploaded by students* from *practice questions drafted for learning and later checked by educators*. Initial question sets are assistant-drafted and have not received independent academic review. No paid AI inference is used at runtime.
6. Student contribution on mobile, with PDF upload, clear consent, review, report and removal. Never publish unchecked copyrighted or private material by default.

## MVP vertical slice
- Real publicly browsable approved resources with search, course/type filter and empty states.
- Email sign-in, permissioned PDF upload, queued moderation.
- Original course-practice questions with server-authoritative grading and post-attempt explanations; educator review is required before general academic reliance.
- Study Spaces and head-to-head arenas are subsequent authenticated vertical slices; don't pretend they work yet.
- Installable PWA manifest; offline document caching is deferred until privacy and quota handling are in place.

## Pilot
Start with a small number of participating BBA courses at Meru University. Recruit legitimate materials and volunteer question reviewers; do not seed fake users or fabricated documents. Track first useful action, successful document access, first practice completed, repeat study activity and moderation time. Expand only once there is repeat use and reliable core workflows.

## Security and delivery
Ace tables use dedicated `ace_` prefixes in the existing Nexus database to avoid impacting unrelated apps. RLS on all exposed data tables. Storage is private by default; only reviewed resources become public. Keep publishable keys public and service-role secrets off clients. Every schema change belongs in a checked-in migration. Deploy preview, verify critical flows, then release production deliberately.

## Open decisions
Product naming and domain clearance; question sourcing/review incentives; academic copyright policy; Kenyan data protection obligations; institutional expansion. These require verification rather than speculative answers.
