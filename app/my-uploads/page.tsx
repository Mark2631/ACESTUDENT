import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell, PageHeader, SetupNotice } from "@/components/app-shell";
import { DocumentCard } from "@/components/document-card";
import { EmptyState } from "@/components/empty-state";
import { getDocuments, getProfile } from "@/lib/ace-data";
import { createClient } from "@/lib/supabase/server";

export default async function MyUploadsPage({searchParams}:{searchParams:Promise<{submitted?:string}>}){
 const params=await searchParams;
 const supabase=await createClient();if(!supabase)redirect("/sign-in");
 const {data}=await supabase.auth.getUser();if(!data.user)redirect("/sign-in");
 const user=data.user;
 const [profile,result]=await Promise.all([getProfile(user.id),getDocuments({uploaderId:user.id,limit:60})]);
 return <AppShell active="uploads" user={user} profile={profile.data}>
  <PageHeader eyebrow="Your contributions" title="My uploads" description="Track each document you have submitted and whether it has been approved for the shared library."/>
  {params.submitted==="1"&&<div className="form-success" style={{marginBottom:16}}>Your document has been submitted for review. It will not appear in public search until approved.</div>}
  <SetupNotice issue={result.issue} message={result.message}/>
  {result.issue==="ready"&&result.data.length>0?<div className="document-list">{result.data.map(d=><div key={d.id}><DocumentCard document={d}/><div style={{padding:"5px 15px 0"}}><span className={"status-pill"+(d.status==="approved"?" status-approved":d.status==="flagged"?" status-rejected":"")}>{d.status==="flagged"?"Flagged":d.status==="approved"?"Approved":"Pending review"}</span></div></div>)}</div>:result.issue==="ready"?<EmptyState title="You have not shared anything yet" description="Your submissions and review status will appear here." action={{href:"/upload",label:"Share your first document"}}/>:null}
 </AppShell>;
}