import Link from "next/link";
import { ArrowRight, BookOpen, FilePlus2, GraduationCap, Search } from "lucide-react";
import { AppShell, SetupNotice } from "@/components/app-shell";
import { DocumentCard } from "@/components/document-card";
import { EmptyState } from "@/components/empty-state";
import { getDocuments, getMyCourseIds, getProfile } from "@/lib/ace-data";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage(){
 const supabase=await createClient();
 const {data:auth}=supabase?await supabase.auth.getUser():{data:{user:null}};
 const user=auth.user;
 const profileResult=user?await getProfile(user.id):null;
 const profile=profileResult?.data??null;
 const selectedCourseIds=user?await getMyCourseIds(user.id):undefined;
 const documents=await getDocuments({limit:8,courseIds:selectedCourseIds?.length?selectedCourseIds:undefined});
 return <AppShell active="home" user={user} profile={profile}>
  <section className="welcome-panel"><div className="welcome-copy"><p className="eyebrow">Your learning community</p><h1>Good material makes hard topics easier.</h1><p>Find notes, past papers and revision guides shared by students in your school. Add to the library when you have something useful to contribute.</p><div className="welcome-actions"><Link className="button button-primary" href="/search"><Search/>Explore the library</Link><Link className="button button-secondary" href="/upload"><FilePlus2/>Share a document</Link></div></div><div className="welcome-mark" aria-hidden="true">A.</div></section>
  {user&&!profile?.onboarding_completed&&<div className="notice notice-blue"><GraduationCap/><div><strong>Complete your academic profile</strong>Choose your school and courses so the library can show more relevant material. <Link href="/onboarding">Set up profile</Link></div></div>}
  <section className="section"><div className="section-heading"><div><h2>{user?"From your courses":"Recently shared"}</h2><p>{user?"Recent approved material for the courses you selected.":"New material from the student community."}</p></div><Link className="inline-link" href="/search">Browse library <ArrowRight size={13}/></Link></div>
   <SetupNotice issue={documents.issue} message={documents.message}/>
   {documents.issue==="ready"&&documents.data.length>0?<div className="document-list">{documents.data.map(d=><DocumentCard key={d.id} document={d}/>)}</div>:documents.issue==="ready"?<EmptyState title="No course material has been shared yet" description="Try the wider library or share a useful document with your course community." action={user?{href:"/upload",label:"Share the first document"}:{href:"/sign-up",label:"Join and contribute"}}/>:null}
  </section>
  <section className="section content-grid"><div className="panel"><div className="panel-header"><div><h2>Your academic spaces</h2><p>Explore material across your school and selected courses.</p></div><BookOpen color="#557b96" size={18}/></div><div className="welcome-actions"><Link className="button button-secondary" href="/school">My School <ArrowRight/></Link><Link className="button button-secondary" href="/courses">My Courses <ArrowRight/></Link></div></div><aside className="panel"><div className="panel-header"><div><h2>Share responsibly</h2><p>Keep the library useful for other students.</p></div></div><p className="text-small muted">Upload material you have the right to share. New contributions are reviewed before public discovery.</p><div className="divider"/><Link className="inline-link" href="/about">Community principles <ArrowRight size={13}/></Link></aside></section>
 </AppShell>
}