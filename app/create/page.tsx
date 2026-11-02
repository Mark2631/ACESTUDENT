import type { Metadata } from "next";
import StudentApp from "../student-app";

export const metadata: Metadata = {
  title: "Create Study Materials | Ace Student",
  description: "Contribute notes and learning materials, build study resources and help other students learn.",
  alternates: { canonical: "/create" },
  robots: { index: false, follow: false },
};

export default function CreatePage() {
  return <StudentApp initialTab="upload" />;
}
