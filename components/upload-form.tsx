"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp } from "lucide-react";
import type { Course } from "@/lib/ace-data";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE=15*1024*1024;
const allowedExtensions=["pdf","jpg","jpeg","png","webp","docx"];
const mimeByExtension:Record<string,string>={pdf:"application/pdf",jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"};


async function hasValidSignature(file:File,extension:string):Promise<boolean>{
 const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer());
 if(extension==="pdf")return new TextDecoder().decode(bytes.slice(0,5))==="%PDF-";
 if(extension==="jpg"||extension==="jpeg")return bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
 if(extension==="png")return bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47&&bytes[4]===0x0d&&bytes[5]===0x0a&&bytes[6]===0x1a&&bytes[7]===0x0a;
 if(extension==="webp")return new TextDecoder().decode(bytes.slice(0,4))==="RIFF"&&new TextDecoder().decode(bytes.slice(8,12))==="WEBP";
 if(extension==="docx")return bytes[0]===0x50&&bytes[1]===0x4b&&bytes[2]===0x03&&bytes[3]===0x04;
 return false;
}

export function UploadForm({courses}:{courses:Course[]}){
 const router=useRouter();const [file,setFile]=useState<File|null>(null);const [title,setTitle]=useState("");
 const [description,setDescription]=useState("");const [courseId,setCourseId]=useState(courses[0]?.id??"");
 const [kind,setKind]=useState<"note"|"past_paper"|"summary">("note");
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [progress,setProgress]=useState("");
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setError("");setProgress("");
  if(!file){setError("Choose a document to upload.");return}
  if(!courseId){setError("Choose the course or subject this material belongs to.");return}
  if(title.trim().length<3){setError("Give the document a title of at least 3 characters.");return}
  if(file.size>MAX_FILE_SIZE){setError("The file is larger than 15 MB.");return}
  const extension=file.name.split(".").pop()?.toLowerCase()??"";
  if(!allowedExtensions.includes(extension)){setError("Upload a PDF, JPG, PNG, WebP or DOCX file.");return}
  const mimeType=mimeByExtension[extension];
  let signatureMatches=false;
  try{
   signatureMatches=await hasValidSignature(file,extension);
  }catch{
   setError("The file could not be inspected. Choose it again and retry.");
   return;
  }
  if(!signatureMatches){
   setError("The file content does not match its extension. Choose the original document.");
   return;
  }
  setBusy(true);setProgress("Checking your account…");
  const supabase=createClient();
  if(!supabase){setError("The Supabase connection is not configured.");setBusy(false);return}
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError||!user){setError("Sign in before contributing a document.");setBusy(false);return}
  const id=crypto.randomUUID();
  const safeName=file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/-+/g,"-").slice(-90);
  const path=user.id+"/"+id+"-"+safeName;
  setProgress("Uploading your document…");
  const {error:uploadError}=await supabase.storage.from("ace-documents").upload(path,file,{contentType:mimeType,upsert:false});
  if(uploadError){setError(uploadError.message);setBusy(false);setProgress("");return}
  setProgress("Saving document details…");
  const {error:recordError}=await supabase.from("ace_documents").insert({
   id,uploader_id:user.id,course_id:courseId,title:title.trim(),description:description.trim()||null,
   document_type:kind,storage_path:path,mime_type:mimeType,file_size:file.size,status:"pending"
  });
  if(recordError){
   const {error:cleanupError}=await supabase.storage.from("ace-documents").remove([path]);
   setError(cleanupError?recordError.message+" The uploaded file could not be removed automatically; contact support.":recordError.message);
   setBusy(false);setProgress("");return;
  }
  setProgress("Submitted for review. Redirecting…");
  router.replace("/my-uploads?submitted=1");router.refresh();
 }
 return <form className="form-card form-grid" onSubmit={submit}>
  {courses.length===0&&<div className="notice notice-blue"><strong>Course information is missing.</strong>Complete your academic profile and add at least one course before uploading.</div>}
  <div className="form-field"><label htmlFor="document-title">Document title</label><input id="document-title" value={title} onChange={e=>setTitle(e.target.value)} minLength={3} maxLength={140} required placeholder="e.g. Business Law — consideration summary"/></div>
  <div className="form-row">
   <div className="form-field"><label htmlFor="document-course">School course / subject</label><select id="document-course" value={courseId} onChange={e=>setCourseId(e.target.value)} required><option value="">Choose a course</option>{courses.map(c=><option key={c.id} value={c.id}>{c.code?c.code+" · ":""}{c.name}</option>)}</select></div>
   <div className="form-field"><label htmlFor="document-kind">Document type</label><select id="document-kind" value={kind} onChange={e=>setKind(e.target.value as typeof kind)}><option value="note">Notes</option><option value="past_paper">Past paper</option><option value="summary">Revision summary</option></select></div>
  </div>
  <div className="form-field"><label htmlFor="document-description">Description <span className="muted">(optional)</span></label><textarea id="document-description" value={description} onChange={e=>setDescription(e.target.value)} maxLength={1200} placeholder="What does this document cover? Include year or topic when relevant."/></div>
  <div className="form-field"><span className="field-label">Your file</span><label className="file-drop" htmlFor="document-file"><FileUp/><strong>{file?file.name:"Choose a document"}</strong><span>{file?(file.size/1024/1024).toFixed(2)+" MB":"PDF, JPG, PNG, WebP or DOCX · Up to 15 MB"}</span><input id="document-file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,application/pdf,image/jpeg,image/png,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e=>setFile(e.target.files?.[0]??null)}/></label></div>
  <p className="form-help">Only share material you have the right to distribute. New contributions are private until reviewed and approved.</p>
  {error&&<p className="form-error" role="alert">{error}</p>}
  {progress&&<p className="form-success" role="status">{progress}</p>}
  <div className="form-actions"><span className="form-help">Usually under a minute.</span><button className="button button-primary" type="submit" disabled={busy||courses.length===0}><FileUp/>{busy?"Submitting…":"Submit for review"}</button></div>
 </form>;
}