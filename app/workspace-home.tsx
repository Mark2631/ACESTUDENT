"use client";
import {useEffect,useMemo,useState} from "react";
import {ArrowRight,ArrowUpRight,BookOpen,CalendarDays,FileText,GraduationCap,Search,Users,PlayCircle,LibraryBig,Sparkles,Video,Trophy,MessageCircle,Bookmark,Clock3,Flame} from "lucide-react";
import {supabase} from "@/lib/supabase";
import {UpcomingSessions} from "./study-sessions";
import type {User} from "@supabase/supabase-js";
type Unit={id:string;code:string;title:string;year_of_study:number|null;semester:number|null;pathway:string|null};
type Material={id:string;title:string;subject:string;kind:string;provider:string;related_codes:string[];url:string};
export default function WorkspaceHome({user,name,studyYear,onCourse,onLibrary,onPractice,onSpaces,onLive,onAccount,onPlanner}:{user:User|null;name:string;studyYear:string;onCourse:(code:string)=>void;onLibrary:()=>void;onPractice:()=>void;onSpaces:()=>void;onLive:(spaceId?:string)=>void;onAccount:()=>void;onPlanner:()=>void}){
 const[courses,setCourses]=useState<Unit[]>([]),[resources,setResources]=useState<Material[]>([]),[loading,setLoading]=useState(true),[issue,setIssue]=useState(""),[search,setSearch]=useState(""),[showAll,setShowAll]=useState(false);
 const[recent,setRecent]=useState<{code:string;title:string}|null>(null),[yearFilter,setYearFilter]=useState(studyYear||"all"),[semesterFilter,setSemesterFilter]=useState("all");
 useEffect(()=>{setYearFilter(studyYear||"all")},[studyYear]);
 useEffect(()=>{try{const last=window.localStorage.getItem("ace-last-course");if(last){const parsed=JSON.parse(last) as {code:string;title:string};if(typeof parsed.code==="string"&&typeof parsed.title==="string")setRecent(parsed)}}catch{}},[]);
 useEffect(()=>{let alive=true;let timeout=0;const controller=new AbortController();async function load(){if(!supabase){setIssue("The course catalogue is temporarily unavailable.");setLoading(false);return}setLoading(true);setIssue("");timeout=window.setTimeout(()=>controller.abort(),8000);try{const [units,materials]=await Promise.all([supabase.from("ace_course_catalog").select("id,code,title,year_of_study,semester,pathway").order("year_of_study").order("semester").order("title").limit(240).abortSignal(controller.signal),supabase.from("ace_open_resources").select("id,title,subject,kind,provider,related_codes,url").eq("hidden",false).order("title").limit(240).abortSignal(controller.signal)]);if(!alive)return;setCourses(units.data??[]);setResources(materials.data??[]);if(units.error||materials.error)setIssue("Some course content could not be loaded. Retry or open the Study Vault.");}catch{if(alive)setIssue("The academic catalogue is taking too long to respond. Retry or browse the Study Vault.");}finally{window.clearTimeout(timeout);if(alive)setLoading(false)}}void load();return()=>{alive=false;controller.abort();window.clearTimeout(timeout)}},[]);
 const filtered=useMemo(()=>courses.filter(c=>(yearFilter==="all"||String(c.year_of_study??"")===yearFilter)&&(semesterFilter==="all"||String(c.semester??"")===semesterFilter)&&[c.code,c.title,c.pathway??""].join(" ").toLowerCase().includes(search.toLowerCase())),[courses,search,yearFilter,semesterFilter]);
 const shown=showAll?filtered:filtered.slice(0,6);
 const recommended=useMemo(()=>resources.filter(r=>(r.related_codes??[]).length>0).slice(0,3),[resources]);
 function visitCourse(c:Unit){try{window.localStorage.setItem("ace-last-course",JSON.stringify({code:c.code,title:c.title}))}catch{}onCourse(c.code)}
 const firstName=name.trim().split(" ")[0];
 return <div className="ace-dashboard">
   <section className="dashboard-welcome">
     <div><div className="dashboard-kicker"><span className="live-dot"/> ACE STUDENT <span className="kicker-divider">/</span> MUST · SCHOOL OF BUSINESS &amp; ECONOMICS</div>
       <h1>{user&&firstName?"Good to see you, "+firstName+".":"Your next study session starts here."}</h1>
       <p>One connected workspace for your course materials, live study rooms, practice challenges and class discussions.</p>
     </div>
     <button className="dashboard-profile" onClick={onAccount} aria-label="Open student profile"><span>{(firstName||user?.email||"S").slice(0,1).toUpperCase()}</span><small>{user?"Your profile":"Sign in"}</small><ArrowUpRight size={15}/></button>
   </section>
   <section className="ecosystem-hero">
     <div className="ecosystem-copy">
       <div className="ecosystem-label"><Sparkles size={15}/> YOUR LEARNING ECOSYSTEM</div>
       <h2>Pick a topic.<br/><span>Everything connects.</span></h2>
       <p>Open a course to find its resources, revision practice, study rooms and discussion threads in one place.</p>
       <div className="ecosystem-actions"><button className="btn" onClick={()=>document.getElementById("dashboard-courses")?.scrollIntoView({behavior:"smooth"})}>Explore my courses <ArrowRight size={16}/></button><button className="hero-text-action" onClick={onLibrary}>Browse the Study Vault <ArrowUpRight size={15}/></button></div>
     </div>
     <div className="ecosystem-visual" aria-hidden="true">
       <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
       <div className="orbit-core"><img src="/icon.svg" alt=""/><span>ACE</span></div>
       <div className="orbit-node node-vault"><BookOpen size={17}/></div><div className="orbit-node node-live"><Video size={17}/></div><div className="orbit-node node-arena"><Trophy size={17}/></div><div className="orbit-node node-forum"><MessageCircle size={17}/></div>
       <div className="orbit-caption">ONE COURSE · FOUR WAYS TO LEARN</div>
     </div>
     <div className="hero-bottom-note"><span>BUILT AROUND YOUR COURSE</span><span>Study at your pace. Learn with your people.</span></div>
   </section>
   {recent&&<button type="button" className="resume-course" onClick={()=>onCourse(recent.code)}><span className="resume-mark"><PlayCircle size={21}/></span><span className="resume-copy"><small>CONTINUE WHERE YOU LEFT OFF</small><strong>{recent.title}</strong><em>{recent.code} · Last opened on this device</em></span><ArrowRight size={19}/></button>}
   <section className="module-section">
     <div className="section-heading"><div><span className="section-overline">THE ACE ECOSYSTEM</span><h2>Four ways to move forward</h2><p>Each module has its own space. Your course keeps them connected.</p></div><span className="module-count">01 — 04</span></div>
     <div className="module-grid">
       <button className="module-card module-vault" onClick={onLibrary}><span className="module-icon"><LibraryBig size={22}/></span><span className="module-number">01 / STUDY VAULT</span><strong>Find the material.</strong><p>Course notes, open textbooks, revision guides and past papers.</p><span className="module-link">Explore the vault <ArrowUpRight size={16}/></span><span className="module-decoration">V</span></button>
       <button className="module-card module-live" onClick={()=>onLive()}><span className="module-icon"><Video size={22}/></span><span className="module-number">02 / LIVE ROOMS</span><strong>Study together.</strong><p>Join course spaces, RSVP to sessions and open hosted meetings.</p><span className="module-link">Find a live room <ArrowUpRight size={16}/></span><span className="module-decoration">L</span></button>
       <button className="module-card module-arena" onClick={onPractice}><span className="module-icon"><Trophy size={22}/></span><span className="module-number">03 / THE ARENA</span><strong>Test what you know.</strong><p>Take course-aligned quizzes, review explanations and earn XP.</p><span className="module-link">Enter the arena <ArrowUpRight size={16}/></span><span className="module-decoration">A</span></button>
       <button className="module-card module-forum" onClick={onSpaces}><span className="module-icon"><MessageCircle size={22}/></span><span className="module-number">04 / THE FORUM</span><strong>Work it out together.</strong><p>Ask questions, share explanations and get peer feedback.</p><span className="module-link">Join the discussion <ArrowUpRight size={16}/></span><span className="module-decoration">F</span></button>
     </div>
   </section>
   <section className="course-section" id="dashboard-courses">
     <div className="section-heading course-heading"><div><span className="section-overline">YOUR ACADEMIC MAP</span><h2>Start with a course</h2><p>Choose a unit to bring its materials, rooms, challenges and discussions into focus.</p></div><span className="course-total">{courses.length} courses mapped</span></div>
     <label className="dashboard-course-search"><Search size={18}/><input aria-label="Find a course" placeholder="Search unit name or code — e.g. BFC3227" value={search} onChange={e=>{setSearch(e.target.value);setShowAll(false)}}/><kbd>⌘ K</kbd></label>
     <div className="course-filter-row"><div className="course-filter-pills"><button className={yearFilter==="all"?"active":""} onClick={()=>{setYearFilter("all");setShowAll(false)}}>All years</button>{[1,2,3,4].map(n=><button key={n} className={yearFilter===String(n)?"active":""} onClick={()=>{setYearFilter(String(n));setShowAll(false)}}>Year {n}</button>)}</div><label className="semester-select"><span>SEMESTER</span><select aria-label="Filter by semester" value={semesterFilter} onChange={e=>{setSemesterFilter(e.target.value);setShowAll(false)}}><option value="all">All semesters</option><option value="1">Semester 1</option><option value="2">Semester 2</option></select></label></div>
     <p className="course-map-note">Course structures are mapped from available MUST programme and examination records. Confirm the current unit list and semester placement with the School of Business &amp; Economics.</p>
     {loading?<div className="dashboard-loading" role="status">Loading your course map<span> · · ·</span></div>:shown.length?<div className="dashboard-course-grid">{shown.map((c,i)=><button key={c.id} className="dashboard-course-card" onClick={()=>visitCourse(c)}><span className="course-code-badge">{c.code}</span><strong>{c.title}</strong><span className="course-meta">{c.year_of_study?"Year "+c.year_of_study:"Year not mapped"}{c.semester?" · Semester "+c.semester:""}</span><span className="course-card-footer"><span>Open course workspace</span><ArrowRight size={16}/></span><span className={"course-glow glow-"+(i%4)}/></button>)}</div>:<div className="dashboard-empty"><GraduationCap size={27}/><strong>No matching courses</strong><p>Try a different year, semester or search term.</p></div>}
     {filtered.length>6&&<button className="show-all-courses" onClick={()=>setShowAll(v=>!v)}>{showAll?"Show fewer courses":"View all "+filtered.length+" courses"} <ArrowRight size={16}/></button>}
     {issue&&<div className="status" role="alert">{issue} <button className="text-link" onClick={()=>window.location.reload()}>Reload catalogue</button></div>}
   </section>
   <section className="connected-learning-section">
     <div className="section-heading"><div><span className="section-overline">KEEP THE MOMENTUM</span><h2>Learning that stays connected</h2><p>Useful materials and upcoming ways to learn with other students.</p></div></div>
     <div className="connected-grid">
       <div className="connected-resources"><div className="connected-title"><div><Bookmark size={18}/><strong>Picked for your courses</strong></div><button onClick={onLibrary}>All materials <ArrowRight size={15}/></button></div>
         {recommended.length?recommended.map(m=><article className="connected-resource" key={m.id}><span className="connected-file"><FileText size={18}/></span><span><small>{m.kind} · {m.provider}</small><strong>{m.title}</strong><em>{m.subject}</em></span><ArrowUpRight size={16}/></article>):<div className="connected-empty"><LibraryBig size={21}/><span>Explore the Study Vault for open resources linked to your courses.</span><button onClick={onLibrary}>Browse materials</button></div>}
       </div>
       <div className="connected-sessions"><div className="connected-title"><div><Clock3 size={18}/><strong>Upcoming study sessions</strong></div><button onClick={()=>onLive()}>All rooms <ArrowRight size={15}/></button></div><UpcomingSessions onVisit={spaceId=>onLive(spaceId)}/></div>
     </div>
   </section>
   <section className="dashboard-footer-prompt"><div><Flame size={18}/><strong>A little progress, consistently, compounds.</strong><span>Set your next study target and make time for it.</span></div><button className="btn secondary" onClick={onPlanner}>Open study planner <ArrowRight size={15}/></button></section>
 </div>
}