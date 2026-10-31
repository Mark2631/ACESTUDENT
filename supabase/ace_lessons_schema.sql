-- Original, on-platform Ace Student lessons. Applied to the linked Ace Supabase project.
-- This reference schema is safe to execute again; content itself is seeded separately.
create table if not exists public.ace_lessons (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check (slug ~ '^[a-z0-9-]{4,90}$'),
 title text not null check (char_length(title) between 5 and 150),
 subject_slug text references public.ace_learning_areas(slug) on delete set null,
 subject_label text not null,
 level text not null default 'Beginner' check (level in ('Beginner','Intermediate','Advanced')),
 reading_minutes integer not null default 7 check (reading_minutes between 1 and 90),
 summary text not null,
 learning_outcomes text[] not null default '{}',
 sections jsonb not null check (jsonb_typeof(sections)='array' and jsonb_array_length(sections) between 2 and 16),
 review_questions jsonb not null default '[]'::jsonb check(jsonb_typeof(review_questions)='array'),
 illustration text not null default 'books' check(illustration in ('books','chart','code','science','globe','calculator','scales','briefcase','brain','market')),
 accent text not null default 'indigo' check(accent in ('indigo','sage','amber','slate','rose')),
 published boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists ace_lessons_subject_published_idx on public.ace_lessons(subject_slug,title) where published;
alter table public.ace_lessons enable row level security;
revoke all on public.ace_lessons from anon, authenticated;
grant select on public.ace_lessons to anon, authenticated;
drop policy if exists ace_lessons_public_read on public.ace_lessons;
create policy ace_lessons_public_read on public.ace_lessons for select to anon,authenticated using (published=true);
