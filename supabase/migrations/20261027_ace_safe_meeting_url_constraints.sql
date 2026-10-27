-- Enforce authentic meeting providers; reject lookalike hostnames (e.g. evilzoom.us).
alter table public.ace_spaces add constraint ace_space_safe_meeting_link check(
 meeting_url is null or lower(meeting_url) ~ '^https://(meet\.google\.com/|([a-z0-9-]+\.)*zoom\.us/|teams\.microsoft\.com/)'
);
alter table public.ace_study_sessions add constraint ace_session_safe_meeting_link check(
 lower(meeting_url) ~ '^https://(meet\.google\.com/|([a-z0-9-]+\.)*zoom\.us/|teams\.microsoft\.com/)'
);