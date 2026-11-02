"use client";

import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Download, ExternalLink, FileText, UploadCloud, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Paper = { id: string; title: string; subject: string; provider: string; url: string; attribution: string; description: string | null };
type Answer = { id: string; title: string; storage_path: string; status: string; created_at: string; related_paper_id: string | null };

export default function CourseExamPapers({ user, code, courseTitle, onSignIn }: { user: User | null; code: string; courseTitle: string; onSignIn?: () => void }) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [pending, setPending] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState("");
  const [uploadingFor, setUploadingFor] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [notice, setNotice] = useState("");
  const [reading, setReading] = useState<Paper | null>(null);
  const [openingAnswer, setOpeningAnswer] = useState("");

  async function load() {
    if (!supabase) { setIssue("Exam papers are unavailable while the library is disconnected."); setLoading(false); return; }
    setLoading(true); setIssue("");
    const ownRequest = user ? supabase.from("ace_resources").select("id,title,storage_path,status,created_at,related_paper_id")
        .eq("uploader_id", user.id).eq("kind", "Model answer").eq("course_code", code).eq("status", "pending").order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null });
    const paperQuery = supabase.from("ace_open_resources").select("id,title,subject,provider,url,attribution,description")
      .eq("kind", "Past paper").eq("provider", "MUST examination archive").contains("related_codes", [code]).order("title");
    const [paperRows, answerRows, ownRows] = await Promise.all([
      user ? paperQuery : paperQuery.eq("hidden", false),
      supabase.from("ace_resources").select("id,title,storage_path,status,created_at,related_paper_id")
        .eq("status", "approved").eq("kind", "Model answer").eq("course_code", code).order("created_at", { ascending: false }),
      ownRequest
    ]);
    if (paperRows.error) setIssue("Past papers could not be loaded. Try again.");
    else setPapers((paperRows.data ?? []) as Paper[]);
    if (answerRows.error || ownRows.error) setIssue("Some model-answer submissions could not be loaded.");
    else {
      setAnswers((answerRows.data ?? []) as Answer[]);
      setPending((ownRows.data ?? []) as Answer[]);
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, [code, user?.id]);

  async function submitAnswer(paper: Paper) {
    if (!supabase || !user || !file || uploadingFor) return;
    if (!file.name.toLowerCase().endsWith(".pdf") || file.size < 8 || file.size > 15 * 1024 * 1024) {
      setNotice("Choose a PDF between 8 bytes and 15 MB."); return;
    }
    const signature = await file.slice(0, 5).text();
    if (signature !== "%PDF-") { setNotice("This file is not a valid PDF."); return; }
    setUploadingFor(paper.id); setNotice("Uploading your model answer…");
    const path = user.id + "/" + crypto.randomUUID() + ".pdf";
    try {
      const upload = await supabase.storage.from("ace-submissions").upload(path, file, { contentType: "application/pdf", upsert: false });
      if (upload.error) throw new Error(upload.error.message);
      const saved = await supabase.from("ace_resources").insert({
        title: "Model answer — " + paper.title,
        description: "Student-submitted model answer linked to " + paper.title + ". Pending content review.",
        course_code: code,
        course_name: courseTitle,
        kind: "Model answer",
        storage_path: path,
        uploader_id: user.id,
        status: "pending",
        related_paper_id: paper.id
      }).select("id").single();
      if (saved.error) {
        await supabase.storage.from("ace-submissions").remove([path]);
        throw new Error(saved.error.message);
      }
      setFile(null);
      setNotice("Submitted. Your PDF is private until a reviewer approves it.");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? "Upload failed: " + error.message : "Upload failed. Try again.");
    } finally { setUploadingFor(""); }
  }

  async function openAnswer(answer: Answer) {
    if (!supabase || openingAnswer) return;
    setOpeningAnswer(answer.id);
    const popup = window.open("about:blank", "_blank");
    const { data, error } = await supabase.storage.from("ace-submissions").createSignedUrl(answer.storage_path, 300);
    setOpeningAnswer("");
    if (error || !data?.signedUrl) { popup?.close(); setNotice("This answer could not be opened. Try again."); return; }
    if (popup) popup.location.href = data.signedUrl;
    else window.location.assign(data.signedUrl);
  }

  return (
    <section className="ace-exam-papers">
      <div className="ace-exam-heading">
        <div><span className="studio-overline">EXAM PREPARATION</span><h2>Past papers & model answers</h2><p>Work through the original paper, attempt it yourself, then compare with a submitted answer where one is available.</p></div>
        <span className="ace-exam-count"><FileText size={16}/>{papers.length} papers</span>
      </div>
      <div className="ace-exam-integrity">Official past papers are identified by source. Model answers are student submissions, not official marking schemes unless explicitly confirmed by MUST teaching staff.</div>
      {loading ? <p className="muted" role="status">Loading exam papers…</p> : papers.length ? (
        <div className="ace-paper-list">
          {papers.map(paper => {
            const approved = answers.filter(answer => answer.related_paper_id === paper.id);
            const own = pending.filter(answer => answer.related_paper_id === paper.id);
            return (
              <article className="ace-paper-card" key={paper.id}>
                <div className="ace-paper-card-main">
                  <span className="ace-paper-source">{paper.provider} · {paper.subject}</span>
                  <h3>{paper.title}</h3>
                  <p>{paper.description || "Official university examination paper."}</p>
                  <div className="ace-paper-actions">
                    <button className="btn secondary" onClick={() => setReading(paper)}><BookOpen size={14}/> Read in Ace</button>
                    <a className="ace-paper-external" href={paper.url} target="_blank" rel="noopener noreferrer">Original PDF <ExternalLink size={13}/></a>
                  </div>
                </div>
                <div className="ace-answer-panel">
                  <div className="ace-answer-panel-title"><CheckCircle2 size={15}/><strong>Model answers</strong><span>{approved.length} approved</span></div>
                  {approved.length ? approved.map(answer => <button className="ace-answer-link" key={answer.id} onClick={() => void openAnswer(answer)} disabled={openingAnswer === answer.id}><FileText size={14}/><span>{answer.title}</span><Download size={14}/></button>) : <p className="ace-answer-empty">No approved model answer for this paper yet.</p>}
                  {own.map(answer => <p className="ace-answer-pending" key={answer.id}>Your submission is awaiting review: {answer.title}</p>)}
                  {user ? <details className="ace-answer-upload">
                    <summary><UploadCloud size={14}/> Upload a model answer for this paper</summary>
                    <p>Upload your own worked solution as a PDF. It stays private until reviewed.</p>
                    <input type="file" accept="application/pdf,.pdf" onChange={event => setFile(event.target.files?.[0] ?? null)} aria-label={"Choose model answer PDF for " + paper.title}/>
                    <button className="btn" onClick={() => void submitAnswer(paper)} disabled={!file || !!uploadingFor}>{uploadingFor === paper.id ? "Uploading…" : "Submit for review"}</button>
                  </details> : <button className="text-link" onClick={onSignIn}>Sign in to contribute a model answer</button>}
                </div>
              </article>
            );
          })}
        </div>
      ) : <div className="ace-exam-empty">{user
        ? "No MUST past paper has been mapped to this unit yet. We will add papers only when the source and unit code can be checked."
        : "Sign in to view the authenticated MUST examination archive for this unit. Only verified paper-to-unit mappings are shown."}</div>}
      {issue && <p className="status" role="alert">{issue} <button className="text-link" onClick={() => void load()}>Retry</button></p>}
      {notice && <p className="status" role="status">{notice}</p>}
      {reading && <div className="ace-paper-reader-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setReading(null); }}>
        <section className="ace-paper-reader" role="dialog" aria-modal="true" aria-label={reading.title}>
          <header><div><span className="studio-overline">MUST EXAMINATION ARCHIVE</span><h2>{reading.title}</h2></div><button className="theme-btn" onClick={() => setReading(null)} aria-label="Close paper"><X size={17}/></button></header>
          <iframe src={reading.url} title={reading.title} loading="lazy"/>
          <a href={reading.url} target="_blank" rel="noopener noreferrer">If the PDF does not display, open the original paper <ExternalLink size={13}/></a>
        </section>
      </div>}
    </section>
  );
}
