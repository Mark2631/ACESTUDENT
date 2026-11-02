alter table public.ace_study_notebooks
 add column if not exists sources jsonb not null default '[]'::jsonb;
do $$
begin
 if not exists (select 1 from pg_constraint where conrelid='public.ace_study_notebooks'::regclass and conname='ace_study_notebooks_sources_shape_check') then
  alter table public.ace_study_notebooks add constraint ace_study_notebooks_sources_shape_check
   check (jsonb_typeof(sources)='array' and jsonb_array_length(sources)<=100);
 end if;
end $$;
