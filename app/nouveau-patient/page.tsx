"use client";

import { SectionLabel } from "@/components/buttons";
import { useLanguage } from "@/components/language-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useSiteSettings } from "@/components/site-settings-provider";

const pageCopy = {
  fr: {
    sequence: "Déroulé", sequenceTitle: "Une heure, cinq moments",
    visit: [
      ["Accueil", "5 min", "Carte d’identité, coordonnées, et la raison qui vous amène."],
      ["Entretien", "10 min", "Antécédents, médicaments, allergies, appréhensions. Tout compte."],
      ["Examen", "20 min", "Chaque dent, les gencives, l’occlusion. Radiographies si elles apportent quelque chose."],
      ["Explication", "15 min", "Vous voyez vos propres images à l’écran et nous les parcourons ensemble."],
      ["Plan", "10 min", "Priorités, calendrier, estimation. Sur papier, à emporter."],
    ],
    bring: "À apporter", before: "Cinq choses",
    prep: [["Carte d’identité", "✓"], ["Vignette de mutuelle", "✓"], ["Liste de vos médicaments", "✓"], ["Anciennes radiographies", "Si possible"], ["Bancontact", "✓"]],
    apprehension: "Appréhension", apprehensionTitle: "Rien ne vous sera fait à la première visite.",
    apprehensionCopy: "Signalez votre appréhension lors de la prise de rendez-vous. Nous prévoyons alors un moment plus long, sans soin : se rencontrer, regarder, expliquer — décider ensuite.",
    file: "Dossier", otherPractice: "Venir d’un autre cabinet",
    fileCopy: "Votre dossier vous appartient. Demandez à votre ancien dentiste vos radiographies et votre historique ; il est tenu de les transmettre. Nous pouvons aussi les réclamer à votre place — une signature suffit.",
    access: "Accès", findUs: "Nous trouver", addressPending: "Adresse à confirmer auprès du cabinet", parking: "Contactez le cabinet pour les informations d’accès et de stationnement.", directions: "Itinéraire",
  },
  nl: {
    sequence: "Verloop", sequenceTitle: "Eén uur, vijf momenten",
    visit: [
      ["Onthaal", "5 min", "Identiteitskaart, contactgegevens en de reden van uw bezoek."],
      ["Gesprek", "10 min", "Voorgeschiedenis, medicatie, allergieën en bezorgdheden. Alles telt mee."],
      ["Onderzoek", "20 min", "Elke tand, het tandvlees en de beet. Röntgenfoto’s als ze een antwoord bieden."],
      ["Uitleg", "15 min", "U ziet uw eigen beelden op het scherm en we bekijken ze samen."],
      ["Plan", "10 min", "Prioriteiten, planning en raming. Duidelijk op papier om mee te nemen."],
    ],
    bring: "Meebrengen", before: "Vijf dingen",
    prep: [["Identiteitskaart", "✓"], ["Kleefbriefje ziekenfonds", "✓"], ["Lijst van uw medicatie", "✓"], ["Oude röntgenfoto’s", "Indien mogelijk"], ["Bancontact", "✓"]],
    apprehension: "Bezorgdheid", apprehensionTitle: "Tijdens uw eerste bezoek gebeurt niets zonder uw toestemming.",
    apprehensionCopy: "Vertel ons bij het maken van uw afspraak dat u bezorgd bent. We voorzien dan extra tijd, zonder behandeling: kennismaken, kijken en uitleggen — daarna pas beslissen.",
    file: "Dossier", otherPractice: "Overkomen van een andere praktijk",
    fileCopy: "Uw dossier is van u. Vraag uw vorige tandarts om uw röntgenfoto’s en historiek door te sturen; die moeten worden overgemaakt. Wij kunnen dit ook voor u regelen — één handtekening volstaat.",
    access: "Bereikbaarheid", findUs: "Ons vinden", addressPending: "Adres te bevestigen bij de praktijk", parking: "Neem contact op met de praktijk voor informatie over bereikbaarheid en parkeren.", directions: "Route",
  },
} as const;

export default function NewPatientPage() {
  const { language } = useLanguage();
  const clinicConfig = useSiteSettings();
  const copy = pageCopy[language];

  return (
    <div className="patient-page page-paper">
      <SiteHeader />
      <main>
      <section className="content-shell patient-visit" id="main-content" tabIndex={-1}>
        <div className="patient-visit__timeline">
          <SectionLabel>{copy.sequence}</SectionLabel>
          <h1>{copy.sequenceTitle}</h1>
          <div>
            {copy.visit.map(([title, time, text]) => (
              <article key={title}>
                <i aria-hidden="true" />
                <h2>{title} <span>– {time}</span></h2>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="patient-visit__aside">
          <article className="patient-bring">
            <div>
              <SectionLabel>{copy.bring}</SectionLabel>
              <h2>{copy.before}</h2>
              <dl>
                {copy.prep.map(([item, note]) => (
                  <div key={item}><dt>{item}</dt><dd className={note === "✓" ? "is-check" : undefined}>{note}</dd></div>
                ))}
              </dl>
            </div>
          </article>
          <article className="patient-apprehension">
            <SectionLabel>{copy.apprehension}</SectionLabel>
            <h2>{copy.apprehensionTitle}</h2>
            <p>{copy.apprehensionCopy}</p>
          </article>
        </div>
      </section>
      <section className="patient-details">
        <div className="content-shell patient-details__grid">
          <div>
            <SectionLabel>{copy.file}</SectionLabel>
            <h2>{copy.otherPractice}</h2>
            <p>{copy.fileCopy}</p>
          </div>
          <div>
            <SectionLabel>{copy.access}</SectionLabel>
            <h2>{copy.findUs}</h2>
            <address>{clinicConfig.hasAddress ? <>{clinicConfig.addressLine1}<br />{clinicConfig.postalCity}</> : copy.addressPending}</address>
            <p>{copy.parking}</p>
            {clinicConfig.mapUrl && <a className="patient-details__directions" href={clinicConfig.mapUrl} target="_blank" rel="noreferrer">{copy.directions}<span aria-hidden="true">→</span></a>}
          </div>
        </div>
      </section>
      </main>
      <SiteFooter />
    </div>
  );
}
