"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {ArrowLeft,ArrowRight,BookOpen,FileText,GraduationCap,LockKeyhole} from "lucide-react";
import {supabase} from "@/lib/supabase";
type Unit={code:string;title:string;year_of_study:number|null;semester:number|null};
type Lesson={id:string;slug:string;title:string;subject_label:string;summary:string;reading_minutes:number};
type Document={id:string;title:string;kind:string;course_code:string};
export default function PublicCourse({code,onBack,onSignIn}:{code:string;onBack:()=>void;onSignIn:()=>void}){
 const[unit,setUnit]=useState<Unit|null>(null),[lessons,setLessons]=useState<Lesson[]>([]),[documents,setDocuments]=useState<Document[]>([]),[loading,setLoading]=useState(true);
 useEffect(()=>{let alive=true;async function load(){
  if(!supabase){setLoading(false);return}
  const [a,b,c]=await Promise.all([
   supabase.from("ace_course_catalog").select("code,title,year_of_study,semester").eq("code",code).maybeSingle(),
   supabase.from("ace_lessons").select("id,slug,title,subject_label,summary,reading_minutes").eq("published",true).order("title").limit(30),
   supabase.from("ace_resources").select("id,title,kind,course_code").eq("status","approved").eq("course_code",code).limit(30)
  ]);
  if(!alive)return;
  const label=(a.data?.title??"").toLowerCase();
  const matched=(b.data??[]).filter(lesson=>label.includes(lesson.subject_label.toLowerCase())||lesson.subject_label.toLowerCase().split(/[^a-z]+/).some((word:string)=>word.length>5&&label.includes(word)));
  setUnit(a.data??null);
  setLessons((matched.length?matched:(b.data??[])).slice(0,4));
  setDocuments(c.data??[]);setLoading(false)
 }void load();return()=>{alive=false}},[code]);
 return <section className="public-course">
  <button className="text-link" onClick={onBack}><ArrowLeft size={17}/> All courses</button>
  <div className="eyebrow">EXPLORE A COURSE</div>
  <h1>{unit?.title??code}</h1><p className="muted">{code}{unit?.year_of_study?" · Year "+unit.year_of_study:""}{unit?.semester?" · Semester "+unit.semester:""}</p>
  <p className="muted">Explore student contributions and complete original learning lessons inside Ace Student.</p>
  {loading?<p className="muted">Preparing your learning material…</p>:<>
   <h2 className="section"><BookOpen size={19}/> Open learning resources</h2>
   <p className="muted">Original Ace lessons to build foundational knowledge. General lessons are shown when a course-specific lesson isn't available.</p>
   {lessons.length?<div className="open-grid">{lessons.map(m=><article key={m.id} className="panel open-card"><div className="eyebrow">{m.subject_label} · {m.reading_minutes} min</div><h3>{m.title}</h3><p className="muted">{m.summary}</p><Link className="btn secondary" href={"/library?lesson="+encodeURIComponent(m.slug)}>Read inside Ace <ArrowRight size={16}/></Link></article>)}</div>:<div className="empty"><GraduationCap/><h3>No lessons available yet</h3><p className="muted">New readings are being added to Ace's own learning library.</p></div>}
   <h2 className="section"><FileText size={19}/> Student documents</h2>
   {documents.length?<div className="open-grid">{documents.map(m=><Link key={m.id} className="panel open-card" href={"/read/"+encodeURIComponent(m.id)}><div className="eyebrow">{m.kind}</div><h3>{m.title}</h3><span className="text-link">Read on Ace Student</span></Link>)}</div>:<div className="empty"><FileText/><h3>No approved student uploads for this unit</h3><p className="muted">Contributions will appear here once reviewed.</p></div>}
  </>}
  <div className="panel guest-course-footer"><LockKeyhole size={21}/><div><h3>Learn with other students</h3><p className="muted">Sign in to save progress, practice and join discussion groups.</p></div><button className="btn" onClick={onSignIn}>Sign in to participate</button></div>
 </section>
}