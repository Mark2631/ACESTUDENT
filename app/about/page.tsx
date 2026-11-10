import Link from "next/link";
import { AppShell, PageHeader } from "@/components/app-shell";

export default function AboutPage(){
 return <AppShell active="home" user={null}>
  <PageHeader eyebrow="About Ace Student" title="A better way to share what helps you learn." description="Useful academic material should be easier to find, contribute to and improve together."/>
  <div className="content-grid"><section className="panel"><h2>Community principles</h2>
   <div className="section"><h3>Share material you have the right to share</h3><p className="muted text-small">Upload your own notes, summaries and permitted past papers. Do not upload private, paid or copyrighted material unless you have permission.</p></div>
   <div className="section"><h3>Make the library dependable</h3><p className="muted text-small">Documents are reviewed before they appear in public discovery. Report information that is inaccurate, outdated or inappropriate.</p></div>
   <div className="section"><h3>Keep course context attached</h3><p className="muted text-small">Every document belongs to a school and a course or subject. Accurate tags make good material easier to find.</p></div>
  </section><aside className="panel"><h2>Start here</h2><p className="muted text-small">Browse learning materials or join the community to contribute.</p><div className="form-grid"><Link className="button button-primary" href="/search">Explore the library</Link><Link className="button button-secondary" href="/sign-up">Create an account</Link></div></aside></div>
 </AppShell>;
}