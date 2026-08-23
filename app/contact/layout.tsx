import { createLocalizedPageMetadata } from "@/lib/seo";

export async function generateMetadata() { return createLocalizedPageMetadata({
  path: "/contact",
  title: { fr: "Contact", nl: "Contact" },
  description: {
    fr: "Contactez le cabinet dentaire CURA.",
    nl: "Neem contact op met tandartspraktijk CURA.",
  },
}); }

export default function ContactLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
