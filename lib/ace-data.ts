import { createClient } from "@/lib/supabase/server";

export type EducationLevel = "university" | "secondary";
export type DocumentKind = "note" | "past_paper" | "summary";
export type School = { id:string; name:string; education_level:EducationLevel; country:string };
export type Course = { id:string; school_id:string; name:string; code:string|null; programme_name:string|null; level_or_year:string|null; education_level:EducationLevel };
export type Profile = { user_id:string; full_name:string; education_level:EducationLevel|null; school_id:string|null; grade_or_year:string|null; programme:string|null; onboarding_completed:boolean; school_name?:string|null };
export type AppDocument = {
  id:string;title:string;description:string|null;document_type:DocumentKind;storage_path:string;
  mime_type:string;file_size:number;upvotes:number;downloads:number;created_at:string;uploader_id:string;
  course_id:string;course_name:string;course_code:string|null;school_name:string;uploader_name:string;
  status:"pending"|"approved"|"flagged";
};
export type DataResult<T> = {data:T;issue:"ready"|"missing-config"|"schema-not-ready"|"error";message?:string};

function isSchemaError(error:{code?:string;message?:string}|null) {
  if(!error)return false;
  return error.code==="42P01"||error.code==="PGRST205"||error.code==="PGRST204"||
    /could not find the table|relation .* does not exist/i.test(error.message??"");
}

export async function getProfile(userId:string):Promise<DataResult<Profile|null>> {
  const supabase=await createClient();
  if(!supabase)return {data:null,issue:"missing-config"};
  const {data,error}=await supabase.from("ace_student_profiles")
    .select("user_id,full_name,education_level,school_id,grade_or_year,programme,onboarding_completed")
    .eq("user_id",userId).maybeSingle();
  if(error)return {data:null,issue:isSchemaError(error)?"schema-not-ready":"error",message:error.message};
  if(!data)return {data:null,issue:"ready"};
  let schoolName:string|null=null;
  if(data.school_id){
    const {data:school}=await supabase.from("ace_schools").select("name").eq("id",data.school_id).maybeSingle();
    schoolName=school?.name??null;
  }
  return {data:{...data,education_level:data.education_level as EducationLevel|null,onboarding_completed:Boolean(data.onboarding_completed),school_name:schoolName},issue:"ready"};
}

export async function getCatalog():Promise<DataResult<{schools:School[];courses:Course[]}>> {
  const supabase=await createClient();
  if(!supabase)return {data:{schools:[],courses:[]},issue:"missing-config"};
  const [s,c]=await Promise.all([
    supabase.from("ace_schools").select("id,name,education_level,country").eq("status","approved").order("name"),
    supabase.from("ace_courses").select("id,school_id,name,code,programme_name,level_or_year,education_level").eq("status","approved").order("name")
  ]);
  const error=s.error??c.error;
  if(error)return {data:{schools:[],courses:[]},issue:isSchemaError(error)?"schema-not-ready":"error",message:error.message};
  return {data:{schools:(s.data??[]) as School[],courses:(c.data??[]) as Course[]},issue:"ready"};
}

export async function getMyCourseIds(userId:string):Promise<string[]> {
  const supabase=await createClient();
  if(!supabase)return [];
  const {data}=await supabase.from("ace_student_courses").select("course_id").eq("user_id",userId);
  return (data??[]).map((row)=>String(row.course_id));
}

export async function getDocuments(options?:{query?:string;type?:DocumentKind|"all";uploaderId?:string;limit?:number;courseIds?:string[]}):Promise<DataResult<AppDocument[]>> {
  const supabase=await createClient();
  if(!supabase)return {data:[],issue:"missing-config",message:"Connect the Supabase project to load the library."};
  let request=supabase.from("ace_documents")
    .select("id,title,description,document_type,storage_path,mime_type,file_size,upvotes,downloads,created_at,uploader_id,course_id,status")
    .order("created_at",{ascending:false}).limit(options?.limit??24);
  if(options?.uploaderId)request=request.eq("uploader_id",options.uploaderId);
  else request=request.eq("status","approved");
  if(options?.type&&options.type!=="all")request=request.eq("document_type",options.type);
  if(options?.courseIds){if(options.courseIds.length===0)return {data:[],issue:"ready"};request=request.in("course_id",options.courseIds);}
  const q=(options?.query??"").replace(/[(),%]/g," ").replace(/\\s+/g," ").trim().slice(0,80);
  if(q)request=request.or("title.ilike.%"+q+"%,description.ilike.%"+q+"%");
  const {data,error}=await request;
  if(error)return {data:[],issue:isSchemaError(error)?"schema-not-ready":"error",message:error.message};
  const rows=data??[];
  if(!rows.length)return {data:[],issue:"ready"};

  const courseIds=Array.from(new Set(rows.map(row=>String(row.course_id))));
  const uploaderIds=Array.from(new Set(rows.map(row=>String(row.uploader_id))));
  const [coursesResult,profilesResult]=await Promise.all([
    supabase.from("ace_courses").select("id,name,code,school_id").in("id",courseIds),
    supabase.from("ace_student_profiles").select("user_id,full_name").in("user_id",uploaderIds)
  ]);
  const courses=new Map((coursesResult.data??[]).map(row=>[String(row.id),row]));
  const schoolIds=Array.from(new Set(Array.from(courses.values()).map(row=>String(row.school_id))));
  const schoolsResult=schoolIds.length?await supabase.from("ace_schools").select("id,name").in("id",schoolIds):{data:[],error:null};
  const schools=new Map((schoolsResult.data??[]).map(row=>[String(row.id),String(row.name)]));
  const profiles=new Map((profilesResult.data??[]).map(row=>[String(row.user_id),String(row.full_name||"Student")]));
  const documents:AppDocument[]=rows.map(row=>{
    const course=courses.get(String(row.course_id));
    return {
      ...row,
      course_name:course?.name??"Course",
      course_code:course?.code??null,
      school_name:course?schools.get(String(course.school_id))??"School":"School",
      uploader_name:profiles.get(String(row.uploader_id))??"Student"
    } as AppDocument;
  });
  return {data:documents,issue:"ready"};
}

export async function getDocument(id:string):Promise<DataResult<{document:AppDocument;previewUrl:string}|null>> {
  const supabase=await createClient();
  if(!supabase)return {data:null,issue:"missing-config"};
  const {data:row,error}=await supabase.from("ace_documents")
    .select("id,title,description,document_type,storage_path,mime_type,file_size,upvotes,downloads,created_at,uploader_id,course_id,status")
    .eq("id",id).maybeSingle();
  if(error)return {data:null,issue:isSchemaError(error)?"schema-not-ready":"error",message:error.message};
  if(!row)return {data:null,issue:"ready"};
  const [courseResult,profileResult]=await Promise.all([
    supabase.from("ace_courses").select("id,name,code,school_id").eq("id",row.course_id).maybeSingle(),
    supabase.from("ace_student_profiles").select("full_name").eq("user_id",row.uploader_id).maybeSingle()
  ]);
  const schoolResult=courseResult.data?.school_id?await supabase.from("ace_schools").select("name").eq("id",courseResult.data.school_id).maybeSingle():{data:null,error:null};
  const document:AppDocument={...row,course_name:courseResult.data?.name??"Course",course_code:courseResult.data?.code??null,school_name:schoolResult.data?.name??"School",uploader_name:profileResult.data?.full_name??"Student"} as AppDocument;
  const {data:signed,error:signError}=await supabase.storage.from("ace-documents").createSignedUrl(document.storage_path,3600);
  if(signError||!signed?.signedUrl)return {data:null,issue:"error",message:signError?.message};
  return {data:{document,previewUrl:signed.signedUrl},issue:"ready"};
}