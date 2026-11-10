import Link from "next/link";
import { ArrowUp, CalendarDays, Download, FileText, GraduationCap } from "lucide-react";
import type { AppDocument } from "@/lib/ace-data";

function dateLabel(value:string){const date=new Date(value);return Number.isNaN(date.getTime())?"Recently":new Intl.DateTimeFormat("en",{day:"numeric",month:"short",year:"numeric"}).format(date)}
function kindLabel(kind:string){return kind==="past_paper"?"Past paper":kind==="summary"?"Summary":"Notes"}

export function DocumentCard({document}:{document:AppDocument}){
 return <article className="document-card"><div className="document-icon"><FileText aria-hidden="true"/></div><div className="document-main">
  <Link className="document-title" href={"/library/"+document.id}>{document.title}</Link>
  {document.description&&<p className="document-description">{document.description}</p>}
  <div className="document-meta"><span className="document-kind">{kindLabel(document.document_type)}</span><span><GraduationCap/>{document.course_code?document.course_code+" · ":""}{document.course_name}</span><span><CalendarDays/>{dateLabel(document.created_at)}</span><span>By {document.uploader_name}</span></div>
 </div><div className="document-counts" aria-label="Document activity"><span title="Helpful votes"><ArrowUp aria-hidden="true"/>{document.upvotes}</span><span title="Downloads"><Download aria-hidden="true"/>{document.downloads}</span></div></article>;
}