import type { MetadataRoute } from "next";
import { absoluteUrl, HAS_PUBLIC_SITE_URL, SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  if (!HAS_PUBLIC_SITE_URL) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL.origin,
  };
}
