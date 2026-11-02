export type AudioNoteMeta={id:string;name:string;mimeType:string;size:number;createdAt:number;durationMs:number};
export type StoredAudioNote=AudioNoteMeta&{notebookId:string;blob:Blob};
const DB_NAME="ace-study-audio-v1",STORE="recordings";
function openDatabase():Promise<IDBDatabase>{
 if(typeof indexedDB==="undefined")return Promise.reject(new Error("This browser does not support local audio storage."));
 return new Promise((resolve,reject)=>{const request=indexedDB.open(DB_NAME,1);
  request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE)){const store=db.createObjectStore(STORE,{keyPath:"id"});store.createIndex("notebookId","notebookId",{unique:false});store.createIndex("createdAt","createdAt",{unique:false})}};
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error??new Error("Could not open audio storage."));
 })
}
export async function saveStudyAudio(note:StoredAudioNote):Promise<void>{
 const db=await openDatabase();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).put(note);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error??new Error("Audio could not be saved."));tx.onabort=()=>reject(tx.error??new Error("Audio save was cancelled."))})}finally{db.close()}
}
export async function listStudyAudio(notebookId:string):Promise<AudioNoteMeta[]>{
 const db=await openDatabase();try{return await new Promise<AudioNoteMeta[]>((resolve,reject)=>{const tx=db.transaction(STORE,"readonly");const request=tx.objectStore(STORE).index("notebookId").getAll(notebookId);request.onsuccess=()=>resolve((request.result as StoredAudioNote[]).map(({id,name,mimeType,size,createdAt,durationMs})=>({id,name,mimeType,size,createdAt,durationMs})).sort((a,b)=>b.createdAt-a.createdAt));request.onerror=()=>reject(request.error??new Error("Audio recordings could not be loaded."))})}finally{db.close()}
}
export async function getStudyAudio(id:string):Promise<StoredAudioNote|null>{
 const db=await openDatabase();try{return await new Promise<StoredAudioNote|null>((resolve,reject)=>{const request=db.transaction(STORE,"readonly").objectStore(STORE).get(id);request.onsuccess=()=>resolve((request.result as StoredAudioNote|undefined)??null);request.onerror=()=>reject(request.error??new Error("Audio recording could not be opened."))})}finally{db.close()}
}
export async function deleteStudyAudio(id:string):Promise<void>{
 const db=await openDatabase();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error??new Error("Audio recording could not be deleted."))})}finally{db.close()}
}
export function formatAudioDuration(milliseconds:number):string{const seconds=Math.max(0,Math.round(milliseconds/1000));return Math.floor(seconds/60)+":"+String(seconds%60).padStart(2,"0")}
