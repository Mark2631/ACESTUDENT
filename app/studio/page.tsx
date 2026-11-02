import type { Metadata } from "next";
import StudentApp from "../student-app";

export const metadata: Metadata = {
  title: "Study Studio | Ace Student",
  description: "Build study notebooks from your materials, revise with FSRS-powered flashcards and practise active recall.",
  robots: { index: false, follow: false },
};

export default function StudyStudioPage() {
  return <StudentApp initialTab="studio" />;
}
