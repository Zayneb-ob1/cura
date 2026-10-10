"use client";

import { ButtonLink, SectionLabel } from "@/components/buttons";
import { useLanguage } from "@/components/language-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { treatmentsByLanguage } from "@/lib/content";

const pageCopy = {
  fr: {
    label: "Tarifs",
    title: "Des tarifs clairs, annoncés avant le soin.",
    intro: "Les montants ci-dessous sont des tarifs indicatifs : ils sont donnés à titre d’information et confirmés après examen. Un devis vous est remis avant tout soin dépassant 150 €.",
    tableCaption: "Tarifs indicatifs par soin",
    care: "Soin",
    duration: "Durée",
    price: "Tarif indicatif",
    practicalItems: [
      ["Devis", "Avant tout soin dépassant 150 €."],
      ["Mutuelle", "Pensez à apporter votre vignette de mutuelle."],
      ["Paiement", "Bancontact, espèces."],
    ],
    question: "Une question sur un montant ?",
    questionCopy: "Écrivez-nous via la page Contact.",
    contact: "Nous contacter",
    details: "Tous les soins en détail",
  },
  nl: {
    label: "Tarieven",
    title: "Duidelijke tarieven, vooraf meegedeeld.",
    intro: "De bedragen hieronder zijn richtprijzen: ze zijn informatief en worden na het onderzoek bevestigd. U ontvangt een offerte vóór elke behandeling boven 150 €.",
    tableCaption: "Richtprijzen per behandeling",
    care: "Behandeling",
    duration: "Duur",
    price: "Richtprijs",
    practicalItems: [
      ["Offerte", "Vóór elke behandeling boven 150 €."],
      ["Ziekenfonds", "Breng uw klevertje van het ziekenfonds mee."],
      ["Betaling", "Bancontact, contant."],
    ],
    question: "Een vraag over een bedrag?",
    questionCopy: "Schrijf ons via de contactpagina.",
    contact: "Contacteer ons",
    details: "Alle behandelingen bekijken",
  },
} as const;

export default function PricingPage() {
  const { language } = useLanguage();
  const copy = pageCopy[language];
  const treatments = treatmentsByLanguage[language];

  return (
    <div className="advice-page pricing-page page-paper">
      <SiteHeader />
      <main>
        <section className="content-shell advice-page__intro" id="main-content" tabIndex={-1}>
          <SectionLabel>{copy.label}</SectionLabel>
          <h1 className="editorial-title">{copy.title}</h1>
          <p>{copy.intro}</p>
        </section>
        <section className="content-shell pricing-table">
          <table>
            <caption className="sr-only">{copy.tableCaption}</caption>
            <thead>
              <tr><th scope="col">{copy.care}</th><th scope="col">{copy.duration}</th><th scope="col">{copy.price}</th></tr>
            </thead>
            <tbody>
              {treatments.map((care) => (
                <tr key={care.number}><th scope="row">{care.name}</th><td>{care.duration}</td><td>{care.price}</td></tr>
              ))}
            </tbody>
          </table>
          <ButtonLink href="/soins" tone="outline">{copy.details}</ButtonLink>
        </section>
        <section className="content-shell advice-cards">
          {copy.practicalItems.map(([title, text], index) => (
            <article key={title}><span aria-hidden="true">0{index + 1}</span><h2>{title}</h2><p>{text}</p></article>
          ))}
        </section>
        <section className="home-question pricing-page__question">
          <h2>{copy.question}</h2>
          <p>{copy.questionCopy}</p>
          <ButtonLink href="/contact">{copy.contact}</ButtonLink>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
