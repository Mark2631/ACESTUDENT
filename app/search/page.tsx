import Link from "next/link";
import { Search } from "lucide-react";
import { AppShell, PageHeader, SetupNotice } from "@/components/app-shell";
import { DocumentCard } from "@/components/document-card";
import { EmptyState } from "@/components/empty-state";
import { getCatalog, getDocuments, getProfile } from "@/lib/ace-data";
import { createClient } from "@/lib/supabase/server";

type SearchParams=Promise<{q?:string;type?:string;school?:string;course?:string}>;
export default async function SearchPage({searchParams}:{searchParams:SearchParams}){
 const params=await searchParams;const query=(params.q??"").trim();
 const type=["note","past_paper","summary"].includes(params.type??"")?params.type as "note"|"past_paper"|"summary":"all";
 const schoolId=params.school??"";const courseId=params.course??"";
 const supabase=await createClient();const {data:auth}=supabase?await supabase.auth.getUser():{data:{user:null}};
 const user=auth.user;const profile=user?(await getProfile(user.id)).data:null;
 const catalog=await getCatalog();
 const courses=catalog.data.courses.filter(c=>!schoolId||c.school_id===schoolId);
 const selectedCourse=courses.find(c=>c.id===courseId);
 const courseIds=selectedCourse?[selectedCourse.id]:schoolId?courses.map(c=>c.id):undefined;
 const result=await getDocuments({query,type,limit:50,courseIds});
 return <AppShell active="search" user={user} profile={profile}>
  <PageHeader eyebrow="Discover" title="Search the library" description="Find learning material by title, course code or subject across schools."/>
  <section className="panel"><form action="/search" className="form-grid">
   <div className="form-field"><label htmlFor="q">Search terms</label><input id="q" name="q" defaultValue={query} placeholder="Try a course title or topic…"/></div>
   <div className="form-row">
    <div className="form-field"><label htmlFor="school">School</label><select id="school" name="school" defaultValue={schoolId}><option value="">All schools</option>{catalog.data.schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
    <div className="form-field"><label htmlFor="course">Course / subject</label><select id="course" name="course" defaultValue={selectedCourse?.id??""}><option value="">All courses</option>{courses.map(c=><option key={c.id} value={c.id}>{c.code?c.code+" · ":""}{c.name}</option>)}</select></div>
   </div>
   <div className="form-row">
    <div className="form-field"><label htmlFor="type">Document type</label><select id="type" name="type" defaultValue={type}><option value="all">All materials</option><option value="note">Notes</option><option value="past_paper">Past papers</option><option value="summary">Summaries</option></select></div>
    <div className="form-field" style={{alignContent:"end"}}><button className="button button-primary" type="submit"><Search/>Search material</button></div>
   </div>
  </form></section>
  <section className="section"><div className="section-heading"><div><h2>{query?"Results for “"+query+"”":"Recent material"}</h2><p>{result.issue==="ready"?result.data.length+" result(s) found":"Library status"}</p></div><Link className="inline-link" href="/search">Clear filters</Link></div>
   <SetupNotice issue={catalog.issue!=="ready"?catalog.issue:result.issue} message={catalog.message||result.message}/>
   {result.issue==="ready"&&result.data.length>0?<div className="document-list">{result.data.map(d=><DocumentCard key={d.id} document={d}/>)}</div>:result.issue==="ready"?<EmptyState title="No matching documents" description="Try another course, school or topic. Only material approved for the shared library appears here."/>:null}
  </section>
 </AppShell>;
}