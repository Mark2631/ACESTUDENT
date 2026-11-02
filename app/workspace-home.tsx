"use client";

import { ArrowRight, Brain, BookOpen, FileText, Users } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import LearningProgress from "./learning-progress";
import BbaPilot from "./bba-pilot";

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
  onArea: (code: string) => void;
  onResource: (id: string) => void;
}) {
  return (
    <main className="ace-bba-home">
      <BbaPilot
        user={user}
        onOpenCourse={onArea}
        onPractice={onPractice}
        onStudio={onStudio}
        onSpaces={onSpaces}
        onNotes={onNotes}
      />
      {user ? (
        <>
          <LearningProgress user={user} onPractice={onPractice} />
          <section className="bba-next-tools">
            <div className="bba-section-title">
              <div><span className="bba-eyebrow">KEEP YOUR WORK TOGETHER</span><h2>Your study workspace</h2><p>{name ? "Your personal study tools, " + name.split(" ")[0] + "." : "Your personal study tools."}</p></div>
            </div>
            <div className="bba-tool-grid">
              <button onClick={onStudio}><Brain size={19}/><span><strong>Study Studio</strong><small>Notebooks, imported notes and spaced-repetition cards</small></span><ArrowRight size={15}/></button>
              <button onClick={onLibrary}><BookOpen size={19}/><span><strong>Learning library</strong><small>Lessons and curated course materials</small></span><ArrowRight size={15}/></button>
              <button onClick={onNotes}><FileText size={19}/><span><strong>Shared revision notes</strong><small>Collaborate with your course mates</small></span><ArrowRight size={15}/></button>
              <button onClick={onSpaces}><Users size={19}/><span><strong>Study discussions</strong><small>Ask questions and work through difficult topics</small></span><ArrowRight size={15}/></button>
            </div>
          </section>
        </>
      ) : (
        <section className="bba-guest-note">
          <strong>Browse first. Save your progress when you sign in.</strong>
          <p>Course units and published learning material are open to explore. Sign in when you want to save cards, join discussions, or track your work.</p>
          <button onClick={onAccount}>Create account <ArrowRight size={14}/></button>
        </section>
      )}
    </main>
  );
}
