"use client";

import { useLanguage } from "@/components/language-provider";
import { useSiteSettings } from "@/components/site-settings-provider";

const cardsCopy = {
  fr: {
    addressCard: "Adresse du cabinet",
    contactCard: "Nous contacter",
    practicalCard: "Infos pratiques",
    pending: "À confirmer",
    directions: "Voir votre itinéraire",
    call: "Téléphonez-nous",
    write: "Écrivez-nous",
    practicalCopy: "Avec ou sans rendez-vous préalable",
    access: "Situé au rez-de-chaussée, entrée accessible",
    parking: "Parking gratuit disponible sur place",
    country: "Belgique",
    hours: "Lundi au vendredi de 9h à 17h",
  },
  nl: {
    addressCard: "Adres van de praktijk",
    contactCard: "Contacteer ons",
    practicalCard: "Praktische info",
    pending: "Te bevestigen",
    directions: "Bekijk uw route",
    call: "Bel ons",
    write: "Schrijf ons",
    practicalCopy: "Met of zonder voorafgaande afspraak",
    access: "Op het gelijkvloers, toegankelijke ingang",
    parking: "Gratis parking ter plaatse",
    country: "België",
    hours: "Maandag tot vrijdag van 9u tot 17u",
  },
} as const;

/** The three practice cards (address, contact, practical info) of the Figma frames. */
export function InfoCards({ practicalAction }: { practicalAction: { href: string; label: string; external?: boolean } }) {
  const { language } = useLanguage();
  const clinicConfig = useSiteSettings();
  const copy = cardsCopy[language];

  return (
    <div className="info-cards">
      <article>
        <h3>{copy.addressCard}</h3>
        <p className="info-cards__upper">{clinicConfig.hasAddress ? <>{clinicConfig.addressLine1}<br />{clinicConfig.postalCity}, {copy.country}</> : copy.pending}</p>
        <p>{copy.access}</p>
        {clinicConfig.mapUrl && <a className="info-cards__button" href={clinicConfig.mapUrl} target="_blank" rel="noreferrer">{copy.directions}</a>}
      </article>
      <article>
        <h3>{copy.contactCard}</h3>
        <p>
          <span className="info-cards__upper">{copy.hours}</span>
          <br />
          <br />
          {clinicConfig.hasPhone ? <a href={`tel:${clinicConfig.phone}`}>{clinicConfig.phoneDisplay}</a> : copy.pending}
          {clinicConfig.email && <><br /><a href={`mailto:${clinicConfig.email}`}>{clinicConfig.email}</a></>}
        </p>
        {clinicConfig.hasPhone
          ? <a className="info-cards__button" href={`tel:${clinicConfig.phone}`}>{copy.call}</a>
          : <a className="info-cards__button" href="/contact#contact-form">{copy.write}</a>}
      </article>
      <article>
        <h3>{copy.practicalCard}</h3>
        <p className="info-cards__upper">{copy.parking}</p>
        <p>{copy.practicalCopy}</p>
        <a className="info-cards__button" href={practicalAction.href} {...(practicalAction.external ? { target: "_blank", rel: "noreferrer" } : {})}>{practicalAction.label}</a>
      </article>
    </div>
  );
}
