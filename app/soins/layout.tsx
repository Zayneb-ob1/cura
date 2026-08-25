import { createLocalizedPageMetadata } from "@/lib/seo";

export async function generateMetadata() { return createLocalizedPageMetadata({
  path: "/soins",
  title: { fr: "Soins dentaires", nl: "Tandheelkundige behandelingen" },
  description: {
    fr: "Découvrez les soins dentaires présentés par CURA.",
    nl: "Ontdek de tandheelkundige behandelingen die CURA voorstelt.",
  },
}); }

export default function TreatmentsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
