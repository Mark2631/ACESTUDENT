alter table public.ace_study_notebooks
 add column if not exists subject_slug text references public.ace_learning_areas(slug) on delete set null;
create index if not exists ace_study_notebooks_subject_idx
 on public.ace_study_notebooks(subject_slug,updated_at desc)
 where subject_slug is not null;
