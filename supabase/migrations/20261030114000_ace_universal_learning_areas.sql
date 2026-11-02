create table if not exists public.ace_learning_areas (
 slug text primary key check (slug ~ '^[a-z0-9-]{2,64}$'),
 title text not null check (char_length(title) between 2 and 70),
 kind text not null check (kind in ('discipline','subject')),
 parent_slug text references public.ace_learning_areas(slug) on delete cascade,
 description text not null default '',
 keywords text[] not null default '{}',
 sort_order integer not null default 0,
 active boolean not null default true,
 constraint ace_learning_areas_parent_kind check (
  (kind='discipline' and parent_slug is null) or
  (kind='subject' and parent_slug is not null)
 )
);
create index if not exists ace_learning_areas_parent_idx on public.ace_learning_areas(parent_slug,sort_order) where active=true;
alter table public.ace_learning_areas enable row level security;
revoke all on public.ace_learning_areas from anon,authenticated;
grant select on public.ace_learning_areas to anon,authenticated;
drop policy if exists ace_learning_areas_public_read on public.ace_learning_areas;
create policy ace_learning_areas_public_read on public.ace_learning_areas
for select to anon,authenticated using (active=true);
insert into public.ace_learning_areas(slug,title,kind,parent_slug,description,keywords,sort_order) values
('business','Business & enterprise','discipline',null,'Build practical understanding of organizations, markets, money and management.',array['business','management','organization'],10),
('computing','Computing & technology','discipline',null,'Learn to build, understand and secure digital systems.',array['computer science','technology','software'],20),
('mathematics','Mathematics & statistics','discipline',null,'Develop quantitative reasoning, modelling and evidence-based decision making.',array['mathematics','statistics','quantitative'],30),
('natural-sciences','Natural sciences','discipline',null,'Explore the physical and living world through observation and experimentation.',array['science','biology','chemistry','physics'],40),
('engineering','Engineering & design','discipline',null,'Apply scientific principles to design, build and improve useful systems.',array['engineering','design','manufacturing'],50),
('health','Health & wellbeing','discipline',null,'Understand human health, public health and evidence-informed care.',array['health','medicine','wellbeing'],60),
('social-sciences','Social sciences','discipline',null,'Study people, societies, institutions, behaviour and public life.',array['society','psychology','politics'],70),
('humanities','Humanities & communication','discipline',null,'Interpret ideas, culture, history, language and human expression.',array['humanities','history','communication'],80)
on conflict(slug) do update set title=excluded.title,description=excluded.description,keywords=excluded.keywords,sort_order=excluded.sort_order,active=true;
insert into public.ace_learning_areas(slug,title,kind,parent_slug,description,keywords,sort_order) values
('accounting','Accounting','subject','business','Financial reporting, cost accounting and management accounting.',array['financial accounting','cost accounting','auditing'],10),
('economics','Economics','subject','business','Microeconomics, macroeconomics, markets and economic policy.',array['microeconomics','macroeconomics','markets'],20),
('finance','Finance','subject','business','Corporate finance, investments, banking and financial literacy.',array['investment','banking','financial management'],30),
('marketing','Marketing','subject','business','Customer behaviour, branding, strategy and digital marketing.',array['branding','consumer behaviour','digital marketing'],40),
('management','Management','subject','business','People, strategy, operations, leadership and organizational design.',array['human resources','operations','leadership'],50),
('entrepreneurship','Entrepreneurship','subject','business','Opportunity discovery, venture design and business models.',array['startups','innovation','business model'],60),
('programming','Programming','subject','computing','Programming foundations, algorithms and application development.',array['python','javascript','software development'],10),
('data-science','Data science & AI','subject','computing','Data analysis, statistics, machine learning and responsible AI.',array['artificial intelligence','machine learning','analytics'],20),
('cybersecurity','Cybersecurity','subject','computing','Security fundamentals, networks, identity and threat awareness.',array['security','networking','privacy'],30),
('information-systems','Information systems','subject','computing','Databases, systems analysis, enterprise software and digital operations.',array['databases','systems analysis','IT'],40),
('algebra','Algebra','subject','mathematics','Equations, functions and mathematical structures.',array['equations','functions'],10),
('calculus','Calculus','subject','mathematics','Limits, derivatives, integrals and mathematical modelling.',array['derivatives','integrals'],20),
('statistics','Statistics','subject','mathematics','Probability, inference, research methods and interpretation of data.',array['probability','regression','sampling'],30),
('biology','Biology','subject','natural-sciences','Cells, organisms, genetics, ecology and evolution.',array['genetics','ecology'],10),
('chemistry','Chemistry','subject','natural-sciences','Matter, reactions, atomic structure and chemical systems.',array['organic chemistry','reactions'],20),
('physics','Physics','subject','natural-sciences','Mechanics, energy, waves, electricity and modern physics.',array['mechanics','electricity'],30),
('environment','Environmental science','subject','natural-sciences','Climate, ecosystems, sustainability and environmental systems.',array['climate','ecology','sustainability'],40),
('civil-engineering','Civil engineering','subject','engineering','Structures, infrastructure, materials and the built environment.',array['structures','construction'],10),
('electrical-engineering','Electrical engineering','subject','engineering','Circuits, electronics, power systems and signals.',array['electronics','power'],20),
('mechanical-engineering','Mechanical engineering','subject','engineering','Mechanics, thermodynamics, materials and machine design.',array['thermodynamics','machines'],30),
('design','Product & interaction design','subject','engineering','Human-centred design, prototyping and product development.',array['UX','product design','prototyping'],40),
('anatomy','Anatomy & physiology','subject','health','Human body structures, systems and physiological processes.',array['human body','physiology'],10),
('public-health','Public health','subject','health','Population health, prevention, epidemiology and health systems.',array['epidemiology','health systems'],20),
('nutrition','Nutrition','subject','health','Nutrition science, food systems and healthy dietary patterns.',array['food','diet'],30),
('psychology','Psychology','subject','social-sciences','Cognition, development, behaviour and mental processes.',array['cognition','behaviour'],10),
('sociology','Sociology','subject','social-sciences','Social institutions, inequality, culture and social change.',array['culture','social change'],20),
('political-science','Political science','subject','social-sciences','Governance, political institutions, public policy and international relations.',array['governance','policy'],30),
('education','Education','subject','social-sciences','Learning science, teaching practice, assessment and educational systems.',array['pedagogy','assessment'],40),
('history','History','subject','humanities','Historical periods, sources, interpretation and change over time.',array['historical sources','world history'],10),
('philosophy','Philosophy','subject','humanities','Logic, ethics, knowledge and philosophical argument.',array['ethics','logic'],20),
('literature','Literature & language','subject','humanities','Literary analysis, writing, language and critical reading.',array['writing','literary analysis'],30),
('communication','Communication & media','subject','humanities','Public communication, media literacy, journalism and rhetoric.',array['media','public relations'],40)
on conflict(slug) do update set title=excluded.title,description=excluded.description,parent_slug=excluded.parent_slug,keywords=excluded.keywords,sort_order=excluded.sort_order,active=true;
update public.ace_open_resources
set hidden=true
where provider ilike '%MUST%' or title ilike '%MUST%' or description ilike '%Meru University%';
