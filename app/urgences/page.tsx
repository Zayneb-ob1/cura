"use client";

import { ButtonLink, SectionLabel } from "@/components/buttons";
import { useLanguage } from "@/components/language-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useSiteSettings } from "@/components/site-settings-provider";
import { hoursByLanguage } from "@/lib/content";

const pageCopy = {
  fr: {
    label: "Urgences",
    title: "Une urgence dentaire ? Appelez-nous.",
    intro: "En cas de douleur, de dent cassée ou de gonflement, contactez le cabinet par téléphone.",
    call: "Appeler le cabinet",
    callPending: "Le numéro de téléphone du cabinet doit encore être confirmé. Utilisez la page Contact en attendant.",
    when: "Quand appeler",
    whenFallback: "Informations à confirmer auprès du cabinet.",
    hours: "Horaires",
    hoursFallback: "Horaires à confirmer auprès du cabinet.",
    other: "Pas une urgence ?",
    otherText: "Pour un contrôle ou un soin planifié, réservez en ligne : vous recevez une confirmation sous 24 h.",
    appointment: "Prendre rendez-vous",
    contact: "Contact",
  },
  nl: {
    label: "Spoed",
    title: "Een tandheelkundig spoedgeval? Bel ons.",
    intro: "Bij pijn, een afgebroken tand of zwelling neemt u telefonisch contact op met de praktijk.",
    call: "Bel de praktijk",
    callPending: "Het telefoonnummer van de praktijk moet nog worden bevestigd. Gebruik intussen de contactpagina.",
    when: "Wanneer bellen",
    whenFallback: "Informatie te bevestigen bij de praktijk.",
    hours: "Openingsuren",
    hoursFallback: "Openingsuren te bevestigen bij de praktijk.",
    other: "Geen spoed?",
    otherText: "Voor een controle of een geplande behandeling boekt u online: u ontvangt binnen 24 uur een bevestiging.",
    appointment: "Maak een afspraak",
    contact: "Contact",
  },
} as const;

export default function EmergencyPage() {
  const { language } = useLanguage();
  const clinicConfig = useSiteSettings();
  const copy = pageCopy[language];
  const schedule = clinicConfig.schedule[language];
  const openHours = hoursByLanguage[language].filter(([, value]) => value && value !== "—");

  return (
    <div className="advice-page page-paper">
      <SiteHeader />
      <main>
        <section className="content-shell advice-page__intro" id="main-content" tabIndex={-1}>
          <SectionLabel>{copy.label}</SectionLabel>
          <h1 className="editorial-title">{copy.title}</h1>
          <p>{copy.intro}</p>
        </section>
        <section className="content-shell advice-cards">
          <article>
            <span aria-hidden="true">01</span>
            <h2>{copy.call}</h2>
            {clinicConfig.hasPhone
              ? <p><a href={`tel:${clinicConfig.phone}`}>{clinicConfig.phoneDisplay}</a></p>
              : <><p>{copy.callPending}</p><ButtonLink href="/contact">{copy.contact}</ButtonLink></>}
          </article>
          <article>
            <span aria-hidden="true">02</span>
            <h2>{copy.when}</h2>
            <p>{clinicConfig.emergency[language] || copy.whenFallback}</p>
          </article>
          <article>
            <span aria-hidden="true">03</span>
            <h2>{copy.hours}</h2>
            {schedule ? <p>{schedule}</p> : null}
            {openHours.length > 0
              ? <p>{openHours.map(([day, value]) => `${day} ${value}`).join(" · ")}</p>
              : schedule ? null : <p>{copy.hoursFallback}</p>}
          </article>
          <article>
            <span aria-hidden="true">04</span>
            <h2>{copy.other}</h2>
            <p>{copy.otherText}</p>
            <ButtonLink href="/rendez-vous">{copy.appointment}</ButtonLink>
          </article>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
