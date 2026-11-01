import type { MetadataRoute } from "next";

const siteUrl = "https://ace-student.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/library", "/practice", "/spaces", "/courses/"],
      disallow: ["/account", "/create", "/read/", "/api/", "/planner", "/notes"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
