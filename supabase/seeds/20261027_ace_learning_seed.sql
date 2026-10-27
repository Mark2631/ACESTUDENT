insert into public.ace_open_resources(title,subject,kind,provider,url,attribution,description) values
('Principles of Economics 3e','Economics','Textbook','OpenStax','https://openstax.org/details/books/principles-economics-3e/','OpenStax; CC BY-NC-SA 4.0; download on publisher site','Introductory microeconomics and macroeconomics textbook with a free PDF option.'),
('Introductory Business Statistics 2e','Business Statistics','Textbook','OpenStax','https://openstax.org/books/introductory-business-statistics-2e/pages/1-introduction','OpenStax; check book license and attribution before redistribution','Business-focused statistics textbook, accessible online.'),
('Principles of Accounting Volume 1: Financial Accounting','Financial Accounting','Textbook','OpenStax','https://openstax.org/details/books/principles-financial-accounting','OpenStax; free open textbook, see publisher license','Fundamentals of financial statements and accounting.'),
('Principles of Accounting Volume 2: Managerial Accounting','Cost Accounting','Textbook','OpenStax','https://openstax.org/details/books/principles-managerial-accounting','OpenStax; free open textbook, see publisher license','Management and cost accounting fundamentals.'),
('Introductory Business Statistics: terms and examples','Business Statistics','Lecture notes','OpenStax','https://openstax.org/books/introductory-business-statistics/pages/1-1-definitions-of-statistics-probability-and-key-terms','OpenStax; attribution and reuse restrictions apply','Definitions of population, sample and statistics, with practice examples.')
on conflict(url) do nothing;
insert into public.ace_quizzes(title,course_code,description) values
('Microeconomics · Fundamentals','ECO 101','Demand, supply, opportunity cost, and market equilibrium. Original introductory questions written for Ace Student.'),
('Financial Accounting · Foundations','ACC 101','Accounting equations, assets, liabilities, and basic double-entry. Original questions written for Ace Student.')
on conflict do nothing;
with target as (select id from public.ace_quizzes where title='Microeconomics · Fundamentals' limit 1)
insert into public.ace_questions(quiz_id,prompt,options,correct_index,explanation,sort_order)
select target.id,q.prompt,q.options::jsonb,q.correct_index,q.explanation,q.sort_order from target cross join (values
('The opportunity cost of a decision is:', '["The money spent on the decision","The value of the next best alternative forgone","All possible alternatives combined","The sunk cost of the decision"]',1,'Opportunity cost measures the value of the next best forgone alternative.',1),
('If the price of a good rises and other factors stay constant, quantity demanded usually:', '["Rises","Stays fixed","Falls","Becomes zero in every market"]',2,'The law of demand predicts lower quantity demanded as own price rises, ceteris paribus.',2),
('Which change is most likely to shift the demand curve for normal goods to the right?', '["A reduction in consumers income","An increase in consumers income","An increase in production costs","An increase in supply"]',1,'For a normal good, higher income increases demand at each price.',3),
('At a competitive market equilibrium:', '["Quantity supplied equals quantity demanded","Every producer earns an identical profit","There is always a shortage","Government sets the price"]',0,'Equilibrium is the market-clearing quantity where supply equals demand.',4),
('A binding price ceiling below equilibrium is likely to cause:', '["A surplus","No market effect","A shortage","A higher equilibrium price"]',2,'A price ceiling below equilibrium tends to increase quantity demanded and reduce quantity supplied.',5)
) as q(prompt,options,correct_index,explanation,sort_order) on conflict(quiz_id,sort_order) do nothing;
with target as (select id from public.ace_quizzes where title='Financial Accounting · Foundations' limit 1)
insert into public.ace_questions(quiz_id,prompt,options,correct_index,explanation,sort_order)
select target.id,q.prompt,q.options::jsonb,q.correct_index,q.explanation,q.sort_order from target cross join (values
('Which equation is the foundation of the statement of financial position?', '["Assets = Liabilities + Equity","Revenue = Assets + Expenses","Cash = Revenue - Payables","Assets = Profit + Revenue"]',0,'The accounting equation represents resources financed by creditors and owners.',1),
('When a business purchases equipment for cash, total assets:', '["Increase by the cost of equipment","Decrease by the cost of equipment","Stay the same","Always become liabilities"]',2,'Equipment increases as cash decreases by the same amount.',2),
('An amount owed by a business to a supplier is usually classified as:', '["Equity","A liability","Revenue","An expense only"]',1,'Accounts payable represents a present obligation to suppliers.',3),
('Recording the two-sided effects of each transaction is called:', '["Single-entry bookkeeping","Budget reconciliation","Double-entry bookkeeping","Cash forecasting"]',2,'Double-entry accounting records equal debit and credit effects.',4),
('Which transaction typically increases owner equity?', '["Paying off a payable in cash","Receiving capital invested by the owner","Buying equipment using cash","Collecting an existing receivable"]',1,'Owner contributions increase assets and owner equity.',5)
) as q(prompt,options,correct_index,explanation,sort_order) on conflict(quiz_id,sort_order) do nothing;