"use client";

import {useCallback,useEffect,useMemo,useState} from "react";
import {ArrowLeft,ArrowRight,BookOpen,Brain,ChartNoAxesCombined,Check,CheckCircle2,ChevronDown,Code2,FlaskConical,GraduationCap,Layers3,Search,Target,Timer,Wallet,X} from "lucide-react";
import {supabase} from "@/lib/supabase";
import type {User} from "@supabase/supabase-js";

export type AceLesson={
 id:string;slug:string;title:string;subject_slug:string|null;subject_label:string;level:string;
 reading_minutes:number;summary:string;learning_outcomes:string[];
 sections:{heading:string;body:string;example?:string}[];
 review_questions:{question:string;answer:string}[];
 illustration:string;accent:string;
};
const VISUALS={
 chart:ChartNoAxesCombined,calculator:Wallet,code:Code2,science:FlaskConical,
 briefcase:Layers3,market:Target,books:BookOpen,brain:Brain,globe:GraduationCap,scales:Layers3
};
const SECTIONS=["All subjects","Accounting","Economics","Management","Marketing","Entrepreneurship","Programming","Natural Sciences","Mathematics & Statistics","Study Skills"];

function LessonIllustration({lesson,large=false}:{lesson:AceLesson;large?:boolean}){
 const Icon=VISUALS[lesson.illustration as keyof typeof VISUALS]??BookOpen;
 return <div className={"ace-lesson-art ace-art-"+lesson.illustration+(large?" large":"")} aria-hidden="true">
  <div className="ace-art-lines"><span/><span/><span/></div>
  <Icon size={large?65:35} strokeWidth={1.35}/>
  <div className="ace-art-stamp">ACE / STUDY</div>
 </div>;
}
function LessonReader({lesson,onClose,onNext,nextLesson}:{lesson:AceLesson;onClose:()=>void;onNext:()=>void;nextLesson:AceLesson|null}){
 const[revealed,setRevealed]=useState<number[]>([]);
 const[completed,setCompleted]=useState(false);
 const [activeSection,setActiveSection]=useState(0);
 const markRead=()=>{
  setCompleted(true);
  try{const saved=JSON.parse(localStorage.getItem("ace-lesson-completed-v1")||"[]") as string[];
   localStorage.setItem("ace-lesson-completed-v1",JSON.stringify([...new Set([...saved,lesson.slug])]));}catch{}
 };
 useEffect(()=>{setRevealed([]);setCompleted(false);setActiveSection(0)},[lesson.slug]);
 useEffect(()=>{const fn=(event:KeyboardEvent)=>{if(event.key==="Escape")onClose()};window.addEventListener("keydown",fn);return()=>window.removeEventListener("keydown",fn)},[onClose]);
 return <div className="ace-lesson-reader">
  <div className="ace-reader-topbar"><button onClick={onClose}><ArrowLeft size={17}/> All lessons</button><span>{lesson.subject_label} / {lesson.reading_minutes} min read</span></div>
  <div className="ace-reader-hero"><div><span className="ace-lesson-kicker">{lesson.level} · GUIDED LESSON</span><h1>{lesson.title}</h1><p>{lesson.summary}</p><div className="ace-reader-pills"><span><Timer size={14}/>{lesson.reading_minutes} min</span><span><BookOpen size={14}/>{lesson.sections.length} sections</span><span><Brain size={14}/>{lesson.review_questions.length} recall checks</span></div></div><LessonIllustration lesson={lesson} large/></div>
  <div className="ace-reader-layout">
   <aside className="ace-reader-toc"><span className="ace-lesson-kicker">ON THIS PAGE</span><nav>{lesson.sections.map((section,i)=><button className={activeSection===i?"active":""} onClick={()=>{setActiveSection(i);document.getElementById("ace-lesson-"+i)?.scrollIntoView({behavior:"smooth",block:"start"})}} key={i}><span>{String(i+1).padStart(2,"0")}</span>{section.heading}</button>)}</nav><div className="ace-reader-outcomes"><strong>What you'll learn</strong>{lesson.learning_outcomes?.map((v,i)=><span key={i}><Check size={13}/>{v}</span>)}</div></aside>
   <article className="ace-reader-article">{lesson.sections.map((section,i)=><section key={i} id={"ace-lesson-"+i} className="ace-reader-section"><div className="ace-lesson-kicker">PART {String(i+1).padStart(2,"0")}</div><h2>{section.heading}</h2><p>{section.body}</p>{section.example&&<div className="ace-lesson-example"><span>PUT IT INTO PRACTICE</span><p>{section.example}</p></div>}</section>)}
    <section className="ace-lesson-review"><span className="ace-lesson-kicker">RETRIEVAL PRACTICE</span><h2>Check what you remember</h2><p>Try answering before revealing each explanation.</p>{lesson.review_questions.map((item,i)=><div className="ace-recall-row" key={i}><button onClick={()=>setRevealed(prev=>prev.includes(i)?prev.filter(x=>x!==i):[...prev,i])} aria-expanded={revealed.includes(i)}><span>{i+1}. {item.question}</span><ChevronDown size={17}/></button>{revealed.includes(i)&&<p>{item.answer}</p>}</div>)}
     <button className="ace-complete-button" onClick={markRead}>{completed?<><CheckCircle2 size={17}/> Lesson completed</>:<><Check size={17}/> Mark lesson complete</>}</button>
    </section><div className="ace-reader-finish"><div><strong>Keep the momentum.</strong><p>{nextLesson?"Your next lesson is ready.":"Explore more subjects in your library."}</p></div><button onClick={nextLesson?onNext:onClose}>{nextLesson?"Next lesson":"Back to lessons"} <ArrowRight size={16}/></button></div>
   </article>
  </div>
 </div>;
}
export default function LessonLibrary({query,initialLessonSlug="",user,onSignIn}:{query:string;initialLessonSlug?:string;user:User|null;onSignIn:()=>void}){
 const[lessons,setLessons]=useState<AceLesson[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const[active,setActive]=useState("All subjects"),[term,setTerm]=useState(""),[selected,setSelected]=useState(""),[completed,setCompleted]=useState<string[]>([]);
 useEffect(()=>{try{setCompleted(JSON.parse(localStorage.getItem("ace-lesson-completed-v1")||"[]"))}catch{}},[selected]);
 useEffect(()=>{let live=true;async function load(){if(!supabase){setLoading(false);setError("The study library is temporarily unavailable.");return}
  const {data,error}=await supabase.from("ace_lessons").select("id,slug,title,subject_slug,subject_label,level,reading_minutes,summary,learning_outcomes,sections,review_questions,illustration,accent").eq("published",true).order("title");
  if(!live)return;if(error)setError("We could not load the lessons. Try again in a moment.");else setLessons((data??[]) as AceLesson[]);setLoading(false)}
  void load();return()=>{live=false}},[]);
 useEffect(()=>{if(initialLessonSlug)setSelected(initialLessonSlug)},[initialLessonSlug]);
 const filtered=useMemo(()=>lessons.filter(x=>(active==="All subjects"||x.subject_label===active)&&[x.title,x.summary,x.subject_label].join(" ").toLowerCase().includes((term||query).trim().toLowerCase())),[lessons,active,term,query]);
 const lesson=lessons.find(x=>x.slug===selected)||null;
 const next=lesson?lessons[(lessons.indexOf(lesson)+1)%lessons.length]:null;
 const close=useCallback(()=>{setSelected("");if(window.location.pathname==="/library")window.history.replaceState(null,"","/library")},[]);
 function open(slug:string){setSelected(slug);if(window.location.pathname==="/library")window.history.replaceState(null,"","/library?lesson="+encodeURIComponent(slug));window.scrollTo({top:0,behavior:"smooth"})}
 if(lesson)return <LessonReader lesson={lesson} onClose={close} nextLesson={next?.slug!==lesson.slug?next:null} onNext={()=>{if(next)open(next.slug)}}/>;
 return <section className="ace-library-v2">
 <div className="ace-library-intro"><div><span className="ace-lesson-kicker">ACE / ORIGINAL LEARNING</span><h1>Learn something. Understand it.</h1><p>Actual lessons, examples and recall questions. Everything is readable here — no redirects, no empty collections.</p></div><div className="ace-library-symbol" aria-hidden="true"><BookOpen size={45} strokeWidth={1.3}/></div></div>
 <div className="ace-library-toolbar"><label><Search size={17}/><input aria-label="Search lessons" placeholder="Search lessons and topics" value={term} onChange={e=>setTerm(e.target.value)}/></label><span>{lessons.length} lessons in your library</span></div>
 <div className="ace-library-categories" role="group" aria-label="Filter by subject">{SECTIONS.map(c=><button key={c} className={active===c?"active":""} onClick={()=>setActive(c)}>{c}</button>)}</div>
 {error&&<div role="alert" className="status">{error}</div>}
 {loading?<div className="ace-library-loading">Opening your library…</div>:filtered.length?<div className="ace-library-lesson-grid">{filtered.map(l=><button key={l.id} className="ace-lesson-card" onClick={()=>open(l.slug)}><LessonIllustration lesson={l}/><div className="ace-lesson-card-body"><span className="ace-lesson-kicker">{l.subject_label.toUpperCase()} · {l.level}</span><h2>{l.title}</h2><p>{l.summary}</p><div className="ace-lesson-card-footer"><span>{l.reading_minutes} min · {l.sections.length} parts</span><span>{completed.includes(l.slug)?"Completed":"Read lesson"} <ArrowRight size={14}/></span></div></div></button>)}</div>:<div className="ace-library-loading">No lessons match this search. Try a different topic.</div>}
 <footer className="ace-library-footer"><span><CheckCircle2 size={16}/> {completed.length} lessons completed on this device</span><span>All lessons are written for Ace Student and available without signing in.</span></footer>
 </section>;
}
