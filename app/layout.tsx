import type { Metadata, Viewport } from "next";
import { LanguageProvider } from "@/components/language-provider";
import { SiteSettingsProvider } from "@/components/site-settings-provider";
import { createPageMetadata, HAS_PUBLIC_SITE_URL, requestLanguage, SITE_NAME, SITE_URL } from "@/lib/seo";
import { loadClinicConfig } from "@/lib/site-settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const language = await requestLanguage();
  return {
    ...createPageMetadata({
      path: "/",
      title: { fr: "Cabinet dentaire CURA", nl: "Tandartspraktijk CURA" },
      description: {
        fr: "Site du cabinet dentaire CURA : informations, accueil des nouveaux patients et demandes de rendez-vous.",
        nl: "Website van tandartspraktijk CURA: informatie, onthaal van nieuwe patiënten en afspraakaanvragen.",
      },
    }, language),
    metadataBase: SITE_URL,
    applicationName: SITE_NAME,
    title: {
      default: language === "fr" ? "CURA | Cabinet dentaire" : "CURA | Tandartspraktijk",
      template: "%s | CURA",
    },
    category: "healthcare",
    robots: HAS_PUBLIC_SITE_URL
      ? { index: true, follow: true }
      : { index: false, follow: false, noarchive: true },
    icons: {
      icon: "/brand/cura-tooth.png",
      shortcut: "/brand/cura-tooth.png",
      apple: "/brand/cura-tooth.png",
    },
  };
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f0e9" },
    { media: "(prefers-color-scheme: dark)", color: "#06100c" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [language, siteSettings] = await Promise.all([requestLanguage(), loadClinicConfig()]);
  return (
    <html lang={language}>
      <head>
        <link rel="preload" href="/fonts/inter-400.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/cormorant-400.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <a className="skip-link" href="#main-content">Aller au contenu / Naar inhoud</a>
        <SiteSettingsProvider initialSettings={siteSettings}>
          <LanguageProvider initialLanguage={language}>{children}</LanguageProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
