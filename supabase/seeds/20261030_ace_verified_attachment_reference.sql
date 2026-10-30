-- Verified MUST industrial-attachment reference for the BBA catalogue.
-- The document is issued by MUST for industrial attachment and contains generic logbook/report-writing guidance.
insert into public.ace_open_resources(title,subject,kind,provider,url,attribution,description,related_codes)
select
  'MUST Industrial Attachment Logbook & Report-Writing Guide',
  'Industrial Attachment',
  'Official guide',
  'Meru University of Science and Technology',
  'https://sed.must.ac.ke/wp-content/uploads/2024/04/MECHANICAL-ENGINEERING-industrial-attachment-logbook.pdf',
  'Official MUST-hosted industrial attachment logbook. Engineering-issued; the generic logbook and report-writing sections are useful as a reference, but BBA students should follow current School of Business and Economics instructions where they differ.',
  'Official MUST-hosted reference covering daily and weekly records, supervisor review and a suggested attachment report structure. It is not presented as a BBA-specific handbook.',
  array['BFB3365']::text[]
where not exists (
  select 1 from public.ace_open_resources
  where url='https://sed.must.ac.ke/wp-content/uploads/2024/04/MECHANICAL-ENGINEERING-industrial-attachment-logbook.pdf'
    and 'BFB3365'=any(related_codes)
);
