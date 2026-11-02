import type { Metadata } from "next";
import StudentApp from "../student-app";

export const metadata: Metadata = {
  title: "Study planner | Ace Student",
  description: "Organise revision tasks and course study sessions.",
  robots: { index: false, follow: false },
};

export default function PlannerPage() {
  return <StudentApp initialTab="planner" />;
}
