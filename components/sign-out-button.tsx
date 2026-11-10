"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton(){
 const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 async function signOut(){
  setBusy(true);setError("");
  const supabase=createClient();
  if(!supabase){setError("Authentication is not configured.");setBusy(false);return}
  const {error:authError}=await supabase.auth.signOut();
  if(authError){setError(authError.message);setBusy(false);return}
  router.replace("/");router.refresh();
 }
 return <div><button className="button button-secondary" type="button" onClick={signOut} disabled={busy}><LogOut/>{busy?"Signing out…":"Sign out"}</button>{error&&<p className="form-error" style={{marginTop:10}}>{error}</p>}</div>;
}