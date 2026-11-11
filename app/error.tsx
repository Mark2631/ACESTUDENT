"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorBoundary({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
  useEffect(()=>{console.error("Ace Student route error:",error);},[error]);
  return <main className="content">
    <section className="empty-state">
      <div>
        <div className="empty-icon"><AlertTriangle/></div>
        <h1>That screen could not load</h1>
        <p>Your account and saved study materials have not been deliberately cleared. Try the screen again, or return to the library.</p>
        <div className="welcome-actions" style={{justifyContent:"center"}}>
          <button className="button button-primary" type="button" onClick={reset}><RefreshCw/>Try again</button>
          <Link className="button button-secondary" href="/">Return home</Link>
        </div>
        {error.digest&&<p className="form-help" style={{marginTop:12}}>Reference: {error.digest}</p>}
      </div>
    </section>
  </main>;
}