import { createLocalizedPageMetadata } from "@/lib/seo";

export async function generateMetadata() { return createLocalizedPageMetadata({
  path: "/mentions-legales",
  title: { fr: "Mentions légales", nl: "Wettelijke vermeldingen" },
  description: {
    fr: "Consultez les mentions légales et les informations de confidentialité de CURA.",
    nl: "Lees de wettelijke vermeldingen en privacyinformatie van CURA.",
  },
}); }

export default function LegalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
