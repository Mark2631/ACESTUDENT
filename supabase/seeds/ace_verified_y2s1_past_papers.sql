-- Verified MUST Year 2 Semester 1 past-paper expansion for Ace Student.
-- Sources were checked against MUST's official examination archive. Idempotent by URL.
INSERT INTO public.ace_open_resources(title,subject,kind,provider,url,attribution,description,related_codes)
SELECT v.title,v.subject,'Past paper','MUST examination archive',v.url,'Meru University of Science and Technology',v.description,v.related_codes
FROM (VALUES
 ('Human Resource Management, April 2024','BFB3200','https://exampapers.must.ac.ke/wp-content/uploads/2024/06/BFB-3200-HUMAN-RESOURCE-MANAGEMENT-.pdf','Official 2023/2024 BBA Year 2 Semester 1 examination paper.',ARRAY['BFB3200']::text[]),
 ('Business Law, January 2025','BFB3201','https://exampapers.must.ac.ke/wp-content/uploads/2025/09/BFB-3201-BUSINESS-LAW.pdf','Official 2024/2025 BBA Year 2 Semester 1 examination paper.',ARRAY['BFB3201']::text[]),
 ('Introduction to Entrepreneurship, January 2019','BFB3202','https://exampapers.must.ac.ke/wp-content/uploads/2020/01/BBS-3475BFB-3375-BFB-3202-ENTREPRENUERSHIP-SKILLS-INTRODUCTION-TO-ENTREPRENUERSHIP.docx.pdf','Official 2018/2019 paper explicitly listing BBA Year 2 Semester 1 under BFB 3202.',ARRAY['BFB3202']::text[]),
 ('Introduction to Entrepreneurship, August 2015','BFB3202','https://exampapers.must.ac.ke/wp-content/uploads/2020/01/Microsoft-Word-BFB-3202-ADDED-INTRODUCTION-TO-ENTREPRENEURSHIP-.docx.pdf','Official 2014/2015 paper explicitly listing BBA Year 2 Semester 1 under BFB 3202.',ARRAY['BFB3202']::text[]),
 ('Principles of Leadership, August 2023','BFB3203','https://exampapers.must.ac.ke/wp-content/uploads/2024/03/BFB-3203-PRINCIPLES-OF-LEADERSHIP.pdf','Official 2022/2023 BBA Year 2 Semester 1 examination paper.',ARRAY['BFB3203']::text[]),
 ('Introduction to Business English, October 2020','BFB3204','https://exampapers.must.ac.ke/wp-content/uploads/2021/06/BFB-3204-Introduction-to-Business-English.pdf','Official 2019/2020 BBA Year 2 Semester 1 examination paper.',ARRAY['BFB3204']::text[]),
 ('Public Relations, April 2024','BFB3205','https://exampapers.must.ac.ke/wp-content/uploads/2024/06/BFB-3205-PUBLIC-RELATIONS-.pdf','Official 2023/2024 BBA Year 2 Semester 1 examination paper.',ARRAY['BFB3205']::text[]),
 ('Public Relations, January 2026','BFB3205','https://exampapers.must.ac.ke/wp-content/uploads/2026/03/BBR-3404-BFB-3205-PUBLIC-RELATIONS.pdf','Official 2025/2026 examination paper identifying BFB 3205 Public Relations for BBA Year 2 Semester 1.',ARRAY['BFB3205']::text[]),
 ('Cost Accounting, January 2025','BFC3227','https://exampapers.must.ac.ke/wp-content/uploads/2025/04/BFC-3227-BFC-3225-COST-ACCOUNTINGCOST-AND-MANAGEMENT.pdf','Official 2024/2025 BBA Year 2 Semester 1 examination paper under BFC 3227.',ARRAY['BFC3227']::text[])
) AS v(title,subject,url,description,related_codes)
WHERE NOT EXISTS (SELECT 1 FROM public.ace_open_resources r WHERE r.url=v.url);