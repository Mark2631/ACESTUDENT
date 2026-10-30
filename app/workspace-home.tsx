"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Atom, BookOpen, Brain, Calculator, CalendarDays, Check,
  Code2, Compass, FileText, HeartPulse, Layers3, Palette, Plus,
  Search, Sparkles, Users, Wrench
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { FALLBACK_AREAS, FALLBACK_SUBJECTS } from "./learning-catalog-fallback";
import type { User } from "@supabase/supabase-js";

type LearningArea = { slug: string; title: string; description: string; sort_order: number };
type LearningSubject = { slug: string; title: string; description: string; parent_slug: string; keywords: string[] };
type OpenResource = { id: string; title: string; provider: string; kind: string; subject: string; description: string | null; url: string; related_codes: string[] };
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
  const [followed, setFollowed] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [showAllAreas, setShowAllAreas] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busySlug, setBusySlug] = useState("");
  const [issue, setIssue] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!supabase) {
        setAreas([...FALLBACK_AREAS]);
        setSubjects([...FALLBACK_SUBJECTS]);
        setLoading(false);
        return;
      }

      const requests = [
        supabase.from("ace_learning_areas").select("slug,title,description,sort_order").eq("kind", "discipline").eq("active", true).order("sort_order"),
        supabase.from("ace_learning_areas").select("slug,title,description,parent_slug,keywords").eq("kind", "subject").eq("active", true).order("sort_order"),
        supabase.from("ace_open_resources").select("id,title,provider,kind,subject,description,url,related_codes").eq("hidden", false).order("title").limit(80)
      ] as const;
      const [disciplines, topics, open] = await Promise.all(requests);
      let recent: Notebook[] = [];
      let followedRows: { subject_slug: string }[] = [];

      if (user) {
        const [notebookResult, followResult] = await Promise.all([
          supabase.from("ace_study_notebooks").select("id,title,course_code,updated_at,cards,attempts,correct").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(4),
          supabase.from("ace_user_subjects").select("subject_slug").eq("user_id", user.id)
        ]);
        recent = (notebookResult.data ?? []) as Notebook[];
        followedRows = followResult.data ?? [];
        if (notebookResult.error && notebookResult.error.code !== "42P01") {
          setIssue("Your recent notebooks could not be loaded. They are still available in Study Studio.");
        }
        if (followResult.error && !notebookResult.error) {
          setIssue("Your followed subjects could not be loaded.");
        }
      }

      if (!alive) return;
      setAreas(disciplines.data?.length ? disciplines.data : [...FALLBACK_AREAS]);
      setSubjects(topics.data?.length ? topics.data : [...FALLBACK_SUBJECTS]);
      setResources(open.data ?? []);
      setNotebooks(recent);
      setFollowed(followedRows.map(row => row.subject_slug));
      if (disciplines.error || topics.error) {
        setIssue("Some learning areas are using the starter directory while the catalogue reconnects.");
      }
      setLoading(false);
    }
    void load();
    return () => { alive = false; };
  }, [user?.id]);

  const filteredAreas = useMemo(
    () => areas.filter(area => (area.title + " " + area.description).toLowerCase().includes(search.toLowerCase())),
    [areas, search]
  );
  const followedSubjects = subjects.filter(subject => followed.includes(subject.slug));
  const resourcePicks = useMemo(() => {
    const targets = followedSubjects.length ? followedSubjects : subjects;
    const ranked = resources.map(resource => {
      const haystack = (resource.title + " " + resource.subject + " " + (resource.description ?? "")).toLowerCase();
      const subjectName = resource.subject.toLowerCase();
      let score = 0;
      for (const target of targets) {
        const label = target.title.toLowerCase();
        if (subjectName === label) score = Math.max(score, 5);
        else if (subjectName.includes(label) || label.includes(subjectName)) score = Math.max(score, 3);
        for (const keyword of target.keywords ?? []) {
          if (keyword.trim().length > 2 && haystack.includes(keyword.toLowerCase())) score = Math.max(score, 2);
        }
      }
      if (["official data", "primary legal text", "open course"].includes(resource.kind.toLowerCase())) score += 0.15;
      return { resource, score };
    }).sort((a, b) => b.score - a.score || a.resource.title.localeCompare(b.resource.title));
    const chosen: OpenResource[] = [];
    const seenSubjects = new Set<string>();
    for (const item of ranked) {
      const key = item.resource.subject.toLowerCase();
      if (!seenSubjects.has(key)) {
        chosen.push(item.resource);
        seenSubjects.add(key);
      }
      if (chosen.length === 3) break;
    }
    if (chosen.length < 3) {
      for (const item of ranked) {
        if (!chosen.some(resource => resource.id === item.resource.id)) chosen.push(item.resource);
        if (chosen.length === 3) break;
      }
    }
    return chosen;
  }, [resources, subjects, followedSubjects]);
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
    <div className="ace-home">
      <header className="home-heading">
        <div>
          <span className="home-eyebrow">YOUR STUDY DESK <i /></span>
          <h1>{user && displayName ? `${greeting()}, ${displayName}.` : "Make room for progress."}</h1>
          <p>Pick up where you left off, or find something worth learning today.</p>
        </div>
        <button className="home-create-button" onClick={onStudio}><Plus size={17} /> New notebook</button>
      </header>

      <section className="home-overview" aria-label="Your learning overview">
        <div><span>Recent notebooks</span><strong>{user ? notebooks.length : "—"}</strong><small>{user ? "Your latest study spaces" : "Sign in to save your work"}</small></div>
        <div><span>Study cards</span><strong>{user ? notebookCardCount : "—"}</strong><small>Built from your own material</small></div>
        <div><span>Subjects followed</span><strong>{user ? followed.length : "—"}</strong><small>Areas you want to explore</small></div>
      </section>

      <div className="home-columns">
        <div className="home-primary-column">
          <section className="home-resume-card">
            <div className="home-resume-copy">
              <span className="home-eyebrow">THE NEXT STEP</span>
              <h2>{latestNotebook ? "Continue your last notebook." : "Turn your notes into a study session."}</h2>
              <p>{latestNotebook
                ? `Pick up ${latestNotebook.title} and continue reading, reviewing cards or testing your recall.`
                : "Bring in a PDF, presentation or your own notes. Ace helps you organise the material and practise what matters."}</p>
              <button onClick={onStudio}>{latestNotebook ? "Open Study Studio" : "Create your first notebook"} <ArrowRight size={15} /></button>
            </div>
            <div className="home-resume-art" aria-hidden="true">
              <div className="home-paper home-paper-back" />
              <div className="home-paper home-paper-front"><span /><span /><span /><b>ACE / 01</b></div>
              <div className="home-orbit" />
            </div>
            {latestNotebook && <div className="home-resume-meta"><span>{latestNotebook.course_code || "Personal notebook"}</span><span>{relativeDate(latestNotebook.updated_at)}</span></div>}
          </section>

          <section className="home-tools-section">
            <div className="home-section-heading"><div><span className="home-eyebrow">YOUR TOOLS</span><h2>Everything you need to study</h2></div></div>
            <div className="home-tools-grid">
              <button onClick={onStudio}><span className="home-tool-icon indigo"><Brain size={18} /></span><span><strong>Study Studio</strong><small>Read, revise and remember</small></span><ArrowRight size={15} /></button>
              <button onClick={onLibrary}><span className="home-tool-icon green"><BookOpen size={18} /></span><span><strong>Learning library</strong><small>Find notes and open resources</small></span><ArrowRight size={15} /></button>
              <button onClick={onPractice}><span className="home-tool-icon amber"><Sparkles size={18} /></span><span><strong>Practice arena</strong><small>Test yourself and track results</small></span><ArrowRight size={15} /></button>
              <button onClick={onPlanner}><span className="home-tool-icon blue"><CalendarDays size={18} /></span><span><strong>Study planner</strong><small>Keep deadlines in sight</small></span><ArrowRight size={15} /></button>
              <button onClick={onNotes}><span className="home-tool-icon rose"><FileText size={18} /></span><span><strong>Shared notes</strong><small>Write and compare ideas</small></span><ArrowRight size={15} /></button>
              <button onClick={onSpaces}><span className="home-tool-icon slate"><Users size={18} /></span><span><strong>Study groups</strong><small>Learn with other students</small></span><ArrowRight size={15} /></button>
            </div>
          </section>

          <section className="home-discovery-section">
            <div className="home-section-heading home-discovery-heading">
              <div><span className="home-eyebrow">FIND YOUR SUBJECT</span><h2>Explore learning areas</h2><p>Start broad. Follow a subject when it feels relevant.</p></div>
              <label className="home-area-search"><Search size={15} /><input aria-label="Search learning areas" placeholder="Search subjects" value={search} onChange={event => setSearch(event.target.value)} /></label>
            </div>
            {loading ? <div className="home-loading">Loading learning areas…</div> : filteredAreas.length ? (
              <div className="home-area-grid">
                {(showAllAreas ? filteredAreas : filteredAreas.slice(0, 8)).map((area, index) => {
                  const Icon = areaIcons[index % areaIcons.length];
                  const topics = subjects.filter(subject => subject.parent_slug === area.slug);
                  const isExpanded = expanded.includes(area.slug);
                  return (
                    <article className={"home-area-card " + (isExpanded ? "expanded" : "")} key={area.slug}>
                      <button className="home-area-main" onClick={() => toggleExpanded(area.slug)} aria-expanded={isExpanded}>
                        <span className={"home-area-icon home-area-" + (index % 5)}><Icon size={18} /></span>
                        <span><strong>{area.title}</strong><small>{area.description}</small></span>
                        <span className="home-area-count">{topics.length} topics</span>
                      </button>
                      {isExpanded && <div className="home-topic-list">{topics.slice(0, 8).map(subject => (
                        <div key={subject.slug}>
                          <button className="home-topic-open" onClick={() => onArea(subject.slug)}><strong>{subject.title}</strong><small>{subject.description}</small></button>
                          <button className={"home-follow " + (followed.includes(subject.slug) ? "following" : "")} disabled={busySlug === subject.slug} onClick={() => void toggleSubject(subject)}>
                            {followed.includes(subject.slug) ? <><Check size={13} /> Following</> : user ? "Follow" : "Sign in"}
                          </button>
                        </div>
                      ))}</div>}
                    </article>
                  );
                })}
              </div>
            ) : <div className="home-loading">No learning areas match that search.</div>}
            {filteredAreas.length > 8 && <button className="home-text-link" onClick={() => setShowAllAreas(value => !value)}>{showAllAreas ? "Show fewer learning areas" : "View all " + filteredAreas.length + " learning areas"} <ArrowRight size={14} /></button>}
            <button className="home-text-link" onClick={onLibrary}>Browse the full learning library <ArrowRight size={14} /></button>
          </section>
        </div>

        <aside className="home-side-column">
          <section className="home-side-panel">
            <div className="home-side-heading"><div><span className="home-eyebrow">YOUR LEARNING PLAN</span><h2>Subjects to follow</h2></div><span>{followed.length}</span></div>
            {followedSubjects.length ? <div className="home-followed-list">{followedSubjects.slice(0, 6).map(subject => (
              <button key={subject.slug} onClick={() => onArea(subject.slug)}><span>{subject.title}</span><ArrowRight size={14} /></button>
            ))}</div> : <div className="home-side-empty"><Compass size={19} /><p>Choose a subject that matters to you. It will stay here as a shortcut.</p><button onClick={() => document.querySelector(".home-discovery-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Explore subjects</button></div>}
          </section>

          <section className="home-side-panel home-resources-panel">
            <div className="home-side-heading"><div><span className="home-eyebrow">OPEN KNOWLEDGE</span><h2>Good places to start</h2></div><button aria-label="Open library" onClick={onLibrary}><ArrowRight size={15} /></button></div>
            {resourcePicks.length ? <div className="home-resource-list">{resourcePicks.map(resource => (
              <button key={resource.id} onClick={() => onResource(resource.id)}>
                <span className="home-resource-kind">{resource.kind}</span><strong>{resource.title}</strong><small>{resource.subject} · {resource.provider}</small>
              </button>
            ))}</div> : <div className="home-side-empty"><BookOpen size={19} /><p>Open books, courses and official learning sources will appear here.</p><button onClick={onLibrary}>Open library</button></div>}
          </section>

          <section className="home-side-note">
            <span className="home-note-mark">“</span>
            <p>Make learning active. Read a little, recall a little, then check what you actually remember.</p>
            <button onClick={onStudio}>Start a study session <ArrowRight size={14} /></button>
          </section>
        </aside>
      </div>
      {issue && <p className="home-issue" role="status">{issue}</p>}
    </div>
  );
}
