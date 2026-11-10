"use client";

import { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";

export function DocxViewer({url,title}:{url:string;title:string}){
 const container=useRef<HTMLDivElement>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 useEffect(()=>{
  let cancelled=false;
  const target=container.current;
  async function render(){
   if(!target)return;
   try{
    const response=await fetch(url);
    if(!response.ok)throw new Error("The document could not be loaded for preview.");
    const blob=await response.blob();
    if(cancelled)return;
    await renderAsync(blob,target,undefined,{className:"docx",inWrapper:true,ignoreWidth:false,ignoreHeight:false,breakPages:true});
    if(!cancelled)setLoading(false);
   }catch(reason){
    if(!cancelled){setError(reason instanceof Error?reason.message:"Document preview failed.");setLoading(false);}
   }
  }
  void render();
  return()=>{cancelled=true;target?.replaceChildren();};
 },[url]);
 return <div className="docx-preview-stage" aria-label={title}>
  {loading&&!error&&<p className="muted text-small">Preparing document preview…</p>}
  {error&&<p className="form-error" role="alert">{error} Use the download action to open the original file.</p>}
  <div ref={container}/>
 </div>;
}