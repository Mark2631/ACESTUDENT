import { redirect } from "next/navigation";
import { AppShell, PageHeader, SetupNotice } from "@/components/app-shell";
import { UploadForm } from "@/components/upload-form";
import { getCatalog, getMyCourseIds, getProfile } from "@/lib/ace-data";
import { createClient } from "@/lib/supabase/server";

export default async function UploadPage(){
 const supabase=await createClient();
 if(!supabase)redirect("/sign-in");
 const {data}=await supabase.auth.getUser();
 if(!data.user)redirect("/sign-in?next=/upload");
 const user=data.user;
 const [profileResult,catalog,ids]=await Promise.all([getProfile(user.id),getCatalog(),getMyCourseIds(user.id)]);
 const courses=catalog.data.courses.filter(course=>ids.includes(course.id));
 if(!profileResult.data?.onboarding_completed)redirect("/onboarding");
 return <AppShell active="upload" user={user} profile={profileResult.data}>
  <PageHeader eyebrow="Contribute" title="Share a study document" description="Add useful notes, summaries or past papers to the library. Every submission is reviewed before public access."/>
  <UploadForm courses={courses}/>
  <div style={{marginTop:14}}><SetupNotice issue={catalog.issue} message={catalog.message}/></div>
 </AppShell>;
}