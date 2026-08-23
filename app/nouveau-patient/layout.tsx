import { createLocalizedPageMetadata } from "@/lib/seo";

export async function generateMetadata() { return createLocalizedPageMetadata({
  path: "/nouveau-patient",
  title: { fr: "Nouveau patient", nl: "Nieuwe patiënt" },
  description: {
    fr: "Préparez votre première visite au cabinet dentaire CURA.",
    nl: "Bereid uw eerste bezoek aan tandartspraktijk CURA voor.",
  },
}); }

export default function NewPatientLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
