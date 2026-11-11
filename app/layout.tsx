import type { Metadata, Viewport } from "next";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/source-serif-4/700.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Ace Student — Learn together. Get ahead.", template: "%s · Ace Student" },
  description: "A student learning community for sharing notes, past papers and course materials.",
  applicationName: "Ace Student",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Ace Student" }
};

export const viewport: Viewport = { themeColor: "#f2f0e8", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}