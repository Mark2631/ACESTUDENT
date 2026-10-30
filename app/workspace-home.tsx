"use client";
import {useEffect,useMemo,useState} from "react";
import {ArrowRight,BookOpen,CalendarDays,FileText,GraduationCap,Search,Users,PlayCircle,ArrowUpRight,Sparkles,Layers3} from "lucide-react";
import {supabase} from "@/lib/supabase";
import type {User} from "@supabase/supabase-js";
type Unit={id:string;code:string;title:string;year_of_study:number|null;semester:number|null;pathway:string|null};
export default function WorkspaceHome({user,name,onCourse,onLibrary,onPractice,onSpaces,onAccount,onNotes,onPlanner,onStudio}:{user:User|null;name:string;onCourse:(code:string)=>void;onLibrary:()=>void;onPractice:()=>void;onSpaces:()=>void;onAccount:()=>void;onNotes:()=>void;onPlanner:()=>void;onStudio:()=>void}){
 const[courses,setCourses]=useState<Unit[]>([]),[loading,setLoading]=useState(true),[issue,setIssue]=useState(""),[search,setSearch]=useState(""),[showAll,setShowAll]=useState(false);
 const[recent,setRecent]=useState<{code:string;title:string}|null>(null);
 useEffect(()=>{try{const last=window.localStorage.getItem("ace-last-course");if(last){const parsed=JSON.parse(last) as {code:string;title:string};if(typeof parsed.code==="string"&&typeof parsed.title==="string")setRecent(parsed)}}catch{}},[]);
 useEffect(()=>{let alive=true;async function load(){if(!supabase){setIssue("Learning catalogue is temporarily unavailable.");setLoading(false);return}const {data,error}=await supabase.from("ace_course_catalog").select("id,code,title,year_of_study,semester,pathway").order("year_of_study").order("semester").order("title").limit(240);if(!alive)return;setCourses(data??[]);if(error)setIssue("The course catalogue could not be loaded. Please retry.");setLoading(false)}void load();return()=>{alive=false}},[]);
 const filtered=useMemo(()=>courses.filter(c=>[c.code,c.title,c.pathway??""].join(" ").toLowerCase().includes(search.toLowerCase())),[courses,search]);
 const shown=showAll?filtered:filtered.slice(0,8);
 function visitCourse(c:Unit){try{window.localStorage.setItem("ace-last-course",JSON.stringify({code:c.code,title:c.title}))}catch{}onCourse(c.code)}
 return <div className="ace-workspace-home ace-next">
  <section className="ace-welcome">
   <div className="ace-welcome-copy"><div className="ace-kicker"><span className="ace-live-dot"/> YOUR SPACE TO LEARN</div><h1>{user&&name.trim()?"Good to see you, "+name.trim().split(" ")[0]+".":"Your learning, organized."}</h1><p>A quiet place to think, practise, listen and make real progress.</p>
   <div className="ace-welcome-buttons"><button className="ace-primary-action" onClick={onStudio}><BookOpen size={15}/> Open Study Studio <ArrowRight size={14}/></button><button className="ace-quiet-action" onClick={onLibrary}><FileText size={15}/> Browse resources</button></div></div>
   <div className="ace-welcome-mark" aria-hidden="true"><div className="ace-orbit ace-orbit-one"/><div className="ace-orbit ace-orbit-two"/><div className="ace-welcome-logo"><img src="/icon.svg" alt="" width="84" height="84"/></div><span className="ace-orbit-caption">LEARN · CREATE · GROW</span></div>
  </section>
  {recent&&<section className="ace-resume"><span className="ace-resume-icon"><PlayCircle size={18}/></span><div><span className="ace-label">PICK UP WHERE YOU LEFT OFF</span><strong>{recent.title}</strong><small>{recent.code}</small></div><button onClick={()=>onCourse(recent.code)} aria-label={"Continue "+recent.title}><ArrowRight size={17}/></button></section>}
  <section className="ace-shortcuts" aria-label="Your study tools">
   <button onClick={onStudio}><span className="ace-tool-icon violet"><Sparkles size={17}/></span><span><strong>Practice</strong><small>Test your knowledge</small></span><ArrowUpRight size={14}/></button>
   <button onClick={onNotes}><span className="ace-tool-icon mint"><FileText size={17}/></span><span><strong>Shared notes</strong><small>Think together</small></span><ArrowUpRight size={14}/></button>
   <button onClick={onSpaces}><span className="ace-tool-icon blue"><Users size={17}/></span><span><strong>Study groups</strong><small>Learn with others</small></span><ArrowUpRight size={14}/></button>
   <button onClick={onPlanner}><span className="ace-tool-icon amber"><CalendarDays size={17}/></span><span><strong>Study plan</strong><small>Keep deadlines visible</small></span><ArrowUpRight size={14}/></button>
  </section>
  <section className="ace-discovery"><div className="ace-section-heading"><div><span className="ace-label">YOUR SUBJECTS</span><h2>Explore courses</h2></div><span className="ace-section-count">{courses.length} courses</span></div>
   <label className="ace-inline-search"><Search size={15}/><input aria-label="Find a course" placeholder="Find a course or topic" value={search} onChange={e=>setSearch(e.target.value)}/></label>
   {loading?<div className="ace-skeleton">Finding courses…</div>:shown.length?<div className="ace-course-list">{shown.map((c,i)=><button key={c.id} className="ace-course-row" onClick={()=>visitCourse(c)}><span className={"ace-course-monogram ace-color-"+i%4}>{c.title.trim().slice(0,1).toUpperCase()}</span><span className="ace-course-info"><strong>{c.title}</strong><small>{c.code}{c.year_of_study?" · Year "+c.year_of_study:""}</small></span><ArrowRight size={15}/></button>)}</div>:<div className="ace-empty"><Layers3 size={18}/> No courses match your search.</div>}
   {filtered.length>8&&<button className="ace-see-all" onClick={()=>setShowAll(v=>!v)}>{showAll?"Show fewer":"See all "+filtered.length+" courses"} <ArrowRight size={14}/></button>}{issue&&<p className="status" role="status">{issue}</p>}
  </section>
  <section className="ace-footer-nudge"><div><span className="ace-label">BETTER TOGETHER</span><h3>Don't study alone.</h3><p>Turn what you're learning into a shared note or start a discussion with your group.</p></div><button onClick={onSpaces}>Explore groups <ArrowRight size={15}/></button></section>
 </div>
}