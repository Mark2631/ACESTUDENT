"use client";
import {useEffect,useMemo,useState} from "react";
import {ArrowRight,BookOpen,CalendarDays,FileText,Search,Users,PlayCircle,ArrowUpRight,Sparkles,Layers3,Code2,Calculator,Atom,Wrench,HeartPulse,Globe2,Palette} from "lucide-react";
import {supabase} from "@/lib/supabase";
import type {User} from "@supabase/supabase-js";
type LearningArea={slug:string;title:string;description:string;sort_order:number};
export default function WorkspaceHome({user,name,onLibrary,onPractice,onSpaces,onAccount,onNotes,onPlanner,onStudio,onArea}:{user:User|null;name:string;onLibrary:()=>void;onPractice:()=>void;onSpaces:()=>void;onAccount:()=>void;onNotes:()=>void;onPlanner:()=>void;onStudio:()=>void;onArea:(area:string)=>void}){
 const[areas,setAreas]=useState<LearningArea[]>([]),[topicCounts,setTopicCounts]=useState<Record<string,number>>({}),[loading,setLoading]=useState(true),[issue,setIssue]=useState(""),[search,setSearch]=useState(""),[showAll,setShowAll]=useState(false);
 useEffect(()=>{let alive=true;async function load(){if(!supabase){setIssue("Learning catalogue is temporarily unavailable.");setLoading(false);return}const [disciplines,topics]=await Promise.all([supabase.from("ace_learning_areas").select("slug,title,description,sort_order").eq("kind","discipline").eq("active",true).order("sort_order"),supabase.from("ace_learning_areas").select("parent_slug").eq("kind","subject").eq("active",true)]);if(!alive)return;setAreas(disciplines.data??[]);const counts:Record<string,number>={};for(const item of topics.data??[]){if(item.parent_slug)counts[item.parent_slug]=(counts[item.parent_slug]??0)+1}setTopicCounts(counts);if(disciplines.error||topics.error)setIssue("Learning areas are temporarily unavailable. Please retry.");setLoading(false)}void load();return()=>{alive=false}},[]);
 const filtered=useMemo(()=>areas.filter(a=>[a.title,a.description].join(" ").toLowerCase().includes(search.toLowerCase())),[areas,search]);
 const shown=showAll?filtered:filtered.slice(0,8);
 const areaIcons=[BookOpen,Code2,Calculator,Atom,Wrench,HeartPulse,Users,Palette];
 return <div className="ace-workspace-home ace-next">
  <section className="ace-welcome">
   <div className="ace-welcome-copy"><div className="ace-kicker"><span className="ace-live-dot"/> YOUR SPACE TO LEARN</div><h1>{user&&name.trim()?"Good to see you, "+name.trim().split(" ")[0]+".":"Your learning, organized."}</h1><p>A quiet place to think, practise, listen and make real progress.</p>
   <div className="ace-welcome-buttons"><button className="ace-primary-action" onClick={onStudio}><BookOpen size={15}/> Open Study Studio <ArrowRight size={14}/></button><button className="ace-quiet-action" onClick={onLibrary}><FileText size={15}/> Browse resources</button></div></div>
   <div className="ace-welcome-mark" aria-hidden="true"><div className="ace-orbit ace-orbit-one"/><div className="ace-orbit ace-orbit-two"/><div className="ace-welcome-logo"><img src="/icon.svg" alt="" width="84" height="84"/></div><span className="ace-orbit-caption">LEARN · CREATE · GROW</span></div>
  </section>
  <section className="ace-shortcuts" aria-label="Your study tools">
   <button onClick={onStudio}><span className="ace-tool-icon violet"><Sparkles size={17}/></span><span><strong>Practice</strong><small>Test your knowledge</small></span><ArrowUpRight size={14}/></button>
   <button onClick={onNotes}><span className="ace-tool-icon mint"><FileText size={17}/></span><span><strong>Shared notes</strong><small>Think together</small></span><ArrowUpRight size={14}/></button>
   <button onClick={onSpaces}><span className="ace-tool-icon blue"><Users size={17}/></span><span><strong>Study groups</strong><small>Learn with others</small></span><ArrowUpRight size={14}/></button>
   <button onClick={onPlanner}><span className="ace-tool-icon amber"><CalendarDays size={17}/></span><span><strong>Study plan</strong><small>Keep deadlines visible</small></span><ArrowUpRight size={14}/></button>
  </section>
  <section className="ace-discovery"><div className="ace-section-heading"><div><span className="ace-label">OPEN A FIELD OF STUDY</span><h2>Explore learning areas</h2><p className="muted">Start with a field, then find the topics and material that matter to you.</p></div><span className="ace-section-count">{areas.length} fields</span></div>
   <label className="ace-inline-search"><Search size={15}/><input aria-label="Find a learning area" placeholder="Find a subject or field" value={search} onChange={e=>setSearch(e.target.value)}/></label>
   {loading?<div className="ace-skeleton">Loading learning areas…</div>:shown.length?<div className="ace-area-grid">{shown.map((area,i)=>{const Icon=areaIcons[i%areaIcons.length];return <button key={area.slug} className="ace-area-card" onClick={()=>onArea(area.slug)}><span className={"ace-area-icon ace-color-"+i%4}><Icon size={19}/></span><span className="ace-area-copy"><strong>{area.title}</strong><small>{area.description}</small><em>{topicCounts[area.slug]??0} subjects <ArrowRight size={12}/></em></span></button>})}</div>:<div className="ace-empty"><Layers3 size={18}/> No learning areas match your search.</div>}
   {filtered.length>8&&<button className="ace-see-all" onClick={()=>setShowAll(v=>!v)}>{showAll?"Show fewer":"See all "+filtered.length+" fields"} <ArrowRight size={14}/></button>}{issue&&<p className="status" role="status">{issue}</p>}
  </section>
  <section className="ace-footer-nudge"><div><span className="ace-label">BETTER TOGETHER</span><h3>Don't study alone.</h3><p>Turn what you're learning into a shared note or start a discussion with your group.</p></div><button onClick={onSpaces}>Explore groups <ArrowRight size={15}/></button></section>
 </div>
}