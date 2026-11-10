import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { AppShell, PageHeader, SetupNotice } from "@/components/app-shell";
import { DocumentActions } from "@/components/document-actions";
import { getDocument, getProfile } from "@/lib/ace-data";
import { createClient } from "@/lib/supabase/server";

export default async function DocumentPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const supabase=await createClient();
 const {data:auth}=supabase?await supabase.auth.getUser():{data:{user:null}};
 const user=auth.user;
 const [result,profile]=await Promise.all([getDocument(id),user?getProfile(user.id):Promise.resolve(null)]);
 if(result.issue==="ready"&&!result.data)notFound();
 const document=result.data?.document;
 const fileUrl=result.data?.previewUrl;
 const image=document?.mime_type.startsWith("image/");
 const pdf=document?.mime_type==="application/pdf";
 return <AppShell active="search" user={user} profile={profile?.data??null}>
  <PageHeader eyebrow="Library document" title={document?.title??"Document unavailable"} description={document?document.course_name+" · "+document.school_name:"This document could not be loaded."} action={<Link className="button button-secondary" href="/search"><ArrowLeft/>Back to library</Link>}/>
  <SetupNotice issue={result.issue} message={result.message}/>
  {document&&fileUrl&&<div className="viewer-panel">
   <div className="viewer-toolbar"><div><span className="document-kind">{document.document_type==="past_paper"?"Past paper":document.document_type==="summary"?"Summary":"Notes"}</span><p className="text-small muted" style={{margin:"7px 0 0"}}>Shared by {document.uploader_name} · {(document.file_size/1024/1024).toFixed(2)} MB</p></div><a className="button button-primary" href={fileUrl} target="_blank" rel="noreferrer"><Download/>Open / download file</a></div>
   <div className="viewer-stage">
    {pdf?<iframe className="pdf-viewer" src={fileUrl+"#toolbar=1&navpanes=0"} title={document.title+" PDF preview"}/>:image?<img className="image-viewer" src={fileUrl} alt={document.title}/>:<div className="viewer-unavailable"><div className="empty-icon"><FileText/></div><h2>Preview not available for this file type</h2><p>Download the original file to open it in a compatible application. The original document is kept unchanged.</p><a className="button button-primary" href={fileUrl} target="_blank" rel="noreferrer"><Download/>Download file</a></div>}
   </div>
  </div>}
  {document&&<section className="panel section"><div className="panel-header"><div><h2>About this document</h2><p>{document.description||"No description was added."}</p></div></div><div className="document-meta"><span>{document.course_code?document.course_code+" · ":""}{document.course_name}</span><span>{document.school_name}</span></div><div className="divider"/><DocumentActions documentId={document.id} initialVotes={document.upvotes} userId={user?.id??null}/></section>}
 </AppShell>;
}