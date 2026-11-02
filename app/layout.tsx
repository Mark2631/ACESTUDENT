import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./fieldnotes.css";
import "./lesson-library.css";
import "./ace-product-polish.css";
import "./ace-campus-ui.css";
import "./bba-pilot.css";
import "./course-exam-papers.css";
import "./question-sharing.css";
import "./course-questions.css";
import { PWARegister } from "./pwa-register";
export const metadata: Metadata = {
 metadataBase: new URL("https://ace-student.vercel.app"),
 title: { default: "Ace Student — Find it. Understand it. Practice it.", template: "%s | Ace Student" },
 description: "A student-first learning workspace for discovering trusted course resources, practising with feedback, creating study materials and learning together.",
 manifest: "/manifest.webmanifest",
 applicationName: "Ace Student",
 icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml", sizes: "any" }], shortcut: "/icon.svg", apple: "/icon.svg" },
 openGraph: { title: "Ace Student", description: "Find trusted learning resources, understand difficult topics and practise with feedback.", siteName: "Ace Student", type: "website" },
 twitter: { card: "summary", title: "Ace Student", description: "Find it. Understand it. Practice it." },
 robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#f3f6fc", width: "device-width", initialScale: 1, viewportFit: "cover" };
const themeBootstrap = "try { var theme = localStorage.getItem('ace-theme') || localStorage.getItem('ace-theme-v2'); document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light'; } catch (error) { document.documentElement.dataset.theme = 'light'; }";
export default function RootLayout({ children }: { children: React.ReactNode }) {
 return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:themeBootstrap}} /></head><body>{children}<PWARegister /></body></html>;
}
