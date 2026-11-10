# Ace Student build standards

## Product scope
Milestone 1 is the content core only: onboarding, library discovery, uploads, document viewing, personal uploads and profile. Groups, chat, scheduled sessions, live quiz matches and leaderboards are later phases.

## Product quality
- No UI element exists only to fill space.
- No activity metric is shown unless it comes from persisted data.
- Empty states explain what is missing and give the next useful action.
- Search and upload remain visible and easy to reach.
- University and secondary paths share the same taxonomy.
- Self-reported school affiliation is accepted at launch; verification is not a signup gate.
- Content moderation and copyright rules are visible before contribution.

## Design rules
- Restrained palette, clear typography, consistent spacing and few component patterns.
- No decorative gradients, glowing surfaces, oversized empty cards or generic AI dashboard patterns.
- Desktop sidebar and mobile bottom navigation share the same destinations.
- Keyboard access, visible focus, semantic controls and readable contrast are mandatory.
- Loading, error, empty, pending and approved states must be distinct.

## Engineering rules
- Supabase sessions use cookies through @supabase/ssr.
- Server routes verify identity; client input is never trusted for ownership.
- RLS is required for all user-owned tables and Storage paths.
- Upload metadata is committed only after Storage upload succeeds. Failed metadata writes attempt Storage cleanup.
- Browser code receives only the Supabase publishable key. Service-role keys must never enter source.
- Schema and data migrations are reviewed before application to the existing shared database.
- No production deployment or database mutation is part of the branch build.