import { createLocalizedPageMetadata } from "@/lib/seo";

export async function generateMetadata() { return createLocalizedPageMetadata({
  path: "/conseils",
  title: { fr: "Conseils dentaires", nl: "Tandheelkundig advies" },
  description: {
    fr: "Consultez les conseils et réponses aux questions fréquentes de CURA.",
    nl: "Lees het advies en de antwoorden op veelgestelde vragen van CURA.",
  },
}); }

export default function AdviceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
