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
\ntest.beforeEach(async({page})=>{await page.goto("/studio")});

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
 await page.getByRole("button",{name:"Good",exact:true}).click();
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
 await expect(page.getByText(/PDF text extracted locally/)).toBeVisible({timeout:30000});
 await expect(page.getByLabel("Notebook name")).toHaveValue("economics");
 await expect(page.getByLabel("Study material")).toContainText("Opportunity cost");
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
 await expect(page.getByText("2",{exact:true})).toBeVisible();
 await page.getByRole("button",{name:/Cards due/}).click();
 await expect(page.getByRole("heading",{name:"Everything due, in one session"})).toBeVisible();
 await expect(page.getByText("2 remaining")).toBeVisible();
 await page.getByRole("button",{name:"Reveal answer"}).click();
 await page.getByRole("button",{name:"Good",exact:true}).click();
 await expect(page.getByText("1 remaining")).toBeVisible();
 await page.getByRole("button",{name:"Reveal answer"}).click();
 await page.getByRole("button",{name:"Easy",exact:true}).click();
 await expect(page.getByRole("heading",{name:"You're caught up."})).toBeVisible();
});

test("PowerPoint lecture slides can be imported into a source notebook",async({page})=>{
 await page.getByRole("button",{name:"New notebook"}).click();
 await page.locator('input[type="file"]').setInputFiles({name:"economics-lecture.pptx",mimeType:"application/vnd.openxmlformats-officedocument.presentationml.presentation",buffer:await minimalPptx()});
 await expect(page.getByText(/Slide text extracted locally/)).toBeVisible({timeout:30000});
 await expect(page.getByLabel("Notebook name")).toHaveValue("economics-lecture");
 await expect(page.getByLabel("Study material")).toContainText("Supply");
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
 await expect(page.getByText(/File imported/)).toBeVisible();
 await expect(page.getByLabel("Study material")).toContainText("Assets");
 await page.getByRole("button",{name:"Create notebook"}).click();
 await expect(page.getByRole("heading",{name:"Intro to Accounting-cards"})).toBeVisible();
 await expect(page.getByText("2 cards",{exact:false})).toBeVisible();
});

test("focus timer requires a notebook",async({page})=>{
 await page.getByRole("button",{name:"Focus timer"}).click();
 await expect(page.getByText("25:00")).toBeVisible();
 await page.getByRole("button",{name:"Start"}).click();
 await expect(page.getByText(/Open a notebook before starting/)).toBeVisible();
});
