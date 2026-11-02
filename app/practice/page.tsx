import type { Metadata } from "next";
import StudentApp from "../student-app";

export const metadata: Metadata = {
  title: "Practice & Quiz Arena | Ace Student",
  description: "Try account-free sample practice or test your understanding with course-aligned quizzes and explanations.",
  alternates: { canonical: "/practice" },
};

export default function PracticePage() {
  return <StudentApp initialTab="practice" />;
}
