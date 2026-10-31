"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {ArrowLeft,ArrowRight,BookOpen,CalendarDays,CheckCircle2,ClipboardList,Download,FileText,GraduationCap,Layers3,Trophy,Users} from "lucide-react";
import {supabase} from "@/lib/supabase";
import ReportAction from "./report-action";
import type {User} from "@supabase/supabase-js";
type Unit={code:string;title:string;year_of_study:number|null;semester:number|null;pathway:string};
type Lesson={id:string;slug:string;title:string;subject_label:string;summary:string;reading_minutes:number};
type Quiz={id:string;title:string;course_code:string;description:string|null};
type StudentMaterial={id:string;title:string;description:string|null;kind:string;course_code:string;storage_path:string};
type CourseSpace={id:string;title:string;description:string;meeting_url:string|null;course_code:string};
const normalise=(value:string)=>value.replace(/\s+/g,"").toUpperCase();
export default function CourseHub({user,code,onBack,onQuiz,onUpload,onSpaces,onStudio,onPlanner}:{user:User;code:string;onBack:()=>void;onQuiz:(code:string,quizId:string)=>void;onUpload:(code:string,title:string)=>void;onSpaces:(code:string,spaceId?:string)=>void;onStudio:(code:string,title:string)=>void;onPlanner:(code:string,title:string)=>void}){
 const[unit,setUnit]=useState<Unit|null>(null),[lessons,setLessons]=useState<Lesson[]>([]),[studentMaterials,setStudentMaterials]=useState<StudentMaterial[]>([]),[spaces,setSpaces]=useState<CourseSpace[]>([]),[quizzes,setQuizzes]=useState<Quiz[]>([]),[done,setDone]=useState<string[]>([]),[loading,setLoading]=useState(true),[issue,setIssue]=useState(""),[downloading,setDownloading]=useState("");
 useEffect(()=>{let active=true;async function load(){if(!supabase){setLoading(false);setIssue("Learning is temporarily unavailable.");return}
  setLoading(true);
  const [a,b,c,d,e,f]=await Promise.all([
   supabase.from("ace_course_catalog").select("code,title,year_of_study,semester,pathway").eq("code",code).maybeSingle(),
   supabase.from("ace_lessons").select("id,slug,title,subject_label,summary,reading_minutes").eq("published",true).order("title"),
   supabase.from("ace_quizzes").select("id,title,course_code,description").eq("status","published"),
   supabase.from("ace_quiz_attempts").select("quiz_id").eq("user_id",user.id),
   supabase.from("ace_resources").select("id,title,description,kind,course_code,storage_path").eq("status","approved").order("created_at",{ascending:false}),
   supabase.from("ace_spaces").select("id,title,description,meeting_url,course_code").order("created_at",{ascending:false})
  ]);
  if(!active)return;
  const normalized=normalise(code);
  setUnit(a.data??null);
  const label=(a.data?.title??"").toLowerCase();
  const candidates=(b.data??[]) as Lesson[];
  const matched=candidates.filter(x=>label.includes(x.subject_label.toLowerCase())||x.subject_label.toLowerCase().split(/[^a-z]+/).some(word=>word.length>5&&label.includes(word)));
  setLessons((matched.length?matched:candidates).slice(0,4));
  setQuizzes((c.data??[]).filter(x=>normalise(x.course_code)===normalized));
  setDone((d.data??[]).map(x=>x.quiz_id));
  setStudentMaterials((e.data??[]).filter(x=>normalise(x.course_code)===normalized));
  setSpaces((f.data??[]).filter(x=>normalise(x.course_code)===normalized).slice(0,6));
  if(a.error||b.error||c.error||d.error||e.error||f.error)setIssue("Some course information could not be loaded.");
  setLoading(false)
 }void load();return()=>{active=false}},[code,user.id]);
 const title=unit?.title??code;
 const completed=useMemo(()=>quizzes.filter(q=>done.includes(q.id)).length,[done,quizzes]);
 async function download(item:StudentMaterial){if(!supabase||downloading)return;setDownloading(item.id);setIssue("");try{
   const safe=item.title.replace(/[^a-z0-9._-]+/gi,"-").replace(/^-+|-+$/g,"").slice(0,100)||"course-document";
   const {data,error}=await supabase.storage.from("ace-submissions").createSignedUrl(item.storage_path,120,{download:safe+".pdf"});
   if(error||!data?.signedUrl)throw new Error();
   const element=document.createElement("a");element.href=data.signedUrl;element.download=safe+".pdf";document.body.appendChild(element);element.click();element.remove();
  }catch{setIssue("This PDF could not be downloaded. Try again.")}finally{setDownloading("")}}
 return <section className="ace-course-hub">
  <button className="text-link" onClick={onBack}><ArrowLeft size={16}/> Back to subjects</button>
  <div className="ace-course-intro"><div><span className="home-eyebrow">COURSE WORKSPACE / {code}</span><h1>{title}</h1><p>{code}{unit?.year_of_study?" · Year "+unit.year_of_study:""}{unit?.semester?" · Semester "+unit.semester:""}</p></div><div className="ace-course-badge" aria-hidden="true"><GraduationCap size={37}/></div></div>
  <div className="ace-course-actions"><button onClick={()=>onStudio(code,title)}><BookOpen size={18}/><span><strong>Study this course</strong><small>Private notes and revision</small></span><ArrowRight size={16}/></button><button onClick={()=>onPlanner(code,title)}><CalendarDays size={18}/><span><strong>Plan a deadline</strong><small>Keep work on schedule</small></span><ArrowRight size={16}/></button><button onClick={()=>onSpaces(code)}><Users size={18}/><span><strong>Study with others</strong><small>Group discussions</small></span><ArrowRight size={16}/></button></div>
  {loading?<div className="home-loading">Loading your course…</div>:<>
   <div className="course-overview"><div className="panel"><BookOpen size={21}/><b>{lessons.length+studentMaterials.length}</b><span>Readings & documents</span></div><div className="panel"><ClipboardList size={21}/><b>{quizzes.length}</b><span>Practice quizzes</span></div><div className="panel"><CheckCircle2 size={21}/><b>{completed}</b><span>Quizzes completed</span></div></div>
   <div className="row section"><h2><BookOpen size={19}/> Read and understand</h2><Link href="/library" className="text-link">All Ace lessons <ArrowRight size={14}/></Link></div>
   <p className="muted">Original lessons available entirely inside Ace. General introductory lessons appear when a course-specific reading is unavailable.</p>
   {lessons.length?<div className="open-grid">{lessons.map(l=><article className="panel open-card" key={l.id}><span className="eyebrow">{l.subject_label} · {l.reading_minutes} min</span><h3>{l.title}</h3><p className="muted">{l.summary}</p><Link className="btn secondary" href={"/library?lesson="+encodeURIComponent(l.slug)}>Read lesson <ArrowRight size={15}/></Link></article>)}</div>:<div className="home-loading">Lessons for this subject are being prepared.</div>}
   <div className="row section"><h2><FileText size={19}/> Shared study materials</h2><button className="text-link" onClick={()=>onUpload(code,title)}>Share your notes <ArrowRight size={14}/></button></div>
   {studentMaterials.length?<div className="open-grid">{studentMaterials.map(m=><article key={m.id} className="panel open-card"><span className="eyebrow">{m.kind} · Student document</span><h3>{m.title}</h3><p className="muted">{m.description??"Reviewed student learning material."}</p><div className="resource-actions"><Link href={"/read/"+encodeURIComponent(m.id)} className="btn secondary">Read PDF</Link><button className="btn secondary" onClick={()=>void download(m)} disabled={!!downloading}><Download size={15}/>{downloading===m.id?"Preparing…":"Download"}</button></div><ReportAction target={{document_id:m.id}}/></article>)}</div>:<div className="home-loading">No student-contributed PDFs for this course yet. Your own study notebook is available above.</div>}
   <div className="row section"><h2><Trophy size={19}/> Check your knowledge</h2></div>
   {quizzes.length?<div className="course-quiz-list">{quizzes.map(q=><article className="panel course-quiz" key={q.id}><div><h3>{q.title}</h3><p className="muted">{q.description}</p>{done.includes(q.id)&&<span className="completed"><CheckCircle2 size={15}/> Completed</span>}</div><button className="btn secondary" onClick={()=>onQuiz(code,q.id)}>{done.includes(q.id)?"Review":"Start quiz"} <ArrowRight size={15}/></button></article>)}</div>:<div className="home-loading">Verified practice questions for this course are being prepared. You can still revise in Study Studio.</div>}
   <div className="row section"><h2><Users size={19}/> Study spaces</h2><button className="text-link" onClick={()=>onSpaces(code)}>Explore spaces <ArrowRight size={14}/></button></div>
   {spaces.length?<div className="course-quiz-list">{spaces.map(space=><article className="panel course-quiz" key={space.id}><div><h3>{space.title}</h3><p className="muted">{space.description||"Discussion and shared study resources"}</p></div><button className="btn secondary" onClick={()=>onSpaces(code,space.id)}>Open space <ArrowRight size={15}/></button></article>)}</div>:<div className="home-loading">No study group has started for this course yet. You can create the first discussion.</div>}
  </>}
  {issue&&<p className="status" role="alert">{issue}</p>}
 </section>;
}