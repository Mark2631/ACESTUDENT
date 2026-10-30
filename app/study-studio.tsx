"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {supabase} from "@/lib/supabase";
import {deleteStudyAudio,formatAudioDuration,getStudyAudio,listStudyAudio,saveStudyAudio,type AudioNoteMeta} from "./study-studio-audio";
import {getFSRSSchedulePreview,getRetrievability,isPersistedFSRSCard,scheduleFSRSReview,type PersistedFSRSCard} from "./study-studio-fsrs";
import type {User} from "@supabase/supabase-js";
import {ArrowLeft,ArrowRight,BookOpen,Bold,Brain,CalendarDays,CheckCircle2,ChevronLeft,ChevronRight,Clock3,Download,FileText,GitBranch,Heading1,Headphones,Layers,List,Mic,MicOff,Pause,Play,Plus,Quote,RotateCcw,Save,Search,Shuffle,Target,Trash2,Users,Volume2,VolumeX,X} from "lucide-react";
type Card={id:string;front:string;back:string;next:number;interval:number;ease:number;reviews:number;lastGrade?:number;lastReviewed?:number;lapses?:number;memory?:PersistedFSRSCard};
type Highlight={id:string;quote:string;note:string;page:string;created:number};
type StudySource={id:string;name:string;format:string;characters:number;pages:number|null;addedAt:number};
type Notebook={id:string;title:string;courseCode?:string|null;subjectSlug?:string|null;tags?:string[];source:string;sources?:StudySource[];cards:Card[];highlights?:Highlight[];created:number;updated:number;minutes:number;attempts:number;correct:number};
function isStudySourceRecord(value:unknown):value is StudySource{if(!value||typeof value!=="object")return false;const source=value as Partial<StudySource>;return typeof source.id==="string"&&typeof source.name==="string"&&typeof source.format==="string"&&typeof source.characters==="number"&&Number.isFinite(source.characters)&&source.characters>=0&&(source.pages===null||typeof source.pages==="number"&&Number.isFinite(source.pages))&&typeof source.addedAt==="number"&&Number.isFinite(source.addedAt)}
function sanitizeNotebook(value:unknown):Notebook|null{
 if(!value||typeof value!=="object")return null;const n=value as Partial<Notebook>;
 if(typeof n.id!=="string"||typeof n.title!=="string"||n.title.trim().length<1||typeof n.source!=="string"||n.source.length>1_900_000||!Array.isArray(n.cards)||n.cards.length>250)return null;
 const cards=n.cards.filter(isCardRecord);const attempts=Number.isFinite(n.attempts)?Math.max(0,Math.floor(n.attempts!)):0;
 return {id:n.id,title:n.title.slice(0,110),courseCode:typeof n.courseCode==="string"?n.courseCode.slice(0,40):null,subjectSlug:typeof n.subjectSlug==="string"?n.subjectSlug:null,tags:Array.isArray(n.tags)?n.tags.filter((tag:unknown):tag is string=>typeof tag==="string").slice(0,12):[],source:n.source,cards,highlights:Array.isArray(n.highlights)?n.highlights.filter(isHighlightRecord).slice(0,200):[],sources:Array.isArray(n.sources)?n.sources.filter(isStudySourceRecord).slice(0,100):[],created:Number.isFinite(n.created)?n.created!:Date.now(),updated:Number.isFinite(n.updated)?n.updated!:Date.now(),minutes:Number.isFinite(n.minutes)?Math.max(0,Math.floor(n.minutes!)):0,attempts,correct:Number.isFinite(n.correct)?Math.min(attempts,Math.max(0,Math.floor(n.correct!))):0};
}
function isHighlightRecord(value:unknown):value is Highlight{if(!value||typeof value!=="object")return false;const h=value as Partial<Highlight>;return typeof h.id==="string"&&h.id.length<=80&&typeof h.quote==="string"&&h.quote.length<=2000&&typeof h.note==="string"&&h.note.length<=1000&&typeof h.page==="string"&&h.page.length<=40&&typeof h.created==="number"&&Number.isFinite(h.created)}
function isCardRecord(value:unknown):value is Card{
 if(!value||typeof value!=="object")return false;
 const card=value as Partial<Card>;
 return typeof card.id==="string"&&card.id.length<=80&&typeof card.front==="string"&&card.front.length<=2000&&typeof card.back==="string"&&card.back.length<=5000&&Number.isFinite(card.next)&&Number.isFinite(card.interval)&&Number.isFinite(card.ease)&&typeof card.reviews==="number"&&Number.isInteger(card.reviews)&&card.reviews>=0&&(card.lastGrade===undefined||(typeof card.lastGrade==="number"&&Number.isInteger(card.lastGrade)&&card.lastGrade>=0&&card.lastGrade<=3))&&(card.lastReviewed===undefined||(typeof card.lastReviewed==="number"&&Number.isFinite(card.lastReviewed)))&&(card.lapses===undefined||(typeof card.lapses==="number"&&Number.isInteger(card.lapses)&&card.lapses>=0))&&(card.memory===undefined||isPersistedFSRSCard(card.memory));
}

type Mode="read"|"guide"|"ask"|"map"|"cards"|"quiz"|"listen";
type StudySessionRow={started_at:string;duration_seconds:number;mode:string};
type CloudNotebookRow={id:string;title:string;course_code:string|null;subject_slug:string|null;source:string;sources:unknown;cards:unknown;highlights:unknown;tags:unknown;attempts:number;correct:number;minutes:number;created_at:string;updated_at:string};
const STORAGE="ace-studio-notebooks-v1";
const SEED=`Opportunity cost: The value of the next best alternative given up when making a choice.
Active recall: Retrieving an answer from memory before checking the source.
Spaced repetition: Reviewing information at increasing intervals based on how well it is remembered.
Marginal analysis: Comparing the additional benefits and costs of a decision.
Critical thinking: Evaluating evidence, assumptions, and alternative explanations before drawing a conclusion.
SMART goals: Goals that are specific, measurable, achievable, relevant, and time-bound.`;
function removeSourceBlock(text:string,source:StudySource):{source:string;removed:boolean}{
 const blocks=text.split(/(?=^SOURCE:\s*.+$)/im);let removed=false;
 const kept=blocks.filter(block=>{
  const header=block.match(/^SOURCE:\s*(.+)$/im)?.[1]?.trim();if(!header)return true;
  const id=header.match(/\[ACE_SOURCE_ID=([^\]]+)\]/i)?.[1];
  if(id){if(id===source.id){removed=true;return false}return true}
  if(!removed&&header===source.name){removed=true;return false}
  return true;
 });
 const result=kept.join("").replace(/^\s+|\s+$/g,"");
 return {source:result,removed};
}
function safeSourceName(name:string){return name.replace(/[\r\n\t\0-\x1f\x7f]/g," ").replace(/[\\/:*?"<>|]/g,"_").trim().slice(0,180)||"Study source"}
function parseDelimitedRow(line:string,delimiter:string):string[]{
 const values:string[]=[];let value="";let quoted=false;
 for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){value+='"';i++}else quoted=!quoted}else if(ch===delimiter&&!quoted){values.push(value.trim());value=""}else value+=ch}
 values.push(value.trim());return values
}
function parseCards(text:string):Card[]{
 const lines=text.split(/\r?\n/).map(x=>x.replace(/^\uFEFF/,"").trim()).filter(Boolean).filter(x=>!/^SOURCE:\s*/i.test(x));const seen=new Set<string>();const explicit:Card[]=[];
 const header=lines[0]?.match(/^(front|question|term|prompt)\s*([,;\t])\s*(back|answer|definition)$/i);
 if(header){
  for(const line of lines.slice(1)){const fields=parseDelimitedRow(line,header[2]);const front=fields[0]??"",back=fields.slice(1).join(" · ");if(front.length<2||back.length<4||seen.has(front.toLowerCase()))continue;seen.add(front.toLowerCase());explicit.push({id:crypto.randomUUID(),front,back,next:0,interval:0,ease:2.5,reviews:0})}
  if(explicit.length)return explicit.slice(0,250);
 }
 for(const line of lines){const match=line.match(/^(.{2,100}?)\s*(?:[:：]\s*|\s+[—–]\s+|\s*\|\s*|\s*->\s*)(.{4,})$/);if(!match)continue;const front=match[1].replace(/^[*\-\d.)\s]+/,"").trim();const back=match[2].trim();if(front.length<2||back.length<4||seen.has(front.toLowerCase()))continue;seen.add(front.toLowerCase());explicit.push({id:crypto.randomUUID(),front,back,next:0,interval:0,ease:2.5,reviews:0})}
 if(explicit.length)return explicit.slice(0,250);
 const statements=text.replace(/^PAGE\s+\d+\s*$/gim,"").split(/(?<=[.!?])\s+|\n+/).map(x=>x.replace(/^[*•\-\d.)\s]+/,"").trim()).filter(x=>x.length>=70&&x.length<=1000);
 const cards:Card[]=[];
 for(const sentence of statements){const words=sentence.split(/\s+/);if(words.length<12)continue;const split=Math.min(words.length-4,Math.max(5,Math.round(words.length*.58)));const front="Complete the statement: "+words.slice(0,split).join(" ")+" …";const back=words.slice(split).join(" ");const key=front.toLowerCase();if(seen.has(key)||back.length<15)continue;seen.add(key);cards.push({id:crypto.randomUUID(),front,back,next:0,interval:0,ease:2.5,reviews:0});if(cards.length>=80)break}
 return cards
}
type GuideSection={title:string;summary:string;sourceStart:number;sourceLength:number;level:number};
type StudyGuide={overview:string;sections:GuideSection[];keyPoints:string[];terms:Card[]};
function buildStudyGuide(source:string):StudyGuide{
 const clean=(value:string)=>value.replace(/^SOURCE:\s*.+$/gim,"").replace(/^(?:PAGE|SLIDE)\s+\d+\s*$/gim,"").replace(/^#{1,4}\s*/gm,"").replace(/\s+/g," ").trim();
 const paragraphs=clean(source).split(/\n{2,}|(?<=[.!?])\s+(?=[A-Z])/).map(x=>x.trim()).filter(x=>x.length>=45);
 const sections:GuideSection[]=[];
 const headingPattern=/^(#{1,4})\s+(.+?)\s*#*\s*$|^(CHAPTER|UNIT|MODULE|SECTION)\s+[\w.-]+[:.\s-]*(.{2,100})$/i;
 const lines=source.split("\n");let offset=0;
 const headings:{title:string;level:number;lineEnd:number;start:number}[]=[];
 for(const line of lines){
  const match=line.trim().match(headingPattern);
  if(match){
   const markdown=Boolean(match[1]);
   headings.push({title:(markdown?match[2]:(match[3]+" "+match[4])).trim(),level:markdown?match[1].length:1,lineEnd:offset+line.length+1,start:offset});
  }
  offset+=line.length+1;
 }
 for(let i=0;i<headings.length&&sections.length<12;i++){
  const current=headings[i];
  let end=source.length;
  for(let j=i+1;j<headings.length;j++){if(headings[j].level<=current.level){end=headings[j].start;break}}
  const raw=source.slice(current.lineEnd,end);
  const summary=clean(raw).slice(0,520);
  if(summary.length<35)continue;
  sections.push({title:current.title,summary,sourceStart:current.lineEnd,sourceLength:Math.max(0,end-current.lineEnd),level:current.level});
 }
 if(!sections.length){
  const sourceBlocks=source.split(/(?=^SOURCE:\s*.+$)/im);
  let globalOffset=0;
  for(const sourceBlock of sourceBlocks){
   if(sections.length>=12)break;
   const sourceName=(sourceBlock.match(/^SOURCE:\s*(.+)$/im)?.[1]?.trim()||"Study notes").replace(/\s*\[ACE_SOURCE_ID=[^\]]+\]\s*$/i,"");
   const pageBlocks=sourceBlock.split(/(?=^(?:PAGE|SLIDE)\s+\d+\s*$)/im).filter(x=>x.trim());
   let blockOffset=globalOffset;
   for(const block of pageBlocks){
    if(sections.length>=12)break;
    const marker=block.match(/^(PAGE|SLIDE)\s+(\d+)/im);
    const label=marker?(marker[1].toUpperCase()==="SLIDE"?"Slide ":"Page ")+marker[2]:"Overview";
    const raw=block.replace(/^SOURCE:\s*.+$/im,"").replace(/^(?:PAGE|SLIDE)\s+\d+\s*$/im,"");
    const summary=clean(raw).slice(0,520);
    const markerLength=block.length-raw.length;
    if(summary.length>45)sections.push({title:sourceName+" · "+label,summary,sourceStart:blockOffset+markerLength,sourceLength:raw.length,level:1});
    blockOffset+=block.length;
   }
   globalOffset+=sourceBlock.length;
  }
 }
 if(!sections.length){
  let cursor=0;
  for(let i=0;i<paragraphs.length&&sections.length<10;i++){
   const start=source.indexOf(paragraphs[i],cursor);const found=start>=0?start:Math.max(0,cursor);
   const sentences=paragraphs[i].match(/[^.!?]+[.!?]?/g)??[paragraphs[i]];
   sections.push({title:"Key idea "+(i+1),summary:sentences.slice(0,2).join(" ").slice(0,500),sourceStart:found,sourceLength:paragraphs[i].length,level:1});
   cursor=found+paragraphs[i].length;
  }
 }
 const keyPoints=[...new Set(paragraphs.map(p=>(p.match(/[^.!?]+[.!?]?/)??[p])[0].trim()).filter(x=>x.length>=35&&x.length<=300))].slice(0,12);
 const terms=parseCards(source).slice(0,16);
 return {overview:keyPoints.slice(0,3).join(" ")||"Add more source material to build an outline.",sections,keyPoints,terms}
}
type Evidence={source:string;page:string;excerpt:string;score:number};
function findEvidence(source:string,question:string):Evidence[]{
 const stop=new Set(["what","when","where","which","who","whom","whose","this","that","with","from","into","about","does","have","been","were","will","would","could","should","there","their","they","them","your","yours","how","why","the","and","for","are","was","has","had","not","but","can","its","you","our","use","used","using","than","then","also","some","any","all","much","many","more","most","such"]);
 const tokenize=(value:string)=>value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").match(/[\p{L}\p{N}]{2,}/gu)??[];
 const terms=[...new Set(tokenize(question).filter(term=>term.length>2&&!stop.has(term)))];
 if(!terms.length)return [];
 const documents:{source:string;page:string;excerpt:string;tokens:string[];frequencies:Map<string,number>}[]=[];
 const sources=source.split(/(?=^SOURCE:\s*.+$)/im);
 for(const sourceBlock of sources){
  const sourceName=sourceBlock.match(/^SOURCE:\s*(.+)$/im)?.[1]?.trim()||"Notebook";
  const pageBlocks=sourceBlock.split(/(?=^PAGE\s+\d+\s*$)/im);
  for(const block of pageBlocks){
   const pageMatch=block.match(/^(PAGE|SLIDE)\s+(\d+)/im);const page=pageMatch?(pageMatch[1].toUpperCase()==="SLIDE"?"Slide ":"Page ")+pageMatch[2]:"Source text";
   const cleaned=block.replace(/^SOURCE:\s*.+$/im,"").replace(/^(?:PAGE|SLIDE)\s+\d+\s*$/im,"");
   const sentences=cleaned.split(/(?<=[.!?])\s+|\n{2,}/).map(x=>x.replace(/\s+/g," ").trim()).filter(x=>x.length>=25);
   let chunk="";
   const push=(excerpt:string)=>{const tokens=tokenize(excerpt);if(!tokens.length)return;const frequencies=new Map<string,number>();for(const token of tokens)frequencies.set(token,(frequencies.get(token)??0)+1);documents.push({source:sourceName,page,excerpt:excerpt.slice(0,720),tokens,frequencies})};
   for(const sentence of sentences){
    if(sentence.length>720){if(chunk){push(chunk);chunk=""}for(let offset=0;offset<sentence.length;offset+=620)push(sentence.slice(offset,offset+620));continue}
    if(chunk&&chunk.length+sentence.length>620){push(chunk);chunk=sentence}else chunk=chunk?chunk+" "+sentence:sentence
   }
   if(chunk)push(chunk)
  }
 }
 const total=documents.length;if(!total)return [];
 const documentFrequency=new Map<string,number>();
 for(const doc of documents)for(const term of new Set(doc.tokens))documentFrequency.set(term,(documentFrequency.get(term)??0)+1);
 const averageLength=documents.reduce((sum,doc)=>sum+doc.tokens.length,0)/total||1;
 const exactPhrase=question.toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim();
 const ranked=documents.map(doc=>{
  const length=doc.tokens.length;let score=0;let matched=0;
  for(const term of terms){
   const tf=doc.frequencies.get(term)??0;if(!tf)continue;matched++;
   const df=documentFrequency.get(term)??0;
   const inverse=Math.log(1+(total-df+0.5)/(df+0.5));
   const k1=1.2,b=0.75;
   score+=inverse*(tf*(k1+1))/(tf+k1*(1-b+b*length/averageLength));
  }
  if(!matched)return null;
  if(exactPhrase.length>5&&doc.excerpt.toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").includes(exactPhrase))score+=2.2;
  const coverage=matched/terms.length;
  score+=coverage*0.35;
  return {...doc,score,normalizedScore:score/(score+2.5)}
 }).filter((doc):doc is NonNullable<typeof doc>=>doc!==null);
 const seen=new Set<string>();
 return ranked.sort((a,b)=>b.score-a.score).filter(doc=>{const key=doc.source+"::"+doc.page+"::"+doc.excerpt.slice(0,90);if(seen.has(key))return false;seen.add(key);return true}).slice(0,5).map(doc=>({source:doc.source,page:doc.page,excerpt:doc.excerpt,score:doc.normalizedScore}))
}
function formatDay(n:number){return new Date(n).toLocaleDateString(undefined,{month:"short",day:"numeric"})}
function formatReviewDelay(dueAt:number,now=Date.now()){
 const remaining=Math.max(0,dueAt-now);
 if(remaining<60_000)return "<1 min";
 if(remaining<60*60_000)return Math.max(1,Math.round(remaining/60_000))+" min";
 if(remaining<24*60*60_000)return Math.max(1,Math.round(remaining/(60*60_000)))+" hr";
 return Math.max(1,Math.round(remaining/(24*60*60_000)))+" d";
}
const createNotebook=(title:string,source:string,courseCode:string,subjectSlug:string,tags:string[],sources:StudySource[]=[]):Notebook=>({id:crypto.randomUUID(),title,courseCode:courseCode.trim().toUpperCase()||null,subjectSlug:subjectSlug||null,tags,source,sources,cards:parseCards(source),highlights:[],created:Date.now(),updated:Date.now(),minutes:0,attempts:0,correct:0});
type MixedCard=Card&{notebookId:string;notebookTitle:string;courseCode:string|null};
function InterleavedPractice({cards,onExit,onResult}:{cards:MixedCard[];onExit:()=>void;onResult:(card:MixedCard,correct:boolean)=>void}){
 const [index,setIndex]=useState(0),[selected,setSelected]=useState<number|null>(null),[score,setScore]=useState(0),[finished,setFinished]=useState(false);
 const current=cards[index];
 const options=useMemo(()=>{
  if(!current)return[];
  const other=[...new Set(cards.filter(c=>c.id!==current.id&&c.back!==current.back).map(c=>c.back))];
  const seed=current.front.split("").reduce((sum,char)=>sum+char.charCodeAt(0),0);
  const distractors=other.sort((a,b)=>((a.length*13+seed)%97)-((b.length*13+seed)%97)).slice(0,3);
  return [current.back,...distractors].sort((a,b)=>((a.length*11+seed)%17)-((b.length*17+seed)%17))
 },[cards,current]);
 function choose(choice:number){if(selected!==null||finished||!current)return;const correct=options[choice]===current.back;setSelected(choice);onResult(current,correct);if(correct)setScore(v=>v+1)}
 function next(){if(index>=cards.length-1){setFinished(true);return}setIndex(v=>v+1);setSelected(null)}
 return <div className="studio-interleaved"><div className="studio-interleaved-header"><button className="studio-icon-button" onClick={onExit} aria-label="Exit mixed practice"><ChevronLeft size={16}/></button><div><span className="studio-overline">INTERLEAVED PRACTICE</span><h2>Think across your subjects</h2><p>Questions alternate between your notebooks to help you distinguish related ideas.</p></div><span className="studio-counter">{Math.min(index+1,cards.length)} / {cards.length}</span></div>{finished?<div className="studio-interleaved-finish"><div className="studio-audio-emblem"><CheckCircle2 size={29}/></div><span className="studio-overline">SESSION COMPLETE</span><h3>{score} of {cards.length} correct</h3><p>You practised across {new Set(cards.map(c=>c.notebookId)).size} notebooks. Revisit missed answers in each notebook's daily review.</p><button className="studio-action" onClick={onExit}>Return to Study Studio <ArrowRight size={14}/></button></div>:current?<><div className="studio-review-progress"><span>{new Set(cards.slice(0,index+1).map(c=>c.notebookId)).size} notebooks visited</span><strong>{score} correct so far</strong></div><div className="studio-quiz-progress"><span style={{width:((index+1)/cards.length*100)+"%"}}/></div><div className="studio-global-source"><span>{current.notebookTitle}</span><small>{current.courseCode||"Personal notebook"}</small></div><div className="studio-question"><span className="studio-overline">CHOOSE THE BEST ANSWER</span><h3>{current.front}</h3></div><div className="studio-answer-list">{options.map((option,i)=>{const correct=option===current.back;return <button key={i} aria-label={option} className={selected===null?"":correct?"correct":selected===i?"wrong":""} disabled={selected!==null} onClick={()=>choose(i)}><span>{String.fromCharCode(65+i)}</span><strong>{option}</strong>{selected!==null&&correct&&<CheckCircle2 size={17}/>}</button>})}</div>{selected!==null&&<div className="studio-feedback" role="status"><strong>{options[selected]===current.back?"Correct. Keep going.":"Not quite. Add this to your next review."}</strong><p>{current.back}</p><button className="studio-action" onClick={next}>{index===cards.length-1?"Finish session":"Next question"} <ArrowRight size={14}/></button></div>}</>:<div className="studio-empty"><p>No questions available in this session.</p><button onClick={onExit}>Return to Studio</button></div>}</div>
}
export default function StudyStudio({user,reviewImport,onReviewImported,initialCourseCode="",initialCourseTitle="",onLibrary,onUpload,onSharedNotes,onPractice,onPlanner}:{user:User|null;reviewImport?:{id:string;title:string;source:string;courseCode:string}|null;onReviewImported?:()=>void;initialCourseCode?:string;initialCourseTitle?:string;onLibrary:()=>void;onUpload:()=>void;onSharedNotes:()=>void;onPractice:()=>void;onPlanner:()=>void}){
const [notebooks,setNotebooks]=useState<Notebook[]>([]),[selected,setSelected]=useState(""),[mode,setMode]=useState<Mode>("read"),[ready,setReady]=useState(false),[cloudReady,setCloudReady]=useState(false),[syncStatus,setSyncStatus]=useState<"local"|"syncing"|"synced"|"error">("local"),[create,setCreate]=useState(false),[title,setTitle]=useState(""),[courseCode,setCourseCode]=useState(""),[subjectSlug,setSubjectSlug]=useState(""),[subjectOptions,setSubjectOptions]=useState<{slug:string;title:string}[]>([]),[tagInput,setTagInput]=useState(""),[source,setSource]=useState(""),[sourceFiles,setSourceFiles]=useState<StudySource[]>([]),[query,setQuery]=useState(""),[askQuery,setAskQuery]=useState(""),[askResults,setAskResults]=useState<Evidence[]>([]),[askSearched,setAskSearched]=useState(false),[flipped,setFlipped]=useState(false),[cardIndex,setCardIndex]=useState(0),[quizIndex,setQuizIndex]=useState(0),[answered,setAnswered]=useState<number|null>(null),[quizFormat,setQuizFormat]=useState<"choice"|"truefalse"|"written">("choice"),[quizCorrect,setQuizCorrect]=useState<boolean|null>(null),[writtenAnswer,setWrittenAnswer]=useState(""),[writtenRevealed,setWrittenRevealed]=useState(false),[listening,setListening]=useState(false),[speechPaused,setSpeechPaused]=useState(false),[audioProgress,setAudioProgress]=useState({current:0,total:0}),[audioMode,setAudioMode]=useState<"overview"|"source">("overview"),[voices,setVoices]=useState<SpeechSynthesisVoice[]>([]),[voiceURI,setVoiceURI]=useState(""),[voiceRate,setVoiceRate]=useState(1),[focus,setFocus]=useState(false),[seconds,setSeconds]=useState(25*60),[running,setRunning]=useState(false),[notice,setNotice]=useState(""),[audioSupported,setAudioSupported]=useState(false),[recording,setRecording]=useState(false),[recordedAudio,setRecordedAudio]=useState<string|null>(null),[savedAudioNotes,setSavedAudioNotes]=useState<AudioNoteMeta[]>([]),[activeAudioNoteId,setActiveAudioNoteId]=useState(""),[reviewAll,setReviewAll]=useState(false),[interleavedPractice,setInterleavedPractice]=useState(false),[reviewedInSession,setReviewedInSession]=useState(0),[mapNode,setMapNode]=useState<number|null>(null),[guestImportAvailable,setGuestImportAvailable]=useState(false),[guestImportCount,setGuestImportCount]=useState(0),[claimGuest,setClaimGuest]=useState(false),[syncRetry,setSyncRetry]=useState(0),[deletedIds,setDeletedIds]=useState<string[]>([]),[weeklySessions,setWeeklySessions]=useState<StudySessionRow[]>([]),[weeklyGoal,setWeeklyGoal]=useState(180),[selection,setSelection]=useState<{quote:string;page:string}|null>(null),[highlightNote,setHighlightNote]=useState("");
const fileRef=useRef<HTMLInputElement>(null);const sourceTextareaRef=useRef<HTMLTextAreaElement>(null);const timerRef=useRef<number|null>(null);const listeningRef=useRef(false);const recorderRef=useRef<MediaRecorder|null>(null);const streamRef=useRef<MediaStream|null>(null);const recordingNotebookRef=useRef<{id:string;title:string;startedAt:number}|null>(null);const notebooksRef=useRef<Notebook[]>([]);const loadedStorageKeyRef=useRef<string|null>(null);const focusStartedRef=useRef<number|null>(null);const importedResourceRef=useRef("");const storageKey=user?`${STORAGE}:${user.id}`:`${STORAGE}:guest`;const deletionKey=user?`ace-studio-deleted-v1:${user.id}`:"ace-studio-deleted-v1:guest";const goalStorageKey=`ace-study-goal-v1:${user?.id??"guest"}`;const sessionStorageKey=`ace-study-sessions-v1:${user?.id??"guest"}`;
useEffect(()=>{if(!supabase)return;let alive=true;void supabase.from("ace_learning_areas").select("slug,title").eq("kind","subject").eq("active",true).order("title").then(({data})=>{if(alive)setSubjectOptions(data??[])});return()=>{alive=false}},[]);
useEffect(()=>{setReady(false);setCloudReady(false);setSyncStatus("local");loadedStorageKeyRef.current=null;try{const removed=JSON.parse(localStorage.getItem(deletionKey)||"[]");setDeletedIds(Array.isArray(removed)?removed.filter((id):id is string=>typeof id==="string").slice(0,200):[])}catch{setDeletedIds([])}notebooksRef.current=[];setNotebooks([]);setSelected("");setSource("");setCreate(false);setReviewAll(false);setInterleavedPractice(false);stopSpeech();setRunning(false);focusStartedRef.current=null;try{let stored=localStorage.getItem(storageKey);let decoded:Notebook[]=[];if(stored){const parsed=JSON.parse(stored) as Notebook[];if(Array.isArray(parsed))decoded=parsed.map(sanitizeNotebook).filter((n):n is Notebook=>n!==null).slice(0,80)}else if(!user){stored=localStorage.getItem(STORAGE);if(stored){const parsed=JSON.parse(stored) as Notebook[];if(Array.isArray(parsed))decoded=parsed.map(sanitizeNotebook).filter((n):n is Notebook=>n!==null).slice(0,80)}}if(user&&!localStorage.getItem("ace-studio-guest-claimed:"+user.id)){const guest=localStorage.getItem(STORAGE+":guest");if(guest){const parsed=JSON.parse(guest) as Notebook[];if(Array.isArray(parsed)){setGuestImportCount(parsed.map(sanitizeNotebook).filter((n):n is Notebook=>n!==null).length);setGuestImportAvailable(parsed.length>0)}}}else{setGuestImportAvailable(false);setGuestImportCount(0)}notebooksRef.current=decoded;setNotebooks(decoded)}catch{notebooksRef.current=[];setNotebooks([])}setAudioSupported(typeof window!=="undefined"&&"speechSynthesis" in window);loadedStorageKeyRef.current=storageKey;setReady(true)},[storageKey,deletionKey]);
useEffect(()=>{if(!user)return;const retry=()=>setSyncRetry(n=>n+1);window.addEventListener("online",retry);return()=>window.removeEventListener("online",retry)},[user?.id]);
useEffect(()=>{notebooksRef.current=notebooks},[notebooks]);
useEffect(()=>{if(ready&&loadedStorageKeyRef.current===storageKey)try{localStorage.setItem(deletionKey,JSON.stringify(deletedIds.slice(-200)))}catch{}},[deletedIds,ready,storageKey,deletionKey]);
useEffect(()=>{if(ready&&loadedStorageKeyRef.current===storageKey)try{const serialized=JSON.stringify(notebooks);if(serialized.length>2_200_000){setNotice("This device is close to its offline storage limit. Export a backup or remove older notebooks before adding more.");return}localStorage.setItem(storageKey,serialized)}catch{setNotice("Local storage is full. Export your notes as a backup.")}},[notebooks,ready,storageKey]);
useEffect(()=>{if(!ready||loadedStorageKeyRef.current!==storageKey||!user||!supabase)return;let alive=true;setCloudReady(false);setSyncStatus("syncing");const client=supabase;void client.from("ace_study_notebooks").select("id,title,course_code,subject_slug,source,sources,cards,highlights,tags,attempts,correct,minutes,created_at,updated_at,version").eq("user_id",user.id).order("updated_at",{ascending:false}).limit(80).then(({data,error})=>{if(!alive)return;if(error){setSyncStatus("error");setNotice("Your notebooks are safe on this device. Cloud sync is temporarily unavailable.");return}const removed=new Set(deletedIds);const cloud=(data??[]).filter((raw:unknown)=>!removed.has(String((raw as {id?:unknown}).id??""))).map((raw:unknown)=>{const row=raw as CloudNotebookRow;return {id:String(row.id),title:String(row.title),courseCode:row.course_code??null,subjectSlug:row.subject_slug??null,tags:Array.isArray(row.tags)?row.tags.filter((tag:unknown):tag is string=>typeof tag==="string"):[],source:String(row.source??""),sources:Array.isArray(row.sources)?row.sources.filter(isStudySourceRecord):[],cards:Array.isArray(row.cards)?row.cards.filter(isCardRecord):[],highlights:Array.isArray(row.highlights)?row.highlights.filter(isHighlightRecord):[],created:Date.parse(row.created_at)||Date.now(),updated:Date.parse(row.updated_at)||Date.now(),minutes:Number(row.minutes)||0,attempts:Number(row.attempts)||0,correct:Number(row.correct)||0} as Notebook});const local=notebooksRef.current;const merged=new Map(cloud.map(n=>[n.id,n]));for(const n of local){const remote=merged.get(n.id);if(!remote||n.updated>remote.updated)merged.set(n.id,n)}setNotebooks([...merged.values()].sort((a,b)=>b.updated-a.updated).slice(0,80));setCloudReady(true);setSyncStatus("synced")});return()=>{alive=false}},[ready,user?.id,storageKey,syncRetry,deletedIds]);
useEffect(()=>{if(!ready||loadedStorageKeyRef.current!==storageKey||!user||!supabase||!cloudReady)return;const client=supabase;const timer=window.setTimeout(async()=>{setSyncStatus("syncing");const payload=notebooks.map(n=>({id:n.id,user_id:user.id,title:n.title,course_code:n.courseCode??null,subject_slug:n.subjectSlug??null,source:n.source,sources:n.sources??[],cards:n.cards,highlights:n.highlights??[],tags:n.tags??[],attempts:n.attempts,correct:n.correct,minutes:n.minutes,created_at:new Date(n.created||Date.now()).toISOString()}));if(deletedIds.length){const {error}=await client.from("ace_study_notebooks").delete().eq("user_id",user.id).in("id",deletedIds);if(error){setSyncStatus("error");setNotice("Notebook deletion is saved on this device and will retry when cloud sync is available.");return}}if(payload.length){const {error}=await client.from("ace_study_notebooks").upsert(payload,{onConflict:"id"});if(error){setSyncStatus("error");setNotice("Cloud sync paused. Your local copy remains available.");return}}if(deletedIds.length)setDeletedIds(current=>current.filter(id=>!deletedIds.includes(id)));if(claimGuest&&typeof window!=="undefined"){localStorage.removeItem(STORAGE+":guest");localStorage.setItem("ace-studio-guest-claimed:"+user.id,"true");setClaimGuest(false)}setSyncStatus("synced")},900);return()=>window.clearTimeout(timer)},[notebooks,ready,user?.id,cloudReady,claimGuest,deletedIds]);
useEffect(()=>{
 let alive=true;
 const since=new Date();since.setDate(since.getDate()-29);since.setHours(0,0,0,0);
 let local:StudySessionRow[]=[];
 try{const stored=JSON.parse(localStorage.getItem(sessionStorageKey)||"[]");if(Array.isArray(stored))local=stored.filter((row):row is StudySessionRow=>!!row&&typeof row.started_at==="string"&&Number.isFinite(row.duration_seconds)&&typeof row.mode==="string"&&new Date(row.started_at).getTime()>=since.getTime()).slice(-400)}catch{}
 setWeeklySessions(local);
 if(!user||!supabase)return()=>{alive=false};
 const client=supabase;
 void client.from("ace_individual_study_sessions").select("started_at,duration_seconds,mode").eq("user_id",user.id).gte("started_at",since.toISOString()).order("started_at").then(({data,error})=>{
  if(!alive)return;
  if(error){setWeeklySessions(local);return}
  const merged=new Map<string,StudySessionRow>();
  for(const row of local)merged.set(row.started_at+"|"+row.duration_seconds+"|"+row.mode,row);
  for(const row of (data??[]) as StudySessionRow[])merged.set(row.started_at+"|"+row.duration_seconds+"|"+row.mode,row);
  const all=[...merged.values()].sort((a,b)=>a.started_at.localeCompare(b.started_at)).slice(-400);
  setWeeklySessions(all);
  try{localStorage.setItem(sessionStorageKey,JSON.stringify(all))}catch{}
 });
 return()=>{alive=false}
},[user?.id,sessionStorageKey]);
useEffect(()=>{
 let alive=true;let stored=180;
 try{const raw=Number(localStorage.getItem(goalStorageKey));if(Number.isFinite(raw)&&raw>=30&&raw<=1200)stored=Math.round(raw)}catch{}
 setWeeklyGoal(stored);
 if(user&&supabase){void supabase.from("ace_study_preferences").select("weekly_goal_minutes").eq("user_id",user.id).maybeSingle().then(({data,error})=>{if(!alive||error||!data)return;const value=Number(data.weekly_goal_minutes);if(Number.isFinite(value)&&value>=30&&value<=1200){setWeeklyGoal(value);try{localStorage.setItem(goalStorageKey,String(value))}catch{}}})}
 return()=>{alive=false}
},[user?.id,goalStorageKey]);
useEffect(()=>{if(!running)return;timerRef.current=window.setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000);return()=>{if(timerRef.current)window.clearInterval(timerRef.current)}},[running]);
useEffect(()=>{if(!running)return;const saveOnPageHide=()=>persistFocusSegment();window.addEventListener("pagehide",saveOnPageHide);return()=>{window.removeEventListener("pagehide",saveOnPageHide);if(focusStartedRef.current)persistFocusSegment()}},[running,selected]);
useEffect(()=>{if(running&&seconds===0){persistFocusSegment();setRunning(false);setSeconds(25*60);setNotice("Focus session complete. Your study time was saved.");}},[running,seconds]);
useEffect(()=>{if(typeof window==="undefined"||!("speechSynthesis" in window))return;const synth=window.speechSynthesis;const load=()=>{const available=synth.getVoices();setVoices(available);setVoiceURI(current=>current||available.find(v=>v.lang.toLowerCase().startsWith("en"))?.voiceURI||available[0]?.voiceURI||"")};load();synth.addEventListener("voiceschanged",load);return()=>synth.removeEventListener("voiceschanged",load)},[]);
useEffect(()=>()=>{if(typeof window!=="undefined"&&"speechSynthesis" in window)window.speechSynthesis.cancel();if(recorderRef.current?.state==="recording")recorderRef.current.stop();streamRef.current?.getTracks().forEach(track=>track.stop())},[]);
useEffect(()=>{if(!storageReady||!reviewImport)return;setSelected("");setCreate(true);setTitle(reviewImport.title);setCourseCode(reviewImport.courseCode);setSource(reviewImport.source);setSourceFiles([]);setMode("read");setNotice("Quiz review is ready. Edit the explanations, then save this notebook to practise missed questions.");onReviewImported?.()},[storageReady,reviewImport?.id]);
useEffect(()=>{if(!ready||!supabase)return;const id=new URLSearchParams(window.location.search).get("importResource");if(!id||id===importedResourceRef.current)return;importedResourceRef.current=id;window.history.replaceState(null,"","/studio");void importApprovedResource(id)},[ready,user?.id]);
const notebook=notebooks.find(n=>n.id===selected)||null;
useEffect(()=>{if(selected){const picked=notebooks.find(n=>n.id===selected);if(picked)setSource(picked.source)}},[selected]);
useEffect(()=>{let alive=true;setSavedAudioNotes([]);setActiveAudioNoteId("");setRecordedAudio(old=>{if(old)URL.revokeObjectURL(old);return null});if(!selected)return;void listStudyAudio(selected).then(notes=>{if(alive)setSavedAudioNotes(notes)}).catch(()=>{if(alive)setNotice("Local audio notes could not be loaded on this browser.")});return()=>{alive=false}},[selected]);
useEffect(()=>()=>{if(recordedAudio)URL.revokeObjectURL(recordedAudio)},[recordedAudio]);
const due=useMemo(()=>notebook?.cards.filter(c=>c.next<=Date.now())??[],[notebook]);
const storageReady=ready&&loadedStorageKeyRef.current===storageKey;
const reviewQueue=useMemo(()=>notebooks.flatMap(n=>n.cards.filter(c=>c.next<=Date.now()).map(c=>({...c,notebookId:n.id,notebookTitle:n.title,courseCode:n.courseCode}))).sort((a,b)=>a.next-b.next),[notebooks]);
const interleavedDeck=useMemo(()=>{
 const grouped=new Map<string,MixedCard[]>();
 for(const n of notebooks){const cards=n.cards.map(card=>({...card,notebookId:n.id,notebookTitle:n.title,courseCode:n.courseCode??null})).sort((a,b)=>(a.next>Date.now()?1:0)-(b.next>Date.now()?1:0)||a.next-b.next);if(cards.length)grouped.set(n.id,cards)}
 const queues=[...grouped.values()];const result:MixedCard[]=[];
 while(queues.some(queue=>queue.length)&&result.length<60)for(const queue of queues){const next=queue.shift();if(next)result.push(next)}
 return result
},[notebooks]);
const activeCards=useMemo(()=>notebook?(due.length?due:notebook.cards):[],[notebook,due]);
const card=activeCards[Math.min(cardIndex,Math.max(activeCards.length-1,0))];
const cardRetention=useMemo(()=>card?.memory?getRetrievability(card.memory):null,[card]);
const cardSchedulePreview=useMemo(()=>card?getFSRSSchedulePreview(card.memory,{next:card.next,interval:card.interval,ease:card.ease,reviews:card.reviews,lapses:card.lapses,lastReviewed:card.lastReviewed}):null,[card]);
const globalCard=reviewQueue[0];
const globalRetention=useMemo(()=>globalCard?.memory?getRetrievability(globalCard.memory):null,[globalCard]);
const globalSchedulePreview=useMemo(()=>globalCard?getFSRSSchedulePreview(globalCard.memory,{next:globalCard.next,interval:globalCard.interval,ease:globalCard.ease,reviews:globalCard.reviews,lapses:globalCard.lapses,lastReviewed:globalCard.lastReviewed}):null,[globalCard]);
const quizCards=useMemo(()=>notebook?.cards??[],[notebook]);
const studyGuide=useMemo(()=>buildStudyGuide(notebook?.source??""),[notebook?.source]);
const mapItems=useMemo(()=>{
 const items:{kind:string;label:string;body:string;query:string}[]=[];
 studyGuide.keyPoints.slice(0,4).forEach((point,i)=>items.push({kind:"Key idea",label:point.split(/[.!?:;]/)[0].slice(0,58)||"Key idea "+(i+1),body:point,query:point.slice(0,150)}));
 studyGuide.terms.slice(0,6-items.length).forEach(term=>items.push({kind:"Term",label:term.front.slice(0,58),body:term.back,query:term.front+" "+term.back.slice(0,80)}));
 studyGuide.sections.slice(0,6-items.length).forEach(section=>items.push({kind:"Section",label:section.title,body:section.summary,query:section.summary.slice(0,120)}));
 return items.slice(0,6)
},[studyGuide]);
const currentQuiz=quizCards[Math.min(quizIndex,Math.max(quizCards.length-1,0))];
const options=useMemo(()=>{if(!currentQuiz)return[];const other=[...new Set(quizCards.filter(c=>c.id!==currentQuiz.id).map(c=>c.back).filter(x=>x!==currentQuiz.back))];const hash=currentQuiz.front.split("").reduce((n,c)=>n+c.charCodeAt(0),0);const picked=other.sort((a,b)=>((a.length*13+hash)%97)-((b.length*13+hash)%97)).slice(0,3);return [currentQuiz.back,...picked].sort((a,b)=>((a.length*11+hash)%17)-((b.length*17+hash)%17))},[quizCards,currentQuiz]);
const trueFalseClaim=useMemo(()=>{if(!currentQuiz)return null;const incorrect=quizCards.filter(c=>c.id!==currentQuiz.id&&c.back!==currentQuiz.back);const wrong=incorrect[(quizIndex+Math.floor(quizIndex/2))%Math.max(1,incorrect.length)];const isTrue=quizIndex%2===0||!wrong;return {text:isTrue?currentQuiz.back:wrong.back,isTrue}},[currentQuiz,quizCards,quizIndex]);
const quizOptionLabels=quizFormat==="truefalse"?["True","False"]:options;
function persistFocusSegment(){const start=focusStartedRef.current;if(!start)return;focusStartedRef.current=null;const seconds=Math.min(21600,Math.max(0,Math.floor((Date.now()-start)/1000)));if(seconds<20||!notebook)return;const startedAt=new Date(start).toISOString();const endedAt=new Date().toISOString();const existing=notebooksRef.current.find(n=>n.id===notebook.id);if(!existing)return;const updated=notebooksRef.current.map(n=>n.id===notebook.id?{...n,minutes:n.minutes+Math.max(1,Math.round(seconds/60)),updated:Date.now()}:n);notebooksRef.current=updated;try{localStorage.setItem(storageKey,JSON.stringify(updated))}catch{}setNotebooks(updated);const localSession:StudySessionRow={started_at:startedAt,duration_seconds:seconds,mode:"focus"};setWeeklySessions(old=>[...old.filter(row=>row.started_at!==startedAt),localSession].sort((a,b)=>a.started_at.localeCompare(b.started_at)).slice(-400));try{const history=JSON.parse(localStorage.getItem(sessionStorageKey)||"[]");const rows=Array.isArray(history)?history.filter((row):row is StudySessionRow=>!!row&&typeof row.started_at==="string"&&Number.isFinite(row.duration_seconds)&&typeof row.mode==="string"):[];rows.push(localSession);localStorage.setItem(sessionStorageKey,JSON.stringify(rows.slice(-400)))}catch{}if(user&&supabase)void supabase.from("ace_individual_study_sessions").insert({user_id:user.id,notebook_id:notebook.id,mode:"focus",duration_seconds:seconds,question_count:0,correct_count:0,started_at:startedAt,ended_at:endedAt}).then(({error})=>{if(error)setNotice("Focus time was saved on this device, but its session record could not sync.")})}
function toggleFocus(){if(running){persistFocusSegment();setRunning(false);return}if(!notebook){setNotice("Open a notebook before starting a tracked focus session.");return}focusStartedRef.current=Date.now();setRunning(true)}
function resetFocus(){if(running){persistFocusSegment();setRunning(false)}setSeconds(25*60)}
function recordInterleavedResult(card:MixedCard,correct:boolean){applyCardGrade(card.notebookId,card,correct?2:0)}
function runSourceSearch(e:React.FormEvent){e.preventDefault();if(!notebook)return;setAskResults(findEvidence(notebook.source,askQuery));setAskSearched(true)}
function importGuestNotebooks(){if(!user){setNotice("Sign in before importing guest notebooks.");return}try{const raw=localStorage.getItem(STORAGE+":guest");if(!raw){setGuestImportAvailable(false);setGuestImportCount(0);return}const parsed=JSON.parse(raw) as Notebook[];if(!Array.isArray(parsed)){setNotice("The guest notebook data could not be read.");return}const merged=new Map(notebooks.map(n=>[n.id,n]));let imported=0;for(const n of parsed){const safe=sanitizeNotebook(n);if(safe&&!merged.has(safe.id)){merged.set(safe.id,safe);imported++}}setNotebooks([...merged.values()].sort((a,b)=>b.updated-a.updated).slice(0,80));setClaimGuest(true);setGuestImportAvailable(false);setGuestImportCount(0);setNotice(imported+" guest notebooks added to your private account. They will be removed from this device after cloud sync completes.")}catch{setNotice("Unable to import guest notebooks. Export a local backup first.")}}
function deleteNotebook(id:string){if(recordingNotebookRef.current?.id===id)stopRecording();if(selected===id){for(const item of savedAudioNotes)void deleteStudyAudio(item.id).catch(()=>{});setSavedAudioNotes([]);setRecordedAudio(old=>{if(old)URL.revokeObjectURL(old);return null})}const remaining=notebooksRef.current.filter(n=>n.id!==id);notebooksRef.current=remaining;setNotebooks(remaining);if(user)setDeletedIds(old=>[...new Set([...old,id])].slice(-200));setSelected("");setNotice("Notebook deleted from this device and queued for cloud deletion.");}
function patchNotebook(id:string,patch:(n:Notebook)=>Notebook){setNotebooks(old=>{const updated=old.map(n=>n.id===id?patch(n):n);notebooksRef.current=updated;return updated})}
function openNotebook(id:string){stopSpeech();if(running){persistFocusSegment();setRunning(false)}setReviewAll(false);setSelected(id);setMode("read");setCardIndex(0);setQuizIndex(0);setAnswered(null);setFlipped(false);setNotice("")}
function startNotebookForCourse(){
 setSelected("");setReviewAll(false);setInterleavedPractice(false);setCreate(true);
 setTitle((initialCourseTitle||initialCourseCode)+" · Study notebook");setCourseCode(initialCourseCode);
 setSubjectSlug("");setTagInput("Course notes");setSource("");setSourceFiles([]);setMode("read");setNotice("");
}
function addNotebook(){if(!title.trim()){setNotice("Give your notebook a title.");return}if(new Blob([source]).size>1_900_000){setNotice("Notebook source text is limited to 1.9 MB so it can sync safely and remain available offline.");return}
 if(sourceFiles.length>100){setNotice("A notebook can contain up to 100 source documents.");return}const next=createNotebook(title.trim(),source.trim(),courseCode,subjectSlug,tagInput.split(",").map(t=>t.trim()).filter(Boolean).slice(0,12),sourceFiles);if(JSON.stringify([next,...notebooks]).length>2_200_000){setNotice("Offline device storage is full. Export or remove older notebooks before adding this one.");return}setNotebooks(old=>[next,...old]);setSelected(next.id);setCreate(false);setTitle("");setCourseCode("");setSubjectSlug("");setTagInput("");setSource("");setSourceFiles([]);setMode("read");setNotice(next.cards.length?"Notebook ready. Your flashcards and quiz were prepared from your term-and-definition lines.":"Notebook created. Add lines such as ‘Term: Definition’ to enable flashcards and quizzes.")}
function captureSelection(){const el=sourceTextareaRef.current;if(!el)return;const start=el.selectionStart,end=el.selectionEnd;if(end<=start){setSelection(null);return}const quote=source.slice(start,end).trim();if(quote.length<8){setSelection(null);return}const before=source.slice(0,start);const pages=[...before.matchAll(/^PAGE\s+(\d+)\s*$/gim)];const page=pages.length?"Page "+pages[pages.length-1][1]:"Notebook";setSelection({quote:quote.slice(0,2000),page});setHighlightNote("")}
function saveHighlight(){if(!notebook||!selection)return;const current=notebook.highlights??[];if(current.length>=200){setNotice("This notebook has reached its 200-highlight limit.");return}const next:Highlight={id:crypto.randomUUID(),quote:selection.quote,note:highlightNote.trim().slice(0,1000),page:selection.page,created:Date.now()};patchNotebook(notebook.id,n=>({...n,highlights:[...(n.highlights??[]),next],updated:Date.now()}));setSelection(null);setHighlightNote("");setNotice("Passage saved to your notebook highlights.")}
function removeHighlight(id:string){if(!notebook)return;patchNotebook(notebook.id,n=>({...n,highlights:(n.highlights??[]).filter(h=>h.id!==id),updated:Date.now()}))}
function jumpToHighlight(highlight:Highlight){if(!sourceTextareaRef.current)return;setMode("read");setSource(notebook?.source??"");const index=(notebook?.source??"").indexOf(highlight.quote);if(index>=0){requestAnimationFrame(()=>{const area=sourceTextareaRef.current;if(!area)return;area.focus();area.setSelectionRange(index,index+highlight.quote.length);area.scrollTop=Math.max(0,area.scrollHeight*(index/Math.max(1,area.value.length))-.3*area.clientHeight)})}}
function jumpToOutlineSection(section:GuideSection){
 setMode("read");setSelection(null);
 requestAnimationFrame(()=>{const textarea=sourceTextareaRef.current;if(!textarea)return;const start=Math.min(section.sourceStart,textarea.value.length);const end=Math.min(start+section.sourceLength,textarea.value.length);textarea.focus();textarea.setSelectionRange(start,end);const ratio=start/Math.max(1,textarea.value.length);textarea.scrollTop=ratio*textarea.scrollHeight})
}
function formatSource(kind:"bold"|"heading"|"bullet"|"quote"){
 const textarea=sourceTextareaRef.current;
 if(!textarea)return;
 const start=textarea.selectionStart,end=textarea.selectionEnd;
 const selected=source.slice(start,end);let prefix="",suffix="",replacement=selected;
 if(kind==="bold"){prefix="**";suffix="**";replacement=selected||"important text"}
 if(kind==="heading"){prefix="## ";replacement=selected||"Section heading";const lineStart=source.lastIndexOf("\n",Math.max(0,start-1))+1;const before=source.slice(lineStart,start);if(before.trim()){prefix="\n## "}}
 if(kind==="bullet"){const base=selected||"List item";replacement=base.split("\n").map(line=>line.trim()? "• "+line:"").join("\n");}
 if(kind==="quote"){const base=selected||"Quoted passage";replacement=base.split("\n").map(line=>line?"> "+line:"").join("\n")}
 const next=source.slice(0,start)+prefix+replacement+suffix+source.slice(end);setSource(next);setSelection(null);
 requestAnimationFrame(()=>{textarea.focus();const left=start+prefix.length;textarea.setSelectionRange(left,left+replacement.length)})
}
function saveSource(){if(!notebook)return;const existing=new Map(notebook.cards.map(c=>[c.front.toLowerCase()+"::"+c.back,c]));const next=parseCards(source).map(c=>existing.get(c.front.toLowerCase()+"::"+c.back)||c);const updated=notebooks.map(n=>n.id===notebook.id?{...n,source,cards:next,updated:Date.now()}:n);if(JSON.stringify(updated).length>2_200_000){setNotice("This edit exceeds the offline storage limit. Split the source into smaller notebooks.");return}setNotebooks(updated);setNotice("Notes saved on this device. Cards rebuilt; unchanged review history preserved.")}
function removeDraftSource(id:string){
 const item=sourceFiles.find(source=>source.id===id);if(!item)return;
 const result=removeSourceBlock(source,item);if(!result.removed){setNotice("That source could not be located in the draft. Keep editing or start a fresh notebook.");return}
 setSource(result.source);setSourceFiles(items=>items.filter(source=>source.id!==id));setNotice(item.name+" removed from this draft.");
}
function removeNotebookSource(item:StudySource){
 if(!notebook)return;
 const result=removeSourceBlock(source,item);if(!result.removed){setNotice("That source could not be located in the notebook text.");return}
 const existing=new Map(notebook.cards.map(card=>[card.front.toLowerCase()+"::"+card.back,card]));
 const cards=parseCards(result.source).map(card=>existing.get(card.front.toLowerCase()+"::"+card.back)||card);
 patchNotebook(notebook.id,current=>({...current,source:result.source,cards,sources:(current.sources??[]).filter(source=>source.id!==item.id),updated:Date.now()}));
 setSource(result.source);setNotice(item.name+" removed. Remaining cards and their review history were preserved.");
}
function applyCardGrade(notebookId:string,prev:Card,grade:0|1|2|3){
 const now=Date.now();
 const scheduled=scheduleFSRSReview(prev.memory,{next:prev.next,interval:prev.interval,ease:prev.ease,reviews:prev.reviews,lapses:prev.lapses,lastReviewed:prev.lastReviewed},grade,now);
 patchNotebook(notebookId,n=>({...n,updated:now,attempts:n.attempts+1,correct:n.correct+(grade?1:0),cards:n.cards.map(c=>c.id===prev.id?{...c,next:scheduled.dueAt,interval:scheduled.scheduledDays,ease:scheduled.difficulty,reviews:scheduled.repetitions,lapses:scheduled.lapses,lastReviewed:now,lastGrade:grade,memory:scheduled.memory}:c)}));
 setFlipped(false);return scheduled.dueAt
}
function rateCard(grade:0|1|2|3){if(!notebook||!card)return;const next=applyCardGrade(notebook.id,card,grade);setCardIndex(i=>Math.max(0,i-1));setNotice(grade===0?"Added to your retry queue (5 min).":"Review scheduled for "+formatDay(next)+".")}
function rateGlobalCard(grade:0|1|2|3){const nextCard=reviewQueue[0];if(!nextCard)return;const next=applyCardGrade(nextCard.notebookId,nextCard,grade);setReviewedInSession(n=>n+1);setNotice(grade===0?"You can retry this card again in five minutes.":"Review scheduled for "+formatDay(next)+".")}
function recordQuizResult(correct:boolean,selectedIndex?:number){if(!notebook||!currentQuiz)return;setQuizCorrect(correct);setAnswered(selectedIndex??(correct?1:0));applyCardGrade(notebook.id,currentQuiz,correct?2:0)}
function pickAnswer(index:number){if(answered!==null||!notebook||!currentQuiz)return;const correct=quizFormat==="truefalse"?(index===0)===(trueFalseClaim?.isTrue??false):options[index]===currentQuiz.back;recordQuizResult(correct,index)}
function nextQuizQuestion(){setQuizIndex(i=>(i+1)%quizCards.length);setAnswered(null);setQuizCorrect(null);setWrittenAnswer("");setWrittenRevealed(false)}

function startSpeech(){
 if(!notebook||!audioSupported)return;
 const synth=window.speechSynthesis;synth.cancel();
 const lessonParts:string[]=[audioMode==="overview"?"Welcome to your Ace study overview for "+notebook.title+". This audio lesson is built from your own imported material.":"Now reading the full source material for "+notebook.title+"."];
 if(audioMode==="overview"){
  if(studyGuide.overview)lessonParts.push("Here is the main idea. "+studyGuide.overview);
  if(studyGuide.keyPoints.length){lessonParts.push("Let's walk through the key ideas.");studyGuide.keyPoints.slice(0,12).forEach((point,i)=>lessonParts.push("Key idea "+(i+1)+". "+point))}
  if(studyGuide.terms.length){lessonParts.push("Now let's revise important terms. I will state each term, leave a moment to think, then read the source definition.");studyGuide.terms.slice(0,16).forEach(term=>lessonParts.push("The term is "+term.front+". Think about the meaning. "+term.back))}
  if(studyGuide.sections.length>0)lessonParts.push("For context, revisit the original sections of your notes. "+studyGuide.sections.slice(0,6).map(section=>section.title+". "+section.summary).join(" "));
  if(studyGuide.keyPoints.length===0&&studyGuide.terms.length===0&&studyGuide.sections.length===0)lessonParts.push(notebook.source.slice(0,30000));
  lessonParts.push("That concludes this source-based overview. Return to your notebook, use the mind map to connect the topics, and test what you remember with written recall.");
 }else lessonParts.push(notebook.source.slice(0,30000));
 const words=lessonParts.join("\n\n").slice(0,30000);
 if(!words.trim()){setNotice("Add some notes to listen to.");return}
 const chunks=words.match(/.{1,220}(?:[.!?\n]|$)/g)||[words];let index=0;
 const voice=voices.find(v=>v.voiceURI===voiceURI);
 listeningRef.current=true;setListening(true);setSpeechPaused(false);setAudioProgress({current:0,total:chunks.length});
 function play(){
  if(!listeningRef.current||index>=chunks.length){setListening(false);setSpeechPaused(false);listeningRef.current=false;setAudioProgress({current:chunks.length,total:chunks.length});return}
  const current=chunks[index++];setAudioProgress({current:index,total:chunks.length});
  const utter=new SpeechSynthesisUtterance(current);utter.rate=voiceRate;if(voice)utter.voice=voice;
  utter.onend=play;utter.onerror=()=>{setListening(false);setSpeechPaused(false);listeningRef.current=false};
  synth.speak(utter)
 }
 play()
}
function toggleSpeechPause(){if(!listening)return;const synth=window.speechSynthesis;if(speechPaused){synth.resume();setSpeechPaused(false)}else{synth.pause();setSpeechPaused(true)}}

function stopSpeech(){listeningRef.current=false;window.speechSynthesis?.cancel();setListening(false);setSpeechPaused(false);setAudioProgress({current:0,total:0})}
async function startRecording(){
 if(!notebook){setNotice("Open a notebook before recording an audio recap.");return}
 if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==="undefined"){setNotice("Recording is not available in this browser.");return}
 try{
  stopSpeech();const stream=await navigator.mediaDevices.getUserMedia({audio:true});streamRef.current=stream;
  const supported=["audio/webm;codecs=opus","audio/webm","audio/mp4"].find(t=>MediaRecorder.isTypeSupported(t))||"";
  const recorder=new MediaRecorder(stream,supported?{mimeType:supported}:undefined);recorderRef.current=recorder;
  const recordingContext={id:notebook.id,title:notebook.title,startedAt:Date.now()};recordingNotebookRef.current=recordingContext;
  const chunks:BlobPart[]=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
  recorder.onstop=async()=>{
   const type=recorder.mimeType||"audio/webm";const blob=new Blob(chunks,{type});
   const durationMs=Math.max(0,Date.now()-recordingContext.startedAt);
   const extension=type.includes("mp4")?".m4a":".webm";
   const meta:AudioNoteMeta={id:crypto.randomUUID(),name:recordingContext.title+" · Recap "+new Date().toLocaleString(),mimeType:type,size:blob.size,createdAt:Date.now(),durationMs};
   const file={...meta,name:meta.name+extension,notebookId:recordingContext.id,blob};
   stream.getTracks().forEach(t=>t.stop());streamRef.current=null;setRecording(false);recordingNotebookRef.current=null;
   try{
    await saveStudyAudio(file);
    if(selected===recordingContext.id)setSavedAudioNotes(old=>[file,...old.filter(n=>n.id!==file.id)].map(({id,name,mimeType,size,createdAt,durationMs})=>({id,name,mimeType,size,createdAt,durationMs})));
    setActiveAudioNoteId(file.id);
    setRecordedAudio(old=>{if(old)URL.revokeObjectURL(old);return URL.createObjectURL(blob)});
    setNotice("Audio recap saved inside this notebook on this device. It remains available after refresh and can be downloaded.");
   }catch(error){
    setRecordedAudio(old=>{if(old)URL.revokeObjectURL(old);return URL.createObjectURL(blob)});
    setNotice("Recording captured, but browser storage could not save it. Download it now to keep a copy. "+(error instanceof Error?error.message:""));
   }
  };
  recorder.start();setRecording(true);setNotice("Recording. Explain the topic in your own words; stop when finished.")
 }catch{setRecording(false);streamRef.current?.getTracks().forEach(track=>track.stop());streamRef.current=null;setNotice("Microphone access was denied or unavailable. You can still listen to text-to-speech playback.")}
}
function stopRecording(){if(recorderRef.current?.state==="recording")recorderRef.current.stop()}
async function playSavedAudio(id:string){try{const item=await getStudyAudio(id);if(!item){setNotice("This local recording is no longer available.");return}setActiveAudioNoteId(id);setRecordedAudio(old=>{if(old)URL.revokeObjectURL(old);return URL.createObjectURL(item.blob)})}catch{setNotice("Could not open the selected audio note.")}}
async function downloadSavedAudio(id:string){try{const item=await getStudyAudio(id);if(!item){setNotice("Audio file is unavailable.");return}const url=URL.createObjectURL(item.blob);const a=document.createElement("a");a.href=url;a.download=item.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch{setNotice("Could not download the selected recording.")}}
async function removeSavedAudio(id:string){try{await deleteStudyAudio(id);setSavedAudioNotes(old=>old.filter(item=>item.id!==id));if(activeAudioNoteId===id){setActiveAudioNoteId("");setRecordedAudio(old=>{if(old)URL.revokeObjectURL(old);return null})}setNotice("Audio recap removed from this device.")}catch{setNotice("Could not delete this audio note.")}}
function downloadRecording(){if(activeAudioNoteId){void downloadSavedAudio(activeAudioNoteId);return}if(!recordedAudio||!notebook)return;const a=document.createElement("a");a.href=recordedAudio;a.download=notebook.title.replace(/[^\w\- ]/g,"").slice(0,60)+".webm";a.click()}

function downloadCards(){if(!notebook)return;const quote=(value:string)=>'"'+value.replace(/"/g,'""')+'"';const csv=["Front,Back",...notebook.cards.map(c=>quote(c.front)+","+quote(c.back))].join("\r\n");const blob=new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=(notebook.title.replace(/[^\w\- ]/g,"").slice(0,60)||"ace-cards")+"-cards.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function downloadNotebookBackup(){
 if(!notebook)return;
 try{
  const zipModule=await import("jszip");const Zip=zipModule.default;const zip=new Zip();
  const audio=await listStudyAudio(notebook.id);if(audio.length>30){setNotice("This notebook has more than 30 audio notes. Download or remove some before creating a complete archive.");return}const audioFiles:{id:string;path:string;name:string;mimeType:string;size:number;createdAt:number;durationMs:number}[]=[];
  let total=0;
  for(const item of audio.slice(0,30)){
   const stored=await getStudyAudio(item.id);if(!stored)continue;
   total+=stored.blob.size;if(total>12*1024*1024){setNotice("This notebook's audio is too large for one backup. Download individual recordings or remove some before exporting.");return}
   const safeName=item.name.replace(/[^\w .-]/g,"_").slice(0,100);
   const path="audio/"+item.id+"_"+safeName;
   zip.file(path,stored.blob);
   audioFiles.push({...item,path});
  }
  zip.file("notebook.ace.json",JSON.stringify({format:"ace-study-notebook",version:2,exportedAt:new Date().toISOString(),notebook,audioFiles},null,2));
  const blob=await zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6}});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=(notebook.title.replace(/[^\w\- ]/g,"").slice(0,60)||"ace-notebook")+".ace.zip";a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
  setNotice("Complete notebook backup created, including "+audioFiles.length+" audio note(s). Keep the .ace.zip file somewhere safe.");
 }catch(error){setNotice("Could not create the full notebook backup. "+(error instanceof Error?error.message:""))}
}
function shareNotebookWithClassmates(){if(!notebook)return;if(!user){setNotice("Sign in before creating a collaborative copy.");return}const title=(notebook.title+" · Shared study notes").slice(0,140);const highlights=(notebook.highlights??[]).map(h=>"• "+h.quote+(h.note?"\n  "+h.note:"")).join("\n");const sources=(notebook.sources??[]).map(item=>"• "+item.name+" ("+item.format+")").join("\n");const content=notebook.source+"\n\n"+(highlights?"MY HIGHLIGHTS\n"+highlights+"\n\n":"")+(sources?"SOURCE FILES\n"+sources+"\n":"");if(content.length>49000){setNotice("This notebook is too large for a shared note. Split it into smaller sections before sharing.");return}try{sessionStorage.setItem("ace-shared-note-draft",JSON.stringify({title,content,course_code:notebook.courseCode??"",createdAt:Date.now()}));onSharedNotes()}catch{setNotice("Unable to prepare this notebook for sharing. Export a backup and try again.")}}
function downloadNotes(){if(!notebook)return;const file=new Blob([notebook.title+"\n\n"+notebook.source],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(file);const a=document.createElement("a");a.href=url;a.download=notebook.title.replace(/[^\w\- ]/g,"").slice(0,60)||"ace-notes";a.download+=".txt";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function importApprovedResource(id:string){
 if(!supabase)return;
 setNotice("Preparing this library document for your notebook…");
 try{
  const {data,error}=await supabase.from("ace_resources").select("id,title,course_code,course_name,kind,storage_path,status,uploader_id").eq("id",id).maybeSingle();
  if(error||!data){setNotice("This library document is unavailable or you do not have permission to use it.");return}
  if(data.status!=="approved"&&data.uploader_id!==user?.id){setNotice("Only approved learning materials can be imported into a notebook.");return}
  const {data:signed,error:signError}=await supabase.storage.from("ace-submissions").createSignedUrl(data.storage_path,600);
  if(signError||!signed?.signedUrl){setNotice("The document could not be prepared for reading. Try downloading it and importing the PDF instead.");return}
  const response=await fetch(signed.signedUrl);
  if(!response.ok){setNotice("The library document download failed. Please retry.");return}
  const bytes=await response.arrayBuffer();
  if(bytes.byteLength>15*1024*1024){setNotice("This document exceeds the 15 MB notebook import limit.");return}
  const pdfjs=await import("pdfjs-dist/build/pdf.mjs");pdfjs.GlobalWorkerOptions.workerSrc="/pdf.worker.mjs";
  const pdf=await pdfjs.getDocument({data:bytes,useSystemFonts:true}).promise;
  if(pdf.numPages>100){await pdf.destroy();setNotice("This document exceeds the 100-page notebook limit. Split it into chapters.");return}
  const pages:string[]=[];
  for(let pageNo=1;pageNo<=pdf.numPages;pageNo++){
   const page=await pdf.getPage(pageNo);const content=await page.getTextContent();
   const pageText=content.items.map(item=>item.str+(item.hasEOL?"\n":" ")).join("").replace(/[ \t]+\n/g,"\n").trim();
   if(pageText)pages.push("PAGE "+pageNo+"\n"+pageText);
   if(pages.join("\n\n").length>1_900_000){await pdf.destroy();setNotice("This document has too much text for one notebook. Split it into chapters.");return}
  }
  await pdf.destroy();const extracted=pages.join("\n\n");
  if(extracted.trim().length<80){setNotice("This PDF has little selectable text. It may be scanned; OCR is not currently enabled.");return}
  const metadata:StudySource={id:crypto.randomUUID(),name:safeSourceName(data.title+".pdf"),format:"PDF · Ace library",characters:extracted.length,pages:pdf.numPages,addedAt:Date.now()};const attributed="SOURCE: "+metadata.name+" [ACE_SOURCE_ID="+metadata.id+"]\\n\\n"+extracted;setSelected("");setMode("read");setTitle(data.title);setCourseCode(data.course_code??"");setTagInput([data.course_name,data.kind,"Ace library"].filter(Boolean).join(", "));setSource(attributed);setSourceFiles([metadata]);setCreate(true);
  setNotice("Imported from the Ace student library. Check the extracted pages, then create your private study notebook.");
 }catch(error){setNotice("Could not import this library document. "+(error instanceof Error?error.message:"Please try again."))}
}
function attachImportedSource(file:File,extracted:string,format:string,pages:number|null=null){
 const metadata:StudySource={id:crypto.randomUUID(),name:safeSourceName(file.name),format,characters:extracted.length,pages,addedAt:Date.now()};
 const header="SOURCE: "+metadata.name+" [ACE_SOURCE_ID="+metadata.id+"]\\n\\n";
 const target=notebook?(notebooksRef.current.find(n=>n.id===notebook.id)??notebook):null;
 if(target&&!create){
  if((target.sources??[]).length>=100){setNotice("This notebook has reached its 100-source limit.");return}
  if(source!==target.source){setNotice("Save your current edits before adding another source, so nothing is overwritten.");return}
  const separator="\n\nSOURCE: "+file.name+"\n\n";
  const combined=(target.source?target.source+separator:"")+extracted;
  if(new Blob([combined]).size>1_900_000){setNotice("This notebook has reached its 1.9 MB source limit. Create another notebook for this file.");return}
  const existing=new Map(target.cards.map(card=>[card.front.toLowerCase()+"::"+card.back,card]));
  const cards=parseCards(combined).map(card=>existing.get(card.front.toLowerCase()+"::"+card.back)||card);
  patchNotebook(target.id,current=>({...current,source:combined,cards,sources:[...(current.sources??[]),metadata],updated:Date.now()}));
  setSource(combined);setNotice("Added "+file.name+" to "+target.title+". Your source collection and study cards are updated.");return;
 }
 if(sourceFiles.length>=100){setNotice("A notebook can contain up to 100 source documents.");return}
 setSource(current=>current?current+"\n\nSOURCE: "+file.name+"\n\n"+extracted:"SOURCE: "+file.name+"\n\n"+extracted);
 setSourceFiles(current=>[...current,metadata]);
 setTitle(current=>current||file.name.replace(/\.(pdf|docx|pptx|txt|md|csv)$/i,""));
 setCreate(true);
 setNotice("Added "+file.name+". You can add more documents before creating this notebook.");
}
async function importFiles(files:File[]){for(const file of files)await importFile(file)}
async function importFile(file?:File){
 if(!file)return;
 if(file.size>15*1024*1024){setNotice("Files must be smaller than 15 MB.");return}
 const extension=file.name.toLowerCase().split(".").pop()||"";
 try{
  if(extension==="zip"){
   setNotice("Opening your complete Ace notebook backup…");
   const zipModule=await import("jszip");const loaded=await zipModule.default.loadAsync(file);
   const manifest=loaded.file("notebook.ace.json");if(!manifest){setNotice("This ZIP is not an Ace notebook backup.");return}
   const data=JSON.parse(await manifest.async("text")) as {format?:string;version?:number;notebook?:unknown;audioFiles?:unknown};
   if(data.format!=="ace-study-notebook"||data.version!==2||!data.notebook){setNotice("This is not a supported complete Ace notebook backup.");return}
   const safe=sanitizeNotebook(data.notebook);if(!safe){setNotice("The notebook backup is damaged or exceeds import limits.");return}
   const restored:Notebook={...safe,id:crypto.randomUUID(),created:Date.now(),updated:Date.now(),cards:safe.cards.map(c=>({...c,id:crypto.randomUUID()})),highlights:(safe.highlights??[]).map(h=>({...h,id:crypto.randomUUID()}))};
   if(JSON.stringify([restored,...notebooks]).length>2_200_000){setNotice("This backup exceeds the remaining offline notebook storage.");return}
   const candidates=Array.isArray(data.audioFiles)?data.audioFiles.slice(0,30):[];
   const restoredAudio:string[]=[];let restoredBytes=0;
   try{
    for(const raw of candidates){
     if(!raw||typeof raw!=="object")continue;const entry=raw as {path?:unknown;name?:unknown;mimeType?:unknown;createdAt?:unknown;durationMs?:unknown};
     if(typeof entry.path!=="string"||!entry.path.startsWith("audio/")||entry.path.includes("..")||typeof entry.name!=="string"||typeof entry.mimeType!=="string")continue;
     const audioFile=loaded.file(entry.path);if(!audioFile||audioFile.dir)continue;const blob=await audioFile.async("blob");restoredBytes+=blob.size;if(restoredBytes>12*1024*1024)throw new Error("Audio attachments exceed the 12 MB restore limit.");
     const id=crypto.randomUUID();await saveStudyAudio({id,notebookId:restored.id,name:entry.name.slice(0,180),mimeType:entry.mimeType,size:blob.size,createdAt:typeof entry.createdAt==="number"?entry.createdAt:Date.now(),durationMs:typeof entry.durationMs==="number"?Math.max(0,entry.durationMs):0,blob});restoredAudio.push(id);
    }
   }catch(error){for(const id of restoredAudio)await deleteStudyAudio(id).catch(()=>{});setNotice("Audio attachments could not be restored. "+(error instanceof Error?error.message:""));return}
   setNotebooks(old=>[restored,...old]);setSelected(restored.id);setCreate(false);setNotice("Complete notebook restored with "+restoredAudio.length+" audio note(s), cards, highlights and study history.");return
  }
  if(extension==="json"){const data=JSON.parse(await file.text()) as {format?:string;version?:number;notebook?:Notebook};const n=data.notebook;if(data.format!=="ace-study-notebook"||data.version!==1||!n||typeof n.title!=="string"||typeof n.source!=="string"||!Array.isArray(n.cards)||n.cards.length>250||!n.cards.every(isCardRecord)||(n.highlights!==undefined&&(!Array.isArray(n.highlights)||n.highlights.length>200||!n.highlights.every(isHighlightRecord)))){setNotice("This is not a valid Ace notebook backup.");return}if(n.source.length>1_900_000||n.cards.length>250){setNotice("This notebook backup exceeds import limits.");return}const restored:Notebook={...n,id:crypto.randomUUID(),created:Date.now(),updated:Date.now(),cards:n.cards.map(c=>({...c,id:crypto.randomUUID()})),highlights:(n.highlights??[]).map(h=>({...h,id:crypto.randomUUID()})),sources:Array.isArray(n.sources)?n.sources.filter(isStudySourceRecord):[]};if(JSON.stringify([restored,...notebooks]).length>2_200_000){setNotice("This backup exceeds the remaining offline storage. Export or remove notebooks before restoring it.");return}setNotebooks(old=>[restored,...old]);setSelected(restored.id);setCreate(false);setNotice("Notebook and review history restored. A fresh copy was created.");return}
  if(extension==="pdf"||file.type==="application/pdf"){
   setNotice("Reading PDF pages on this device…");
   const pdfjs=await import("pdfjs-dist/build/pdf.mjs");
   pdfjs.GlobalWorkerOptions.workerSrc="/pdf.worker.mjs";
   const pdfDocument=await pdfjs.getDocument({data:await file.arrayBuffer(),useSystemFonts:true}).promise;
   if(pdfDocument.numPages>100){await pdfDocument.destroy();setNotice("Import PDFs up to 100 pages. Split larger books into chapters.");return}
   const pages:string[]=[];
   for(let pageNumber=1;pageNumber<=pdfDocument.numPages;pageNumber++){
    const page=await pdfDocument.getPage(pageNumber);const content=await page.getTextContent();
    const text=content.items.map(item=>item.str+(item.hasEOL?"\n":" ")).join("").replace(/[ \t]+\n/g,"\n").trim();
    if(text)pages.push("PAGE "+pageNumber+"\n"+text);
    if(pages.join("\n\n").length>1_900_000){await pdfDocument.destroy();setNotice("Extracted text is too large for one notebook. Split the PDF into smaller chapters.");return}
   }
   await pdfDocument.destroy();
   const extracted=pages.join("\n\n");
   if(extracted.trim().length<80){setNotice("This PDF contains little selectable text. It may be scanned; OCR is not enabled, so use a text-based PDF or paste your notes instead.");return}
   attachImportedSource(file,extracted,"PDF",pdfDocument.numPages);return;
  }
  if(extension==="docx"){
   setNotice("Extracting Word document text on this device…");
   const mammoth=await import("mammoth");
   const result=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
   const extracted=result.value.trim();
   if(extracted.length<40){setNotice("This Word document has too little extractable text.");return}
   if(extracted.length>1_900_000){setNotice("The extracted document is too large for one notebook. Split it into chapters.");return}
   attachImportedSource(file,extracted,"Word",null);return;
  }
  if(extension==="pptx"){
   setNotice("Extracting lecture slides on this device…");
   const JSZip=(await import("jszip")).default;
   const archive=await JSZip.loadAsync(await file.arrayBuffer());
   const slidePaths=Object.keys(archive.files).filter(path=>/^ppt\/slides\/slide\d+\.xml$/.test(path)&&!archive.files[path].dir).sort((a,b)=>Number(a.match(/slide(\d+)/)?.[1]??0)-Number(b.match(/slide(\d+)/)?.[1]??0));
   if(!slidePaths.length){setNotice("No readable PowerPoint slides were found in this file.");return}
   if(slidePaths.length>150){setNotice("Import decks up to 150 slides. Split larger presentations into chapters.");return}
   const pages:string[]=[];
   for(let i=0;i<slidePaths.length;i++){
    const xml=await archive.files[slidePaths[i]].async("string");
    const parsed=new DOMParser().parseFromString(xml,"application/xml");
    if(parsed.querySelector("parsererror"))continue;
    const text=Array.from(parsed.getElementsByTagName("a:t")).map(node=>node.textContent?.trim()??"").filter(Boolean).join(" ");
    if(text)pages.push("SLIDE "+(i+1)+"\n"+text);
    if(pages.join("\n\n").length>1_900_000){setNotice("Extracted slide text is too large for one notebook. Split the deck into smaller chapters.");return}
   }
   const extracted=pages.join("\n\n");
   if(extracted.trim().length<40){setNotice("These slides contain little selectable text. Images and diagrams are not extracted.");return}
   attachImportedSource(file,extracted,"PowerPoint",slidePaths.length);setNotice("Slide text extracted locally. Images and speaker audio are not imported.");return;
  }
  if(!(/\.txt$|\.md$|\.csv$/i.test(file.name))){setNotice("Import PDF, Word, PowerPoint, CSV, text or Ace backups.");return}
  const text=await file.text();if(text.length>1_900_000){setNotice("This text file is too large for one notebook. Split it into smaller chapters.");return}
  attachImportedSource(file,text,extension.toUpperCase(),null);
 }catch(error){setNotice("Could not read this file. Try another export or save it in a supported format. "+(error instanceof Error?error.message:""))}
}
const filtered=notebooks.filter(n=>[n.title,n.courseCode??"",...(n.tags??[])].join(" ").toLowerCase().includes(query.toLowerCase()));
const summary=notebooks.reduce((a,n)=>({minutes:a.minutes+n.minutes,cards:a.cards+n.cards.length,attempts:a.attempts+n.attempts,correct:a.correct+n.correct}),{minutes:0,cards:0,attempts:0,correct:0});
const dueTotal=reviewQueue.length;
const weeklyBars=Array.from({length:7},(_,index)=>{const day=new Date();day.setDate(day.getDate()-(6-index));day.setHours(0,0,0,0);const key=day.toDateString();const seconds=weeklySessions.filter(session=>new Date(session.started_at).toDateString()===key).reduce((total,session)=>total+session.duration_seconds,0);return {key,label:day.toLocaleDateString(undefined,{weekday:"short"}),minutes:Math.round(seconds/60)}});
const weekTotal=weeklyBars.reduce((total,day)=>total+day.minutes,0);const weekPeak=Math.max(30,...weeklyBars.map(day=>day.minutes));
const dayHistory=new Set(weeklySessions.filter(row=>row.duration_seconds>=20).map(row=>new Date(row.started_at).toLocaleDateString("en-CA")));
const today=new Date();today.setHours(0,0,0,0);
const todayKey=today.toLocaleDateString("en-CA");const yesterday=new Date(today);yesterday.setDate(yesterday.getDate()-1);
let streakCursor=dayHistory.has(todayKey)?today:yesterday;let studyStreak=0;
while(studyStreak<30&&dayHistory.has(streakCursor.toLocaleDateString("en-CA"))){studyStreak++;streakCursor=new Date(streakCursor);streakCursor.setDate(streakCursor.getDate()-1)}
const goalProgress=Math.min(100,Math.round(weekTotal/weeklyGoal*100));
async function updateWeeklyGoal(value:number){const safe=Math.max(30,Math.min(1200,Math.round(value)));setWeeklyGoal(safe);try{localStorage.setItem(goalStorageKey,String(safe))}catch{}if(user&&supabase){const {error}=await supabase.from("ace_study_preferences").upsert({user_id:user.id,weekly_goal_minutes:safe,preferred_study_days:5},{onConflict:"user_id"});if(error)setNotice("Your goal was saved on this device, but could not sync to your account.")}}
const accuracy=notebook?.attempts?Math.round(notebook.correct/notebook.attempts*100):0;
if(!storageReady)return <div className="studio-boot"><span className="ace-live-dot"/> Opening your private study space…</div>;
return <div className="ace-studio">
<div className="studio-topline"><span className="studio-overline"><span className="ace-live-dot"/> ACE STUDY STUDIO</span><div className="studio-top-actions"><span className={"studio-sync-state "+syncStatus}>{syncStatus==="synced"?"Synced":syncStatus==="syncing"?"Syncing…":syncStatus==="error"?"On this device":"Local mode"}</span><button type="button" onClick={()=>setFocus(v=>!v)}><Clock3 size={15}/> {focus?"Hide timer":"Focus timer"}</button><button type="button" onClick={()=>{stopSpeech();if(running){persistFocusSegment();setRunning(false)}if(recording)stopRecording();setSelected("");setReviewAll(false);setCreate(true);setSource("");setSourceFiles([]);setTitle("");setCourseCode("");setSubjectSlug("");setTagInput("");setNotice("")}}><Plus size={15}/> New notebook</button></div></div>
{focus&&<div className="studio-timer"><span>Focus session</span><strong>{String(Math.floor(seconds/60)).padStart(2,"0")}:{String(seconds%60).padStart(2,"0")}</strong><button onClick={toggleFocus}>{running?<Pause size={15}/>:<Play size={15}/>} {running?"Pause":"Start"}</button><button onClick={resetFocus}><RotateCcw size={14}/> Reset</button></div>}
{notice&&<div className="studio-notice" role="status">{notice}<button onClick={()=>setNotice("")} aria-label="Dismiss notification"><X size={14}/></button></div>}<input ref={fileRef} type="file" multiple accept=".pdf,.docx,.pptx,.txt,.md,.csv,.json,.zip,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/markdown,text/csv,application/json" hidden onChange={e=>{const files=Array.from(e.target.files??[]);void importFiles(files);e.currentTarget.value="";}}/>
{interleavedPractice?<InterleavedPractice cards={interleavedDeck} onExit={()=>setInterleavedPractice(false)} onResult={recordInterleavedResult}/>:create?<div className="studio-editor-wrap"><div className="studio-heading"><button className="studio-icon-button" onClick={()=>setCreate(false)} aria-label="Back"><ArrowLeft size={17}/></button><div><span className="studio-overline">PERSONAL WORKSPACE</span><h1>Create a notebook</h1></div></div><p className="studio-copy">Bring your own material. Ace extracts your content on this device, builds recall cards and lets you test yourself. Nothing is sent to an AI service during import.</p>{sourceFiles.length>0&&<div className="studio-draft-sources"><div className="studio-overline">SOURCE COLLECTION · {sourceFiles.length}</div>{sourceFiles.map(item=><div key={item.id}><FileText size={14}/><span><strong>{item.name}</strong><small>{item.format} · {item.characters.toLocaleString()} characters{item.pages?" · "+item.pages+" pages":""}</small></span><button type="button" aria-label={"Remove "+item.name} title="Remove source" onClick={()=>removeDraftSource(item.id)}><X size={13}/></button></div>)}</div>}<label className="studio-field">Notebook name<input value={title} maxLength={110} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Economics · Chapter 2"/></label><label className="studio-field">Learning subject <select value={subjectSlug} onChange={e=>setSubjectSlug(e.target.value)}><option value="">Choose later</option>{subjectOptions.map(subject=><option key={subject.slug} value={subject.slug}>{subject.title}</option>)}</select></label><label className="studio-field">Course code <input value={courseCode} maxLength={40} onChange={e=>setCourseCode(e.target.value)} placeholder="Optional · e.g. your unit code"/></label><label className="studio-field">Tags <input value={tagInput} maxLength={180} onChange={e=>setTagInput(e.target.value)} placeholder="Optional · separate with commas"/></label>{sourceFiles.length>0&&<div className="studio-source-manifest"><div className="studio-overline">{sourceFiles.length} DOCUMENTS READY TO ADD</div><div>{sourceFiles.map(item=><span key={item.id}><FileText size={12}/><strong>{item.name}</strong><small>{item.format} · {item.characters.toLocaleString()} chars</small></span>)}</div></div>}
<div className="studio-field"><label htmlFor="ace-new-source">Study material</label><div className="studio-markdown-tools"><span>FORMAT</span><button type="button" title="Bold" aria-label="Bold selected text" onClick={()=>formatSource("bold")}><Bold size={14}/></button><button type="button" title="Section heading" aria-label="Insert section heading" onClick={()=>formatSource("heading")}><Heading1 size={14}/></button><button type="button" title="Bullet list" aria-label="Format as bullet list" onClick={()=>formatSource("bullet")}><List size={14}/></button><button type="button" title="Quote" aria-label="Format as quotation" onClick={()=>formatSource("quote")}><Quote size={14}/></button><small>Markdown formatting</small></div><textarea ref={sourceTextareaRef} id="ace-new-source" rows={13} value={source} onChange={e=>setSource(e.target.value)} placeholder={"Paste your notes here.\n\nOpportunity cost: The value of the next best alternative forgone.\nSupply: The quantity producers are willing to sell at a given price.\n\nUse one Term: Definition per line for study cards."}/></div><div className="studio-editor-footer"><button className="studio-soft-button" onClick={()=>fileRef.current?.click()}><FileText size={15}/> Add source files</button><span className="studio-source-count">{sourceFiles.length?sourceFiles.length+" documents added · ":""}PDF, DOCX, PPTX, text, CSV or complete Ace backup</span><button className="studio-action" onClick={addNotebook}><Plus size={15}/> Create notebook</button></div></div>:reviewAll?<div className="studio-global-review"><div className="studio-mode-header"><div><span className="studio-overline">DAILY REVIEW</span><h2>Everything due, in one session</h2><p>Cards from all your notebooks, prioritised by review date.</p></div><button className="studio-icon-button" onClick={()=>{setReviewAll(false);setFlipped(false)}} aria-label="Return to notebooks"><X size={16}/></button></div>{reviewQueue.length? <><div className="studio-review-progress"><span>{reviewedInSession} reviewed this session</span><strong>{reviewQueue.length} remaining</strong></div><div className="studio-global-source"><span>{reviewQueue[0].notebookTitle}</span><small>{reviewQueue[0].courseCode??"Your notebook"}</small></div><button className={"studio-flashcard "+(flipped?"flipped":"")} onClick={()=>setFlipped(v=>!v)} aria-label={flipped?"Show question":"Reveal answer"}><span className="studio-overline">{flipped?"ANSWER":"QUESTION"}</span><strong>{flipped?reviewQueue[0].back:reviewQueue[0].front}</strong><span className="studio-flip-hint"><RotateCcw size={13}/> Tap to reveal the answer</span></button>{flipped&&<div className="studio-fsrs-rating"><div className="studio-fsrs-rating-head"><span>Rate your recall</span>{globalRetention!==null&&<strong>Estimated recall {Math.round(globalRetention*100)}%</strong>}</div>{globalRetention!==null&&<div className="studio-retention-track" role="progressbar" aria-label="Estimated memory retrievability" aria-valuenow={Math.round(globalRetention*100)} aria-valuemin={0} aria-valuemax={100}><span style={{width:Math.round(globalRetention*100)+"%"}}/></div>}<div className="studio-rate"><div><button onClick={()=>rateGlobalCard(0)}>Again <small>{globalSchedulePreview?formatReviewDelay(globalSchedulePreview.again):"—"}</small></button><button onClick={()=>rateGlobalCard(1)}>Hard <small>{globalSchedulePreview?formatReviewDelay(globalSchedulePreview.hard):"—"}</small></button><button onClick={()=>rateGlobalCard(2)}>Good <small>{globalSchedulePreview?formatReviewDelay(globalSchedulePreview.good):"—"}</small></button><button onClick={()=>rateGlobalCard(3)}>Easy <small>{globalSchedulePreview?formatReviewDelay(globalSchedulePreview.easy):"—"}</small></button></div></div></div>}</>:<div className="studio-empty"><CheckCircle2 size={28}/><h3>You're caught up.</h3><p>{reviewedInSession?reviewedInSession+" cards reviewed in this session.":"There are no cards due across your notebooks right now."}</p><button onClick={()=>{setReviewAll(false);setFlipped(false)}}>Return to notebooks <ArrowRight size={14}/></button></div>}</div>:
!notebook?<><div className="studio-guest-import-anchor">{user&&guestImportAvailable&&<div className="studio-guest-import"><div><strong>Bring your guest notebooks with you.</strong><span>{guestImportCount} notebooks are saved on this device. Import them into this account?</span></div><button onClick={importGuestNotebooks}>Import notebooks <ArrowRight size={14}/></button></div>}</div><section className="studio-course-context"><div><span className="studio-overline">COURSE WORKSPACE</span><h2>{initialCourseTitle||initialCourseCode}</h2><p>{initialCourseCode} · Course-specific notebook, source documents and revision cards.</p></div><button className="studio-action" onClick={startNotebookForCourse}><Plus size={15}/> Create course notebook <ArrowRight size={14}/></button></section><div className="studio-hero"><div><span className="studio-overline">A BETTER WAY TO STUDY</span><h1>Your thinking space.</h1><p>Read. Remember. Test yourself. Listen. Everything stays together, inside your own notebooks.</p><button className="studio-action" onClick={()=>{setCreate(true);setTitle("");setSource("")}}><Plus size={15}/> Start a notebook <ArrowRight size={15}/></button></div><div className="studio-hero-art"><div className="studio-stack studio-stack-one"/><div className="studio-stack studio-stack-two"/><div className="studio-stack studio-stack-three"><BookOpen size={31}/></div></div></div>
<div className="studio-stats"><div><strong>{summary.minutes>=60?Math.floor(summary.minutes/60)+"h "+summary.minutes%60+"m":summary.minutes+"m"}</strong><span>Focus time</span></div><div><strong>{summary.cards}</strong><span>Study cards</span></div><div><strong>{summary.attempts?Math.round(summary.correct/summary.attempts*100)+"%":"—"}</strong><span>Recall accuracy</span></div><button type="button" className="studio-stat-tile" onClick={()=>{setReviewAll(true);setReviewedInSession(0);setFlipped(false)}}><strong>{dueTotal}</strong><span>Cards due · Review now</span></button></div>
<section className="studio-weekly"><div className="studio-weekly-heading"><div><span className="studio-overline">YOUR LEARNING RHYTHM</span><h2>This week <strong>{weekTotal} / {weeklyGoal} min</strong></h2><p>{studyStreak?studyStreak+"-day study streak · ":"Build a consistent routine · "}{goalProgress}% of your weekly goal</p></div><label>Weekly goal <select aria-label="Weekly study goal" value={weeklyGoal} onChange={e=>void updateWeeklyGoal(Number(e.target.value))}><option value={60}>1 hour</option><option value={90}>1.5 hours</option><option value={120}>2 hours</option><option value={180}>3 hours</option><option value={240}>4 hours</option><option value={300}>5 hours</option><option value={420}>7 hours</option><option value={600}>10 hours</option><option value={840}>14 hours</option></select></label></div><div className="studio-goal-track" role="progressbar" aria-label="Weekly study goal progress" aria-valuenow={Math.min(weeklyGoal,weekTotal)} aria-valuemin={0} aria-valuemax={weeklyGoal}><span style={{width:goalProgress+"%"}}/></div><div className="studio-weekly-footer"><span>{Math.max(0,weeklyGoal-weekTotal)} min left to reach your goal</span><span>{new Set(weeklyBars.filter(day=>day.minutes>0).map(day=>day.key)).size} of 7 study days</span></div><div className="studio-weekly-bars">{weeklyBars.map(day=><div key={day.key} title={day.minutes+" focused minutes"}><span style={{height:Math.max(day.minutes?5:2,Math.round(day.minutes/weekPeak*76))+"px"}}/><small>{day.label}</small></div>)}</div></section>
<section className="studio-interleaved-promo"><div className="studio-interleaved-icon"><Shuffle size={20}/></div><div><span className="studio-overline">INTERLEAVED LEARNING</span><h2>Practise across your notebooks</h2><p>Mix cards from {notebooks.length} notebooks and switch between subjects, rather than revising one topic in isolation.</p></div><button className="studio-action" disabled={new Set(notebooks.map(n=>n.id)).size<2||interleavedDeck.length<2} onClick={()=>{setInterleavedPractice(true);setReviewAll(false);setSelected("");}}>{new Set(notebooks.map(n=>n.id)).size<2?"Add another notebook":"Start mixed practice"} <ArrowRight size={14}/></button></section><div className="studio-section-heading"><div><span className="studio-overline">LIBRARY</span><h2>My notebooks <span>{notebooks.length}</span></h2></div><label className="studio-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find notebook" aria-label="Search notebooks"/></label></div>
{filtered.length?<div className="studio-notebook-grid">{filtered.map((n,i)=><button key={n.id} className="studio-notebook" onClick={()=>openNotebook(n.id)}><span className={"studio-book-cover studio-cover-"+i%4}><BookOpen size={22}/></span><span className="studio-notebook-copy"><strong>{n.title}</strong><small>{n.subjectSlug?(subjectOptions.find(x=>x.slug===n.subjectSlug)?.title??"")+(n.courseCode?" · ":""): ""}{n.courseCode?n.courseCode+" · ":""}{n.cards.length} study cards · {n.attempts} answers</small><em>Updated {formatDay(n.updated)}</em></span><ArrowRight size={16}/></button>)}</div>:<div className="studio-empty"><Layers size={27}/><h3>{notebooks.length?"No matching notebooks":"You haven't made a notebook yet."}</h3><p>Start with your own notes, or try a small ready-made example.</p><button onClick={()=>{const n=createNotebook("How learning works",SEED,"","",["Study skills","Example"],[]);setNotebooks(a=>[n,...a]);openNotebook(n.id)}}>Try an example notebook <ArrowRight size={14}/></button></div>}
<div className="studio-bottom-links"><button onClick={onLibrary}><BookOpen size={17}/> Explore the public library <ArrowRight size={14}/></button><button onClick={onSharedNotes}><FileText size={17}/> Write with classmates <ArrowRight size={14}/></button><button onClick={onPractice}><Brain size={17}/> Community quizzes <ArrowRight size={14}/></button><button onClick={onPlanner}><CalendarDays size={17}/> Plan your study week <ArrowRight size={14}/></button><button onClick={onUpload}><FileText size={17}/> Share a PDF <ArrowRight size={14}/></button></div><p className="studio-privacy">Guest notebooks stay on this device. When you sign in, they are claimed into your private account and synced across devices. Study content remains private to your account; export a backup before clearing browser storage.</p></>:
<div className="studio-workspace"><div className="studio-breadcrumb"><button onClick={()=>{stopSpeech();if(running){persistFocusSegment();setRunning(false)}setSelected("");setNotice("")}}><ChevronLeft size={15}/> All notebooks</button><span>/</span><strong>{notebook.title}</strong></div><div className="studio-book-heading"><div><span className="studio-overline">STUDY NOTEBOOK</span><h1>{notebook.title}</h1><p>{notebook.cards.length} cards <span>·</span> {notebook.attempts} answers <span>·</span> {accuracy}% correct</p></div><div className="studio-book-actions"><button className="studio-share-button" onClick={shareNotebookWithClassmates}><Users size={14}/> Share a copy</button><button className="studio-icon-button" title="Export notes as text" aria-label="Export notes" onClick={downloadNotes}><Download size={18}/></button></div></div><div className="studio-study-tabs" role="tablist" aria-label="Study modes">{([{id:"read",name:"Read",Icon:BookOpen},{id:"guide",name:"Study guide",Icon:FileText},{id:"map",name:"Mind map",Icon:GitBranch},{id:"ask",name:"Find",Icon:Search},{id:"cards",name:"Flashcards",Icon:Layers},{id:"quiz",name:"Quick test",Icon:Brain},{id:"listen",name:"Listen",Icon:Headphones}] as const).map(t=><button key={t.id} role="tab" aria-selected={mode===t.id} className={mode===t.id?"active":""} onClick={()=>{if(mode==="listen")stopSpeech();setMode(t.id);setCardIndex(0);setQuizIndex(0);setAnswered(null);setFlipped(false);setNotice("")}}><t.Icon size={16}/>{t.name}</button>)}</div>
{mode==="read"&&<div className="studio-reading"><div className="studio-reading-tools"><span><FileText size={15}/> SOURCE MATERIAL</span><div><button onClick={()=>fileRef.current?.click()}><Plus size={14}/> Add source</button><button onClick={()=>{setSource(notebook.source);setMode("read");setNotice("Edit your material below, then save.")}}><Save size={14}/> Edit notes</button><button onClick={downloadNotes}><Download size={14}/> Text</button><button onClick={downloadCards}><Layers size={14}/> Anki CSV</button><button onClick={()=>void downloadNotebookBackup()} title="Export this notebook, highlights, review history and saved audio"><Save size={14}/> Full backup</button><button onClick={()=>fileRef.current?.click()}><Plus size={14}/> Add sources</button></div></div>{(notebook.sources??[]).length>0&&<div className="studio-source-manifest"><div className="studio-overline">{(notebook.sources??[]).length} SOURCES IN THIS NOTEBOOK</div><div>{(notebook.sources??[]).map(item=><span key={item.id}><FileText size={12}/><strong>{item.name}</strong><small>{item.format} · {item.characters.toLocaleString()} chars{item.pages?" · "+item.pages+" pages":""}</small><button type="button" aria-label={"Remove "+item.name} title="Remove source" onClick={()=>removeNotebookSource(item)}><X size={12}/></button></span>)}</div></div>}<div className="studio-markdown-tools"><span>FORMAT</span><button type="button" title="Bold" aria-label="Bold selected text" onClick={()=>formatSource("bold")}><Bold size={14}/></button><button type="button" title="Section heading" aria-label="Insert section heading" onClick={()=>formatSource("heading")}><Heading1 size={14}/></button><button type="button" title="Bullet list" aria-label="Format as bullet list" onClick={()=>formatSource("bullet")}><List size={14}/></button><button type="button" title="Quote" aria-label="Format as quotation" onClick={()=>formatSource("quote")}><Quote size={14}/></button><small>Markdown formatting</small></div><textarea ref={sourceTextareaRef} aria-label="Notebook material" rows={17} value={source} onMouseUp={captureSelection} onKeyUp={captureSelection} onChange={e=>{setSource(e.target.value);setSelection(null)}} placeholder="Add your lecture notes here. Write Term: Definition to create cards."/><div className="studio-reading-bottom"><span>Select a passage to save a highlighted quote. Cards use Term: Definition lines or sentence-completion prompts.</span><button className="studio-action" onClick={saveSource}><Save size={14}/> Save & update cards</button></div>{selection&&<div className="studio-highlight-draft"><span className="studio-overline">{selection.page} · SELECTED PASSAGE</span><blockquote>{selection.quote}</blockquote><textarea aria-label="Highlight note" rows={2} maxLength={1000} value={highlightNote} onChange={e=>setHighlightNote(e.target.value)} placeholder="Why is this important? Add your own note (optional)."/><div><button className="studio-soft-button" onClick={()=>setSelection(null)}>Cancel</button><button className="studio-action" onClick={saveHighlight}><Save size={14}/> Save highlight</button></div></div>}{(notebook.highlights??[]).length>0&&<section className="studio-highlights"><div className="studio-overline">YOUR ANNOTATIONS · {(notebook.highlights??[]).length}</div>{(notebook.highlights??[]).slice().sort((a,b)=>b.created-a.created).map(h=><article key={h.id}><button className="studio-highlight-quote" onClick={()=>jumpToHighlight(h)}><small>{h.page}</small><span>“{h.quote}”</span>{h.note&&<em>{h.note}</em>}</button><button className="studio-highlight-remove" aria-label="Delete highlight" onClick={()=>removeHighlight(h.id)}><X size={13}/></button></article>)}</section>}</div>}
{mode==="guide"&&<div className="studio-guide"><div className="studio-guide-head"><div><span className="studio-overline">BUILT FROM YOUR SOURCES</span><h2>Your study guide</h2><p>This is an extractive outline of your notes. It keeps your original wording rather than inventing explanations.</p></div><button className="studio-soft-button" onClick={downloadNotes}><Download size={15}/> Source text</button></div><article className="studio-overview"><span className="studio-label">AT A GLANCE</span><p>{studyGuide.overview}</p></article><div className="studio-guide-grid"><section><span className="studio-label">KEY IDEAS</span>{studyGuide.keyPoints.length?studyGuide.keyPoints.map((point,i)=><div className="studio-guide-point" key={i}><b>{String(i+1).padStart(2,"0")}</b><p>{point}</p></div>):<p className="studio-empty-copy">Add fuller notes to extract key ideas.</p>}</section><section><span className="studio-label">TERMS & DEFINITIONS</span>{studyGuide.terms.length?studyGuide.terms.map((term,i)=><details className="studio-guide-term" key={term.id}><summary>{term.front}</summary><p>{term.back}</p></details>):<p className="studio-empty-copy">No clearly labeled terms found yet. Use “Term: Definition” lines to add vocabulary cards.</p>}</section></div><section className="studio-guide-sections"><span className="studio-label">SOURCE OUTLINE</span>{studyGuide.sections.map((item,i)=><button type="button" key={i} className="studio-guide-section" onClick={()=>jumpToOutlineSection(item)}><span><strong style={{paddingLeft:Math.max(0,item.level-1)*12}}>{item.title}</strong><p>{item.summary}</p></span><small>Open source <ArrowRight size={12}/></small></button>)}</section><div className="studio-guide-footer"><span>Nothing here replaces your source document. Review the original material before relying on a summary.</span><button className="studio-action" onClick={()=>setMode("quiz")}><Brain size={15}/> Test my understanding</button></div></div>}
{mode==="map"&&<div className="studio-mindmap"><div className="studio-guide-head"><div><span className="studio-overline">VISUAL SOURCE MAP</span><h2>See how this notebook is organised</h2><p>Built from ideas, terms and sections extracted from your material. Lines connect extracted points to the notebook topic; they do not claim a causal relationship.</p></div><span className="studio-counter">{mapItems.length} branches</span></div>{mapItems.length?<><div className="studio-mindmap-canvas"><svg viewBox="0 0 900 520" role="presentation" aria-hidden="true">{["M450 258 C330 195 230 115 110 66","M450 258 C450 180 450 125 450 66","M450 258 C570 195 670 115 790 66","M450 258 C330 320 230 405 110 455","M450 258 L450 455","M450 258 C570 320 670 405 790 455"].slice(0,mapItems.length).map((d,i)=><path key={i} d={d}/>)}</svg><div className="studio-map-core"><span>YOUR NOTEBOOK</span><strong>{notebook.title}</strong></div>{mapItems.map((item,i)=><button key={i} className={"studio-map-node studio-map-node-"+i+(mapNode===i?" selected":"")} onClick={()=>setMapNode(i)}><small>{item.kind} {String(i+1).padStart(2,"0")}</small><strong>{item.label}</strong></button>)}</div><div className="studio-map-detail">{mapNode!==null&&mapItems[mapNode]?<><div><span className="studio-overline">SOURCE EXCERPT</span><h3>{mapItems[mapNode].label}</h3><p>{mapItems[mapNode].body}</p></div><button className="studio-action" onClick={()=>{setAskQuery(mapItems[mapNode].query);setAskResults(findEvidence(notebook.source,mapItems[mapNode].query));setAskSearched(true);setMode("ask")}}>Find this in my source <ArrowRight size={14}/></button></>:<span>Select a branch to inspect its original source wording.</span>}</div></>:<div className="studio-empty"><GitBranch size={24}/><h3>Not enough source material to map yet</h3><p>Import a document or add fuller notes to identify the main ideas and terms.</p><button onClick={()=>setMode("read")}>Add source material <ArrowRight size={14}/></button></div>}</div>}{mode==="ask"&&<div className="studio-source-search"><div className="studio-mode-header"><div><span className="studio-overline">SOURCE-GROUNDED LOOKUP</span><h2>Find answers in your material</h2></div><span className="studio-counter">{notebook.source.length.toLocaleString()} characters</span></div><p>Search the actual text in this notebook. Results are excerpts from your imported material, not generated answers. Use the page labels to return to the original context.</p><form className="studio-ask-form" onSubmit={runSourceSearch}><input value={askQuery} onChange={e=>setAskQuery(e.target.value)} placeholder="e.g. What determines price elasticity?" aria-label="Find in notes" required minLength={2}/><button className="studio-action"><Search size={15}/> Find evidence</button></form>{askSearched&&<div className="studio-evidence-list">{askResults.length?askResults.map((item,i)=><article key={i} className="studio-evidence"><span>{item.source} · {item.page} · Excerpt {i+1}</span><p>{item.excerpt}</p><small>{Math.round(item.score*100)} relevance score</small></article>):<div className="studio-empty"><Search size={22}/><h3>No matching passage found</h3><p>Try using different words or add more source material to this notebook.</p></div>}</div>}<div className="studio-source-tip"><BookOpen size={15}/> For full AI explanations with citations, connect a model provider later. This tool deliberately shows only what your material actually says.</div></div>}
{mode==="cards"&&(activeCards.length?<div className="studio-flash-workspace"><div className="studio-mode-header"><div><span className="studio-overline">ACTIVE RECALL</span><h2>{due.length?due.length+" cards to review":"Browse your cards"}</h2></div><span className="studio-counter">{Math.min(cardIndex+1,activeCards.length)} / {activeCards.length}</span></div><button className={"studio-flashcard "+(flipped?"flipped":"")} onClick={()=>setFlipped(v=>!v)} aria-label={flipped?"Show question":"Reveal answer"}><span className="studio-overline">{flipped?"ANSWER":"QUESTION"}</span><strong>{flipped?card?.back:card?.front}</strong><span className="studio-flip-hint"><RotateCcw size={13}/> Tap to {flipped?"see question":"reveal answer"}</span></button><div className="studio-card-controls"><button onClick={()=>{setCardIndex(i=>Math.max(0,i-1));setFlipped(false)}} disabled={!cardIndex}><ChevronLeft size={16}/> Previous</button><button onClick={()=>{setCardIndex(i=>Math.min(activeCards.length-1,i+1));setFlipped(false)}} disabled={cardIndex>=activeCards.length-1}>Next <ChevronRight size={16}/></button></div>{flipped&&<div className="studio-fsrs-rating"><div className="studio-fsrs-rating-head"><span>Rate your recall</span>{cardRetention!==null&&<strong>Estimated recall {Math.round(cardRetention*100)}%</strong>}</div>{cardRetention!==null&&<div className="studio-retention-track" role="progressbar" aria-label="Estimated memory retrievability" aria-valuenow={Math.round(cardRetention*100)} aria-valuemin={0} aria-valuemax={100}><span style={{width:Math.round(cardRetention*100)+"%"}}/></div>}<div className="studio-rate"><div><button onClick={()=>rateCard(0)}>Again <small>{cardSchedulePreview?formatReviewDelay(cardSchedulePreview.again):"—"}</small></button><button onClick={()=>rateCard(1)}>Hard <small>{cardSchedulePreview?formatReviewDelay(cardSchedulePreview.hard):"—"}</small></button><button onClick={()=>rateCard(2)}>Good <small>{cardSchedulePreview?formatReviewDelay(cardSchedulePreview.good):"—"}</small></button><button onClick={()=>rateCard(3)}>Easy <small>{cardSchedulePreview?formatReviewDelay(cardSchedulePreview.easy):"—"}</small></button></div></div></div>}</div>:<div className="studio-empty"><Layers size={24}/><h3>No flashcards yet</h3><p>Add lines such as “Concept: Explanation” in Read mode.</p><button onClick={()=>setMode("read")}>Edit notes <ArrowRight size={14}/></button></div>)}
{mode==="quiz"&&(quizCards.length>1?<div className="studio-quiz"><div className="studio-mode-header"><div><span className="studio-overline">PRACTICE MODE</span><h2>Check what you know</h2><p>Choose a question style. Your results update your notebook's learning record.</p></div><span className="studio-counter">{quizIndex+1} / {quizCards.length}</span></div><div className="studio-quiz-formats" role="group" aria-label="Question format"><button className={quizFormat==="choice"?"active":""} onClick={()=>{setQuizFormat("choice");setAnswered(null);setQuizCorrect(null);setWrittenRevealed(false)}}>Multiple choice</button><button className={quizFormat==="truefalse"?"active":""} onClick={()=>{setQuizFormat("truefalse");setAnswered(null);setQuizCorrect(null);setWrittenRevealed(false)}}>True / False</button><button className={quizFormat==="written"?"active":""} onClick={()=>{setQuizFormat("written");setAnswered(null);setQuizCorrect(null);setWrittenAnswer("");setWrittenRevealed(false)}}>Written recall</button></div><div className="studio-quiz-progress"><span style={{width:((quizIndex+1)/quizCards.length*100)+"%"}}/></div><div className="studio-question"><span className="studio-overline">{quizFormat==="choice"?"CHOOSE THE BEST DEFINITION":quizFormat==="truefalse"?"CHECK THE STATEMENT":"RECALL BEFORE REVEALING"}</span><h3>{currentQuiz?.front}</h3>{quizFormat==="truefalse"&&<p className="studio-quiz-claim">{trueFalseClaim?.text}</p>}</div>{quizFormat!=="written"?<div className="studio-answer-list">{quizOptionLabels.map((o,i)=>{const isCorrect=quizFormat==="choice"?o===currentQuiz.back:i===(trueFalseClaim?.isTrue?0:1);const isSelected=answered===i;return <button key={i} aria-label={o} className={answered===null?"":isCorrect?"correct":isSelected?"wrong":""} disabled={answered!==null} onClick={()=>pickAnswer(i)}><span>{quizFormat==="truefalse"?(i===0?"T":"F"):String.fromCharCode(65+i)}</span><strong>{o}</strong>{answered!==null&&isCorrect&&<CheckCircle2 size={18}/>}</button>})}</div>:<div className="studio-written-recall"><label htmlFor="ace-written-answer">Your answer</label><textarea id="ace-written-answer" rows={4} value={writtenAnswer} onChange={e=>setWrittenAnswer(e.target.value)} placeholder="Write the definition or explanation from memory…"/>{!writtenRevealed?<button className="studio-action" disabled={writtenAnswer.trim().length<2} onClick={()=>setWrittenRevealed(true)}>Reveal model answer <ArrowRight size={14}/></button>:<><div className="studio-model-answer"><span className="studio-overline">SOURCE ANSWER</span><p>{currentQuiz?.back}</p><small>Compare your response with the original notebook card. Ace does not pretend to semantically grade free-text answers.</small></div><div className="studio-self-grade"><span>How well did you recall it?</span><button onClick={()=>recordQuizResult(true)}>I remembered it</button><button onClick={()=>recordQuizResult(false)}>I need to review</button></div></>}</div>}{answered!==null&&<div className="studio-feedback" role="status"><strong>{quizCorrect?"Correct — nicely done.":"Add this to your next review."}</strong><p>{quizFormat==="written"?"Your self-assessment has been recorded. "+currentQuiz.back:quizFormat==="truefalse"?(trueFalseClaim?.isTrue?"That statement was true. ":"That statement was false. ")+currentQuiz.back:currentQuiz.back}</p><button className="studio-action" onClick={nextQuizQuestion}>Next question <ArrowRight size={14}/></button></div>}</div>:<div className="studio-empty"><Brain size={24}/><h3>Need at least two study cards</h3><p>Add two or more Term: Definition lines to build multiple-choice and true/false practice. Written recall works with one card.</p><button onClick={()=>setMode("read")}>Edit notes <ArrowRight size={14}/></button></div>)}
{mode==="listen"&&<div className="studio-listen"><div className="studio-audio-emblem"><Headphones size={33}/></div><span className="studio-overline">AUDIO STUDY MODE</span><h2>Listen to your notebook</h2><p>Listen to a structured overview of the key points and terms, or hear the full source read aloud. Playback uses voices available on this device; no audio is sent to a cloud service.</p><label>Audio content <select value={audioMode} onChange={e=>{stopSpeech();setAudioMode(e.target.value as "overview"|"source")}}><option value="overview">Study overview · Key ideas and terms</option><option value="source">Read the full source</option></select></label><label>Voice <select value={voiceURI} onChange={e=>{if(listening)stopSpeech();setVoiceURI(e.target.value)}}>{voices.map(voice=><option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>)}</select></label><label>Listening speed <select value={voiceRate} onChange={e=>{setVoiceRate(Number(e.target.value));if(listening)stopSpeech()}}><option value={0.8}>0.8× · Relaxed</option><option value={1}>1× · Normal</option><option value={1.2}>1.2× · Quick</option><option value={1.5}>1.5× · Fast</option></select></label><div className="studio-audio-controls"><button className="studio-action" disabled={!audioSupported} onClick={listening?stopSpeech:startSpeech}>{listening?<VolumeX size={17}/>:<Volume2 size={17}/>} {audioSupported?listening?"Stop playback":"Play audio lesson":"Speech unavailable on this device"}</button>{listening&&<button className="studio-soft-button" onClick={toggleSpeechPause}>{speechPaused?<Play size={15}/>:<Pause size={15}/>} {speechPaused?"Resume":"Pause"}</button>}</div>{listening&&<div className="studio-audio-progress" aria-live="polite"><span style={{width:(audioProgress.total?audioProgress.current/audioProgress.total*100:0)+"%"}}/>{audioProgress.current} of {audioProgress.total} audio segments</div>}<div className="studio-audio-recorder"><span className="studio-overline">YOUR AUDIO NOTES</span><p>Record your explanation or lecture recap. Audio is stored in this browser's private IndexedDB storage and stays with this notebook on this device.</p><button className="studio-soft-button" onClick={recording?stopRecording:()=>void startRecording()} disabled={!notebook}>{recording?<MicOff size={16}/>:<Mic size={16}/>} {recording?"Stop recording":"Record a recap"}</button>{recordedAudio&&<div className="studio-audio-result"><audio controls src={recordedAudio} aria-label="Selected audio recap"/><button className="studio-soft-button" onClick={downloadRecording}><Download size={15}/> Download audio</button></div>}{savedAudioNotes.length>0&&<div className="studio-saved-audio"><span className="studio-overline">SAVED IN THIS NOTEBOOK · {savedAudioNotes.length}</span>{savedAudioNotes.map(item=><div className="studio-saved-audio-row" key={item.id}><button className={activeAudioNoteId===item.id?"selected":""} onClick={()=>void playSavedAudio(item.id)}><Headphones size={15}/><span><strong>{item.name}</strong><small>{formatAudioDuration(item.durationMs)} · {(item.size/1024/1024).toFixed(1)} MB · {new Date(item.createdAt).toLocaleDateString()}</small></span><Play size={14}/></button><button className="studio-saved-audio-download" aria-label={"Download "+item.name} onClick={()=>void downloadSavedAudio(item.id)}><Download size={14}/></button><button className="studio-saved-audio-delete" aria-label={"Delete "+item.name} onClick={()=>void removeSavedAudio(item.id)}><Trash2 size={14}/></button></div>)}</div>}</div><p className="studio-audio-note">Spoken playback uses device voices; downloading a generated MP3 is not supported. Your own recap can be downloaded as an audio file.</p></div>}
<div className="studio-workspace-footer"><div><Target size={17}/><span><strong>Keep progressing</strong><small>{notebook.attempts?notebook.attempts+" attempts · "+accuracy+"% accuracy":"Your first review is one click away."}</small></span></div><button onClick={()=>{if(!window.confirm("Delete this notebook and all its local progress?"))return;deleteNotebook(notebook.id)}}><Trash2 size={14}/> Delete notebook</button></div></div>}
</div>
}