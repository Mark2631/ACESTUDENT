"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Clipboard, FileImage,
  MessageCircle, Send, Share2, ShieldCheck, Sparkles, UploadCloud
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type QuestionType = "concept" | "calculation" | "case_study" | "exam_question" | "discussion";
type Verdict = "correct" | "partly_correct" | "needs_revision";
type CourseQuestion = {
  id: string; course_code: string; author_id: string; title: string; body: string;
  question_type: QuestionType; image_path: string | null; is_resolved: boolean; created_at: string;
};
type CourseAnswer = {
  id: string; question_id: string; author_id: string; body: string; image_path: string | null; created_at: string;
};
type CourseAnswerReview = {
  id: string; answer_id: string; reviewer_id: string; verdict: Verdict; feedback: string; reviewed_at: string;
};
type DraftReview = { verdict: Verdict; feedback: string };

const verdictLabel: Record<Verdict, string> = {
  correct: "Correct",
  partly_correct: "Partly correct",
  needs_revision: "Needs revision"
};
const questionTypeLabel: Record<QuestionType, string> = {
  concept: "Concept clarification",
  calculation: "Calculation / workings",
  case_study: "Case study",
  exam_question: "Exam-style question",
  discussion: "Discussion"
};
const fileTypes = ["image/jpeg", "image/png", "image/webp"];

export default function CourseQuestionBoard({ user, code, courseTitle }: {
  user: User; code: string; courseTitle: string;
}) {
  const [questions, setQuestions] = useState<CourseQuestion[]>([]);
  const [answers, setAnswers] = useState<CourseAnswer[]>([]);
  const [reviews, setReviews] = useState<CourseAnswerReview[]>([]);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState("");
  const [isReviewer, setIsReviewer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [issue, setIssue] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionBody, setQuestionBody] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType>("concept");
  const [questionImage, setQuestionImage] = useState<File | null>(null);
  const [answerBody, setAnswerBody] = useState("");
  const [answerImage, setAnswerImage] = useState<File | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, DraftReview>>({});

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("question");
    if (initial) setSelectedId(initial);
  }, []);

  async function load() {
    if (!supabase) {
      setIssue("Course discussions are unavailable while Ace is disconnected.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setIssue("");
    const [questionResult, reviewerResult] = await Promise.all([
      supabase.from("ace_course_questions")
        .select("id,course_code,author_id,title,body,question_type,image_path,is_resolved,created_at")
        .eq("course_code", code).order("created_at", { ascending: false }).limit(80),
      supabase.from("ace_reviewers").select("user_id").eq("user_id", user.id).maybeSingle()
    ]);
    if (questionResult.error) {
      setIssue("Questions could not be loaded. Retry to reconnect.");
      setLoading(false);
      return;
    }
    const nextQuestions = (questionResult.data ?? []) as CourseQuestion[];
    const questionIds = nextQuestions.map(question => question.id);
    const answerResult = questionIds.length
      ? await supabase.from("ace_course_answers")
          .select("id,question_id,author_id,body,image_path,created_at")
          .in("question_id", questionIds).order("created_at", { ascending: true })
      : { data: [], error: null };
    if (answerResult.error) setIssue("Some answers could not be loaded.");
    const nextAnswers = (answerResult.data ?? []) as CourseAnswer[];
    const answerIds = nextAnswers.map(answer => answer.id);
    const reviewResult = answerIds.length
      ? await supabase.from("ace_course_answer_reviews")
          .select("id,answer_id,reviewer_id,verdict,feedback,reviewed_at")
          .in("answer_id", answerIds)
      : { data: [], error: null };
    if (reviewResult.error) setIssue("Some answer evaluations could not be loaded.");
    const nextReviews = (reviewResult.data ?? []) as CourseAnswerReview[];
    setQuestions(nextQuestions);
    setAnswers(nextAnswers);
    setReviews(nextReviews);
    setIsReviewer(!!reviewerResult.data);
    const paths = [...new Set([
      ...nextQuestions.map(item => item.image_path),
      ...nextAnswers.map(item => item.image_path)
    ].filter((path): path is string => !!path))];
    const urlEntries = await Promise.all(paths.map(async path => {
      const { data } = await supabase!.storage.from("ace-course-media").createSignedUrl(path, 300);
      return data?.signedUrl ? [path, data.signedUrl] as const : null;
    }));
    setMediaUrls(Object.fromEntries(urlEntries.filter((entry): entry is readonly [string, string] => !!entry)));
    if (reviewerResult.error && reviewerResult.error.code !== "PGRST116") {
      // A student without a reviewer row is expected; the empty result is not an error state.
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, [code, user.id]);

  useEffect(() => {
    if (!supabase) return;
    const refresh = () => { void load(); };
    const channel = supabase.channel("ace-bba-qna-" + code + "-" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ace_course_questions", filter: "course_code=eq." + code }, refresh)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "ace_course_questions", filter: "course_code=eq." + code }, refresh)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ace_course_answers" }, refresh)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "ace_course_answers" }, refresh)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ace_course_answer_reviews" }, refresh)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "ace_course_answer_reviews" }, refresh)
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [code, user.id]);

  const visibleQuestions = useMemo(() => questions.filter(question =>
    [question.title, question.body, question.question_type].join(" ").toLowerCase().includes(search.toLowerCase())
  ), [questions, search]);
  const selectedQuestion = questions.find(question => question.id === selectedId) ?? null;
  const selectedAnswers = selectedQuestion ? answers.filter(answer => answer.question_id === selectedQuestion.id) : [];
  const reviewByAnswer = useMemo(() => new Map(reviews.map(review => [review.answer_id, review])), [reviews]);

  function setQuestionUrl(id: string) {
    setSelectedId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("question", id);
    window.history.replaceState({}, "", url.toString());
  }
  function clearQuestionUrl() {
    setSelectedId("");
    const url = new URL(window.location.href);
    url.searchParams.delete("question");
    window.history.replaceState({}, "", url.toString());
  }

  async function uploadImage(file: File, folder: string) {
    if (!supabase) throw new Error("Storage is not connected.");
    if (!fileTypes.includes(file.type) || file.size < 16 || file.size > 10 * 1024 * 1024) {
      throw new Error("Choose a JPG, PNG or WebP image up to 10 MB.");
    }
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = user.id + "/" + folder + "-" + crypto.randomUUID() + "." + ext;
    const { error } = await supabase.storage.from("ace-course-media").upload(path, file, {
      contentType: file.type, upsert: false
    });
    if (error) throw new Error(error.message);
    return path;
  }

  async function createQuestion(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase || working) return;
    if (questionTitle.trim().length < 5 || questionBody.trim().length < 5) {
      setIssue("Add a clear title and explain what you are asking.");
      return;
    }
    setWorking("question");
    setIssue("");
    setNotice("");
    let imagePath: string | null = null;
    try {
      if (questionImage) imagePath = await uploadImage(questionImage, "question");
      const { data, error } = await supabase.from("ace_course_questions").insert({
        course_code: code, author_id: user.id, title: questionTitle.trim(),
        body: questionBody.trim(), question_type: questionType, image_path: imagePath
      }).select("id").single();
      if (error || !data) throw new Error(error?.message ?? "Question could not be created.");
      setQuestionTitle("");
      setQuestionBody("");
      setQuestionImage(null);
      setQuestionType("concept");
      setShowQuestionForm(false);
      setNotice("Your question is now in the unit discussion.");
      await load();
      setQuestionUrl(data.id);
    } catch (error) {
      if (imagePath) await supabase.storage.from("ace-course-media").remove([imagePath]);
      setIssue(error instanceof Error ? error.message : "Question could not be created. Try again.");
    } finally { setWorking(""); }
  }

  async function postAnswer(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase || !selectedQuestion || working) return;
    if (answerBody.trim().length < 2) { setIssue("Write an explanation before posting."); return; }
    setWorking("answer");
    setIssue("");
    setNotice("");
    let imagePath: string | null = null;
    try {
      if (answerImage) imagePath = await uploadImage(answerImage, "answer");
      const { error } = await supabase.from("ace_course_answers").insert({
        question_id: selectedQuestion.id, author_id: user.id,
        body: answerBody.trim(), image_path: imagePath
      });
      if (error) throw new Error(error.message);
      setAnswerBody("");
      setAnswerImage(null);
      setNotice("Answer posted. It will remain marked as awaiting review until the question host evaluates it.");
      await load();
    } catch (error) {
      if (imagePath) await supabase.storage.from("ace-course-media").remove([imagePath]);
      setIssue(error instanceof Error ? error.message : "Your answer could not be posted.");
    } finally { setWorking(""); }
  }

  async function reviewAnswer(answer: CourseAnswer) {
    if (!supabase || !selectedQuestion || working) return;
    const draft = reviewDrafts[answer.id] ?? { verdict: "correct" as Verdict, feedback: "" };
    setWorking("review-" + answer.id);
    setIssue("");
    const { error } = await supabase.from("ace_course_answer_reviews").upsert({
      answer_id: answer.id, reviewer_id: user.id,
      verdict: draft.verdict, feedback: draft.feedback.trim()
    }, { onConflict: "answer_id" });
    if (error) setIssue("Evaluation could not be saved: " + error.message);
    else {
      setNotice("Answer evaluation saved.");
      await load();
    }
    setWorking("");
  }

  async function toggleResolved() {
    if (!supabase || !selectedQuestion || selectedQuestion.author_id !== user.id || working) return;
    if (!selectedQuestion.is_resolved) {
      const awaitingReview = selectedAnswers.filter(answer => !reviewByAnswer.has(answer.id)).length;
      if (awaitingReview > 0) {
        setIssue("Evaluate all " + awaitingReview + " remaining answer(s) before resolving this question.");
        return;
      }
    }
    setWorking("resolve");
    const { error } = await supabase.from("ace_course_questions")
      .update({ is_resolved: !selectedQuestion.is_resolved }).eq("id", selectedQuestion.id);
    if (error) setIssue("Question status could not be updated: " + error.message);
    else {
      setQuestions(items => items.map(item => item.id === selectedQuestion.id
        ? { ...item, is_resolved: !item.is_resolved } : item));
    }
    setWorking("");
  }

  async function shareQuestionImage(question: CourseQuestion, forAi: boolean) {
    if (!question.image_path) return;
    const signedUrl = mediaUrls[question.image_path];
    if (!signedUrl) { setIssue("The screenshot is still loading. Try again."); return; }
    const context = question.title + "\n" + question.body;
    const text = forAi
      ? "Help me understand and solve this " + courseTitle + " question. Explain the relevant concept and reasoning step by step, distinguish what is visible from assumptions, and do not invent facts.\n\n" + context
      : "Can you work through this " + courseTitle + " question with me? Share your approach or point out what I may be missing.\n\n" + context + "\n\nUnit discussion: " + window.location.href;
    try {
      const response = await fetch(signedUrl);
      if (!response.ok) throw new Error("Screenshot download failed.");
      const blob = await response.blob();
      const extension = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
      const file = new File([blob], "ace-question." + extension, { type: blob.type || "image/jpeg" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Ace Student · " + code,
          text,
          files: [file]
        });
      } else {
        await navigator.clipboard.writeText(text + "\n\nThe screenshot is available in the Ace Student thread: " + window.location.href);
        setNotice(forAi
          ? "AI prompt copied. This browser cannot attach the image; open the screenshot and use your device's Share action."
          : "Question context copied. Open the screenshot in Ace Student and share it from your device.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(text + "\n\nOpen the screenshot in Ace Student: " + window.location.href);
        setNotice(forAi
          ? "AI prompt copied. Share the screenshot separately from the question thread."
          : "Question text copied. Share the screenshot separately from the question thread.");
      } catch {
        setIssue("Could not share the screenshot. Open the image and use your device's Share action.");
      }
    }
  }

  async function shareQuestion(question: CourseQuestion, forAi: boolean) {
    const url = window.location.origin + "/courses/" + encodeURIComponent(code) + "?question=" + encodeURIComponent(question.id);
    const text = forAi
      ? "Help me understand and solve this " + courseTitle + " question. Explain the relevant concept first, show a structured approach, work through the reasoning, and identify common mistakes. Do not invent facts.\n\n" + question.title + "\n" + question.body
      : question.title + "\n\n" + question.body + "\n\nDiscuss this question with me on Ace Student.";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Ace Student · " + code, text, url });
      } else {
        await navigator.clipboard.writeText(text + "\n\nOpen the discussion: " + url);
        setNotice(forAi ? "AI prompt copied. Paste it into your preferred assistant." : "Question link copied. Share it with a classmate.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(text + "\n\nOpen the discussion: " + url);
        setNotice("Question and in-app link copied.");
      } catch { setIssue("Sharing is unavailable. Copy the question text and the unit link manually."); }
    }
  }

  return (
    <section className="ace-course-questions">
      <div className="cq-heading">
        <div>
          <span className="studio-overline">UNIT DISCUSSION · {code}</span>
          <h2>Questions and peer answers</h2>
          <p>Post a concept, calculation, case study or exam-style question. Every answer starts unreviewed until the question host evaluates it.</p>
        </div>
        <button className="btn" onClick={() => setShowQuestionForm(value => !value)}>
          {showQuestionForm ? "Close form" : "Ask a question"}
        </button>
      </div>

      {showQuestionForm && <form className="cq-question-form" onSubmit={event => void createQuestion(event)}>
        <label className="field" htmlFor="cq-title">Question title</label>
        <input id="cq-title" className="control" value={questionTitle} onChange={event => setQuestionTitle(event.target.value)} maxLength={180} minLength={5} required placeholder="e.g. How do we calculate the weighted average cost?" />
        <label className="field" htmlFor="cq-type">Question type</label>
        <select id="cq-type" className="control" value={questionType} onChange={event => setQuestionType(event.target.value as QuestionType)}>
          {Object.entries(questionTypeLabel).map(([value,label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <label className="field" htmlFor="cq-body">Context and what you have tried</label>
        <textarea id="cq-body" className="control" rows={4} maxLength={6000} value={questionBody} onChange={event => setQuestionBody(event.target.value)} required placeholder="Show the part that is confusing, the values given, or the reasoning you have tried." />
        <label className="cq-image-input" htmlFor="cq-question-image"><FileImage size={17}/><span>{questionImage ? questionImage.name : "Attach a screenshot (JPG, PNG or WebP, up to 10 MB)"}</span></label>
        <input id="cq-question-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setQuestionImage(event.target.files?.[0] ?? null)} />
        <button className="btn" type="submit" disabled={working === "question"}>{working === "question" ? "Posting…" : "Post question"}</button>
      </form>}

      {selectedQuestion ? (
        <div className="cq-thread">
          <button className="cq-back" onClick={clearQuestionUrl}><ArrowLeft size={15}/> All unit questions</button>
          <article className="cq-question-card">
            <div className="cq-card-meta"><span>{questionTypeLabel[selectedQuestion.question_type]}</span><span>{selectedQuestion.is_resolved ? "Resolved" : "Open for answers"}</span></div>
            <h3>{selectedQuestion.title}</h3>
            <p>{selectedQuestion.body}</p>
            {selectedQuestion.image_path && mediaUrls[selectedQuestion.image_path] && <img className="cq-attachment" src={mediaUrls[selectedQuestion.image_path]} alt="Screenshot attached to the question"/>}
            <div className="cq-question-tools">
              <button onClick={() => void shareQuestion(selectedQuestion, false)}><Share2 size={14}/> Share</button>
              <button onClick={() => void shareQuestion(selectedQuestion, true)}><Sparkles size={14}/> Send to AI</button>{selectedQuestion.image_path && <><button onClick={() => void shareQuestionImage(selectedQuestion, false)}><Share2 size={14}/> Share screenshot</button><button onClick={() => void shareQuestionImage(selectedQuestion, true)}><FileImage size={14}/> Send screenshot to AI</button></>}
              {selectedQuestion.author_id === user.id && <button onClick={() => void toggleResolved()}><CheckCircle2 size={14}/>{selectedQuestion.is_resolved ? "Reopen question" : "Mark resolved"}</button>}
            </div>
          </article>

          <div className="cq-answers-heading"><h3>{selectedAnswers.length} peer {selectedAnswers.length === 1 ? "answer" : "answers"}</h3><span>Each answer needs a review</span></div>
          {selectedAnswers.length ? selectedAnswers.map(answer => {
            const review = reviewByAnswer.get(answer.id);
            // No one may evaluate their own answer. A question host or an authorised reviewer can evaluate peers.
            const canReview = answer.author_id !== user.id && (selectedQuestion.author_id === user.id || isReviewer);
            // A question host cannot overwrite a moderator's evaluation unless they are themselves an authorised reviewer.
            const canEditReview = !review || review.reviewer_id === user.id || isReviewer;
            const draft = reviewDrafts[answer.id] ?? { verdict: review?.verdict ?? "correct", feedback: review?.feedback ?? "" };
            return <article className="cq-answer-card" key={answer.id}>
              <div className="cq-answer-meta"><span>{answer.author_id === user.id ? "Your answer" : "Student answer"}</span><span>{new Date(answer.created_at).toLocaleString()}</span></div>
              <p>{answer.body}</p>
              {answer.image_path && mediaUrls[answer.image_path] && <img className="cq-attachment" src={mediaUrls[answer.image_path]} alt="Screenshot attached to this answer"/>}
              {review ? <div className={"cq-review-result cq-review-" + review.verdict}>
                <strong><ShieldCheck size={14}/>{verdictLabel[review.verdict]}</strong>
                {review.feedback && <p>{review.feedback}</p>}
                <small>Reviewed {new Date(review.reviewed_at).toLocaleString()}</small>
              </div> : <p className="cq-awaiting">Awaiting evaluation by the question host.</p>}
              {canReview && canEditReview && <details className="cq-review-form" open={!review}>
                <summary>{review ? "Update evaluation" : "Evaluate this answer"}</summary>
                <label className="field">Evaluation</label>
                <select className="control" value={draft.verdict} onChange={event => setReviewDrafts(items => ({ ...items, [answer.id]: { ...draft, verdict: event.target.value as Verdict } }))}>
                  {Object.entries(verdictLabel).map(([value,label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <label className="field">Feedback / correction</label>
                <textarea className="control" rows={2} maxLength={1600} value={draft.feedback} onChange={event => setReviewDrafts(items => ({ ...items, [answer.id]: { ...draft, feedback: event.target.value } }))} placeholder="Explain what is correct or what needs improvement."/>
                <button className="btn secondary" onClick={() => void reviewAnswer(answer)} disabled={working === "review-" + answer.id}>{working === "review-" + answer.id ? "Saving…" : "Save evaluation"}</button>
              </details>}
            </article>;
          }) : <div className="cq-empty">No answers yet. Add the first explanation or show the working you would use in an exam.</div>}

          {!selectedQuestion.is_resolved && <form className="cq-answer-form" onSubmit={event => void postAnswer(event)}>
            <h3>Your answer</h3>
            <textarea className="control" rows={4} maxLength={6000} value={answerBody} onChange={event => setAnswerBody(event.target.value)} required placeholder="Explain the steps, relevant principle and your conclusion."/>
            <label className="cq-image-input" htmlFor="cq-answer-image"><FileImage size={17}/><span>{answerImage ? answerImage.name : "Attach a working or screenshot (optional)"}</span></label>
            <input id="cq-answer-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setAnswerImage(event.target.files?.[0] ?? null)}/>
            <button className="btn" type="submit" disabled={working === "answer"}><Send size={14}/>{working === "answer" ? "Posting…" : "Post answer"}</button>
          </form>}
        </div>
      ) : (
        <>
          <div className="cq-filter"><MessageCircle size={15}/><input aria-label="Search unit questions" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search questions in this unit"/></div>
          {loading ? <p className="cq-empty" role="status">Loading unit questions…</p> : visibleQuestions.length ? (
            <div className="cq-question-list">{visibleQuestions.map(question => (
              <button className="cq-question-row" key={question.id} onClick={() => setQuestionUrl(question.id)}>
                <span className="cq-question-row-main"><small>{questionTypeLabel[question.question_type]} · {question.is_resolved ? "Resolved" : "Open"}</small><strong>{question.title}</strong><span>{question.body.slice(0, 150)}{question.body.length > 150 ? "…" : ""}</span></span>
                <ArrowRight size={16}/>
              </button>
            ))}</div>
          ) : <div className="cq-empty">No one has posted a question for this unit yet. This is the place to start a worked example, ask for a concept explanation or compare exam approaches.</div>}
        </>
      )}

      {issue && <p className="status" role="alert">{issue} <button className="text-link" onClick={() => void load()}>Retry</button></p>}
      {notice && <p className="status" role="status">{notice}</p>}
    </section>
  );
}
