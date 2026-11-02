import type { Metadata } from "next";
import StudentApp from "../student-app";

export const metadata: Metadata = {
  title: "Collaborative notes | Ace Student",
  description: "Create and review shared study notes with your learning group.",
  robots: { index: false, follow: false },
};

export default function NotesPage() {
  return <StudentApp initialTab="notes" />;
}
