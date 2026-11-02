"use client";
import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import Link from "next/link";
import {supabase} from "@/lib/supabase";

type DocumentRow={id:string;title:string;course_code:string;course_name:string;kind:string;storage_path:string;status:string;uploader_id:string};

export default function DocumentReader(){
 const params=useParams();const id=typeof params.id==="string"?params.id:"";
 const [doc,setDoc]=useState<DocumentRow|null>(null);const [url,setUrl]=useState("");const [error,setError]=useState("");const [loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;let timer:ReturnType<typeof setTimeout>|undefined;
  async function load(){
   if(!supabase||!id){setError("Reader is unavailable.");setLoading(false);return}
   const {data,error:readError}=await supabase.from("ace_resources").select("id,title,course_code,course_name,kind,storage_path,status,uploader_id").eq("id",id).single();
   if(!active)return;
   if(readError||!data){setError("Document not found or access denied.");setLoading(false);return}
   const {data:auth}=await supabase.auth.getUser();
   if(data.status!=="approved"&&data.uploader_id!==auth.user?.id){setError("This document is not available.");setLoading(false);return}
   const {data:signed,error:signError}=await supabase.storage.from("ace-submissions").createSignedUrl(data.storage_path,300);
   if(!active)return;
   if(signError||!signed?.signedUrl){setError("Unable to load the document. Please retry.");setLoading(false);return}
   setDoc(data);setUrl(signed.signedUrl);setLoading(false);
   timer=setTimeout(()=>{if(active)void load()},240000);
  }
  void load();return()=>{active=false;if(timer)clearTimeout(timer)}
 },[id]);
 return <main style={{minHeight:"100dvh",background:"#0b1020",color:"#f5f7ff",padding:"clamp(12px,3vw,28px)"}}>
  <nav style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap",marginBottom:18}}>
   <Link href="/" style={{color:"#a8c7ff"}}>← Ace Student</Link>
   <div style={{flex:1,minWidth:180}}><strong>{doc?.title??"Document reader"}</strong>{doc&&<div style={{fontSize:13,opacity:.75}}>{doc.course_code} · {doc.course_name} · {doc.kind}</div>}</div>
   {url&&<><Link href={"/studio?importResource="+encodeURIComponent(id)} style={{color:"#b9d8ff",border:"1px solid #34506e",borderRadius:9,padding:"8px 11px",fontSize:13}}>Study this PDF in Studio →</Link><a href={url} download style={{color:"#a8c7ff"}}>Download PDF</a></>}
  </nav>
  {loading?<p role="status">Loading document…</p>:error?<div role="alert">{error} <Link href="/">Return to library</Link></div>:<iframe title={doc?.title??"PDF document"} src={url+"#toolbar=1&navpanes=0"} style={{width:"100%",height:"calc(100dvh - 115px)",border:"1px solid #27354f",borderRadius:12,background:"#fff"}}/>}
 </main>
}
