import type { Metadata } from "next";
import { headers } from "next/headers";

type LocalizedText = {
  fr: string;
  nl: string;
};

type PageMetadataOptions = {
  path: string;
  title: LocalizedText;
  description: LocalizedText;
};

function toSiteOrigin(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
}

const explicitSiteUrl = toSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL);
const vercelProductionUrl = process.env.VERCEL_ENV === "production"
  ? toSiteOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL)
  : null;
const deploymentUrl = explicitSiteUrl ?? vercelProductionUrl ?? toSiteOrigin(process.env.VERCEL_URL);
const isVercelPreview = Boolean(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production");

export const SITE_NAME = "CURA Tandarts Praktijk";
export const HAS_PUBLIC_SITE_URL = !isVercelPreview && (explicitSiteUrl !== null || vercelProductionUrl !== null);
export const SITE_URL = deploymentUrl ?? new URL("http://localhost:3000");

export const publicRoutes = [
  "/",
  "/soins",
  "/cabinet",
  "/tarifs",
  "/nouveau-patient",
  "/conseils",
  "/contact",
  "/rendez-vous",
  "/mentions-legales",
] as const;

export function languageUrl(path: string, language: "fr" | "nl") {
  return `${path}?lang=${language}`;
}

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export async function requestLanguage(): Promise<"fr" | "nl"> {
  return (await headers()).get("x-cura-language") === "nl" ? "nl" : "fr";
}

export function createPageMetadata(
  { path, title, description }: PageMetadataOptions,
  language: "fr" | "nl" = "fr",
): Metadata {
  const localizedTitle = title[language];
  const localizedDescription = description[language];
  const canonical = languageUrl(path, language);
  return {
    title: localizedTitle,
    description: localizedDescription,
    alternates: HAS_PUBLIC_SITE_URL ? {
      canonical,
      languages: {
        "fr-BE": languageUrl(path, "fr"),
        "nl-BE": languageUrl(path, "nl"),
        "x-default": path,
      },
    } : undefined,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: localizedTitle,
      description: localizedDescription,
      url: HAS_PUBLIC_SITE_URL ? canonical : undefined,
      locale: language === "fr" ? "fr_BE" : "nl_BE",
      alternateLocale: [language === "fr" ? "nl_BE" : "fr_BE"],
      images: HAS_PUBLIC_SITE_URL ? [
        {
          url: "/brand/cura-tooth.png",
          alt: SITE_NAME,
        },
      ] : undefined,
    },
    twitter: {
      card: "summary",
      title: localizedTitle,
      description: localizedDescription,
      images: HAS_PUBLIC_SITE_URL ? ["/brand/cura-tooth.png"] : undefined,
    },
  };
}

export async function createLocalizedPageMetadata(options: PageMetadataOptions): Promise<Metadata> {
  return createPageMetadata(options, await requestLanguage());
}
