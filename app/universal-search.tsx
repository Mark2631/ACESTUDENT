"use client";
import {useEffect,useState} from "react";
import {ArrowRight,BookOpen,FileText,GraduationCap,MessageSquare,Search,StickyNote,Trophy} from "lucide-react";
import {supabase} from "@/lib/supabase";
import type {User} from "@supabase/supabase-js";
type Hit={id:string;label:string;detail:string;kind:"area"|"course"|"resource"|"document"|"quiz"|"space"|"note";code?:string;url?:string};
export default function UniversalSearch({query,user,open,onPick}:{query:string;user:User|null;open:boolean;onPick:(hit:Hit)=>void}){
 const[results,setResults]=useState<Hit[]>([]),[loading,setLoading]=useState(false);
 useEffect(()=>{const q=query.trim();if(!open||q.length<2||!supabase){setResults([]);setLoading(false);return}const client=supabase;let alive=true;setLoading(true);
 const timer=setTimeout(async()=>{
  const term="%"+q.replace(/[%,]/g," ")+"%";
  const requests=[
   client.from("ace_learning_areas").select("slug,title,description").eq("active",true).or("slug.ilike."+term+",title.ilike."+term+",description.ilike."+term).limit(6),
   client.from("ace_open_resources").select("id,title,subject,url").eq("hidden",false).ilike("title",term).limit(5),
   client.from("ace_resources").select("id,title,course_code").eq("status","approved").ilike("title",term).limit(4)
  ];
  if(user){requests.push(client.from("ace_quizzes").select("id,title,course_code").eq("status","published").ilike("title",term).limit(4));requests.push(client.from("ace_spaces").select("id,title,course_code").ilike("title",term).limit(4));requests.push(client.from("ace_shared_notes").select("id,title,course_code").ilike("title",term).limit(4))}
  const groups=await Promise.all(requests);if(!alive)return;
  const out:Hit[]=[];
  const rows=(index:number):Array<Record<string,unknown>>=>(groups[index]?.data??[]) as unknown as Array<Record<string,unknown>>;
  for(const row of rows(0))out.push({id:String(row.slug??""),label:String(row.title??""),detail:String(row.description??"Learning area"),kind:"area",code:String(row.slug??"")});
  for(const row of rows(1))out.push({id:String(row.id??""),label:String(row.title??""),detail:String(row.subject??""),kind:"resource",url:String(row.url??"")});
  for(const row of rows(2))out.push({id:String(row.id??""),label:String(row.title??""),detail:String(row.course_code??""),kind:"document"});
  if(user){
   for(const row of rows(3))out.push({id:String(row.id??""),label:String(row.title??""),detail:String(row.course_code??""),kind:"quiz",code:String(row.course_code??"")});
   for(const row of rows(4))out.push({id:String(row.id??""),label:String(row.title??""),detail:String(row.course_code??""),kind:"space",code:String(row.course_code??"")});
   for(const row of rows(5))out.push({id:String(row.id??""),label:String(row.title??""),detail:String(row.course_code??"")||"Shared notes",kind:"note"})
  }
  setResults(out.slice(0,16));setLoading(false);
 },210);
 return()=>{alive=false;clearTimeout(timer)}
 },[query,user?.id,open]);
 if(!open||query.trim().length<2)return null;
 const icons={area:GraduationCap,course:GraduationCap,resource:BookOpen,document:FileText,quiz:Trophy,space:MessageSquare,note:StickyNote};
 return <div className="universal-results" role="region" aria-label="Search suggestions"><div className="universal-results-head"><Search size={14}/> Results for “{query.trim()}”</div>{loading?<p className="muted">Searching learning areas, materials and discussions…</p>:results.length?<div className="universal-result-items">{results.map(hit=>{const Icon=icons[hit.kind];return <button type="button" key={hit.kind+hit.id} onMouseDown={e=>e.preventDefault()} onClick={()=>onPick(hit)}><Icon size={17}/><span><strong>{hit.label}</strong><small>{hit.kind.toUpperCase()} · {hit.detail}</small></span><ArrowRight size={15}/></button>})}</div>:<div className="universal-empty">No matching items. Try a subject, topic or another keyword.</div>}</div>
}
