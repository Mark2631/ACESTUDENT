# Ace Student — native learning platform execution plan

## Product rule
Ace Student is the destination, not a directory of competing websites. Benchmark the ease of document discovery, synchronous learning, community messaging and real student competitions. Do not copy proprietary interfaces, brands, or content.

## Verified baseline (repository README, 2026-10-30)
Existing app has moderated PDF submissions, course library, peer quizzes, Study Spaces, live discussions, session scheduling and third-party meeting links. Existing meeting links do NOT constitute native video rooms. Existing discussion is not yet equivalent to WhatsApp-style messaging. Do not describe either as complete.

## P0 — Document library (Studocu-level workflows)
- Upload PDF with clear ownership/rights declaration, file preview, course/institution/year metadata, progress and retry.
- Extract PDF text server-side safely, validate MIME by bytes, virus scan, deduplicate by SHA-256, reject encrypted/corrupt/oversized files, strip risky metadata.
- Public approved content only; pending documents visible only to author/reviewer. Search by title, course, institution, tags, extracted text. Show preview before download, report/takedown and uploader attribution.
- Seed only licensed/openly distributable material with explicit source attribution and permission; do not scrape or rehost Studocu documents.

## P1 — Native community messaging (WhatsApp benchmark)
- Channels per course and private study groups; threaded replies, reactions, attachments, unread counts, search, mention notifications, mute, block/report and moderation.
- Use Supabase Realtime with membership-gated RLS for channels/messages. Server-validated attachments and per-user rate limits. Do not expose phone numbers by default.
- Show offline state, optimistic sends with idempotency keys, delivery/retry states, pagination and realtime reconnection.

## P1 — Native learning rooms (Meet/Zoom benchmark)
- Start/join inside Ace Student with room lobby, audio/video permission prompts, mute/camera, participant list, screen share (browser support permitting), host controls and reconnect handling.
- WebRTC requires authenticated signaling plus TURN relay, not merely a browser UI. Assess SFU infrastructure for groups; pure peer-to-peer is unsuitable for larger classes.
- Avoid storing recordings by default. Explicit consent and retention controls before adding recordings.
- Gate rooms by group membership, use short-lived credentials, enforce participant limits, handle device permissions and network failures.
- Ship reliable 1:1 and small-group calls first; only advertise larger classes after load testing and cost assessment.

## P1 — Genuine student competitions
- Human-created quizzes, scheduled events, private/public participation, server-side grading, anti-cheat limits, verified scoreboards, dispute/report flow.
- Clearly distinguish practice scores from institution-certified academic results. No synthetic students or fabricated participation.

## Acceptance gates
1. Anonymous visitor can search and preview approved resources; unauthorized users cannot read pending uploads.
2. Student can upload, track moderation status, withdraw and report content; invalid files are rejected.
3. Group members can message live across two devices; nonmembers cannot read or send; reconnect does not duplicate messages.
4. Two authenticated users can join an in-app call, toggle microphone/camera, screen share on supported browsers and recover after connection loss.
5. Competition results are computed server-side and cannot be forged from browser requests.
6. Mobile-first accessibility, keyboard navigation, sensible loading/error/empty states, RLS tests and CI checks must pass before release.

## Delivery order
Audit current migrations/components and tests; finish document UX and security; implement messaging; prototype room signaling and TURN/SFU economics; implement native calls; strengthen competitions; seed licensed material; run security and multi-device tests; then request production release approval. Never silently deploy or represent roadmap items as shipped.
