import type { Metadata } from "next";
import StudentApp from "../student-app";

export const metadata: Metadata = {
  title: "My account | Ace Student",
  description: "Manage your Ace Student account and academic profile.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <StudentApp initialTab="account" />;
}
