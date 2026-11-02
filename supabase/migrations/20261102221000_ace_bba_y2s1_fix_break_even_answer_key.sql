-- Correct the answer key for the BFB3202 exam-preparation set.
UPDATE public.ace_questions
SET correct_index = 3,
    explanation = 'Contribution per job = 900 − 540 = KSh 360. Break-even volume = 18,000 ÷ 360 = 50 jobs.'
WHERE id = 'a1200000-0000-4000-8000-000000000024'
  AND prompt = 'A business sells a service for KSh 900 per job. Variable cost is KSh 540 per job. Monthly fixed costs are KSh 18,000. How many jobs are required to break even?';
