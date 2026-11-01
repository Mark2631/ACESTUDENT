import { redirect } from "next/navigation";
export const metadata = { title: "Student Groups | Ace Student", description: "Find classmates, start revision groups, share resources and study together.", alternates: { canonical: "/groups" } };
export default function GroupsRoute() { redirect("/spaces"); }
