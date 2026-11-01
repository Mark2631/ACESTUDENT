import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://ace-student.vercel.app";
  return ["", "/library", "/practice", "/create", "/spaces"].map((path) => ({
    url: base + path,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
