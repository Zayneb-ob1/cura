import type { Metadata } from "next";
import { LanguageProvider } from "@/components/language-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "CURA Tandarts Praktijk",
  description:
    "Cabinet dentaire à Hasselt. Des soins clairs et une équipe attentive.",
  icons: {
    icon: "/brand/cura-tooth.png",
    shortcut: "/brand/cura-tooth.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
