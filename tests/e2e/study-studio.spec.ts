import {test,expect} from "@playwright/test";
import type {Buffer} from "node:buffer";
import JSZip from "jszip";

function minimalPdf():Buffer{
 const objects=[
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ""
 ];
 const stream="BT /F1 16 Tf 50 700 Td (Opportunity cost: value of the next best alternative given up.) Tj ET";
 objects[4]="<< /Length "+Buffer.byteLength(stream)+" >>\nstream\n"+stream+"\nendstream";
 let pdf="%PDF-1.4\n";const offsets=[0];
 for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(pdf));pdf+=(i+1)+" 0 obj\n"+objects[i]+"\nendobj\n"}
 const xref=Buffer.byteLength(pdf);pdf+="xref\n0 6\n0000000000 65535 f \n";
 for(const offset of offsets.slice(1))pdf+=String(offset).padStart(10,"0")+" 00000 n \n";
 pdf+="trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n"+xref+"\n%%EOF";
 return Buffer.from(pdf,"binary");
}
async function minimalPptx():Promise<Buffer>{
 const zip=new JSZip();
 zip.file("ppt/slides/slide1.xml",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>Supply: The quantity producers are willing to sell at a given price.</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>`);
 return Buffer.from(await zip.generateAsync({type:"nodebuffer"}));
}

test.beforeEach(async({page})=>{await page.goto("/studio")});

test("guest can create a notebook, review cards and test understanding",async({page})=>{
 await page.getByRole("button",{name:"New notebook"}).click();
 await page.getByLabel("Notebook name").fill("Intro to Economics");
 await page.getByLabel("Course code").fill("ECO 101");
 await page.getByLabel("Tags").fill("economics, fundamentals");
 await page.getByLabel("Study material").fill([
  "Opportunity cost: The value of the next best alternative given up when making a choice.",
  "Supply: The quantity producers are willing to sell at a given price."
 ].join("\n"));
 await page.getByRole("button",{name:"Create notebook"}).click();
 await expect(page.getByRole("heading",{name:"Intro to Economics"})).toBeVisible();
 await page.getByRole("tab",{name:"Study guide"}).click();
 await expect(page.getByRole("heading",{name:"Your study guide"})).toBeVisible();
 await page.getByRole("tab",{name:"Find"}).click();
 await page.getByRole("textbox",{name:"Find in notes"}).fill("opportunity cost");
 await page.getByRole("button",{name:"Find evidence"}).click();
 await expect(page.getByText(/value of the next best alternative/)).toBeVisible();
 await page.getByRole("tab",{name:"Flashcards"}).click();
 await expect(page.getByText("Opportunity cost")).toBeVisible();
 await page.getByRole("button",{name:"Reveal answer"}).click();
 await expect(page.getByText(/next best alternative given up/)).toBeVisible();
 await page.getByRole("button",{name:/^Good\b/}).click();
 await page.getByRole("tab",{name:"Quick test"}).click();
 await expect(page.getByText("Check what you know")).toBeVisible();
 await page.getByRole("button",{name:/The value of the next best alternative given up/}).click();
 await expect(page.getByText(/Correct — nicely done/)).toBeVisible();
});

test("guest notebooks survive reload and remain searchable",async({page})=>{
 await page.getByRole("button",{name:"New notebook"}).click();
 await page.getByLabel("Notebook name").fill("Research Methods");
 await page.getByLabel("Study material").fill("Hypothesis: A testable statement predicting a relationship between variables.");
 await page.getByRole("button",{name:"Create notebook"}).click();
 await expect(page.getByRole("heading",{name:"Research Methods"})).toBeVisible();
 await page.getByRole("button",{name:"All notebooks"}).click();
 await page.reload();
 await expect(page.getByText("Research Methods")).toBeVisible();
 await page.getByRole("textbox",{name:"Search notebooks"}).fill("Research");
 await expect(page.getByText("Research Methods")).toBeVisible();
 await page.getByRole("textbox",{name:"Search notebooks"}).fill("No matching content");
 await expect(page.getByText("No matching notebooks")).toBeVisible();
});

test("a text-based PDF can be imported and converted into a notebook",async({page})=>{
 await page.getByRole("button",{name:"New notebook"}).click();
 await page.locator('input[type="file"]').setInputFiles({name:"economics.pdf",mimeType:"application/pdf",buffer:minimalPdf()});
 await expect(page.getByText(/Added economics\.pdf/)).toBeVisible({timeout:30000});
 await expect(page.getByLabel("Notebook name")).toHaveValue("economics");
 await expect(page.getByLabel("Study material")).toHaveValue(/Opportunity cost/);
 await page.getByRole("button",{name:"Create notebook"}).click();
 await expect(page.getByRole("heading",{name:"economics"})).toBeVisible();
 await page.getByRole("tab",{name:"Flashcards"}).click();
 await expect(page.getByText("Opportunity cost")).toBeVisible();
});

test("daily review combines due cards from every notebook",async({page})=>{
 await page.getByRole("button",{name:"New notebook"}).click();
 await page.getByLabel("Notebook name").fill("Statistics basics");
 await page.getByLabel("Study material").fill([
  "Mean: The arithmetic average of a dataset.",
  "Median: The middle value when observations are ordered."
 ].join(String.fromCharCode(10)));
 await page.getByRole("button",{name:"Create notebook"}).click();
 await page.getByRole("button",{name:"All notebooks"}).click();
 await expect(page.getByRole("button",{name:/Cards due/})).toBeVisible();
 await page.getByRole("button",{name:/Cards due/}).click();
 await expect(page.getByRole("heading",{name:"Everything due, in one session"})).toBeVisible();
 await expect(page.getByText("2 remaining")).toBeVisible();
 await page.getByRole("button",{name:"Reveal answer"}).click();
 await page.getByRole("button",{name:/^Good\b/}).click();
 await expect(page.getByText("1 remaining")).toBeVisible();
 await page.getByRole("button",{name:"Reveal answer"}).click();
 await page.getByRole("button",{name:/^Easy\b/}).click();
 await expect(page.getByRole("heading",{name:"You're caught up."})).toBeVisible();
});

test("PowerPoint lecture slides can be imported into a source notebook",async({page})=>{
 await page.getByRole("button",{name:"New notebook"}).click();
 await page.locator('input[type="file"]').setInputFiles({name:"economics-lecture.pptx",mimeType:"application/vnd.openxmlformats-officedocument.presentationml.presentation",buffer:await minimalPptx()});
 await expect(page.getByText(/Slide text extracted locally/)).toBeVisible({timeout:30000});
 await expect(page.getByLabel("Notebook name")).toHaveValue("economics-lecture");
 await expect(page.getByLabel("Study material")).toHaveValue(/Supply/);
 await page.getByRole("button",{name:"Create notebook"}).click();
 await expect(page.getByRole("heading",{name:"economics-lecture"})).toBeVisible();
 await page.getByRole("tab",{name:"Flashcards"}).click();
 await expect(page.getByText("Supply")).toBeVisible();
});

test("Anki CSV export can be imported back into Ace without losing card text",async({page})=>{
 await page.getByRole("button",{name:"New notebook"}).click();
 await page.getByLabel("Notebook name").fill("Intro to Accounting");
 await page.getByLabel("Study material").fill([
  "Assets: Resources controlled by an entity.",
  "Liabilities: Present obligations of an entity."
 ].join(String.fromCharCode(10)));
 await page.getByRole("button",{name:"Create notebook"}).click();
 const downloadPromise=page.waitForEvent("download");
 await page.getByRole("button",{name:"Anki CSV"}).click();
 const download=await downloadPromise;
 expect(download.suggestedFilename()).toMatch(/Intro to Accounting-cards\.csv$/);
 const downloadPath=await download.path();
 await page.getByRole("button",{name:"All notebooks"}).click();
 await page.getByRole("button",{name:"New notebook"}).click();
 await page.locator('input[type="file"]').setInputFiles(downloadPath!);
 await expect(page.getByText(/Added Intro to Accounting-cards\.csv/)).toBeVisible();
 await expect(page.getByLabel("Study material")).toHaveValue(/Assets/);
 await page.getByRole("button",{name:"Create notebook"}).click();
 await expect(page.getByRole("heading",{name:"Intro to Accounting-cards"})).toBeVisible();
 await expect(page.getByText("2 cards",{exact:false})).toBeVisible();
});

test("students can highlight source passages and keep private annotations",async({page})=>{
 await page.getByRole("button",{name:"New notebook"}).click();
 await page.getByLabel("Notebook name").fill("Business Law notes");
 const source="The rule of law requires that public power is exercised according to publicly known laws, applied consistently and reviewed independently.\n\nLegal certainty helps people understand the consequences of their actions.";
 await page.getByLabel("Study material").fill(source);
 await page.getByRole("button",{name:"Create notebook"}).click();
 const textarea=page.getByRole("textbox",{name:"Notebook material"});
 await textarea.evaluate((element)=>{
  const field=element as HTMLTextAreaElement;
  const start=field.value.indexOf("public power");
  field.focus();field.setSelectionRange(start,start+("public power is exercised according to publicly known laws").length);
  field.dispatchEvent(new Event("mouseup",{bubbles:true}));
 });
 await expect(page.getByText(/SELECTED PASSAGE/)).toBeVisible();
 await page.getByLabel("Highlight note").fill("Remember the limits and accountability of government.");
 await page.getByRole("button",{name:"Save highlight"}).click();
 await expect(page.getByText(/Remember the limits and accountability/)).toBeVisible();
 await page.getByRole("button",{name:"All notebooks"}).click();
 await page.getByRole("button",{name:/Business Law notes/}).click();
 await expect(page.getByText(/Remember the limits and accountability/)).toBeVisible();
});

test("multiple files become one source collection inside a notebook",async({page})=>{
 await page.getByRole("button",{name:"New notebook"}).click();
 await page.locator('input[type="file"]').setInputFiles([
  {name:"economics-notes.txt",mimeType:"text/plain",buffer:Buffer.from("Opportunity cost: The value of the next best alternative given up.")},
  {name:"market-structure.md",mimeType:"text/markdown",buffer:Buffer.from("Perfect competition: A market structure with many buyers and sellers.")},
 ]);
 await expect(page.getByText(/Added market-structure.md/)).toBeVisible();
 await expect(page.getByLabel("Notebook name")).toHaveValue("economics-notes");
 await expect(page.getByLabel("Study material")).toHaveValue(/Perfect competition/);
 await expect(page.getByLabel("Study material")).toContainText("Opportunity cost");
 await page.getByRole("button",{name:"Create notebook"}).click();
 await expect(page.getByRole("heading",{name:"economics-notes"})).toBeVisible();
 await expect(page.getByText("2 SOURCES IN THIS NOTEBOOK")).toBeVisible();
 await expect(page.locator(".studio-source-manifest strong").filter({hasText:"market-structure.md"})).toBeVisible();
});

test("a second source can be attached to an existing notebook",async({page})=>{
 await page.getByRole("button",{name:"New notebook"}).click();
 await page.getByLabel("Notebook name").fill("Public policy");
 await page.getByLabel("Study material").fill("Governance: The processes through which decisions are made and implemented.");
 await page.getByRole("button",{name:"Create notebook"}).click();
 await page.locator(".studio-reading-tools").getByRole("button",{name:"Add source"}).click();
 await page.locator('input[type="file"]').setInputFiles({name:"public-finance.txt",mimeType:"text/plain",buffer:Buffer.from("Public expenditure: Government spending on goods, services and transfers.")});
 await expect(page.getByText(/Added public-finance.txt to Public policy/)).toBeVisible();
 await expect(page.getByText("1 SOURCES IN THIS NOTEBOOK")).toBeVisible();
 await expect(page.getByRole("textbox",{name:"Notebook material"})).toHaveValue(/Public expenditure/);
});

test("focus timer requires a notebook",async({page})=>{
 await page.getByRole("button",{name:"Focus timer"}).click();
 await expect(page.getByText("25:00")).toBeVisible();
 await page.locator(".studio-timer").getByRole("button",{name:"Start"}).click();
 await expect(page.getByText(/Open a notebook before starting/)).toBeVisible();
});


test("source mind map turns notebook ideas into an inspectable visual index",async({page})=>{
 await page.getByRole("button",{name:"New notebook"}).click();
 await page.getByLabel("Notebook name").fill("Principles of Economics");
 await page.getByLabel("Study material").fill([
  "Opportunity cost: The value of the next best alternative given up when making a choice.",
  "Supply: The quantity producers are willing to sell at a given price.",
  "Demand: The quantity consumers are willing and able to purchase at different prices."
 ].join(String.fromCharCode(10)));
 await page.getByRole("button",{name:"Create notebook"}).click();
 await page.getByRole("tab",{name:"Mind map"}).click();
 await expect(page.getByRole("heading",{name:"See how this notebook is organised"})).toBeVisible();
 await expect(page.getByRole("heading",{name:"Principles of Economics"})).toBeVisible();
 await expect(page.getByRole("button",{name:/Key idea 01/})).toBeVisible();
 await page.getByRole("button",{name:/Key idea 01/}).click();
 await expect(page.getByText(/The value of the next best alternative/)).toBeVisible();
 await page.getByRole("button",{name:/Find this in my source/}).click();
 await expect(page.getByRole("heading",{name:"Find answers in your material"})).toBeVisible();
 await expect(page.getByText(/value of the next best alternative/)).toBeVisible();
});


test("practice supports multiple choice, true-false and written self-recall",async({page})=>{
 await page.getByRole("button",{name:"New notebook"}).click();
 await page.getByLabel("Notebook name").fill("Basic Economics");
 await page.getByLabel("Study material").fill([
  "Opportunity cost: The value of the next best alternative given up when making a choice.",
  "Supply: The quantity producers are willing to sell at a given price."
 ].join(String.fromCharCode(10)));
 await page.getByRole("button",{name:"Create notebook"}).click();
 await page.getByRole("tab",{name:"Quick test"}).click();
 await page.getByRole("button",{name:"True / False"}).click();
 await page.getByRole("button",{name:"True",exact:true}).click();
 await expect(page.getByText(/Correct — nicely done/)).toBeVisible();
 await page.getByRole("button",{name:"Next question"}).click();
 await page.getByRole("button",{name:"False",exact:true}).click();
 await expect(page.getByText(/Correct — nicely done/)).toBeVisible();
 await page.getByRole("button",{name:"Written recall"}).click();
 await page.getByLabel("Your answer").fill("Producers supply goods and services at different prices.");
 await page.getByRole("button",{name:"Reveal model answer"}).click();
 await expect(page.getByText(/The quantity producers are willing to sell/)).toBeVisible();
 await page.getByRole("button",{name:"I remembered it"}).click();
 await expect(page.getByText(/self-assessment has been recorded/)).toBeVisible();
});


test("interleaved practice alternates between independent notebooks",async({page})=>{
 for(const notebook of [
  {title:"Microeconomics",source:["Opportunity cost: The value of the next best alternative forgone.","Demand: The quantity consumers are willing to buy at each price."]},
  {title:"Management",source:["Delegation: Assigning responsibility and authority to another person.","Planning: Defining goals and deciding how to achieve them."]}
 ]){
  await page.getByRole("button",{name:"New notebook"}).click();
  await page.getByLabel("Notebook name").fill(notebook.title);
  await page.getByLabel("Study material").fill(notebook.source.join(String.fromCharCode(10)));
  await page.getByRole("button",{name:"Create notebook"}).click();
  await page.getByRole("button",{name:"All notebooks"}).click();
 }
 await expect(page.getByRole("heading",{name:"My notebooks"})).toBeVisible();
 await page.getByRole("button",{name:"Start mixed practice"}).click();
 await expect(page.getByRole("heading",{name:"Think across your subjects"})).toBeVisible();
 const firstNotebook=await page.locator(".studio-global-source>span").textContent();
 expect(["Microeconomics","Management"]).toContain(firstNotebook?.trim());
 await page.locator(".studio-answer-list button").first().click();
 await page.getByRole("button",{name:"Next question"}).click();
 const secondNotebook=await page.locator(".studio-global-source>span").textContent();
 expect(["Microeconomics","Management"]).toContain(secondNotebook?.trim());
 expect(secondNotebook?.trim()).not.toBe(firstNotebook?.trim());
});

test("deleting a guest notebook removes it from the local library",async({page})=>{
 await page.getByRole("button",{name:"New notebook"}).click();
 await page.getByLabel("Notebook name").fill("Temporary revision notes");
 await page.getByLabel("Study material").fill("Revenue: Income generated from ordinary business activities.");
 await page.getByRole("button",{name:"Create notebook"}).click();
 page.once("dialog",dialog=>dialog.accept());
 await page.getByRole("button",{name:"Delete notebook"}).click();
 await expect(page.getByText("Temporary revision notes")).toHaveCount(0);
});


test("weekly study goal persists on the device",async({page})=>{
 await expect(page.getByRole("combobox",{name:"Weekly study goal"})).toHaveValue("180");
 await page.getByLabel("Weekly study goal").selectOption("240");
 await expect(page.getByLabel("Weekly study goal")).toHaveValue("240");
 await page.reload();
 await expect(page.getByLabel("Weekly study goal")).toHaveValue("240");
});


test("audio recaps persist in the notebook after reload",async({page})=>{
 await page.addInitScript(()=>{
  const stream=new MediaStream();
  Object.defineProperty(navigator.mediaDevices,"getUserMedia",{configurable:true,value:async()=>stream});
  class FakeRecorder{
   mimeType="audio/webm";state="inactive";ondataavailable:((event:BlobEvent)=>void)|null=null;onstop:(()=>void)|null=null;
   static isTypeSupported(){return true}
   constructor(_stream:MediaStream,_options?:MediaRecorderOptions){}
   start(){this.state="recording"}
   stop(){this.state="inactive";const blob=new Blob(["fake audio data"],{type:this.mimeType});queueMicrotask(()=>{this.ondataavailable?.({data:blob} as BlobEvent);this.onstop?.()})}
  }
  Object.defineProperty(window,"MediaRecorder",{configurable:true,value:FakeRecorder});
 });
 await page.reload();
 await page.getByRole("button",{name:"New notebook"}).click();
 await page.getByLabel("Notebook name").fill("Audio revision");
 await page.getByLabel("Study material").fill("Revision: Revisiting material to improve retention.");
 await page.getByRole("button",{name:"Create notebook"}).click();
 await page.getByRole("tab",{name:"Listen"}).click();
 await page.getByRole("button",{name:"Record a recap"}).click();
 await page.getByRole("button",{name:"Stop recording"}).click();
 await expect(page.getByText(/SAVED IN THIS NOTEBOOK/)).toBeVisible();
 await page.reload();
 await page.getByRole("button",{name:"Audio revision"}).click();
 await page.getByRole("tab",{name:"Listen"}).click();
 await expect(page.getByText(/SAVED IN THIS NOTEBOOK/)).toBeVisible();
 await expect(page.getByText(/Audio revision · Recap/)).toBeVisible();
});


test("complete Ace backup carries saved audio recaps into a fresh notebook",async({page})=>{
 await page.addInitScript(()=>{
  const stream=new MediaStream();
  Object.defineProperty(navigator.mediaDevices,"getUserMedia",{configurable:true,value:async()=>stream});
  class FakeRecorder{
   mimeType="audio/webm";state="inactive";ondataavailable:((event:BlobEvent)=>void)|null=null;onstop:(()=>void)|null=null;
   static isTypeSupported(){return true}
   constructor(_stream:MediaStream,_options?:MediaRecorderOptions){}
   start(){this.state="recording"}
   stop(){this.state="inactive";const blob=new Blob(["portable audio note"],{type:this.mimeType});queueMicrotask(()=>{this.ondataavailable?.({data:blob} as BlobEvent);this.onstop?.()})}
  }
  Object.defineProperty(window,"MediaRecorder",{configurable:true,value:FakeRecorder});
 });
 await page.reload();
 await page.getByRole("button",{name:"New notebook"}).click();
 await page.getByLabel("Notebook name").fill("Portable lecture notes");
 await page.getByLabel("Study material").fill("Delegation: Assigning responsibility and authority to another person.");
 await page.getByRole("button",{name:"Create notebook"}).click();
 await page.getByRole("tab",{name:"Listen"}).click();
 await page.getByRole("button",{name:"Record a recap"}).click();
 await page.getByRole("button",{name:"Stop recording"}).click();
 await expect(page.getByText(/SAVED IN THIS NOTEBOOK/)).toBeVisible();
 const downloadPromise=page.waitForEvent("download");
 await page.getByRole("button",{name:"Full backup"}).click();
 const download=await downloadPromise;
 expect(download.suggestedFilename()).toMatch(/Portable lecture notes\.ace\.zip$/);
 const stream=await download.createReadStream();
 if(!stream)throw new Error("Backup download stream unavailable");
 const chunks:Buffer[]=[];
 for await(const chunk of stream)chunks.push(Buffer.from(chunk));
 const archive=Buffer.concat(chunks);
 await page.getByRole("button",{name:"New notebook"}).click();
 await page.locator('input[type="file"]').setInputFiles({name:"Portable lecture notes.ace.zip",mimeType:"application/zip",buffer:archive});
 await expect(page.getByRole("heading",{name:"Portable lecture notes"})).toBeVisible();
 await expect(page.getByText(/Complete notebook restored with 1 audio note/)).toBeVisible();
 await page.getByRole("tab",{name:"Listen"}).click();
 await expect(page.getByText(/SAVED IN THIS NOTEBOOK/)).toBeVisible();
 await expect(page.getByText(/Portable lecture notes · Recap/)).toBeVisible();
});


test("students can remove one source without deleting the other source",async({page})=>{
 await page.getByRole("button",{name:"New notebook"}).click();
 await page.locator('input[type="file"]').setInputFiles([
  {name:"economics-core.txt",mimeType:"text/plain",buffer:Buffer.from("Opportunity cost: The value of the next best alternative forgone.")},
  {name:"economics-markets.txt",mimeType:"text/plain",buffer:Buffer.from("Market equilibrium: A price at which quantity supplied equals quantity demanded.")}
 ]);
 await expect(page.getByText(/Added economics-markets.txt/)).toBeVisible();
 await page.getByRole("button",{name:"Remove economics-core.txt"}).click();
 await expect(page.locator(".studio-draft-sources strong").filter({hasText:"economics-core.txt"})).toHaveCount(0);
 await expect(page.locator(".studio-draft-sources strong").filter({hasText:"economics-markets.txt"})).toBeVisible();
 await expect(page.getByLabel("Study material")).not.toHaveValue(/Opportunity cost/);
 await expect(page.getByLabel("Study material")).toHaveValue(/Market equilibrium/);
 await page.getByRole("button",{name:"Create notebook"}).click();
 await expect(page.getByRole("heading",{name:"economics-core"})).toBeVisible();
 await expect(page.getByText("1 SOURCES IN THIS NOTEBOOK")).toBeVisible();
 await page.getByRole("button",{name:"Remove economics-markets.txt"}).click();
 await expect(page.getByText("0 SOURCES IN THIS NOTEBOOK")).toHaveCount(0);
 await expect(page.getByRole("textbox",{name:"Notebook material"})).not.toHaveValue(/Market equilibrium/);
});


test("new recall cards use FSRS memory states and persist the next review forecast",async({page})=>{
 await page.getByRole("button",{name:"New notebook"}).click();
 await page.getByLabel("Notebook name").fill("FSRS scheduling");
 await page.getByLabel("Study material").fill("Retrieval practice: Recalling information from memory strengthens later access.");
 await page.getByRole("button",{name:"Create notebook"}).click();
 await page.getByRole("tab",{name:"Flashcards"}).click();
 await page.getByRole("button",{name:"Reveal answer"}).click();
 await expect(page.getByText(/Rate your recall/)).toBeVisible();
 await expect(page.getByRole("button",{name:/Good/})).toBeVisible();
 await page.getByRole("button",{name:/Good/}).click();
 const saved=await page.evaluate(()=>{
  const raw=localStorage.getItem("ace-studio-notebooks-v1:guest");
  return raw?JSON.parse(raw):[];
 });
 const card=saved[0]?.cards?.[0];
 expect(card?.memory).toBeTruthy();
 expect(card.memory.stability).toBeGreaterThan(0);
 expect(card.memory.difficulty).toBeGreaterThan(0);
 expect(card.memory.reps).toBe(1);
 expect(card.memory.last_review).toBeTruthy();
 expect(Date.parse(card.memory.due)).toBeGreaterThan(Date.now());
 expect(card.next).toBe(Date.parse(card.memory.due));
});


test("the generated source outline opens the original section in the notebook",async({page})=>{
 const notes=[
  "# Introduction",
  "A market is a set of buyers and sellers whose actions determine prices and the allocation of resources. Market participants respond to changing information and incentives.",
  "## Market equilibrium",
  "Market equilibrium occurs when the quantity supplied equals the quantity demanded at a given price. A change in demand or supply can move the equilibrium price and quantity.",
  "## Price elasticity",
  "Price elasticity measures how responsive quantity demanded or supplied is to a change in price. Elasticity is calculated as a percentage change divided by another percentage change."
 ].join(String.fromCharCode(10,10));
 await page.getByRole("button",{name:"New notebook"}).click();
 await page.getByLabel("Notebook name").fill("Market analysis");
 await page.getByLabel("Study material").fill(notes);
 await page.getByRole("button",{name:"Create notebook"}).click();
 await page.getByRole("tab",{name:"Study guide"}).click();
 const section=page.locator(".studio-guide-section").filter({hasText:/^Market equilibrium/});
 await expect(section).toBeVisible();
 await expect(section).toContainText(/quantity supplied equals the quantity demanded/);
 await section.click();
 const textarea=page.getByRole("textbox",{name:"Notebook material"});
 await expect(textarea).toBeFocused();
 const selected=await textarea.evaluate((element)=>{
  const field=element as HTMLTextAreaElement;
  return field.value.slice(field.selectionStart,field.selectionEnd);
 });
 expect(selected).toContain("Market equilibrium occurs");
});


test("source focus limits evidence search and returns to all sources",async({page})=>{
 await page.getByRole("button",{name:"New notebook"}).click();
 await page.locator('input[type="file"]').setInputFiles([
  {name:"opportunity-cost.txt",mimeType:"text/plain",buffer:Buffer.from("Opportunity cost is the value of the next best alternative that is forgone when making a choice.")},
  {name:"market-structure.txt",mimeType:"text/plain",buffer:Buffer.from("Perfect competition is a market structure with many buyers and sellers and price-taking firms.")}
 ]);
 await page.getByRole("button",{name:"Create notebook"}).click();
 await expect(page.getByLabel("Source selection")).toBeVisible();
 await page.getByLabel("opportunity-cost.txt").uncheck();
 await expect(page.getByText("1 of 2 selected")).toBeVisible();
 await page.getByRole("tab",{name:"Find"}).click();
 await page.getByRole("textbox",{name:"Find in notes"}).fill("opportunity cost forgone alternative");
 await page.getByRole("button",{name:"Find evidence"}).click();
 await expect(page.getByRole("heading",{name:"No matching passage found"})).toBeVisible();
 await page.getByRole("button",{name:"Select all"}).click();
 await page.getByRole("button",{name:"Find evidence"}).click();
 await expect(page.getByText(/next best alternative that is forgone/)).toBeVisible();
});
