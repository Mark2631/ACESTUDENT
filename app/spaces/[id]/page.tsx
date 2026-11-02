import type { Metadata } from "next";
import StudentApp from "../../student-app";

export const metadata: Metadata = {
  title: "Study Space | Ace Student",
  description: "Open a course discussion space and study with your peers.",
  robots: { index: false, follow: false },
};

export default async function StudySpacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudentApp initialTab="spaces" initialSpaceId={id} />;
}
