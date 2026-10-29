-- Idempotent BBA Finance pathway practice quiz.
-- Original study questions; not copied from the official exam paper.
DO $$
DECLARE qid uuid;
BEGIN
  SELECT id INTO qid FROM public.ace_quizzes
  WHERE course_code='BFC3429' AND title='Ace Practice · International Finance'
  LIMIT 1;
  IF qid IS NULL THEN
    INSERT INTO public.ace_quizzes(title,course_code,description,status)
    VALUES ('Ace Practice · International Finance','BFC3429','Original practice on exchange-rate exposure, hedging, international cash flows and cross-border finance.','published')
    RETURNING id INTO qid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.ace_questions WHERE quiz_id=qid) THEN
    INSERT INTO public.ace_questions(quiz_id,prompt,options,correct_index,explanation,sort_order) VALUES
    (qid,'A Kenyan firm must pay US$20,000 in three months. The main transaction exposure is that:',jsonb_build_array('Exchange-rate changes may alter the shilling cost of the future dollar payment','The invoice amount will automatically become revenue','The exchange rate cannot change before payment','The firm has no cash-flow risk if the contract is in dollars'),0,'A foreign-currency payable creates transaction exposure because the domestic-currency amount required at settlement can change.',1),
    (qid,'If a Kenyan exporter expects to receive US dollars later and wants to lock in a conversion rate today, a common instrument is a:',jsonb_build_array('Forward exchange contract','Ordinary share split','Warehouse receipt','Fixed-asset depreciation schedule'),0,'A forward contract can set an agreed exchange rate for a specified future currency exchange, subject to its terms and counterparty risk.',2),
    (qid,'A currency depreciates against another currency. All else equal, the depreciating currency’s exports may become:',jsonb_build_array('Cheaper to foreign buyers in their currency','Automatically illegal','More expensive to every foreign buyer','Unaffected under every pricing arrangement'),0,'Depreciation can lower foreign-currency export prices if exporters pass through the exchange-rate change; actual effects depend on pricing and contracts.',3),
    (qid,'Which exposure arises when translating a foreign subsidiary’s financial statements into the parent company’s reporting currency?',jsonb_build_array('Translation exposure','Inventory shrinkage only','Domestic payroll exposure only','A guaranteed arbitrage profit'),0,'Translation exposure arises from converting foreign operations’ accounts into the group reporting currency.',4),
    (qid,'Why might a firm use a currency option rather than a forward contract?',jsonb_build_array('An option can provide a right, but not an obligation, to exchange at a specified rate in return for a premium','An option removes all currency risk at no cost','An option must always be exercised','A forward contract is a type of inventory control'),0,'A currency option grants a right without an obligation to transact at the specified terms; the buyer typically pays a premium.',5);
  END IF;
END $$;