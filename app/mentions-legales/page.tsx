"use client";

import { SectionLabel } from "@/components/buttons";
import { useLanguage } from "@/components/language-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const pageCopy = {
  fr: {
    label: "Informations légales",
    title: "Mentions légales.",
    intro: "Les informations essentielles concernant le site et la pratique CURA.",
    sections: [
      ["Éditeur du site", "CURA Tandarts Praktijk · Kuringenstraat 511, 4030 Hasselt · +32 (0)11 00 00 00"],
      ["Données personnelles", "Les informations envoyées via les formulaires sont utilisées uniquement pour répondre à votre message ou organiser votre rendez-vous. Elles ne sont pas cédées à des tiers."],
      ["Informations médicales", "Le contenu de ce site est informatif et ne remplace pas un examen clinique ni l’avis personnalisé d’un professionnel de santé."],
    ],
  },
  nl: {
    label: "Wettelijke informatie",
    title: "Wettelijke vermeldingen.",
    intro: "De belangrijkste informatie over de CURA-website en tandartspraktijk.",
    sections: [
      ["Verantwoordelijke uitgever", "CURA Tandarts Praktijk · Kuringenstraat 511, 4030 Hasselt · +32 (0)11 00 00 00"],
      ["Persoonsgegevens", "Gegevens die via de formulieren worden verzonden, gebruiken we alleen om uw bericht te beantwoorden of uw afspraak te regelen. Ze worden niet aan derden doorgegeven."],
      ["Medische informatie", "De inhoud van deze website is informatief en vervangt geen klinisch onderzoek of persoonlijk advies van een zorgverlener."],
    ],
  },
} as const;

export default function LegalPage() {
  const { language } = useLanguage();
  const copy = pageCopy[language];

  return (
    <main className="advice-page page-paper">
      <SiteHeader />
      <section className="content-shell advice-page__intro">
        <SectionLabel>{copy.label}</SectionLabel><h1 className="editorial-title">{copy.title}</h1><p>{copy.intro}</p>
      </section>
      <section className="content-shell advice-cards">
        {copy.sections.map(([title, text], index) => <article key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{text}</p></article>)}
      </section>
      <SiteFooter />
    </main>
  );
}
