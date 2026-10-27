"use client";
import {useEffect,useMemo,useState} from "react";
import {ArrowUpRight,BookOpen,BookMarked,ChevronRight,ClipboardList,FileText,GraduationCap,Search,SlidersHorizontal} from "lucide-react";
import type {User} from "@supabase/supabase-js";
import {supabase} from "@/lib/supabase";
type Course={id:string,programme_id:string,code:string,title:string,year_of_study:number|null,semester:number|null};
type Resource={id:string,title:string,subject:string,kind:string,related_codes:string[]};
type Quiz={id:string,title:string,course_code:string,description:string|null};
type StudentMaterial={id:string,course_code:string};
export default function BusinessSchoolWorkspace({user,onCourse}:{user:User,onCourse:(code:string)=>void}){
 const[schoolName,setSchoolName]=useState("Business School"),[schoolSub,setSchoolSub]=useState("Bachelor of Business Administration"),[institutionName,setInstitutionName]=useState(""),[courses,setCourses]=useState<Course[]>([]),[resources,setResources]=useState<Resource[]>([]),[quizzes,setQuizzes]=useState<Quiz[]>([]),[attempts,setAttempts]=useState<{quiz_id:string}[]>([]),[year,setYear]=useState("all"),[search,setSearch]=useState(""),[loading,setLoading]=useState(true),[notice,setNotice]=useState(""),[myYear,setMyYear]=useState<number|null>(null);
 useEffect(()=>{if(!supabase){setNotice("The academic database is not connected.");setLoading(false);return}const db=supabase;let alive=true;
 async function load(){setLoading(true);setNotice("");
  const {data:institution,error:institutionError}=await db.from("ace_institutions").select("id,name,short_name").eq("short_name","MUST").maybeSingle();
  if(!alive)return;
  if(institutionError||!institution){setCourses([]);setNotice("Business School records are not available in the connected student database.");setLoading(false);return}
  const {data:programme,error:programmeError}=await db.from("ace_programmes").select("id,name,school").eq("institution_id",institution.id).eq("name","Bachelor of Business Administration").maybeSingle();
  if(!alive)return;
  if(programmeError||!programme){setInstitutionName(institution.name);setCourses([]);setNotice("The BBA programme has not been added to the academic catalogue.");setLoading(false);return}
  setInstitutionName(institution.name);setSchoolSub(programme.name);setSchoolName(programme.school||"Business School");
  const [courseResult,resourceResult,quizResult,attemptResult,profileResult,studentResult]=await Promise.all([
   db.from("ace_course_catalog").select("id,programme_id,code,title,year_of_study,semester").eq("programme_id",programme.id).order("year_of_study").order("semester").order("code"),
   db.from("ace_open_resources").select("id,title,subject,kind,related_codes").eq("hidden",false),
   db.from("ace_quizzes").select("id,title,course_code,description").eq("status","published"),
   db.from("ace_quiz_attempts").select("quiz_id").eq("user_id",user.id),
   db.from("ace_student_profiles").select("year_of_study").eq("user_id",user.id).maybeSingle(),
   db.from("ace_resources").select("id,course_code").eq("status","approved")
  ]);
  if(!alive)return;setCourses(courseResult.data??[]);setResources(resourceResult.data??[]);setStudentMaterials(studentResult.data??[]);setQuizzes(quizResult.data??[]);setAttempts(attemptResult.data??[]);setMyYear(profileResult.data?.year_of_study??null);
  if(courseResult.error)setNotice("Unable to load the curriculum. Please retry.");else if(resourceResult.error||quizResult.error||attemptResult.error||studentResult.error)setNotice("Some resource and progress counts are temporarily unavailable.");
  setLoading(false);
 }
 void load();return()=>{alive=false}
 },[user.id]);
 const normalizeCode=(code:string)=>code.replace(/\s+/g,"").toUpperCase();
 const rows=useMemo(()=>courses.filter(c=>(year==="all"||String(c.year_of_study)===year)&&[c.code,c.title,""].join(" ").toLowerCase().includes(search.trim().toLowerCase())).map(c=>{const rs=resources.filter(r=>(r.related_codes??[]).includes(c.code));const qs=quizzes.filter(q=>q.course_code.replace(/\s/g,"").toUpperCase()===c.code.replace(/\s/g,"").toUpperCase());return {...c,resourceCount:rs.length+studentMaterials.filter(r=>normalizeCode(r.course_code)===normalizeCode(c.code)).length,quizCount:qs.length,completed:qs.filter(q=>attempts.some(a=>a.quiz_id===q.id)).length}}),[courses,resources,studentMaterials,quizzes,attempts,year,search]);
 const summary={units:courses.length,resources:resources.filter(r=>courses.some(c=>(r.related_codes??[]).includes(c.code))).length+studentMaterials.filter(r=>courses.some(c=>normalizeCode(c.code)===normalizeCode(r.course_code))).length,quizzes:quizzes.filter(q=>courses.some(c=>c.code===q.course_code)).length,completed:attempts.filter(a=>quizzes.some(q=>q.id===a.quiz_id&&courses.some(c=>c.code===q.course_code))).length};
 const yearCounts=[1,2,3,4].map(y=>({year:y,count:courses.filter(c=>c.year_of_study===y).length}));
 return <section className="school-workspace">
  <div className="school-breadcrumb"><span>ACE STUDENT</span><ChevronRight size={14}/><span>BUSINESS SCHOOL</span><span className="workspace-status"><i/> Academic catalogue</span></div>
  <div className="school-heading"><div className="school-mark"><GraduationCap size={23}/></div><div className="school-heading-copy"><div className="eyebrow">ACADEMIC WORKSPACE</div><h1>{schoolName}</h1><p>{schoolSub}{institutionName?" · "+institutionName:""}</p></div></div>
  <div className="school-stats"><div className="school-stat"><span>Course units</span><strong>{loading?"—":summary.units}</strong><small>From the curriculum</small></div><div className="school-stat"><span>Learning resources</span><strong>{loading?"—":summary.resources}</strong><small>Publisher and course-linked</small></div><div className="school-stat"><span>Practice sets</span><strong>{loading?"—":summary.quizzes}</strong><small>Securely graded</small></div><div className="school-stat"><span>Completed</span><strong>{loading?"—":summary.completed}</strong><small>Your saved activity</small></div></div>
  <div className="school-section-head"><div><h2>Curriculum</h2><p>Browse course units, course materials and practice. Choose a unit to open its workspace.</p></div><span className="school-year-note">{myYear?"Your year: "+myYear:"4 academic years"}</span></div>
  <div className="school-toolbar"><div className="school-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filter by unit code or title" aria-label="Filter courses"/></div><div className="school-years" aria-label="Filter by academic year"><SlidersHorizontal size={15}/><button className={year==="all"?"active":""} onClick={()=>setYear("all")}>All <span>{courses.length}</span></button>{yearCounts.map(item=><button key={item.year} className={year===String(item.year)?"active":""} onClick={()=>setYear(String(item.year))}>Y{item.year}<span>{item.count}</span></button>)}</div></div>
  {!loading&&notice&&courses.length>0&&<div className="status" role="status">{notice}</div>}
  {loading?<div className="school-message"><span className="school-loader"/>Loading curriculum from Supabase…</div>:notice?<div className="school-message school-warning"><div><b>Business School data unavailable</b><p>{notice}</p></div></div>:rows.length===0?<div className="school-message"><BookOpen size={21}/><div><b>{year!=="all"&&courses.every(c=>String(c.year_of_study)!==year)?"Year "+year+" curriculum not mapped yet":"No matching course units"}</b><p>{year!=="all"&&courses.every(c=>String(c.year_of_study)!==year)?"Verified course records for this year have not been published yet.":"Try a different unit code or academic year."}</p></div></div>:<div className="course-table" role="table" aria-label="Business administration curriculum"><div className="course-table-head" role="row"><span>UNIT</span><span>YEAR / SEMESTER</span><span>RESOURCES</span><span>PRACTICE</span><span/></div>{rows.map(c=><button key={c.id} className="course-table-row" role="row" onClick={()=>onCourse(c.code)}><span className="course-unit-cell"><span className="course-code">{c.code.replace(/^([A-Z]+)\s*(\d{4})$/,"$1 $2")}</span><b>{c.title}</b></span><span className="course-term"><span>Year {c.year_of_study??"—"}</span><small>Semester {c.semester??"—"}</small></span><span className="course-count"><BookMarked size={15}/>{c.resourceCount}</span><span className="course-count"><ClipboardList size={15}/>{c.quizCount}{c.completed>0&&<small>{c.completed} done</small>}</span><span className="course-open"><ArrowUpRight size={16}/></span></button>)}</div>}
  <div className="school-footer"><span><FileText size={14}/> Course materials open in the selected unit.</span><span>Data is read from the academic catalogue.</span></div>
 </section>
}
