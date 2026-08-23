"use client";

import { SectionLabel } from "@/components/buttons";
import { useLanguage } from "@/components/language-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useSiteSettings } from "@/components/site-settings-provider";

const pageCopy = {
  fr: {
    label: "Informations légales",
    title: "Mentions légales.",
    intro: "Les informations essentielles concernant le site et la pratique CURA.",
    operator: "Éditeur du site",
    operatorContact: "Les coordonnées légales complètes doivent être confirmées auprès du cabinet via la page Contact.",
    registration: "Identification légale",
    registrationPending: "Le numéro d’entreprise et les éventuelles informations professionnelles doivent être fournis et validés par le cabinet avant la mise en ligne.",
    controller: "Responsable du traitement",
    controllerPending: "L’identité et l’adresse de contact du responsable du traitement doivent être confirmées par le cabinet.",
    hosting: "Hébergement",
    hostingPending: "Les coordonnées de l’hébergeur doivent être renseignées avant la mise en ligne.",
    privacy: "Données personnelles",
    privacyText: "Les données envoyées via les formulaires servent à répondre à votre message ou à traiter votre demande de rendez-vous. Elles ne sont pas utilisées à des fins publicitaires par ce site.",
    retention: "Conservation",
    retentionText: "La durée exacte de conservation doit être définie et validée par le cabinet avant la mise en ligne.",
    rights: "Vos droits",
    rightsText: "Vous pouvez demander l’accès, la rectification ou l’effacement de vos données, ainsi que l’exercice des autres droits applicables, depuis la page Contact.",
    storage: "Cookies et stockage local",
    storageText: "Le site mémorise votre préférence de langue dans le stockage local et dans un cookie fonctionnel. Un cookie de session est utilisé uniquement pour l’accès protégé à l’administration. Aucun outil publicitaire ou analytique n’est configuré.",
    medical: "Informations médicales",
    medicalText: "Le contenu de ce site est informatif et ne remplace pas un examen clinique ni l’avis personnalisé d’un professionnel de santé.",
  },
  nl: {
    label: "Wettelijke informatie",
    title: "Wettelijke vermeldingen.",
    intro: "De belangrijkste informatie over de CURA-website en tandartspraktijk.",
    operator: "Verantwoordelijke uitgever",
    operatorContact: "De volledige wettelijke contactgegevens moeten via de contactpagina bij de praktijk worden bevestigd.",
    registration: "Wettelijke identificatie",
    registrationPending: "Het ondernemingsnummer en eventuele beroepsgegevens moeten vóór publicatie door de praktijk worden aangeleverd en goedgekeurd.",
    controller: "Verwerkingsverantwoordelijke",
    controllerPending: "De identiteit en het contactadres van de verwerkingsverantwoordelijke moeten door de praktijk worden bevestigd.",
    hosting: "Hosting",
    hostingPending: "De gegevens van de hostingprovider moeten vóór publicatie worden ingevuld.",
    privacy: "Persoonsgegevens",
    privacyText: "Gegevens die via de formulieren worden verzonden, dienen om uw bericht te beantwoorden of uw afspraakaanvraag te behandelen. Deze website gebruikt ze niet voor reclamedoeleinden.",
    retention: "Bewaartermijn",
    retentionText: "De exacte bewaartermijn moet vóór publicatie door de praktijk worden vastgesteld en goedgekeurd.",
    rights: "Uw rechten",
    rightsText: "U kunt via de contactpagina vragen om inzage, verbetering of verwijdering van uw gegevens en om uw andere toepasselijke rechten uit te oefenen.",
    storage: "Cookies en lokale opslag",
    storageText: "De website bewaart uw taalvoorkeur in lokale opslag en in een functionele cookie. Alleen voor de beveiligde beheeromgeving wordt een sessiecookie gebruikt. Er zijn geen advertentie- of analysetools geconfigureerd.",
    medical: "Medische informatie",
    medicalText: "De inhoud van deze website is informatief en vervangt geen klinisch onderzoek of persoonlijk advies van een zorgverlener.",
  },
} as const;

export default function LegalPage() {
  const { language } = useLanguage();
  const clinicConfig = useSiteSettings();
  const copy = pageCopy[language];
  const operatorContacts = [
    clinicConfig.addressLine1,
    clinicConfig.postalCity,
    clinicConfig.phoneDisplay,
    clinicConfig.email,
  ].filter(Boolean).join(" · ");
  const operatorDetails = operatorContacts
    ? `${clinicConfig.legal.operator || clinicConfig.name} · ${operatorContacts}`
    : `${clinicConfig.legal.operator || clinicConfig.name}. ${copy.operatorContact}`;
  const sections = [
    [copy.operator, operatorDetails],
    [copy.registration, clinicConfig.legal.registration || copy.registrationPending],
    [copy.controller, clinicConfig.legal.privacyEmail || copy.controllerPending],
    [copy.privacy, copy.privacyText],
    [copy.retention, clinicConfig.legal.retention[language] || copy.retentionText],
    [copy.rights, copy.rightsText],
    [copy.storage, copy.storageText],
    [copy.hosting, clinicConfig.legal.host || copy.hostingPending],
    [copy.medical, copy.medicalText],
  ];

  return (
    <div className="advice-page page-paper">
      <SiteHeader />
      <main>
      <section className="content-shell advice-page__intro" id="main-content" tabIndex={-1}>
        <SectionLabel>{copy.label}</SectionLabel><h1 className="editorial-title">{copy.title}</h1><p>{copy.intro}</p>
      </section>
      <section className="content-shell advice-cards">
        {sections.map(([title, text], index) => <article key={title}><span aria-hidden="true">0{index + 1}</span><h2>{title}</h2><p>{text}</p></article>)}
      </section>
      </main>
      <SiteFooter />
    </div>
  );
}
