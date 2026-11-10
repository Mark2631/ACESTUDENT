import type { MetadataRoute } from "next";

export default function robots():MetadataRoute.Robots {
 return {rules:{userAgent:"*",allow:"/",disallow:["/profile","/my-uploads","/upload","/onboarding"]},sitemap:"https://ace-student.vercel.app/sitemap.xml"};
}