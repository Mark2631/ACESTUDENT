"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Brand } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({mode}:{mode:"sign-in"|"sign-up"}){
 const router=useRouter();const params=useSearchParams();
 const [name,setName]=useState("");const [email,setEmail]=useState("");const [password,setPassword]=useState("");
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [message,setMessage]=useState("");
 const isSignUp=mode==="sign-up";
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setError("");setMessage("");
  if(password.length<8){setError("Use a password with at least 8 characters.");return}
  setBusy(true);
  const supabase=createClient();
  if(!supabase){setError("Authentication is not configured. The Supabase URL and publishable key are missing.");setBusy(false);return}
  if(isSignUp){
   const redirectTo=window.location.origin+"/auth/callback?next=/onboarding";
   const {data,error:authError}=await supabase.auth.signUp({email,password,options:{data:{full_name:name.trim()},emailRedirectTo:redirectTo}});
   if(authError){setError(authError.message);setBusy(false);return}
   if(data.session){router.replace("/onboarding");router.refresh();return}
   setMessage("Account created. Check your email for the confirmation link, then continue setting up your profile.");
   setBusy(false);return;
  }
  const {error:authError}=await supabase.auth.signInWithPassword({email,password});
  if(authError){setError(authError.message);setBusy(false);return}
  const next=params.get("next");
  router.replace(next&&next.startsWith("/")&&!next.startsWith("//")?next:"/");
  router.refresh();
 }
 return <div className="auth-page">
  <aside className="auth-aside"><Brand/><div className="auth-statement"><p className="eyebrow">Ace Student</p><h1>Study material should move between students, not get lost in group chats.</h1><p>Find course materials, contribute what helped you and make the academic library stronger for everyone.</p></div><div className="auth-proof">A student learning community · Built around shared knowledge</div></aside>
  <main className="auth-main"><div className="auth-main-inner">
   <div className="auth-mobile-brand"><Brand/></div>
   <p className="eyebrow">{isSignUp?"Join the community":"Welcome back"}</p>
   <h1>{isSignUp?"Create your account":"Sign in to Ace Student"}</h1>
   <p className="auth-subtitle">{isSignUp?"Start with your name and student email. You will add your school and courses next.":"Access your academic profile and contributions."}</p>
   <form className="form-grid" onSubmit={submit}>
    {isSignUp&&<div className="form-field"><label htmlFor="full-name">Full name</label><input id="full-name" autoComplete="name" value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={100} required placeholder="Your name"/></div>}
    <div className="form-field"><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com"/></div>
    <div className="form-field"><label htmlFor="password">Password</label><input id="password" type="password" autoComplete={isSignUp?"new-password":"current-password"} value={password} onChange={e=>setPassword(e.target.value)} minLength={8} required placeholder="At least 8 characters"/></div>
    {error&&<p className="form-error" role="alert">{error}</p>}{message&&<p className="form-success" role="status">{message}</p>}
    <button className="button button-primary" type="submit" disabled={busy}>{busy?"Please wait…":isSignUp?"Create account":"Sign in"}</button>
   </form>
   <p className="auth-switch">{isSignUp?"Already have an account? ":"New to Ace Student? "}<Link href={isSignUp?"/sign-in":"/sign-up"}>{isSignUp?"Sign in":"Create an account"}</Link></p>
   <p className="auth-footer">By continuing, you agree to share only material you have the right to distribute.</p>
  </div></main>
 </div>
}