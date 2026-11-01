import type { MetadataRoute } from "next";

const siteUrl = "https://ace-student.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/library", "/practice", "/spaces"];
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
