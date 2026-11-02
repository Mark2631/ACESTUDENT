import type { Metadata } from "next";
import StudentApp from "../../student-app";

export const metadata: Metadata = {
  title: "Course learning | Ace Student",
  description: "Explore course resources, original lessons and practice materials on Ace Student.",
};

export default async function CoursePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <StudentApp initialTab="course" initialCourseCode={code} />;
}
