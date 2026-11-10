import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { BookOpen, FilePlus2, Files, House, Search, UserRound } from "lucide-react";
import type { Profile } from "@/lib/ace-data";

const items=[
  {href:"/",label:"Home",key:"home",icon:House},
  {href:"/search",label:"Search library",key:"search",icon:Search},
  {href:"/upload",label:"Share material",key:"upload",icon:FilePlus2},
  {href:"/my-uploads",label:"My uploads",key:"uploads",icon:Files},
  {href:"/profile",label:"Profile",key:"profile",icon:UserRound}
];

export function Brand(){return <Link className="brand" href="/" aria-label="Ace Student home"><span className="brand-mark">A</span><span><span className="brand-name">Ace Student</span><span className="brand-caption">Learn together</span></span></Link>}

export function AppShell({active,user,profile,children}:{active:string;user:User|null;profile?:Profile|null;children:React.ReactNode}){
  const name=profile?.full_name||user?.user_metadata?.full_name||user?.email?.split("@")[0]||"Student";
  return <div className="app-frame">
    <aside className="sidebar"><Brand/><div className="nav-section">Workspace</div>
      <nav className="nav-list" aria-label="Main navigation">{items.map(item=>{const Icon=item.icon;return <Link key={item.key} className={"nav-link"+(active===item.key?" active":"")} href={item.href}><Icon aria-hidden="true"/><span>{item.label}</span></Link>})}</nav>
      <div className="sidebar-footer"><strong>{user?name:"Your study space"}</strong><div className="sidebar-note">{user?"Your academic profile and shared materials.":"Sign in to save your profile and contribute materials."}</div>{!user&&<Link className="inline-link" href="/sign-in">Sign in to Ace Student</Link>}</div>
    </aside>
    <div className="app-main"><header className="topbar"><span className="topbar-label">Student learning community</span><div className="topbar-actions">
      <form className="topbar-search" action="/search"><Search aria-hidden="true"/><input name="q" aria-label="Search learning material" placeholder="Search notes, papers, courses…"/></form>
      <Link className="button button-primary" href="/upload"><FilePlus2/>Share material</Link>
      {user?<Link className="avatar" href="/profile" aria-label="Open profile">{name.slice(0,1).toUpperCase()}</Link>:<Link className="button button-secondary" href="/sign-in">Sign in</Link>}
    </div></header><main className="content">{children}</main>
      <nav className="mobile-nav" aria-label="Mobile navigation">{items.map(item=>{const Icon=item.icon;return <Link key={item.key} className={active===item.key?"active":""} href={item.href}><Icon/><span>{item.key==="upload"?"Upload":item.key==="uploads"?"My files":item.label.split(" ")[0]}</span></Link>})}</nav>
    </div>
  </div>
}

export function PageHeader({eyebrow,title,description,action}:{eyebrow?:string;title:string;description?:string;action?:React.ReactNode}){
 return <div className="page-heading"><div>{eyebrow&&<p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description&&<p className="page-description">{description}</p>}</div>{action}</div>
}

export function SetupNotice({issue,message}:{issue:string;message?:string}){
 if(issue==="ready")return null;
 const schema=issue==="schema-not-ready";
 return <div className="notice"><BookOpen aria-hidden="true"/><div><strong>{schema?"The new library schema is not installed yet":"Library connection needs attention"}</strong>{schema?"The additive Ace Student v1 migration is in this branch but has not been applied. Existing data and Storage files remain untouched.":message||"Check the Supabase environment settings before using the library."}</div></div>
}