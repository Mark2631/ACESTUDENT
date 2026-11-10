import Link from "next/link";
import { BookOpen, FilePlus2 } from "lucide-react";

export function EmptyState({title="Nothing here yet",description="When students share useful material, it will appear here.",action}:{title?:string;description?:string;action?:{href:string;label:string}}){
 return <div className="empty-state"><div><div className="empty-icon"><BookOpen/></div><h2>{title}</h2><p>{description}</p>{action&&<Link className="button button-primary" href={action.href}><FilePlus2/>{action.label}</Link>}</div></div>
}