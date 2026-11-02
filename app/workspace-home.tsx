"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Atom, BookOpen, Brain, Calculator, CalendarDays, Check,
  Code2, Compass, FileText, HeartPulse, Layers3, Palette, Plus,
  Search, Sparkles, Users, Wrench
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import LearningProgress from "./learning-progress";
import { FALLBACK_AREAS, FALLBACK_SUBJECTS } from "./learning-catalog-fallback";
import type { User } from "@supabase/supabase-js";

type LearningArea = { slug: string; title: string; description: string; sort_order: number };
type LearningSubject = { slug: string; title: string; description: string; parent_slug: string; keywords: string[] };
type OpenResource = { id: string; slug: string; title: string; subject_slug: string | null; subject_label: string; summary: string; reading_minutes: number; illustration: string; level: string };
type Notebook = { id: string; title: string; course_code: string | null; updated_at: string; cards: unknown; attempts: number; correct: number };

const areaIcons = [BookOpen, Code2, Calculator, Atom, Wrench, HeartPulse, Users, Palette, Compass, Layers3];
const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
};
const relativeDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently updated";
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  if (days < 7) return `Updated ${days} days ago`;
  return `Updated ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
};

export default function WorkspaceHome({
  user, name, onLibrary, onPractice, onSpaces, onAccount, onNotes,
  onPlanner, onStudio, onArea, onResource
}: {
  user: User | null;
  name: string;
  onLibrary: () => void;
  onPractice: () => void;
  onSpaces: () => void;
  onAccount: () => void;
  onNotes: () => void;
  onPlanner: () => void;
  onStudio: () => void;
  onArea: (area: string) => void;
  onResource: (id: string) => void;
}) {
  const [areas, setAreas] = useState<LearningArea[]>([]);
  const [subjects, setSubjects] = useState<LearningSubject[]>([]);
  const [resources, setResources] = useState<OpenResource[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [notebookCount, setNotebookCount] = useState(0);
  const [followed, setFollowed] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [showAllAreas, setShowAllAreas] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busySlug, setBusySlug] = useState("");
  const [issue, setIssue] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    async function load() {
      setLoading(true);
      setIssue("");
      try {
        if (!supabase) {
          setAreas([...FALLBACK_AREAS]); setSubjects([...FALLBACK_SUBJECTS]);
          setResources([]); setNotebooks([]); setNotebookCount(0); setFollowed([]);
          setIssue("The learning directory is not connected. You can still explore the starter subjects.");
          return;
        }
        const [disciplines, topics, open] = await Promise.all([
          supabase.from("ace_learning_areas").select("slug,title,description,sort_order").eq("kind", "discipline").eq("active", true).order("sort_order").abortSignal(controller.signal),
          supabase.from("ace_learning_areas").select("slug,title,description,parent_slug,keywords").eq("kind", "subject").eq("active", true).order("sort_order").abortSignal(controller.signal),
          supabase.from("ace_lessons").select("id,slug,title,subject_slug,subject_label,summary,reading_minutes,illustration,level").eq("published", true).order("title").limit(80).abortSignal(controller.signal)
        ]);
        let recent: Notebook[] = [];
        let notebookResultCount: number | null = null;
        let followedRows: { subject_slug: string }[] = [];
        if (user) {
          const [notebookResult, followResult] = await Promise.all([
            supabase.from("ace_study_notebooks").select("id,title,course_code,updated_at,cards,attempts,correct", { count: "exact" }).eq("user_id", user.id).order("updated_at", { ascending: false }).limit(4).abortSignal(controller.signal),
            supabase.from("ace_user_subjects").select("subject_slug").eq("user_id", user.id).abortSignal(controller.signal)
          ]);
          recent = (notebookResult.data ?? []) as Notebook[];
          notebookResultCount = notebookResult.count;
          followedRows = followResult.data ?? [];
          if (notebookResult.error && notebookResult.error.code !== "42P01") setIssue("Your recent notebooks could not be loaded. They are still available in Study Studio.");
          if (followResult.error && !notebookResult.error) setIssue("Your followed subjects could not be loaded.");
        }
        if (controller.signal.aborted) throw new Error("Timed out");
        if (!alive) return;
        setAreas(disciplines.data?.length ? disciplines.data : [...FALLBACK_AREAS]);
        setSubjects(topics.data?.length ? topics.data : [...FALLBACK_SUBJECTS]);
        setResources(open.data ?? []); setNotebooks(recent);
        setNotebookCount(user ? (notebookResultCount ?? recent.length) : 0);
        setFollowed(followedRows.map(row => row.subject_slug));
        if (disciplines.error || topics.error) setIssue("Some learning areas are using the starter directory while the catalogue reconnects.");
        else if (open.error) setIssue("The original lesson library could not be refreshed. Retry to reconnect.");
      } catch {
        if (!alive) return;
        setAreas([...FALLBACK_AREAS]); setSubjects([...FALLBACK_SUBJECTS]); setResources([]);
        setNotebooks([]); setNotebookCount(0); setFollowed([]);
        setIssue(controller.signal.aborted ? "The learning directory took too long to respond. Try again." : "The learning directory could not be reached. Try again.");
      } finally {
        window.clearTimeout(timeout);
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => { alive = false; controller.abort(); window.clearTimeout(timeout); };
  }, [user?.id, retryCount]);

  const filteredAreas = useMemo(
    () => areas.filter(area => (area.title + " " + area.description).toLowerCase().includes(search.toLowerCase())),
    [areas, search]
  );
  const followedSubjects = subjects.filter(subject => followed.includes(subject.slug));
  const resourcePicks = useMemo(() => {
    const ranked = resources.map(resource => ({
      resource,
      score: followed.includes(resource.subject_slug ?? "") ? 5 : 0
    })).sort((a,b)=>b.score-a.score||a.resource.title.localeCompare(b.resource.title));
    const featured:OpenResource[]=[];
    const subjectsSeen=new Set<string>();
    for(const item of ranked){
      if(!subjectsSeen.has(item.resource.subject_label)){
        featured.push(item.resource);
        subjectsSeen.add(item.resource.subject_label);
      }
      if(featured.length===3)break;
    }
    return featured;
  }, [resources,followed]);
  const latestNotebook = notebooks[0];
  const notebookCardCount = notebooks.reduce((total, item) => total + (Array.isArray(item.cards) ? item.cards.length : 0), 0);
  const displayName = name.trim().split(/\s+/)[0];

  async function toggleSubject(subject: LearningSubject) {
    if (!user) { onAccount(); return; }
    if (!supabase || busySlug) return;
    setBusySlug(subject.slug);
    setIssue("");
    if (followed.includes(subject.slug)) {
      const { error } = await supabase.from("ace_user_subjects").delete().eq("user_id", user.id).eq("subject_slug", subject.slug);
      if (error) setIssue("Could not update your learning plan. Please try again.");
      else setFollowed(items => items.filter(slug => slug !== subject.slug));
    } else {
      const { error } = await supabase.from("ace_user_subjects").insert({ user_id: user.id, subject_slug: subject.slug });
      if (error) setIssue("Could not update your learning plan. Please try again.");
      else setFollowed(items => [...items, subject.slug]);
    }
    setBusySlug("");
  }

  function toggleExpanded(slug: string) {
    setExpanded(items => items.includes(slug) ? items.filter(item => item !== slug) : [...items, slug]);
  }

  return (
    <div className="ace-home-v2">
      <header className="v2-home-heading">
        <div>
          <span className="v2-kicker">YOUR LEARNING SPACE</span>
          <h1>{user && displayName ? "Welcome back, " + displayName + "." : "Make your next hour count."}</h1>
          <p>Course materials, useful lessons and focused practice — organised in one place.</p>
        </div>
        <button className="v2-heading-action" onClick={onStudio}><Plus size={16} /> New study pack</button>
      </header>

      <section className="v2-hero" aria-label="Continue learning">
        <div className="v2-hero-main">
          <span className="v2-kicker">PICK UP WHERE YOU LEFT OFF</span>
          <h2>{latestNotebook ? latestNotebook.title : "Build a study space around your material."}</h2>
          <p>{latestNotebook
            ? "Your notebook was " + relativeDate(latestNotebook.updated_at).toLowerCase() + ". Continue reading, revising cards or checking what you remember."
            : "Bring in lecture notes or a presentation. Turn your material into a focused place to read, revise and test your recall."}</p>
          <div className="v2-hero-actions">
            <button className="v2-primary-action" onClick={onStudio}><Brain size={15} /> {latestNotebook ? "Continue studying" : "Create your first notebook"} <ArrowRight size={14} /></button>
            <button className="v2-secondary-action" onClick={onLibrary}><BookOpen size={15} /> Browse learning library</button>
          </div>
        </div>
        <div className="v2-hero-side" aria-hidden="true">
          <div className="v2-study-card">
            <div className="v2-study-card-top"><span>ACE / STUDY STUDIO</span><span>01</span></div>
            <div className="v2-study-card-icon"><BookOpen size={20} /></div>
            <strong>{user ? (notebookCount ? notebookCount + " saved notebooks" : "Your study space") : "Explore as a guest"}</strong>
            <small>{user ? (latestNotebook ? notebookCardCount + " cards in recent notebooks" : "Your notes stay private to you") : "Create an account when you want to save work"}</small>
          </div>
        </div>
      </section>

      <nav className="v2-quicklinks" aria-label="Study shortcuts">
        <button className="v2-quicklink" onClick={onPractice}><span className="v2-quick-icon"><Brain size={17} /></span><span><strong>Practice</strong><small>Test your understanding</small></span><ArrowRight size={14} /></button>
        <button className="v2-quicklink" onClick={onPlanner}><span className="v2-quick-icon"><CalendarDays size={17} /></span><span><strong>Study planner</strong><small>Organise your week</small></span><ArrowRight size={14} /></button>
        <button className="v2-quicklink" onClick={onNotes}><span className="v2-quick-icon"><FileText size={17} /></span><span><strong>Shared notes</strong><small>Write with classmates</small></span><ArrowRight size={14} /></button>
        <button className="v2-quicklink" onClick={onSpaces}><span className="v2-quick-icon"><Users size={17} /></span><span><strong>Study groups</strong><small>Work through ideas together</small></span><ArrowRight size={14} /></button>
      </nav>

      {user && <div className="v2-progress-wrap"><LearningProgress user={user} onPractice={onPractice} /></div>}

      {user && <section className="v2-section">
        <div className="v2-section-heading">
          <div><span className="v2-kicker">YOUR LEARNING PLAN</span><h2>Subjects you follow</h2><p>Shortcuts to the topics you have chosen to keep close.</p></div>
        </div>
        {followedSubjects.length ? <div className="v2-path-list">{followedSubjects.slice(0, 10).map(subject => (
          <button key={subject.slug} onClick={() => onArea(subject.slug)}><BookOpen size={13} /> {subject.title} <ArrowRight size={12} /></button>
        ))}</div> : <div className="v2-home-empty">You have not followed a subject yet. Open a learning area below and add the topics that matter to your course.</div>}
      </section>}

      <section className="v2-section">
        <div className="v2-section-heading">
          <div><span className="v2-kicker">BROWSE BY INTEREST</span><h2>Find the subject you need</h2><p>Explore by discipline, then open a topic to find focused lessons.</p></div>
          <label className="v2-area-search"><Search size={15} /><input aria-label="Search learning areas" placeholder="Search subjects" value={search} onChange={event => setSearch(event.target.value)} /></label>
        </div>
        {loading ? <div className="v2-home-empty" role="status" aria-live="polite">Loading learning areas…</div> : filteredAreas.length ? (
          <div className="v2-area-grid">
            {(showAllAreas ? filteredAreas : filteredAreas.slice(0, 8)).map((area, index) => {
              const Icon = areaIcons[index % areaIcons.length];
              const topics = subjects.filter(subject => subject.parent_slug === area.slug);
              const isExpanded = expanded.includes(area.slug);
              return (
                <article className={"v2-area-card " + (isExpanded ? "expanded" : "")} key={area.slug}>
                  <button className="v2-area-main" onClick={() => toggleExpanded(area.slug)} aria-expanded={isExpanded}>
                    <span className={"v2-area-icon tone-" + (index % 5)}><Icon size={17} /></span>
                    <span className="v2-area-copy"><strong>{area.title}</strong><small>{area.description}</small><span className="v2-area-count">{topics.length} TOPICS</span></span>
                  </button>
                  {isExpanded && <div className="v2-topic-list">{topics.slice(0, 8).map(subject => (
                    <div key={subject.slug}>
                      <button className="v2-topic-open" onClick={() => onArea(subject.slug)}><strong>{subject.title}</strong><small>{subject.description}</small></button>
                      <button className={"v2-follow " + (followed.includes(subject.slug) ? "following" : "")} disabled={busySlug === subject.slug} onClick={() => void toggleSubject(subject)}>
                        {followed.includes(subject.slug) ? <><Check size={12} /> Saved</> : user ? "Follow" : "Sign in"}
                      </button>
                    </div>
                  ))}</div>}
                </article>
              );
            })}
          </div>
        ) : <div className="v2-home-empty">No learning areas match that search.</div>}
        {filteredAreas.length > 8 && <button className="v2-text-link" onClick={() => setShowAllAreas(value => !value)}>{showAllAreas ? "Show fewer subjects" : "View all " + filteredAreas.length + " subjects"} <ArrowRight size={13} /></button>}
      </section>

      <section className="v2-section">
        <div className="v2-section-heading">
          <div><span className="v2-kicker">READY WHEN YOU ARE</span><h2>Start with a lesson</h2><p>Original Ace learning material, available to read inside the app.</p></div>
          <button className="v2-text-link" onClick={onLibrary}>Open full library <ArrowRight size={13} /></button>
        </div>
        {resourcePicks.length ? <div className="v2-lesson-grid">{resourcePicks.map(resource => (
          <button className="v2-lesson-card" key={resource.id} onClick={() => onResource(resource.slug)}>
            <span className="v2-lesson-top"><span className="v2-lesson-icon"><BookOpen size={16} /></span><small>{resource.level} · {resource.reading_minutes} MIN</small></span>
            <strong>{resource.title}</strong>
            <span>{resource.subject_label} · Read in Ace</span>
          </button>
        ))}</div> : <div className="v2-home-empty">No published lessons are available in this view yet. Open the full library to browse available material.</div>}
      </section>

      {issue && <p className="v2-home-issue" role="status">{issue} <button type="button" className="v2-text-link" onClick={() => { setLoading(true); setRetryCount(value => value + 1); }}>Try again</button></p>}
    </div>
  );
}
