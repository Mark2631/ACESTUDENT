import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { AppShell, PageHeader, SetupNotice } from "@/components/app-shell";
import { DocumentCard } from "@/components/document-card";
import { EmptyState } from "@/components/empty-state";
import { getCatalog, getDocuments, getProfile } from "@/lib/ace-data";
import { createClient } from "@/lib/supabase/server";

export default async function MySchoolPage(){
 const supabase=await createClient();if(!supabase)redirect("/sign-in");
 const {data}=await supabase.auth.getUser();if(!data.user)redirect("/sign-in?next=/school");
 const user=data.user;
 const [profile,catalog]=await Promise.all([getProfile(user.id),getCatalog()]);
 if(!profile.data?.onboarding_completed)redirect("/onboarding");
 const schoolId=profile.data.school_id;
 const courses=catalog.data.courses.filter(c=>c.school_id===schoolId);
 const result=await getDocuments({courseIds:courses.map(c=>c.id),limit:50});
 return <AppShell active="school" user={user} profile={profile.data}>
  <PageHeader eyebrow="School community" title={profile.data.school_name||"My School"} description="Approved notes, past papers and summaries connected to your school."/>
  <section className="panel"><div className="panel-header"><div><h2>Courses at your school</h2><p>Browse the subjects students have added to the school directory.</p></div><Building2 color="#557b96" size={18}/></div>
   <div className="course-pills">{courses.length?courses.map(c=><Link className="course-pill" href={"/courses?course="+c.id} key={c.id}>{c.name}{c.code&&<span>{c.code}</span>}</Link>):<span className="muted text-small">No courses have been added for this school yet.</span>}</div>
  </section>
  <section className="section"><div className="section-heading"><div><h2>School library</h2><p>Latest approved material from courses in your school.</p></div></div>
   <SetupNotice issue={catalog.issue!=="ready"?catalog.issue:result.issue} message={catalog.message||result.message}/>
   {result.issue==="ready"&&result.data.length>0?<div className="document-list">{result.data.map(d=><DocumentCard key={d.id} document={d}/>)}</div>:result.issue==="ready"?<EmptyState title="No shared material from your school yet" description="Start the collection by contributing a set of notes or a past paper." action={{href:"/upload",label:"Share material"}}/>:null}
  </section>
 </AppShell>;
}