import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/account", "/api/", "/read/"] }],
    sitemap: "https://ace-student.vercel.app/sitemap.xml",
    host: "https://ace-student.vercel.app",
  };
}
