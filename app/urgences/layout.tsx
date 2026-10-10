import { createLocalizedPageMetadata } from "@/lib/seo";

export async function generateMetadata() { return createLocalizedPageMetadata({
  path: "/urgences",
  title: { fr: "Urgences dentaires", nl: "Tandheelkundige spoed" },
  description: {
    fr: "Une urgence dentaire ? Appelez le cabinet CURA.",
    nl: "Een tandheelkundig spoedgeval? Bel de CURA-praktijk.",
  },
}); }

export default function EmergencyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
