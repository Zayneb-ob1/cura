import { createLocalizedPageMetadata } from "@/lib/seo";

export async function generateMetadata() { return createLocalizedPageMetadata({
  path: "/cabinet",
  title: { fr: "Le cabinet", nl: "De praktijk" },
  description: {
    fr: "Découvrez l’équipe et le cabinet dentaire CURA.",
    nl: "Maak kennis met het team en de tandartspraktijk van CURA.",
  },
}); }

export default function CabinetLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
