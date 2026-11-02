"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, ClipboardList, FileText, GraduationCap, Search, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Unit = { code: string; title: string; year_of_study: number | null; semester: number | null; pathway: string };
type Quiz = { id: string; course_code: string };
type Paper = { id: string; title: string; subject: string; kind: string; provider: string; url: string; description: string | null; related_codes: string[] };


const COHORT_FOCUS = new Set(["BFB3200", "BFB3201", "BFB3202", "BFB3203", "BFB3205", "BFC3227"]);

export default function BbaPilot({
  user, onOpenCourse, onPractice, onStudio, onSpaces, onNotes
}: {
  user: User | null;
  onOpenCourse: (code: string) => void;
  onPractice: () => void;
  onStudio: () => void;
  onSpaces: () => void;
  onNotes: () => void;
}) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [year, setYear] = useState("2");
  const [semester, setSemester] = useState("1");
  const [pathway, setPathway] = useState("common");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState("");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    async function load() {
      setLoading(true);
      setIssue("");
      if (!supabase) {
        setIssue("Course catalogue is unavailable. Try again when the connection is restored.");
        setLoading(false);
        return;
      }
      const programme = await supabase.from("ace_programmes").select("id")
        .eq("name", "Bachelor of Business Administration")
        .eq("school", "School of Business and Economics")
        .abortSignal(controller.signal).maybeSingle();
      if (programme.error || !programme.data) {
        setIssue("The MUST School of Business & Economics BBA catalogue is not available. Other programmes will appear only after their unit maps are verified.");
        setUnits([]); setQuizzes([]); setPapers([]);
        setLoading(false); window.clearTimeout(timeout);
        return;
      }
      const [catalogue, quizRows, paperRows, profile] = await Promise.all([
        supabase.from("ace_course_catalog").select("code,title,year_of_study,semester,pathway")
          .eq("programme_id", programme.data.id).order("code").abortSignal(controller.signal),
        user ? supabase.from("ace_quizzes").select("id,course_code").eq("status", "published").abortSignal(controller.signal) : Promise.resolve({ data: [], error: null }),
        supabase.from("ace_open_resources").select("id,title,subject,kind,provider,url,description,related_codes")
          .eq("hidden", false).eq("kind", "Past paper").eq("provider", "MUST examination archive").abortSignal(controller.signal),
        user ? supabase.from("ace_student_profiles").select("year_of_study,programme,institution")
          .eq("user_id", user.id).abortSignal(controller.signal).maybeSingle() : Promise.resolve({ data: null, error: null })
      ]);
      if (!active) return;
      if (catalogue.error) setIssue("BBA course units could not be loaded. Retry to reconnect.");
      else setUnits((catalogue.data ?? []) as Unit[]);
      setQuizzes((quizRows.data ?? []) as Quiz[]);
      setPapers((paperRows.data ?? []) as Paper[]);
      if (profile.data?.year_of_study && profile.data.year_of_study >= 1 && profile.data.year_of_study <= 4) {
        setYear(String(profile.data.year_of_study));
      }
      if (catalogue.error || quizRows.error || paperRows.error) setIssue("Some course counts may be incomplete. Retry to refresh.");
      setLoading(false);
      window.clearTimeout(timeout);
    }
    void load().catch(() => {
      if (!active) return;
      setIssue(controller.signal.aborted ? "Course information took too long to load." : "Course information is temporarily unavailable.");
      setLoading(false);
      window.clearTimeout(timeout);
    });
    return () => { active = false; controller.abort(); window.clearTimeout(timeout); };
  }, [user?.id]);

  const visibleUnits = useMemo(() => units.filter(unit =>
    String(unit.year_of_study ?? "") === year &&
    String(unit.semester ?? "") === semester &&
    unit.pathway === pathway &&
    (unit.code + " " + unit.title).toLowerCase().includes(search.toLowerCase())
  ), [units, year, semester, pathway, search]);

  const quizzesByCode = useMemo(() => {
    const counts = new Map<string, number>();
    for (const quiz of quizzes) counts.set(quiz.course_code.replace(/\s+/g, "").toUpperCase(), (counts.get(quiz.course_code.replace(/\s+/g, "").toUpperCase()) ?? 0) + 1);
    return counts;
  }, [quizzes]);

  const papersByCode = useMemo(() => {
    const counts = new Map<string, number>();
    for (const paper of papers) for (const code of paper.related_codes ?? []) {
      const normalized = code.replace(/\s+/g, "").toUpperCase();
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
    return counts;
  }, [papers]);

  const semesterUnits = units.filter(unit => String(unit.year_of_study) === year && String(unit.semester) === semester && unit.pathway === pathway);
  const totalQuizzes = semesterUnits.reduce((sum, unit) => sum + (quizzesByCode.get(unit.code) ?? 0), 0);
  const totalPapers = semesterUnits.reduce((sum, unit) => sum + (papersByCode.get(unit.code) ?? 0), 0);

  return (
    <div className="ace-bba-home bba-pilot">
      <header className="bba-pilot-header">
        <div>
          <span className="bba-eyebrow">MERU UNIVERSITY · SCHOOL OF BUSINESS & ECONOMICS</span>
          <h1>Your BBA study desk</h1>
          <p>Learn the unit. Practise exam questions. Review what you missed. Prepare with your classmates.</p>
        </div>
        <span className="bba-programme-mark"><GraduationCap size={23}/><span>BBA<br/><small>FOCUSED PILOT</small></span></span>
      </header>

      <section className="bba-action-grid" aria-label="Study actions">
        <button onClick={onStudio}><BookOpen size={19}/><span><strong>Learn a concept</strong><small>Read, make notes and build revision cards</small></span><ArrowRight size={15}/></button>
        <button onClick={onPractice}><ClipboardList size={19}/><span><strong>Practise for exams</strong><small>Attempt questions and review explanations</small></span><ArrowRight size={15}/></button>
        <button onClick={onNotes}><FileText size={19}/><span><strong>Revision notes</strong><small>Build and share unit notes</small></span><ArrowRight size={15}/></button>
        <button onClick={onSpaces}><GraduationCap size={19}/><span><strong>Discuss with classmates</strong><small>Ask questions and work through answers</small></span><ArrowRight size={15}/></button>
      </section>

      <section className="bba-unit-section">
        <div className="bba-section-title">
          <div><span className="bba-eyebrow">YOUR COURSE MAP</span><h2>Bachelor of Business Administration</h2><p>Choose your year, semester and pathway to see the units in your programme.</p></div>
          <span className="bba-unit-total">{semesterUnits.length} units</span>
        </div>
        <div className="bba-filters">
          <label>Year<select value={year} onChange={event => setYear(event.target.value)}>{[1,2,3,4].map(value=><option key={value} value={value}>Year {value}</option>)}</select></label>
          <label>Semester<select value={semester} onChange={event => setSemester(event.target.value)}><option value="1">Semester 1</option><option value="2">Semester 2</option></select></label>
          <label>Pathway<select value={pathway} onChange={event => setPathway(event.target.value)}><option value="common">Common units</option><option value="finance_accounting">Finance & Accounting</option><option value="project_management">Project Management</option></select></label>
          <label className="bba-search"><Search size={15}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Find a unit" aria-label="Find a BBA unit"/></label>
        </div>
        <div className="bba-summary-strip">
          <span><BookOpen size={15}/>{user ? totalQuizzes + " published practice quizzes" : "Sign in to access course quizzes"}</span>
          <span><FileText size={15}/>{totalPapers} linked past papers</span>
          <span><ShieldCheck size={15}/>Official and student material labelled separately</span>
        </div>
        {loading ? <p className="bba-state" role="status" aria-live="polite">Loading the BBA course map…</p> : visibleUnits.length ? (
          <div className="bba-unit-grid">
            {visibleUnits.map(unit => {
              const quizCount = quizzesByCode.get(unit.code) ?? 0;
              const paperCount = papersByCode.get(unit.code) ?? 0;
              const currentFocus = year === "2" && semester === "1" && unit.pathway === "common" && COHORT_FOCUS.has(unit.code);
              const curriculumNote = year === "2" && semester === "1" && unit.code === "BFB3204";
              return (
                <article className={"bba-unit-card " + (currentFocus ? "bba-unit-current" : "")} key={unit.code}>
                  <div className="bba-unit-card-top"><span>{unit.code}</span>{currentFocus && <small>YOUR 2026 Y2S1 TIMETABLE</small>}{curriculumNote && <small>CONFIRM CURRENT REGISTRATION</small>}</div>
                  <h3>{unit.title}</h3>
                  <div className="bba-unit-stats"><span><ClipboardList size={13}/>{user ? quizCount + " quizzes" : "Sign in for quizzes"}</span><span><FileText size={13}/>{paperCount} past papers</span></div>
                  {curriculumNote && <p className="bba-curriculum-note">Present in the existing BBA catalogue, but absent from the six units on your supplied 2026 Y2S1 timetable. Confirm against your registered units.</p>}
                  <button onClick={() => onOpenCourse(unit.code)}>Open unit <ArrowRight size={14}/></button>
                </article>
              );
            })}
          </div>
        ) : <div className="bba-state">No units are mapped for this year, semester and pathway yet. Check the programme structure or choose another pathway.</div>}
        {issue && <p className="bba-error" role="alert">{issue} <button onClick={() => window.location.reload()}>Refresh</button></p>}
        <p className="bba-source-note">Pilot boundary: Meru University of Science and Technology, School of Business & Economics. The current in-app catalogue maps BBA only; other SBE programmes are not presented as supported until their current unit structures are verified. Course mapping is based on the published BBA structure and the Ace catalogue. The public structure is historical, so confirm current registration with your department. Finance & Accounting and Project Management options are separated from common units.</p><div className="bba-official-links"><a href="https://sbe.must.ac.ke/undergraduate/" target="_blank" rel="noopener noreferrer">MUST SBE undergraduate programmes</a><a href="https://exampapers.must.ac.ke/" target="_blank" rel="noopener noreferrer">Official MUST examination archive</a><a href="https://library.must.ac.ke/wp-content/uploads/2025/04/How-to-Access-Past-papers-compressed.pdf" target="_blank" rel="noopener noreferrer">MUST Library past-paper access guide</a></div>
      </section>
    </div>
  );
}
