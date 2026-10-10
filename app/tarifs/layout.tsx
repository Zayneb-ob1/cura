import { createLocalizedPageMetadata } from "@/lib/seo";

export async function generateMetadata() { return createLocalizedPageMetadata({
  path: "/tarifs",
  title: { fr: "Tarifs", nl: "Tarieven" },
  description: {
    fr: "Tarifs indicatifs des soins du cabinet CURA, devis avant tout soin dépassant 150 €.",
    nl: "Richtprijzen van de behandelingen bij CURA, offerte vóór elke behandeling boven 150 €.",
  },
}); }

export default function PricingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
