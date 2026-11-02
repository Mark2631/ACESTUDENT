import type { Metadata } from "next";
import StudentApp from "../student-app";

export const metadata: Metadata = {
  title: "Student Groups | Ace Student",
  description: "Find classmates, start revision groups, share resources and study together.",
  alternates: { canonical: "/spaces" },
  robots: { index: false, follow: false },
};

export default function SpacesPage() {
  return <StudentApp initialTab="spaces" />;
}
