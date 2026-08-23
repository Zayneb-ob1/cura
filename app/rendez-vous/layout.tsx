import { createLocalizedPageMetadata } from "@/lib/seo";

export async function generateMetadata() { return createLocalizedPageMetadata({
  path: "/rendez-vous",
  title: { fr: "Prendre rendez-vous", nl: "Afspraak maken" },
  description: {
    fr: "Envoyez votre demande de rendez-vous au cabinet dentaire CURA.",
    nl: "Stuur uw afspraakaanvraag naar tandartspraktijk CURA.",
  },
}); }

export default function AppointmentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
