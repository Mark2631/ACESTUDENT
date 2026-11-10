# Ace Student — Product brief

## Vision
Ace Student is a student-run learning community built on two pillars: a shared library of notes, past papers and course materials; and live social collaboration layered on top of that content.

The library is the first point of entry. Collaboration and competition are later reasons to return.

## Locked decisions
- Support university and secondary-school taxonomy from signup.
- University path: school, programme/course of study, year and course selections.
- Secondary path: school, form/year and multiple subjects.
- School affiliation is self-reported in v1. Do not introduce verification friction before there is evidence of abuse.
- Ship the content library first. Build groups, messaging and quizzes on the same taxonomy later.

## v1 information architecture
- Onboarding: education level → school → programme/year or form → courses/subjects.
- Home: recent approved uploads.
- Search: cross-school library with school, course and document-type filters.
- Document viewer: PDF/image preview, original-file download, helpful vote and report.
- Upload: file, course, type, title and optional description.
- My uploads and profile: contribution status and academic details.

## Taxonomy
School → Course/Subject → Document. Every document and later group or quiz must connect through this shared taxonomy.

An unlisted school or course can be added by the student. School entries are self-reported at launch. Duplicate names are normalized at the database layer.

## v2 collaboration
Groups directory, group spaces, messaging, shared materials, scheduled Meet/Zoom sessions and group quizzes.

## v3 competition
Manual quiz authoring, 1:1 matches, scoring/results and class/school/inter-school leaderboards.

## Deferred
AI question generation and AI opponents are intentionally deferred until core student usage justifies their cost.

## Risks to address as usage grows
- Copyright and ownership of uploaded material.
- Review process for flagged or inaccurate documents.
- School self-reporting abuse if inter-school rankings are introduced.
- Reporting and blocking before messaging launches.
- Monetization only after contribution and access patterns are understood.
