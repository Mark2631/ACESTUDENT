import Link from "next/link";
import { AppShell, PageHeader } from "@/components/app-shell";

export default function NotFound(){
  return <AppShell active="home" user={null}>
    <PageHeader eyebrow="Not found" title="This page is not here" description="The document may have been removed, or the link may be incorrect."/>
    <div className="empty-state"><div><h2>Back to your learning library</h2><p>Search for another document or return to the home feed.</p><div className="welcome-actions" style={{justifyContent:"center"}}><Link className="button button-primary" href="/search">Search the library</Link><Link className="button button-secondary" href="/">Go home</Link></div></div></div>
  </AppShell>;
}