"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flag, ThumbsUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function DocumentActions({documentId,initialVotes,userId}:{documentId:string;initialVotes:number;userId:string|null}){
 const [votes,setVotes]=useState(initialVotes);const [voted,setVoted]=useState(false);
 const [showReport,setShowReport]=useState(false);const [reason,setReason]=useState("");
 const [message,setMessage]=useState("");const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 useEffect(()=>{
  if(!userId)return;
  const supabase=createClient();if(!supabase)return;
  void supabase.from("ace_document_votes").select("document_id").eq("document_id",documentId).maybeSingle()
   .then(({data})=>setVoted(Boolean(data)));
 },[documentId,userId]);
 async function vote(){
  setError("");setMessage("");
  const supabase=createClient();if(!supabase){setError("Supabase is not configured.");return}
  setBusy(true);
  const {data,error:voteError}=await supabase.rpc("ace_vote_document",{p_document:documentId});
  if(voteError)setError(voteError.message);
  else{setVotes(Number(data));setVoted(true);setMessage("Marked as helpful.");}
  setBusy(false);
 }
 async function report(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setError("");setMessage("");
  if(reason.trim().length<8){setError("Add a short explanation so moderators can review this report.");return}
  const supabase=createClient();if(!supabase){setError("Supabase is not configured.");return}
  setBusy(true);
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){setError("Sign in to report this document.");setBusy(false);return}
  const {error:reportError}=await supabase.from("ace_document_flags").insert({document_id:documentId,user_id:user.id,reason:reason.trim()});
  if(reportError)setError(reportError.code==="23505"?"You have already reported this document.":reportError.message);
  else{setMessage("Report submitted for moderator review.");setReason("");setShowReport(false);}
  setBusy(false);
 }
 return <div className="form-grid">
  <div className="welcome-actions">
   {userId?<button className="button button-secondary" type="button" onClick={vote} disabled={busy||voted}><ThumbsUp/>{voted?"Marked helpful":"Helpful · "+votes}</button>:<Link className="button button-secondary" href="/sign-in"><ThumbsUp/>Sign in to mark helpful</Link>}
   {userId&&<button className="button button-quiet" type="button" onClick={()=>setShowReport(v=>!v)}><Flag/>Report document</button>}
  </div>
  {showReport&&<form className="form-grid" onSubmit={report}><div className="form-field"><label htmlFor="report-reason">Why should this be reviewed?</label><textarea id="report-reason" value={reason} onChange={e=>setReason(e.target.value)} maxLength={600} minLength={8} placeholder="Explain what is inaccurate, outdated or inappropriate."/></div><button className="button button-secondary" type="submit" disabled={busy}>Submit report</button></form>}
  {message&&<p className="form-success" role="status">{message}</p>}{error&&<p className="form-error" role="alert">{error}</p>}
 </div>;
}