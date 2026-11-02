-- Enable low-volume Postgres Changes subscriptions for the BBA unit Q&A board.
-- RLS policies continue to govern which rows authenticated students can receive.
ALTER PUBLICATION supabase_realtime
  ADD TABLE public.ace_course_questions,
             public.ace_course_answers,
             public.ace_course_answer_reviews;
