-- Idempotent Ace Student catalogue seed. Writes only ace_course_catalog and ace_open_resources; does not modify shared Auth settings or non-Ace tables.
-- Source: MUST School of Business & Economics published BBA course structure:
-- https://www.must.ac.ke/sbe/comment-page-1/
-- The published School course structure supplies common Years 1-3 units. Years 4 units below are included only where official MUST exam papers explicitly identify the BBA year/semester.
-- This seed contains only common courses. Finance and project specialization\n-- units are intentionally excluded until a pathway-to-course schema exists.
-- Once a separate Ace Student Supabase project is selected, apply academic taxonomy migration first.
WITH programme AS (
 SELECT p.id FROM public.ace_programmes p JOIN public.ace_institutions i ON i.id=p.institution_id
 WHERE i.short_name='MUST' AND p.name='Bachelor of Business Administration'
)
INSERT INTO public.ace_course_catalog(programme_id,code,title,year_of_study,semester)
SELECT programme.id,v.code,v.title,v.yr,v.sem
FROM programme CROSS JOIN (VALUES
 (1,1,'UCU3102','Communication Skills'),
 (1,1,'BFC3125','Introduction to Accounting I'),
 (1,1,'BFB3100','Constitution and Governance'),
 (1,1,'EFN3151','Sociology'),
 (1,1,'BEC3101','Principles of Microeconomics'),
 (1,1,'BFB3103','Principles of Management'),
 (1,1,'CIT3100','Introduction to Computer Technology'),
 (1,1,'UCU3103','HIV/AIDS'),
 (1,2,'BFC3175','Financial Accounting II'),
 (1,2,'SMB3151','Management Mathematics'),
 (1,2,'BFB3150','Insurance and Risk Management'),
 (1,2,'SMB3113','Introduction to Business Statistics'),
 (1,2,'BEC3150','Principles of Macroeconomics'),
 (1,2,'BFB3151','Principles of Marketing'),
 (1,2,'UCU3101','Development Studies and Ethics'),
 (2,1,'BFC3227','Cost Accounting'),
 (2,1,'BFB3200','Human Resource Management I'),
 (2,1,'BFB3201','Business Law'),
 (2,1,'BFB3202','Introduction to Entrepreneurship'),
 (2,1,'BFB3203','Principles of Leadership'),
 (2,1,'BFB3204','Business English'),
 (2,1,'BFB3205','Public Relations'),
 (2,2,'BFB3250','Introduction to Project Management'),
 (2,2,'BBS3125','Principles of Procurement'),
 (2,2,'BFB3251','Organizational Behaviour'),
 (2,2,'BFC3276','Introduction to Taxation'),
 (2,2,'BFC3226','Introduction to Financial Management'),
 (2,2,'CIT3251','Management Information System'),
 (2,2,'CIT3477','E-Commerce'),
 (3,1,'BFB3301','Environmental Issues in Business'),
 (3,1,'BFB3302','Behavioural Science'),
 (3,1,'BFB3465','Motivation and Stress Management'),
 (3,2,'EMP3350','Research Methodology'),
 (3,2,'BFC3327','Financial Accounting Theory'),
 (3,2,'BFC3329','Advanced Taxation'),
 (3,2,'BFB3350','Strategic Management'),
 (4,1,'BFC3400','Company Law'),
 (4,1,'BFC3428','Computerized Accounting'),
 (4,1,'BFB3366','International Business Management'),
 (4,2,'BFB3452','Business Planning')
) AS v(yr,sem,code,title)
ON CONFLICT(programme_id,code) DO UPDATE SET title=excluded.title, year_of_study=excluded.year_of_study, semester=excluded.semester;
-- The existing table has no specialization/pathway field. Introduce an explicit
-- specialization relation before using these option units in individualized recommendations.

-- Verified direct PDFs from MUST's own exam archive; these are past papers,
-- not user-uploaded notes or model-written exam content.
INSERT INTO public.ace_open_resources(title,subject,kind,provider,url,attribution,description,related_codes)
SELECT v.title,v.subject,v.kind,v.provider,v.url,v.attribution,v.description,v.related_codes
FROM (VALUES
 ('Business Law, January 2026','BFB3201','Past paper','MUST examination archive','https://exampapers.must.ac.ke/wp-content/uploads/2026/03/BFB-3201-BUSINESS-LAW.pdf','Meru University of Science and Technology','Official published university exam paper',ARRAY['BFB3201']::text[]),
 ('Business Law, December 2023','BFB3201','Past paper','MUST examination archive','https://exampapers.must.ac.ke/wp-content/uploads/2024/03/BFB-3201-BUSINESS-LAW.pdf','Meru University of Science and Technology','Official published university exam paper',ARRAY['BFB3201']::text[]),
 ('Strategic Management, April 2024','BFB3350','Past paper','MUST examination archive','https://exampapers.must.ac.ke/wp-content/uploads/2024/06/BFB-3350-STRATEGIC-MANAGEMENT-.pdf','Meru University of Science and Technology','Official published university exam paper',ARRAY['BFB3350']::text[]),
 ('Strategic Management, April 2023','BFB3350','Past paper','MUST examination archive','https://exampapers.must.ac.ke/wp-content/uploads/2024/03/BFB-3350-STRATEGIC-MANAGEMENT-1.pdf','Meru University of Science and Technology','Official published university exam paper',ARRAY['BFB3350']::text[]),
 ('Financial Accounting I, April 2024','BFC3125','Past paper','MUST examination archive','https://exampapers.must.ac.ke/wp-content/uploads/2024/06/BFC-3125-FINANCIAL-ACCOUNTING-I-.pdf','Meru University of Science and Technology','Official published university exam paper',ARRAY['BFC3125']::text[]),
 ('Company Law, January 2025','BFC3400','Past paper','MUST examination archive','https://exampapers.must.ac.ke/wp-content/uploads/2025/09/BFB-3400-COMPANY-LAW.docx.pdf','Meru University of Science and Technology','Official published BBA Year 4 Semester 1 examination paper',ARRAY['BFC3400']::text[]),
 ('Computerized Accounting, January 2025','BFC3428','Past paper','MUST examination archive','https://exampapers.must.ac.ke/wp-content/uploads/2025/04/BFC-3428-COMPUTERIZED-ACCOUNTING.pdf','Meru University of Science and Technology','Official published BBA Year 4 Semester 1 examination paper',ARRAY['BFC3428']::text[]),
 ('International Business Management, January 2026','BFB3366','Past paper','MUST examination archive','https://exampapers.must.ac.ke/wp-content/uploads/2026/03/BFB-3366-BFB-3300-INTERNATIONAL-BUSINESS-MANAGEMENT.pdf','Meru University of Science and Technology','Official published BBA Year 4 Semester 1 examination paper; paper also identifies BFB 3300',ARRAY['BFB3366']::text[]),
 ('Business Planning, April 2024','BFB3452','Past paper','MUST examination archive','https://exampapers.must.ac.ke/wp-content/uploads/2024/06/BFB-3452-BUSINESS-PLANNING-.pdf','Meru University of Science and Technology','Official published BBA Year 4 Semester 2 examination paper',ARRAY['BFB3452']::text[])
) AS v(title,subject,kind,provider,url,attribution,description,related_codes)
WHERE NOT EXISTS (SELECT 1 FROM public.ace_open_resources r WHERE r.url=v.url);
