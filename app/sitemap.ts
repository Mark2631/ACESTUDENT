import type { MetadataRoute } from "next";

export default function sitemap():MetadataRoute.Sitemap {
 return [{url:"https://ace-student.vercel.app",changeFrequency:"weekly",priority:1},{url:"https://ace-student.vercel.app/search",changeFrequency:"daily",priority:.8},{url:"https://ace-student.vercel.app/about",changeFrequency:"monthly",priority:.5}];
}