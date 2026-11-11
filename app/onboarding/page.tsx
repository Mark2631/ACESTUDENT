import "../academic.css";
import { redirect } from "next/navigation";
import { AppShell, PageHeader, SetupNotice } from "@/components/app-shell";
import { OnboardingForm } from "@/components/onboarding-form";
import { getCatalog, getMyCourseIds, getProfile } from "@/lib/ace-data";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage(){
  const supabase=await createClient();
  if(!supabase)return <main className="content"><PageHeader eyebrow="Academic setup" title="Connect your studies"/><SetupNotice issue="missing-config"/></main>;
  const {data,error}=await supabase.auth.getUser();
  if(error||!data.user)redirect("/sign-in?next=/onboarding");
  const user=data.user;
  const [catalog,profile,courseIds]=await Promise.all([getCatalog(),getProfile(user.id),getMyCourseIds(user.id)]);
  return <AppShell active="profile" user={user} profile={profile.data}>
    <PageHeader eyebrow="Academic setup" title={profile.data?.onboarding_completed?"Update your studies":"Connect your studies"}
      description="Your school and course choices organise the library. You can update them later."/>
    {catalog.issue==="ready"
      ?<OnboardingForm schools={catalog.data.schools} courses={catalog.data.courses}
        initialName={profile.data?.full_name||user.user_metadata?.full_name||""}
        initialEducationLevel={profile.data?.education_level||"university"}
        initialSchoolName={profile.data?.school_name||""}
        initialProgramme={profile.data?.programme||""}
        initialYear={profile.data?.grade_or_year||""}
        initialCourseIds={courseIds}/>
      :<SetupNotice issue={catalog.issue} message={catalog.message}/>} 
  </AppShell>;
}