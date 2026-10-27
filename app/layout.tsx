import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Ace Student — Learn together. Get better.", description:"A student-powered learning workspace for resources, practice and study sessions.", manifest:"/manifest.webmanifest", applicationName:"Ace Student" };
export const viewport: Viewport={themeColor:"#f8f9fb",width:"device-width",initialScale:1};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}