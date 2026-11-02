import type { Metadata } from "next";
import StudentApp from "../student-app";

export const metadata: Metadata = {
  title: "Learning Library | Ace Student",
  description: "Browse course notes, revision guides, past papers and original in-app lessons on Ace Student.",
  alternates: { canonical: "/library" },
};

export default function LibraryPage() {
  return <StudentApp initialTab="library" />;
}
