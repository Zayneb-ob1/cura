"use client";

import { ButtonLink, SectionLabel } from "@/components/buttons";
import { useLanguage } from "@/components/language-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { treatmentsByLanguage } from "@/lib/content";

const pageCopy = {
  fr: {
    label: "Nos soins",
    title: "Neuf soins, de la prévention à la reconstruction.",
    intro: "Chaque soin avec son déroulé, sa durée et son tarif indicatif. Les montants sont donnés à titre d’information et confirmés après examen.",
    sheet: "Voir la fiche",
    book: "Réserver",
  },
  nl: {
    label: "Onze behandelingen",
    title: "Negen behandelingen, van preventie tot herstel.",
    intro: "Bij elke behandeling vindt u het verloop, de duur en een richtprijs. Bedragen zijn informatief en worden na het onderzoek bevestigd.",
    sheet: "Bekijk de fiche",
    book: "Reserveren",
  },
} as const;

export default function SoinsPage() {
  const { language } = useLanguage();
  const copy = pageCopy[language];
  const treatments = treatmentsByLanguage[language];

  return (
    <div className="treatments-page page-paper">
      <SiteHeader />
      <main>
      <section className="content-shell page-intro treatments-page__intro" id="main-content" tabIndex={-1}>
        <SectionLabel>{copy.label}</SectionLabel>
        <h1 className="editorial-title page-intro__title">{copy.title}</h1>
        <p className="page-intro__copy">{copy.intro}</p>
      </section>
      <div className="content-shell treatments-list">
        {treatments.map((care) => (
          <article className="treatment-row" id={`soin-${care.number}`} key={care.number}>
            <span className="treatment-row__bar" aria-hidden="true" />
            <div className="treatment-row__title">
              <small>{care.number} — {care.duration.toUpperCase()} · {care.price}</small>
              <h2>{care.name}</h2><p>{care.short}</p>
            </div>
            <div className="treatment-row__detail">
              <p id={`soin-${care.number}-details`}>{care.detail}</p>
              <div><ButtonLink href={`/soins#soin-${care.number}-details`} tone="outline">{copy.sheet}</ButtonLink><ButtonLink href={`/rendez-vous?care=${care.number}`}>{copy.book}</ButtonLink></div>
            </div>
          </article>
        ))}
      </div>
      </main>
      <SiteFooter />
    </div>
  );
}
