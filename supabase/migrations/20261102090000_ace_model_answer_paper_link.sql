-- Link moderated student model-answer PDFs to the exact official past paper they address.
-- Reuses ace_resources moderation, ownership policies and the private ace-submissions bucket.
ALTER TABLE public.ace_resources
  ADD COLUMN IF NOT EXISTS related_paper_id uuid
  REFERENCES public.ace_open_resources(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ace_resources_related_paper_idx
  ON public.ace_resources(related_paper_id)
  WHERE related_paper_id IS NOT NULL;

COMMENT ON COLUMN public.ace_resources.related_paper_id IS
  'Optional official MUST past-paper resource answered by this student-submitted model-answer PDF. The answer remains pending until approved by a reviewer.';
