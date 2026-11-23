// Texts of the public site that can be edited from the dashboard (/admin/contenu).
// The default values below are the texts written in the pages; an edited value replaces
// them on the site, and clearing it brings the default back.

export type ContentField = {
  key: string;
  label: { fr: string; nl: string };
  multiline?: boolean;
  defaults: { fr: string; nl: string };
};

export type ContentGroup = {
  id: string;
  title: { fr: string; nl: string };
  path: string;
  fields: ContentField[];
};

const cta = {
  fr: "Réservez en ligne en deux minutes. Vous recevez une confirmation sous 24 h.",
  nl: "Boek online in twee minuten. U ontvangt binnen 24 uur een bevestiging.",
};

export const contentCatalog: ContentGroup[] = [
  {
    id: "home",
    title: { fr: "Accueil", nl: "Startpagina" },
    path: "/",
    fields: [
      { key: "home.heroLabel", label: { fr: "Petit titre au-dessus", nl: "Kleine titel erboven" }, defaults: { fr: "Cabinet dentaire", nl: "Tandartspraktijk" } },
      { key: "home.heroLine1", label: { fr: "Grand titre — ligne 1", nl: "Grote titel — regel 1" }, defaults: { fr: "BIENVENUE DANS LA CLINIQUE", nl: "WELKOM IN DE" } },
      { key: "home.heroLine2", label: { fr: "Grand titre — ligne 2 (dorée)", nl: "Grote titel — regel 2 (goud)" }, defaults: { fr: "DE SANTÉ DENTAIRE CURA", nl: "TANDHEELKUNDIGE KLINIEK CURA" } },
      { key: "home.heroCopy", label: { fr: "Texte d’introduction", nl: "Introductietekst" }, multiline: true, defaults: { fr: "Du contrôle annuel à l’implant : un seul cabinet, une seule équipe, et le temps de tout vous expliquer calmement — avant de commencer.", nl: "Van de jaarlijkse controle tot een implantaat: één praktijk, één team en de tijd om alles rustig uit te leggen — vóór we beginnen." } },
      { key: "home.heroNote", label: { fr: "Mention en italique", nl: "Vermelding in cursief" }, multiline: true, defaults: { fr: "À noter : les chirurgiens-dentistes de Clinic Cura ne sont pas conventionnés.", nl: "Let op: de tandartsen van Clinic Cura zijn niet geconventioneerd." } },
      { key: "home.careTitle", label: { fr: "Titre « Nos compétences »", nl: "Titel « Onze expertise »" }, defaults: { fr: "Nos compétences", nl: "Onze expertise" } },
      { key: "home.careSubtitle", label: { fr: "Sous-titre des compétences", nl: "Ondertitel expertise" }, defaults: { fr: "Choisissez le soin adapté", nl: "Kies de behandeling die bij u past" } },
      { key: "home.valuesTitle", label: { fr: "Titre « Nos valeurs »", nl: "Titel « Onze waarden »" }, defaults: { fr: "Nos valeurs", nl: "Onze waarden" } },
      { key: "home.questionTitle", label: { fr: "Bloc question — titre", nl: "Vraagblok — titel" }, defaults: { fr: "Une question ?", nl: "Een vraag?" } },
      { key: "home.questionCopy", label: { fr: "Bloc question — texte", nl: "Vraagblok — tekst" }, multiline: true, defaults: { fr: "Vous souhaitez avoir plus de renseignements ou prendre un rendez-vous ?", nl: "Wenst u meer informatie of wilt u een afspraak maken?" } },
      { key: "home.ctaTitle", label: { fr: "Appel final — titre", nl: "Slotoproep — titel" }, defaults: { fr: "Nous sommes prêts quand vous l’êtes.", nl: "Wij staan klaar wanneer u dat bent." } },
      { key: "home.ctaCopy", label: { fr: "Appel final — texte", nl: "Slotoproep — tekst" }, multiline: true, defaults: cta },
    ],
  },
  {
    id: "soins",
    title: { fr: "Nos traitements (Soins)", nl: "Behandelingen" },
    path: "/soins",
    fields: [
      { key: "soins.heroLine1", label: { fr: "Grand titre — ligne 1", nl: "Grote titel — regel 1" }, defaults: { fr: "VOUS SOUHAITEZ RETROUVER VOTRE PLUS", nl: "WILT U OPNIEUW STRALEN MET UW" } },
      { key: "soins.heroLine2", label: { fr: "Grand titre — ligne 2 (dorée)", nl: "Grote titel — regel 2 (goud)" }, defaults: { fr: "BEAU SOURIRE ?", nl: "MOOISTE GLIMLACH?" } },
      { key: "soins.heroCopy", label: { fr: "Texte d’introduction", nl: "Introductietekst" }, multiline: true, defaults: { fr: "Découvrez les différents soins dentaires réalisés au sein de la clinique Cura.", nl: "Ontdek de verschillende tandheelkundige behandelingen in de Cura-kliniek." } },
      { key: "soins.title", label: { fr: "Titre « Nos actes »", nl: "Titel behandelingen" }, defaults: { fr: "Nos actes", nl: "Onze behandelingen" } },
      { key: "soins.subtitle", label: { fr: "Sous-titre « Nos actes »", nl: "Ondertitel behandelingen" }, defaults: { fr: "Huit soins, de la prévention à la reconstruction.", nl: "Acht behandelingen, van preventie tot herstel." } },
      { key: "soins.ctaCopy", label: { fr: "Appel final — texte", nl: "Slotoproep — tekst" }, multiline: true, defaults: cta },
    ],
  },
  {
    id: "cabinet",
    title: { fr: "Cabinet", nl: "Praktijk" },
    path: "/cabinet",
    fields: [
      { key: "cabinet.heroTitle", label: { fr: "Grand titre", nl: "Grote titel" }, defaults: { fr: "CLINIQUE DENTAIRE CURA", nl: "TANDHEELKUNDIGE KLINIEK CURA" } },
      { key: "cabinet.heroCopy", label: { fr: "Texte d’introduction", nl: "Introductietekst" }, multiline: true, defaults: { fr: "Vous souhaitez recevoir des informations complémentaires ou nous poser des questions ? N’hésitez pas à nous contacter par téléphone.", nl: "Wenst u meer informatie of heeft u een vraag? Aarzel niet om ons telefonisch te contacteren." } },
      { key: "cabinet.teamTitle", label: { fr: "Titre « Une équipe à votre écoute »", nl: "Titel team" }, defaults: { fr: "Une équipe à votre écoute !", nl: "Een team dat naar u luistert!" } },
      { key: "cabinet.teamCopy", label: { fr: "Texte à côté du titre", nl: "Tekst naast de titel" }, multiline: true, defaults: { fr: "Vous souhaitez avoir plus de renseignements ou prendre un rendez-vous ? Posez votre question à l’équipe de Cura, n’hésitez pas à nous contacter.", nl: "Wenst u meer informatie of wilt u een afspraak maken? Stel uw vraag aan het Cura-team, wij helpen u graag verder." } },
      { key: "cabinet.reasonsIntro", label: { fr: "« Pour quelles raisons… » — texte", nl: "« Waarvoor… » — tekst" }, multiline: true, defaults: { fr: "Chez Cura, nous proposons une prise en charge personnalisée pour préserver votre santé bucco-dentaire et sublimer votre sourire.", nl: "Bij Cura bieden we persoonlijke zorg om uw mondgezondheid te bewaren en uw glimlach te verfraaien." } },
    ],
  },
  {
    id: "contact",
    title: { fr: "Contact", nl: "Contact" },
    path: "/contact",
    fields: [
      { key: "contact.heroTitle", label: { fr: "Grand titre", nl: "Grote titel" }, defaults: { fr: "CONTACTEZ-NOUS", nl: "CONTACTEER ONS" } },
      { key: "contact.heroAccent", label: { fr: "Grand titre — ligne dorée", nl: "Grote titel — gouden regel" }, defaults: { fr: "CURA CLINIC", nl: "CURA CLINIC" } },
      { key: "contact.heroCopy", label: { fr: "Texte d’introduction", nl: "Introductietekst" }, multiline: true, defaults: { fr: "Vous pouvez poser votre question directement ici.", nl: "U kunt uw vraag hier rechtstreeks stellen." } },
      { key: "contact.introTitle", label: { fr: "Titre « Rencontrons-nous »", nl: "Titel « Laten we kennismaken »" }, defaults: { fr: "Rencontrons-nous", nl: "Laten we kennismaken" } },
    ],
  },
  {
    id: "rendez-vous",
    title: { fr: "Rendez-vous", nl: "Afspraak" },
    path: "/rendez-vous",
    fields: [
      { key: "rdv.heroLine1", label: { fr: "Grand titre — ligne 1", nl: "Grote titel — regel 1" }, defaults: { fr: "PRENDRE RENDEZ-VOUS", nl: "EEN AFSPRAAK MAKEN" } },
      { key: "rdv.heroCopy", label: { fr: "Texte d’introduction", nl: "Introductietekst" }, multiline: true, defaults: { fr: "Bénéficiez de soins dentaires personnalisés et d’une qualité supérieure, adaptés à vos besoins uniques.", nl: "Geniet van persoonlijke tandzorg van hoge kwaliteit, afgestemd op uw noden." } },
      { key: "rdv.bookNow", label: { fr: "Titre du formulaire", nl: "Titel van het formulier" }, defaults: { fr: "Réservez maintenant", nl: "Reserveer nu" } },
    ],
  },
];

export const contentKeys = new Set(contentCatalog.flatMap((group) => group.fields.map((field) => field.key)));

export type ContentOverrides = Record<string, { fr: string; nl: string }>;
