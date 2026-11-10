"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function DownloadLink({url,documentId,userId,initialDownloads}:{url:string;documentId:string;userId:string|null;initialDownloads:number}){
 const [downloads,setDownloads]=useState(initialDownloads);
 const [error,setError]=useState("");
 async function recordDownload(){
  if(!userId)return;
  const supabase=createClient();
  if(!supabase)return;
  const {data,error:rpcError}=await supabase.rpc("ace_record_download",{p_document:documentId});
  if(rpcError){setError("The file opened, but its download count could not be updated.");return;}
  setDownloads(Number(data));
 }
 return <div>
  <a className="button button-primary" href={url} target="_blank" rel="noreferrer" onClick={()=>{void recordDownload();}}>
   <Download/>Open / download · {downloads}
  </a>
  {error&&<p className="form-help" role="status">{error}</p>}
 </div>;
}