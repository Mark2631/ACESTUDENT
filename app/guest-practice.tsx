"use client";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";

type Question = { prompt: string; options: string[]; answer: number; explanation: string };
const banks: Record<string, Question[]> = {
  "Business & economics": [
    {prompt:"What does opportunity cost measure?",options:["The money already spent","The next best alternative forgone","Total fixed costs","A product's selling price"],answer:1,explanation:"Opportunity cost is the value of the next best alternative given up when a choice is made."},
    {prompt:"When demand rises and supply stays constant, what normally happens to equilibrium price?",options:["It falls","It stays fixed","It rises","It becomes zero"],answer:2,explanation:"An increase in demand shifts the demand curve right, raising equilibrium price and quantity, all else equal."},
    {prompt:"Which statement best describes working capital?",options:["Current assets minus current liabilities","Total assets minus equity","Revenue minus expenses","Cash sales only"],answer:0,explanation:"Net working capital is current assets less current liabilities."},
    {prompt:"Which is an example of a variable cost in a bakery?",options:["Annual rent","Monthly insurance","Flour used for each cake","Business licence"],answer:2,explanation:"Flour usage changes with the volume of cakes produced, making it a variable cost."},
    {prompt:"What is the main purpose of a cash-flow statement?",options:["Show profitability only","Explain cash inflows and outflows","List shareholders","Calculate market share"],answer:1,explanation:"A cash-flow statement reports cash generated and used by operating, investing and financing activities."}
  ],
  "Business mathematics & statistics": [
    {prompt:"A unit sells 120 items at KSh 250 each. What is its total sales revenue?",options:["KSh 3,000","KSh 30,000","KSh 25,000","KSh 120,250"],answer:1,explanation:"Sales revenue equals selling price multiplied by quantity: 250 × 120 = KSh 30,000."},
    {prompt:"A product sells for KSh 800 and has a variable cost of KSh 500. What is its contribution per unit?",options:["KSh 300","KSh 500","KSh 800","KSh 1,300"],answer:0,explanation:"Contribution per unit is selling price less variable cost: 800 − 500 = KSh 300."},
    {prompt:"A student scores 60, 70 and 80 in three tests. What is the arithmetic mean?",options:["65","70","75","210"],answer:1,explanation:"The mean is the sum divided by the number of observations: (60 + 70 + 80) ÷ 3 = 70."},
    {prompt:"If fixed costs are KSh 24,000 and contribution is KSh 400 per unit, what is the break-even output?",options:["40 units","50 units","60 units","80 units"],answer:2,explanation:"Break-even quantity equals fixed costs divided by contribution per unit: 24,000 ÷ 400 = 60 units."},
    {prompt:"A KSh 2,000 item is discounted by 10%. What is the new price?",options:["KSh 1,600","KSh 1,700","KSh 1,800","KSh 1,900"],answer:2,explanation:"Ten per cent of 2,000 is 200, so the discounted price is KSh 1,800."}
  ]
};

export default function GuestPractice() {
  const categories = useMemo(() => Object.keys(banks).filter((name) => name.toLowerCase().includes("business")), []);
  const [category, setCategory] = useState(categories[0] ?? "Business & economics");
  const questions = banks[category] ?? [];
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const question = questions[index];

  function chooseCategory(value: string) {
    setCategory(value);
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }

  function next() {
    if (selected === null) return;
    if (index >= questions.length - 1) { setFinished(true); return; }
    setIndex((value) => value + 1);
    setSelected(null);
  }

  function restart() {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }

  return (
    <section className="guest-practice" aria-label="BBA sample practice">
      <header className="guest-practice-heading">
        <span className="guest-practice-kicker"><Sparkles size={13}/> TRY A QUICK SESSION · NO ACCOUNT REQUIRED</span>
        <h2>Practice what you're studying</h2>
        <p>Try a short business-focused sample before creating an account. These are practice questions, not official MUST examination questions.</p><p className="guest-practice-sample-note">Sample practice questions for exploration — not official exam questions.</p>
      </header>
      <div className="guest-practice-categories" role="group" aria-label="Practice topic">
        {categories.map((name) => <button type="button" key={name} className={category === name ? "active" : ""} onClick={() => chooseCategory(name)}>{name}</button>)}
      </div>
      {finished ? (
        <div className="guest-practice-result" role="status" aria-live="polite">
          <span className="guest-practice-result-icon"><CheckCircle2 size={22}/></span>
          <span className="guest-practice-kicker">SAMPLE COMPLETE</span>
          <h3>{score} out of {questions.length} correct</h3>
          <p>Sign in to access the full BBA unit quizzes, save attempts and review missed questions.</p>
          <button type="button" className="guest-practice-next" onClick={restart}><RotateCcw size={14}/> Try again</button>
        </div>
      ) : question ? (
        <div className="guest-practice-card guest-questions">
          <div className="guest-practice-progress">
            <span>QUESTION {index + 1} OF {questions.length}</span>
            <span>{score} correct so far</span>
          </div>
          <div className="guest-practice-progress-track"><span style={{width: ((index + 1) / questions.length * 100) + "%"}}/></div>
          <h3>{question.prompt}</h3>
          <div className="guest-practice-options quiz-options">
            {question.options.map((option, optionIndex) => {
              const isCorrect = optionIndex === question.answer;
              const isSelected = selected === optionIndex;
              return <button type="button" key={option} disabled={selected !== null} aria-pressed={isSelected} className={selected !== null && isCorrect ? "correct" : isSelected ? "incorrect" : ""} onClick={() => {setSelected(optionIndex);if(isCorrect)setScore((value)=>value+1);}}>
                <span>{String.fromCharCode(65 + optionIndex)}</span>{option}
                {selected !== null && isCorrect && <CheckCircle2 size={15}/>}
              </button>;
            })}
          </div>
          {selected !== null && <div className={"guest-practice-feedback " + (selected === question.answer ? "correct" : "incorrect")} role="status" aria-live="polite">
            <strong>{selected === question.answer ? "Correct" : "Not quite"}</strong>
            <p>{question.explanation}</p>
          </div>}
          <button type="button" className="guest-practice-next" disabled={selected === null} onClick={next}>{index === questions.length - 1 ? "See my result" : "Next question"} <ArrowRight size={14}/></button>
        </div>
      ) : <p className="muted">No sample questions are available for this topic yet.</p>}
    </section>
  );
}
