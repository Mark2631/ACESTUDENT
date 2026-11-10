import type { Metadata, Viewport } from "next";
import "./globals.css";
import "docx-preview/dist/docx-preview.css";

export const metadata: Metadata = {
  title: { default: "Ace Student — Learn together. Get ahead.", template: "%s · Ace Student" },
  description: "A student learning community for sharing notes, past papers and course materials.",
  applicationName: "Ace Student",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Ace Student" }
};

export const viewport: Viewport = { themeColor: "#f6f8fa", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}