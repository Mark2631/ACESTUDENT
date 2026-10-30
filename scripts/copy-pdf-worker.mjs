import { copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "node_modules/pdfjs-dist/build/pdf.worker.mjs");
const target = resolve(root, "public/pdf.worker.mjs");

await copyFile(source, target);
process.stdout.write("PDF.js worker copied to public/pdf.worker.mjs\n");
