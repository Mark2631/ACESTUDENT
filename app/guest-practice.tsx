"use client";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";

type Question = { prompt: string; options: string[]; answer: number; explanation: string };
const banks: Record<string, Question[]> = {
  "Business & economics": [
    {prompt:"What does opportunity cost measure?",options:["The money already spent","The next best alternative forgone","Total fixed costs","A product's selling price"],answer:1,explanation:"Opportunity cost is the value of the next best alternative given up when a choice is made."},
    {prompt:"When demand rises and supply stays constant, what normally happens to equilibrium price?",options:["It falls","It stays fixed","It rises","It becomes zero"],answer:2,explanation:"An increase in demand shifts the demand curve right, raising equilibrium price and quantity, all else equal."},
    {prompt:"Which statement best describes working capital?",options:["Current assets minus current liabilities","Total assets minus equity","Revenue minus expenses","Cash sales only"],answer:0,explanation:"Net working capital is current assets less current liabilities."},
    {prompt:"Which is an example of a variable cost in a bakery?",options:["Annual rent","Monthly insurance","Flour used for each cake","Business licence"],answer:2,explanation:"Flour usage changes with the volume of cakes produced, making it a variable cost."},
    {prompt:"What is the main purpose of a cash-flow statement?",options:["Show profitability only","Explain cash inflows and outflows","List shareholders","Calculate market share"],answer:1,explanation:"A cash-flow statement reports cash generated and used by operating, investing and financing activities."}
  ],
  "Mathematics": [
    {prompt:"If 3x + 5 = 20, what is x?",options:["3","5","8","15"],answer:1,explanation:"Subtract 5 from both sides to get 3x = 15, then divide by 3."},
    {prompt:"What is the derivative of x²?",options:["x","2x","x³","2"],answer:1,explanation:"Using the power rule, d(xⁿ)/dx = nxⁿ⁻¹, so the derivative is 2x."},
    {prompt:"What is 15% of 240?",options:["24","30","36","40"],answer:2,explanation:"0.15 × 240 = 36."},
    {prompt:"What is the probability of rolling an even number on a fair six-sided die?",options:["1/6","1/3","1/2","2/3"],answer:2,explanation:"There are three even outcomes (2, 4, 6) among six equally likely outcomes."},
    {prompt:"Solve: 2(x − 4) = 10.",options:["1","5","9","14"],answer:2,explanation:"Divide by 2: x − 4 = 5, so x = 9."}
  ],
  "Biology": [
    {prompt:"Which organelle is the primary site of aerobic respiration?",options:["Ribosome","Mitochondrion","Golgi apparatus","Nucleus"],answer:1,explanation:"Mitochondria generate most cellular ATP through aerobic respiration."},
    {prompt:"Which molecule carries genetic information in most living organisms?",options:["ATP","DNA","Glucose","Cellulose"],answer:1,explanation:"DNA stores hereditary information in its nucleotide sequence."},
    {prompt:"What is the main function of red blood cells?",options:["Clot blood","Produce hormones","Transport oxygen","Digest pathogens"],answer:2,explanation:"Haemoglobin in red blood cells binds and transports oxygen."},
    {prompt:"Which process produces genetically varied gametes?",options:["Mitosis","Meiosis","Binary fission","Budding"],answer:1,explanation:"Meiosis halves chromosome number and generates variation through recombination and independent assortment."},
    {prompt:"What is the basic structural and functional unit of life?",options:["Tissue","Organ","Cell","Organ system"],answer:2,explanation:"The cell is the smallest unit capable of carrying out the processes of life."}
  ],
  "Computer science": [
    {prompt:"What is the time complexity of binary search on a sorted array?",options:["O(1)","O(log n)","O(n)","O(n²)"],answer:1,explanation:"Binary search halves the remaining search interval on each comparison."},
    {prompt:"Which HTTP method is conventionally used to retrieve a resource?",options:["POST","PATCH","GET","DELETE"],answer:2,explanation:"GET requests a representation of a resource and should not mutate server state."},
    {prompt:"What does a primary key guarantee in a relational table?",options:["Rows are sorted","Each row has a unique identifier","All columns are numeric","The table is encrypted"],answer:1,explanation:"A primary key uniquely identifies each row and cannot contain NULL values."},
    {prompt:"Which data structure follows last-in, first-out order?",options:["Queue","Stack","Tree","Graph"],answer:1,explanation:"A stack removes the most recently added item first."},
    {prompt:"What is the purpose of input validation?",options:["Make pages load faster","Reject malformed or unsafe input","Replace authentication","Compress database rows"],answer:1,explanation:"Validation checks that incoming data meets expected rules before it is processed."}
  ]
};
export default function GuestPractice(){
 const [subject,setSubject]=useState("Business & economics");
 const [answers,setAnswers]=useState<Record<number,number>>({});
 const [submitted,setSubmitted]=useState(false);
 const questions=useMemo(()=>banks[subject],[subject]);
 const score=questions.reduce((n,q,i)=>n+(answers[i]===q.answer?1:0),0);
 function changeSubject(value:string){setSubject(value);setAnswers({});setSubmitted(false)}
 return <section className="guest-practice">
  <div className="eyebrow">TRY A QUICK SESSION · NO ACCOUNT REQUIRED</div>
  <div className="row"><div><h1>Practice what you're studying</h1><p className="muted">Choose a subject. Work through five sample questions and review the reasoning.</p></div><span className="kind">5 QUESTIONS</span></div>
  <div className="chips" aria-label="Choose a subject">{Object.keys(banks).map(name=><button key={name} className={subject===name?"chip selected":"chip"} onClick={()=>changeSubject(name)}>{name}</button>)}</div>
  {!submitted ? <div className="guest-questions">{questions.map((q,i)=><article className="panel quiz-question" key={q.prompt}>
    <div className="row"><span className="eyebrow">QUESTION {i+1} OF 5</span><span className="small">{answers[i]===undefined?"Not answered":"Answer selected"}</span></div>
    <h3>{q.prompt}</h3><div className="quiz-options">{q.options.map((option,j)=><button key={option} className={answers[i]===j?"selected":""} aria-pressed={answers[i]===j} onClick={()=>setAnswers(old=>({...old,[i]:j}))}><span>{String.fromCharCode(65+j)}</span>{option}</button>)}</div>
  </article>)}
  <div className="row guest-submit"><span className="muted">{Object.keys(answers).length} of 5 answered</span><button className="btn" disabled={Object.keys(answers).length!==5} onClick={()=>setSubmitted(true)}>Check answers <ArrowRight size={16}/></button></div></div>
  : <div className="panel guest-results"><div className="result-score"><Sparkles size={25}/><b>{score}/5</b><span>{score===5?"Excellent work":score>=3?"Good progress":"Keep practising"}</span></div>
    {questions.map((q,i)=><article className="answer-review" key={q.prompt}><h3>{i+1}. {q.prompt}</h3><p className={answers[i]===q.answer?"correct":"muted"}>{answers[i]===q.answer?"Correct":"Your answer: "+q.options[answers[i]]}</p><p><b>Answer: {q.options[q.answer]}</b></p><p className="muted">{q.explanation}</p></article>)}
    <button className="btn" onClick={()=>{setAnswers({});setSubmitted(false)}}><RotateCcw size={16}/> Try again</button>
  </div>}
  <p className="small">Sample practice questions for exploration. They are not official institutional examination questions. Sign in to access published quizzes and save graded progress.</p>
 </section>;
}
