import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export default function SignUpPage(){
 return <Suspense fallback={<main className="auth-main"><p>Loading account setup…</p></main>}><AuthForm mode="sign-up"/></Suspense>;
}