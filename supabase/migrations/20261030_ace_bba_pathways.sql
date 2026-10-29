-- Add explicit BBA pathway metadata and map only options named in the published MUST BBA course structure.
-- Source: https://www.must.ac.ke/sbe/comment-page-1/
-- Verify this historical structure with the department before treating it as the current approved syllabus.
ALTER TABLE public.ace_course_catalog
  ADD COLUMN IF NOT EXISTS pathway text NOT NULL DEFAULT 'common'
  CHECK (pathway IN ('common','finance_accounting','project_management'));

WITH programme AS (
 SELECT p.id FROM public.ace_programmes p JOIN public.ace_institutions i ON i.id=p.institution_id
 WHERE i.short_name='MUST' AND p.name='Bachelor of Business Administration'
)
INSERT INTO public.ace_course_catalog(programme_id,code,title,year_of_study,semester,pathway)
SELECT programme.id,v.code,v.title,v.yr,v.sem,v.pathway
FROM programme CROSS JOIN (VALUES
 (3,2,'BFB3351','Corporate Social Responsibility', 'common'),
 (3,2,'BFB3365','Industrial Attachment (8 Weeks)', 'common'),
 (4,1,'BFB3401','Cross Cultural Management', 'common'),
 (4,1,'BFB3402','Management of Organizational Change', 'common'),
 (4,1,'BFB3420','Leadership and Team Building', 'common'),
 (4,2,'BFB3451','Corporate Governance', 'common'),
 (4,2,'BFB3469','Workplace Counselling', 'common'),
 (4,2,'BFC3475','Management Research Project', 'common'),
 (4,1,'BFC3426','Advanced Accounting II', 'finance_accounting'),
 (3,2,'BFC3381','Project Appraisal', 'finance_accounting'),
 (3,2,'BFC3479','Financial Risk Management', 'finance_accounting'),
 (4,2,'BFC3429','International Finance', 'finance_accounting'),
 (4,1,'BFC3425','Management Accounting', 'finance_accounting'),
 (3,2,'BFB3361','Project Risk Analysis and Management', 'project_management'),
 (3,2,'BFB3362','Decision Making in Projects', 'project_management'),
 (3,2,'BFB3363','Project Appraisal', 'project_management'),
 (4,1,'BFB3411','Project Portfolio Management', 'project_management'),
 (4,1,'BFB3412','Project Finance', 'project_management'),
 (4,1,'BFB3413','Project Resources Management', 'project_management'),
 (4,2,'BFB3462','Project Management Decision Making Models', 'project_management'),
 (4,2,'BFB3463','Projects Organization, Management and Leadership', 'project_management'),
 (4,2,'BFB3464','Global Project Management', 'project_management')
) AS v(yr,sem,code,title,pathway)
ON CONFLICT(programme_id,code) DO UPDATE
SET title=excluded.title,year_of_study=excluded.year_of_study,semester=excluded.semester,pathway=excluded.pathway;

UPDATE public.ace_course_catalog c
SET pathway='finance_accounting',year_of_study=4,semester=2
FROM public.ace_programmes p JOIN public.ace_institutions i ON i.id=p.institution_id
WHERE c.programme_id=p.id AND i.short_name='MUST' AND p.name='Bachelor of Business Administration'
AND c.code IN ('BFC3327','BFC3329');

UPDATE public.ace_course_catalog c SET pathway='finance_accounting'
FROM public.ace_programmes p JOIN public.ace_institutions i ON i.id=p.institution_id
WHERE c.programme_id=p.id AND i.short_name='MUST' AND p.name='Bachelor of Business Administration'
AND c.code IN ('BFC3428');
