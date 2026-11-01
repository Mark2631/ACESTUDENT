import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Study Groups | Ace Student",
  description: "Join course communities and study spaces with other students on Ace Student.",
};

export default function GroupsRedirect() {
  redirect("/spaces");
}
