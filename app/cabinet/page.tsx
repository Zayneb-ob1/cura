"use client";

import { SectionLabel } from "@/components/buttons";
import { useLanguage } from "@/components/language-provider";
import { PageCta, PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useSiteSettings } from "@/components/site-settings-provider";
import { ValueIcon } from "@/components/value-icons";

// Layout of Figma frame 7: hero, team + 3 info cards, values, reasons to book, closing call to action.
const pageCopy = {
  fr: {
    heroTitle: "CLINIQUE DENTAIRE CURA",
    heroIn: "À",
    heroCopy: "Vous souhaitez recevoir des informations complémentaires ou nous poser des questions ? N’hésitez pas à nous contacter par téléphone.",
    appointment: "Prendre rendez-vous",
    teamLabel: "La clinique",
    teamTitle: "Une équipe à votre écoute !",
    teamCopy: "Vous souhaitez avoir plus de renseignements ou prendre un rendez-vous ? Posez votre question à l’équipe de Cura, n’hésitez pas à nous contacter.",
    addressCard: "Adresse du cabinet",
    contactCard: "Nous contacter",
    practicalCard: "Infos pratiques",
    pending: "À confirmer",
    directions: "Voir votre itinéraire",
    call: "Téléphonez-nous",
    write: "Écrivez-nous",
    schedulePending: "Horaires à confirmer",
    practicalCopy: "Avec ou sans rendez-vous préalable",
    access: "Situé au rez-de-chaussée, entrée accessible",
    parking: "Parking gratuit disponible sur place",
    country: "Belgique",
    hours: "Lundi au vendredi de 9h à 17h",
    valuesLabel: "Nos engagements",
    valuesTitle: "Nos valeurs",
    values: ["Le patient avant tout", "Des praticiens passionnés et compétents", "Des technologies performantes", "Le respect de la déontologie"],
    reasonsTitle: "Pour quelles raisons prendre rendez-vous ?",
    reasonsIntro: "Chez Cura, nous proposons une prise en charge personnalisée pour préserver votre santé bucco-dentaire et sublimer votre sourire.",
    reasons: ["Soins dentaires courants : consultations, détartrage, extractions et endodontie.", "Esthétique du sourire : blanchiment et facettes dentaires.", "Orthodontie et prothèses : appareils, gouttières et couronnes.", "Implantologie : implants dentaires et soins gingivaux.", "Bilans spécialisés : bilans parodontaux et orthodontiques.", "Suivi et deuxième avis : évaluation et conseils personnalisés."],
    ctaTitle: "Nous sommes prêts quand vous l’êtes.",
    ctaCopy: "Réservez en ligne en deux minutes. Vous recevez une confirmation sous 24 h.",
  },
  nl: {
    heroTitle: "TANDHEELKUNDIGE KLINIEK CURA",
    heroIn: "IN",
    heroCopy: "Wenst u meer informatie of heeft u een vraag? Aarzel niet om ons telefonisch te contacteren.",
    appointment: "Maak een afspraak",
    teamLabel: "De kliniek",
    teamTitle: "Een team dat naar u luistert!",
    teamCopy: "Wenst u meer informatie of wilt u een afspraak maken? Stel uw vraag aan het Cura-team, wij helpen u graag verder.",
    addressCard: "Adres van de praktijk",
    contactCard: "Contacteer ons",
    practicalCard: "Praktische info",
    pending: "Te bevestigen",
    directions: "Bekijk uw route",
    call: "Bel ons",
    write: "Schrijf ons",
    schedulePending: "Openingsuren te bevestigen",
    practicalCopy: "Met of zonder voorafgaande afspraak",
    access: "Op het gelijkvloers, toegankelijke ingang",
    parking: "Gratis parking ter plaatse",
    country: "België",
    hours: "Maandag tot vrijdag van 9u tot 17u",
    valuesLabel: "Onze engagementen",
    valuesTitle: "Onze waarden",
    values: ["De patiënt staat voorop", "Gedreven en deskundige tandartsen", "Performante technologie", "Respect voor de deontologie"],
    reasonsTitle: "Waarvoor kunt u een afspraak maken?",
    reasonsIntro: "Bij Cura bieden we persoonlijke zorg om uw mondgezondheid te bewaren en uw glimlach te verfraaien.",
    reasons: ["Dagelijkse tandzorg: consultaties, tandsteenverwijdering, extracties en endodontie.", "Esthetiek van de glimlach: bleken en facetten.", "Orthodontie en prothesen: beugels, aligners en kronen.", "Implantologie: tandimplantaten en tandvleeszorg.", "Gespecialiseerde onderzoeken: parodontale en orthodontische bilans.", "Opvolging en tweede advies: beoordeling en persoonlijk advies."],
    ctaTitle: "Wij staan klaar wanneer u dat bent.",
    ctaCopy: "Boek online in twee minuten. U ontvangt binnen 24 uur een bevestiging.",
  },
} as const;

export default function CabinetPage() {
  const { language } = useLanguage();
  const clinicConfig = useSiteSettings();
  const copy = pageCopy[language];

  return (
    <div className="cabinet-page">
      <SiteHeader />
      <main>
        <PageHero
          title={copy.heroTitle}
          accent={clinicConfig.city ? `${copy.heroIn} ${clinicConfig.city.toUpperCase()}` : undefined}
          text={copy.heroCopy}
          action={{ href: "/rendez-vous", label: copy.appointment }}
        />

        <section className="contact-team">
          <div className="content-shell">
            <div className="split-intro">
              <div>
                <SectionLabel>{copy.teamLabel}</SectionLabel>
                <h2>{copy.teamTitle}</h2>
              </div>
              <p>{copy.teamCopy}</p>
            </div>
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
                  : <a className="info-cards__button" href="/contact">{copy.write}</a>}
              </article>
              <article>
                <h3>{copy.practicalCard}</h3>
                <p className="info-cards__upper">{copy.parking}</p>
                <p>{copy.practicalCopy}</p>
                <a className="info-cards__button" href="/rendez-vous">{copy.appointment}</a>
              </article>
            </div>
          </div>
        </section>

        <section className="home-values">
          <div className="content-shell">
            <SectionLabel>{copy.valuesLabel}</SectionLabel>
            <h2>{copy.valuesTitle}</h2>
            <ul className="home-values__grid">
              {copy.values.map((value, index) => (
                <li key={value}>
                  <ValueIcon index={index} />
                  <span>{value}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="info-rows info-rows--paper">
          <div className="content-shell">
            <article className="info-row">
              <h2>{copy.reasonsTitle}</h2>
              <div><p>{copy.reasonsIntro}</p><ul>{copy.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div>
            </article>
          </div>
        </section>

        <PageCta title={copy.ctaTitle} text={copy.ctaCopy} action={{ href: "/rendez-vous", label: copy.appointment }} />
      </main>
      <SiteFooter />
    </div>
  );
}
