import Link from "next/link";
import { redirect } from "next/navigation";
import { GraduationCap, UserRound } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { SignOutButton } from "@/components/sign-out-button";
import { getCatalog, getMyCourseIds, getProfile } from "@/lib/ace-data";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage(){
 const supabase=await createClient();if(!supabase)redirect("/sign-in");
 const {data}=await supabase.auth.getUser();if(!data.user)redirect("/sign-in");
 const user=data.user;
 const [profileResult,ids,catalog]=await Promise.all([getProfile(user.id),getMyCourseIds(user.id),getCatalog()]);
 const profile=profileResult.data;const courses=catalog.data.courses.filter(c=>ids.includes(c.id));
 const name=profile?.full_name||user.user_metadata?.full_name||"Student";
 return <AppShell active="profile" user={user} profile={profile}>
  <PageHeader eyebrow="Account" title="Your profile" description="Your academic details help the library surface relevant material."/>
  <div className="profile-header"><div className="avatar">{name.slice(0,1).toUpperCase()}</div><div><h2>{name}</h2><p>{user.email}</p></div></div>
  <section className="panel" style={{marginTop:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
   <div><p className="eyebrow">Contribution reputation</p><h2 style={{fontSize:24,margin:0}}>{profile?.karma_points??0} karma points</h2><p className="muted text-small" style={{margin:"4px 0 0"}}>Points are added when a moderator approves one of your contributions.</p></div>
   <Link className="button button-secondary" href="/my-uploads">View my uploads</Link>
  </section>
  <div className="section content-grid"><section className="panel"><div className="panel-header"><div><h2>Academic profile</h2><p>Your school and study path.</p></div><GraduationCap color="#557b96" size={18}/></div>
   {profile?.onboarding_completed?<><div className="form-grid"><div><span className="muted text-small">School</span><h3>{profile.school_name??"Not set"}</h3></div><div><span className="muted text-small">Education level</span><h3>{profile.education_level==="secondary"?"Secondary school":"University"}</h3></div><div><span className="muted text-small">Programme / year</span><h3>{profile.programme||profile.grade_or_year||"Not set"}</h3></div></div><div className="divider"/><div className="section-heading"><h3>My courses</h3><Link className="inline-link" href="/onboarding">Edit profile</Link></div><div className="course-pills">{courses.length?courses.map(c=><span className="course-pill" key={c.id}>{c.name}{c.code&&<span>{c.code}</span>}</span>):<span className="muted text-small">No courses selected.</span>}</div></>:<div className="empty-state"><div><div className="empty-icon"><UserRound/></div><h2>Complete your academic profile</h2><p>Choose your school and the courses or subjects you study.</p><Link className="button button-primary" href="/onboarding">Set up profile</Link></div></div>}
  </section><aside className="panel"><div className="panel-header"><div><h2>Account</h2><p>Manage your session.</p></div><UserRound color="#557b96" size={18}/></div><p className="muted text-small">Signed in as {user.email}. Your contributions remain attached to this account.</p><div className="divider"/><SignOutButton/></aside></div>
 </AppShell>;
}