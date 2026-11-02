"use client";

import { useEffect, useState } from "react";
import { Activity, Brain, CalendarDays, Clock3, Medal } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type AttemptRow = {
  correct_count: number;
  total_count: number;
  submitted_at: string;
};
type StudySessionRow = {
  duration_seconds: number;
  started_at: string;
  ended_at: string | null;
};
type ProgressSummary = {
  xp: number | null;
  accuracy: number | null;
  attemptCount: number | null;
  activeDays: number | null;
  studyMinutes: number | null;
};
const EMPTY: ProgressSummary = {
  xp: null,
  accuracy: null,
  attemptCount: null,
  activeDays: null,
  studyMinutes: null,
};
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function localDayKey(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function ProgressMetric({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="ace-progress-metric">
      <div className="ace-progress-metric-top">
        <span>{label}</span>
        <span className="ace-progress-icon" aria-hidden="true">{icon}</span>
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

export default function LearningProgress({
  user,
  onPractice,
}: {
  user: User;
  onPractice: () => void;
}) {
  const [summary, setSummary] = useState<ProgressSummary>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    const now = Date.now();
    const since = new Date(now - WEEK_MS).toISOString();

    async function load() {
      setLoading(true);
      setIssue("");
      try {
        if (!supabase) throw new Error("Progress service is unavailable.");

        const [xpResult, attemptsResult, sessionsResult] = await Promise.all([
          supabase
            .from("ace_xp")
            .select("xp")
            .eq("user_id", user.id)
            .abortSignal(controller.signal)
            .maybeSingle(),
          supabase
            .from("ace_quiz_attempts")
            .select("correct_count,total_count,submitted_at")
            .eq("user_id", user.id)
            .order("submitted_at", { ascending: false })
            .limit(100)
            .abortSignal(controller.signal),
          supabase
            .from("ace_individual_study_sessions")
            .select("duration_seconds,started_at,ended_at")
            .eq("user_id", user.id)
            .gte("started_at", since)
            .not("ended_at", "is", null)
            .order("started_at", { ascending: false })
            .limit(100)
            .abortSignal(controller.signal),
        ]);

        if (controller.signal.aborted) throw new Error("Progress request timed out.");
        if (!alive) return;

        const attempts = (attemptsResult.data ?? []) as AttemptRow[];
        const sessions = (sessionsResult.data ?? []) as StudySessionRow[];
        const questionCount = attempts.reduce(
          (sum, attempt) => sum + Math.max(0, Number(attempt.total_count) || 0),
          0,
        );
        const correctCount = attempts.reduce(
          (sum, attempt) => sum + Math.max(0, Number(attempt.correct_count) || 0),
          0,
        );

        const cutoff = now - WEEK_MS;
        const activeDates = new Set<string>();
        for (const attempt of attempts) {
          const timestamp = new Date(attempt.submitted_at).getTime();
          if (Number.isFinite(timestamp) && timestamp >= cutoff) {
            const key = localDayKey(attempt.submitted_at);
            if (key) activeDates.add(key);
          }
        }
        for (const session of sessions) {
          const timestamp = new Date(session.started_at).getTime();
          if (Number.isFinite(timestamp) && timestamp >= cutoff) {
            const key = localDayKey(session.started_at);
            if (key) activeDates.add(key);
          }
        }

        const studySeconds = sessions.reduce(
          (sum, session) => sum + Math.max(0, Number(session.duration_seconds) || 0),
          0,
        );

        setSummary({
          xp: xpResult.error ? null : Math.max(0, Number(xpResult.data?.xp) || 0),
          accuracy: attemptsResult.error || questionCount === 0
            ? null
            : Math.round((correctCount / questionCount) * 100),
          attemptCount: attemptsResult.error ? null : attempts.length,
          activeDays: attemptsResult.error || sessionsResult.error ? null : activeDates.size,
          studyMinutes: sessionsResult.error ? null : Math.round(studySeconds / 60),
        });

        if (xpResult.error || attemptsResult.error || sessionsResult.error) {
          setIssue("Some progress could not be refreshed. Your saved work is unchanged.");
        }
      } catch {
        if (!alive) return;
        setIssue(controller.signal.aborted
          ? "Progress took too long to load. Try again."
          : "Your progress is temporarily unavailable. Try again.");
      } finally {
        window.clearTimeout(timeout);
        if (alive) setLoading(false);
      }
    }

    void load();
    return () => {
      alive = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [user.id, retryCount]);

  const accuracy = summary.accuracy === null ? "—" : summary.accuracy + "%";
  const xp = summary.xp === null ? "—" : summary.xp.toLocaleString();
  const activeDays = summary.activeDays === null ? "—" : summary.activeDays + " / 7";
  const studyMinutes = summary.studyMinutes === null || summary.studyMinutes === 0
    ? "—"
    : summary.studyMinutes + " min";
  const hasActivity = (summary.attemptCount ?? 0) > 0 || (summary.studyMinutes ?? 0) > 0;

  return (
    <section className="ace-progress" aria-labelledby="ace-progress-title">
      <div className="ace-progress-heading">
        <div>
          <span className="home-eyebrow">YOUR RECORDED ACTIVITY</span>
          <h2 id="ace-progress-title">Learning momentum</h2>
          <p>Progress from completed quizzes and finished study sessions.</p>
        </div>
        <Activity size={20} aria-hidden="true" />
      </div>

      {loading ? (
        <p className="ace-progress-status" role="status" aria-live="polite">Updating your progress…</p>
      ) : (
        <>
          <div className="ace-progress-grid">
            <ProgressMetric
              icon={<Medal size={16} />}
              label="XP earned"
              value={xp}
              detail="From server-graded practice"
            />
            <ProgressMetric
              icon={<Brain size={16} />}
              label="Recent quiz accuracy"
              value={accuracy}
              detail={summary.attemptCount === null
                ? "Quiz history unavailable"
                : summary.attemptCount === 0
                  ? "Complete a quiz to start tracking"
                  : "Across your latest " + summary.attemptCount + " attempts"}
            />
            <ProgressMetric
              icon={<CalendarDays size={16} />}
              label="Active days"
              value={activeDays}
              detail="Quiz or completed study activity · last 7 days"
            />
            <ProgressMetric
              icon={<Clock3 size={16} />}
              label="Study time"
              value={studyMinutes}
              detail="Finished Study Studio sessions · last 7 days"
            />
          </div>
          {!hasActivity && !loading && (
            <div className="ace-progress-empty">
              No study activity has been recorded yet. Start with a course quiz or a Study Studio session.
              <button type="button" onClick={onPractice}>Go to practice</button>
            </div>
          )}
        </>
      )}

      {issue && (
        <p className="ace-progress-error" role="alert">
          {issue}
          <button type="button" onClick={() => setRetryCount((value) => value + 1)}>Retry</button>
        </p>
      )}
    </section>
  );
}
