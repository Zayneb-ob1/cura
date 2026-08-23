import type { MetadataRoute } from "next";
import { absoluteUrl, HAS_PUBLIC_SITE_URL, languageUrl, publicRoutes } from "@/lib/seo";

const priorities: Record<(typeof publicRoutes)[number], number> = {
  "/": 1,
  "/soins": 0.9,
  "/cabinet": 0.8,
  "/nouveau-patient": 0.8,
  "/conseils": 0.7,
  "/contact": 0.8,
  "/rendez-vous": 0.9,
  "/mentions-legales": 0.3,
};

export default function sitemap(): MetadataRoute.Sitemap {
  if (!HAS_PUBLIC_SITE_URL) return [];
  return publicRoutes.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: priorities[path],
    alternates: {
      languages: {
        "fr-BE": absoluteUrl(languageUrl(path, "fr")),
        "nl-BE": absoluteUrl(languageUrl(path, "nl")),
      },
    },
  }));
}
