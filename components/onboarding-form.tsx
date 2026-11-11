"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import type { Course, EducationLevel, School } from "@/lib/ace-data";
import { createClient } from "@/lib/supabase/client";

type OnboardingProps={
  schools:School[]; courses:Course[]; initialName:string;
  initialEducationLevel:EducationLevel; initialSchoolName:string;
  initialProgramme:string; initialYear:string; initialCourseIds:string[];
};

export function OnboardingForm({
  schools,courses,initialName,initialEducationLevel,initialSchoolName,
  initialProgramme,initialYear,initialCourseIds
}:OnboardingProps){
  const router=useRouter();
  const [level,setLevel]=useState<EducationLevel>(initialEducationLevel);
  const [name,setName]=useState(initialName);
  const [schoolName,setSchoolName]=useState(initialSchoolName);
  const [programme,setProgramme]=useState(initialProgramme);
  const [year,setYear]=useState(initialYear||(initialEducationLevel==="secondary"?"Form 1":"1"));
  const [selected,setSelected]=useState<string[]>(initialCourseIds);
  const [newCourse,setNewCourse]=useState("");
  const [newCourseCode,setNewCourseCode]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [note,setNote]=useState("");

  const availableSchools=useMemo(()=>schools.filter(s=>s.education_level===level),[schools,level]);
  const school=availableSchools.find(s=>s.name.toLowerCase()===schoolName.trim().toLowerCase());
  const schoolCourses=useMemo(()=>courses.filter(c=>c.school_id===school?.id&&c.education_level===level),[courses,school,level]);
  const programmeCourses=useMemo(()=>{
    if(level!=="university"||!programme.trim())return schoolCourses;
    const matches=schoolCourses.filter(c=>c.programme_name?.trim().toLowerCase()===programme.trim().toLowerCase());
    return matches.length?matches:schoolCourses;
  },[schoolCourses,programme,level]);
  const availableCourses=useMemo(()=>{
    const tag=level==="secondary"?year.toLowerCase():"year "+year;
    const matches=programmeCourses.filter(c=>!c.level_or_year||c.level_or_year.toLowerCase().includes(tag));
    return matches.length?matches:programmeCourses;
  },[programmeCourses,year,level]);

  function changeLevel(next:EducationLevel){
    setLevel(next);setSchoolName("");setProgramme("");setSelected([]);setNewCourse("");setNewCourseCode("");
    setYear(next==="secondary"?"Form 1":"1");
  }
  function toggleCourse(id:string){setSelected(old=>old.includes(id)?old.filter(item=>item!==id):[...old,id]);}

  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setError("");setNote("");
    if(!name.trim()||!schoolName.trim()){setError("Enter your name and choose or add your school.");return;}
    if(level==="university"&&!programme.trim()){setError("Enter your programme or course of study.");return;}
    if(selected.length===0&&!newCourse.trim()){setError("Choose at least one course or subject, or add one below.");return;}
    setBusy(true);
    const supabase=createClient();
    if(!supabase){setError("Supabase is not configured. Add the environment variables first.");setBusy(false);return;}
    const {data:{user},error:userError}=await supabase.auth.getUser();
    if(userError||!user){setError("Your session has expired. Sign in again.");setBusy(false);return;}

    let schoolId=school?.id;
    if(!schoolId){
      const {data:createdSchool,error:schoolError}=await supabase.from("ace_schools")
        .insert({name:schoolName.trim(),education_level:level,country:"Kenya",created_by:user.id})
        .select("id").single();
      if(schoolError){
        const {data:existing}=await supabase.from("ace_schools")
          .select("id").eq("education_level",level).eq("country","Kenya").ilike("name",schoolName.trim()).maybeSingle();
        if(!existing){setError(schoolError.message);setBusy(false);return;}
        schoolId=existing.id;
      }else schoolId=createdSchool.id;
    }

    const courseIds=[...selected];
    if(newCourse.trim()){
      const {data:createdCourse,error:courseError}=await supabase.from("ace_courses")
        .insert({
          school_id:schoolId,name:newCourse.trim(),
          code:level==="university"?newCourseCode.trim()||null:null,
          programme_name:level==="university"?programme.trim():null,
          education_level:level,level_or_year:level==="university"?"Year "+year:year,created_by:user.id
        }).select("id").single();
      if(courseError){
        const {data:existing}=await supabase.from("ace_courses")
          .select("id").eq("school_id",schoolId).eq("education_level",level).eq("level_or_year",level==="university"?"Year "+year:year).ilike("name",newCourse.trim()).maybeSingle();
        if(!existing){setError(courseError.message);setBusy(false);return;}
        courseIds.push(existing.id);
      }else courseIds.push(createdCourse.id);
    }

    const {error:profileError}=await supabase.from("ace_student_profiles").upsert({
      user_id:user.id,full_name:name.trim(),education_level:level,school_id:schoolId,
      grade_or_year:year,programme:level==="university"?programme.trim():null,
      onboarding_completed:true,updated_at:new Date().toISOString()
    },{onConflict:"user_id"});
    if(profileError){setError(profileError.message);setBusy(false);return;}

    const {error:clearLinksError}=await supabase.from("ace_student_courses").delete().eq("user_id",user.id);
    if(clearLinksError){setError(clearLinksError.message);setBusy(false);return;}
    const rows=courseIds.map(course_id=>({user_id:user.id,course_id}));
    const {error:linkError}=await supabase.from("ace_student_courses").upsert(rows,{onConflict:"user_id,course_id"});
    if(linkError){setError(linkError.message);setBusy(false);return;}
    setNote("Your academic profile is saved.");
    router.replace("/");router.refresh();
  }

  return <form className="form-card form-grid" onSubmit={submit}>
    <div className="form-field"><label htmlFor="full-name">Your name</label>
      <input id="full-name" value={name} onChange={e=>setName(e.target.value)} autoComplete="name" required maxLength={100}/>
    </div>
    <div className="form-field"><span className="field-label">Education level</span><div className="form-row">
      <label className="choice-card"><input type="radio" name="level" checked={level==="university"} onChange={()=>changeLevel("university")}/><span><strong>University / college</strong><span>Programme, year and course codes.</span></span></label>
      <label className="choice-card"><input type="radio" name="level" checked={level==="secondary"} onChange={()=>changeLevel("secondary")}/><span><strong>Secondary school</strong><span>Form, grade and multiple subjects.</span></span></label>
    </div></div>
    <div className="form-field"><label htmlFor="school">School</label>
      <input id="school" list="school-options" value={schoolName} onChange={e=>{setSchoolName(e.target.value);setSelected([]);}} placeholder="Search your school or type to add it" required/>
      <datalist id="school-options">{availableSchools.map(s=><option key={s.id} value={s.name}/>)}</datalist>
      <span className="form-help">{school?"School selected.":"If your school is not listed, enter its name. It will be added to the shared directory as self-reported."}</span>
    </div>
    {level==="university"&&<div className="form-field"><label htmlFor="programme">Programme / course of study</label>
      <input id="programme" value={programme} onChange={e=>{setProgramme(e.target.value);setSelected([]);}} placeholder="e.g. Bachelor of Business Administration" required maxLength={140}/>
    </div>}
    <div className="form-field"><label htmlFor="year">{level==="university"?"Year of study":"Form / grade"}</label>
      {level==="university"
        ?<select id="year" value={year} onChange={e=>{setYear(e.target.value);setSelected([]);}}>{["1","2","3","4","5","6"].map(n=><option key={n} value={n}>Year {n}</option>)}</select>
        :<select id="year" value={year} onChange={e=>{setYear(e.target.value);setSelected([]);}}>{["Form 1","Form 2","Form 3","Form 4"].map(n=><option key={n}>{n}</option>)}</select>}
    </div>
    <div className="form-field"><span className="field-label">{level==="university"?"Courses you take":"Subjects you study"}</span>
      {availableCourses.length>0
        ?<div className="checkbox-list">{availableCourses.map(c=><label className="checkbox-option" key={c.id}><input type="checkbox" checked={selected.includes(c.id)} onChange={()=>toggleCourse(c.id)}/>{c.code?c.code+" · ":""}{c.name}</label>)}</div>
        :<p className="form-help">No course list is available for this school and year yet. Add your first course or subject below.</p>}
      <input value={newCourse} onChange={e=>setNewCourse(e.target.value)} placeholder={level==="university"?"Add a course (e.g. Business Law)":"Add a subject (e.g. Mathematics)"} maxLength={140}/>
      {level==="university"&&<input value={newCourseCode} onChange={e=>setNewCourseCode(e.target.value)} placeholder="Course code (optional)" maxLength={30}/>}
      <span className="form-help">You can select more than one and add missing courses. This helps build the directory for other students.</span>
    </div>
    {error&&<p className="form-error" role="alert">{error}</p>}{note&&<p className="form-success" role="status">{note}</p>}
    <div className="form-actions"><span className="form-help">Your school affiliation is self-reported in this release.</span><button className="button button-primary" type="submit" disabled={busy}><GraduationCap/>{busy?"Saving profile…":"Save academic profile"}</button></div>
  </form>;
}