import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request:NextRequest){
 const requestUrl=new URL(request.url);
 const code=requestUrl.searchParams.get("code");
 const rawNext=requestUrl.searchParams.get("next")??"/onboarding";
 const next=rawNext.startsWith("/")&&!rawNext.startsWith("//")?rawNext:"/onboarding";
 if(code){
  const supabase=await createClient();
  if(supabase){
   const {error}=await supabase.auth.exchangeCodeForSession(code);
   if(!error)return NextResponse.redirect(new URL(next,requestUrl.origin));
  }
 }
 return NextResponse.redirect(new URL("/sign-in?error=confirmation",requestUrl.origin));
}