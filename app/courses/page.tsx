import Link from "next/link";
import { redirect } from "next/navigation";
import { Library } from "lucide-react";
import { AppShell, PageHeader, SetupNotice } from "@/components/app-shell";
import { DocumentCard } from "@/components/document-card";
import { EmptyState } from "@/components/empty-state";
import { getCatalog, getDocuments, getMyCourseIds, getProfile } from "@/lib/ace-data";
import { createClient } from "@/lib/supabase/server";

export default async function MyCoursesPage({searchParams}:{searchParams:Promise<{course?:string}>}){
 const params=await searchParams;
 const supabase=await createClient();if(!supabase)redirect("/sign-in");
 const {data}=await supabase.auth.getUser();if(!data.user)redirect("/sign-in?next=/courses");
 const user=data.user;
 const [profile,catalog,ids]=await Promise.all([getProfile(user.id),getCatalog(),getMyCourseIds(user.id)]);
 if(!profile.data?.onboarding_completed)redirect("/onboarding");
 const courses=catalog.data.courses.filter(c=>ids.includes(c.id));
 const selected=courses.find(c=>c.id===params.course);
 const docs=await getDocuments({courseIds:selected?[selected.id]:ids,limit:50});
 return <AppShell active="courses" user={user} profile={profile.data}>
  <PageHeader eyebrow="Your coursework" title="My Courses" description="Learning material grouped around the subjects and courses you selected."/>
  <section className="panel"><div className="panel-header"><div><h2>Selected courses</h2><p>Update these from your academic profile.</p></div><Library color="var(--blue)" size={18}/></div>
   <div className="course-pills">{courses.length?courses.map(c=><Link className="course-pill" href={"/courses?course="+c.id} key={c.id}>{c.name}{c.code&&<span>{c.code}</span>}</Link>):<span className="muted text-small">No courses selected.</span>}</div>
  </section>
  <section className="section"><div className="section-heading"><div><h2>{selected?selected.name:"Course materials"}</h2><p>{selected?"Approved material for this course.":"Approved documents from all your selected courses."}</p></div></div>
   <SetupNotice issue={catalog.issue!=="ready"?catalog.issue:docs.issue} message={catalog.message||docs.message}/>
   {docs.issue==="ready"&&docs.data.length>0?<div className="document-list">{docs.data.map(d=><DocumentCard key={d.id} document={d}/>)}</div>:docs.issue==="ready"?<EmptyState title="No material for these courses yet" description="Share your notes or a past paper to start building a course library." action={{href:"/upload",label:"Share material"}}/>:null}
  </section>
 </AppShell>;
}