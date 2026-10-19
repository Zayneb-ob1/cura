"use client";

import Image from "next/image";
import Link from "next/link";
import { ButtonLink, SectionLabel } from "@/components/buttons";
import { ReviewsSection } from "@/components/reviews-section";
import { useLanguage } from "@/components/language-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useSiteSettings } from "@/components/site-settings-provider";
import { ValueIcon } from "@/components/value-icons";


const pageCopy = {
  fr: {
    heroLabel: "Cabinet dentaire",
    heroLine1: "BIENVENUE DANS LA CLINIQUE",
    heroLine2: "DE SANTÉ DENTAIRE CURA",
    heroCopy: "Des soins dentaires répondant aux normes internationales de la qualité, au service de nos patients. Votre santé est notre priorité, votre sourire est notre passion !",
    appointment: "Prendre rendez-vous",
    careLabel: "Nos soins",
    careTitle: "Nos compétences",
    careSubtitle: "Choisissez le soin adapté",
    marqueeLabel: "Soins proposés au cabinet",
    competences: [
      ["esthetique", "Esthétique dentaire", "Nous réalisons des réhabilitations dentaires complètes."],
      ["parodontologie", "Parodontologie", "Nous diagnostiquons et traitons tous vos problèmes de gencive."],
      ["implantologie", "Implantologie", "Nous remplaçons votre dent manquante ou endommagée."],
      ["endodontie", "Endodontie", "Solutions pour traiter les douleurs dentaires, les caries profondes et les dents dévitalisées."],
      ["soins-generaux", "Soins généraux", "Soins dentaires courants pour préserver votre santé bucco-dentaire."],
      ["chirurgie", "Chirurgie dentaire", "Vos extractions dentaires et interventions chirurgicales avec précision et confort."],
      ["facettes", "Facettes dentaires", "Nous corrigeons divers aspects esthétiques des dents."],
      ["orthodontie", "Orthodontie", "Nous proposons des solutions orthodontiques adaptées pour corriger l’alignement des dents et améliorer l’esthétique de votre sourire."],
    ],
    valuesLabel: "Nos engagements",
    valuesTitle: "Nos valeurs",
    values: ["Le patient avant tout", "Des praticiens passionnés et compétents", "Des technologies performantes", "Le respect de la déontologie"],
    questionTitle: "Une question ?",
    questionCopy: "Vous souhaitez avoir plus de renseignements ou prendre un rendez-vous ?",
    allCare: "Tous les soins en détail",
    reviewsLabel: "Avis",
    reviewsTitle: "CE QU’ON DIT À PROPOS DE NOUS",
    noReviews: "Aucun avis vérifié n’est publié pour le moment.",
    loadingReviews: "Chargement des avis…",
    reviewsError: "Les avis ne peuvent pas être chargés pour le moment.",
    ctaTitle: "Nous sommes prêts quand vous l’êtes.",
    ctaCopy: "Réservez en ligne en deux minutes. Vous recevez une confirmation sous 24 h.",
  },
  nl: {
    heroLabel: "Tandartspraktijk",
    heroLine1: "WELKOM IN DE",
    heroLine2: "TANDHEELKUNDIGE KLINIEK CURA",
    heroCopy: "Tandzorg volgens de internationale kwaliteitsnormen, ten dienste van onze patiënten. Uw gezondheid is onze prioriteit, uw glimlach is onze passie!",
    appointment: "Maak een afspraak",
    careLabel: "Onze behandelingen",
    careTitle: "Onze expertise",
    careSubtitle: "Kies de behandeling die bij u past",
    marqueeLabel: "Behandelingen in de praktijk",
    competences: [
      ["esthetique", "Esthetische tandheelkunde", "Wij voeren volledige tandheelkundige rehabilitaties uit."],
      ["parodontologie", "Parodontologie", "Wij sporen al uw tandvleesproblemen op en behandelen ze."],
      ["implantologie", "Implantologie", "Wij vervangen uw ontbrekende of beschadigde tand."],
      ["endodontie", "Endodontie", "Oplossingen voor tandpijn, diepe gaatjes en gedevitaliseerde tanden."],
      ["soins-generaux", "Algemene tandzorg", "Dagelijkse tandzorg om uw mondgezondheid te bewaren."],
      ["chirurgie", "Mondchirurgie", "Uw tandextracties en chirurgische ingrepen, nauwkeurig en comfortabel."],
      ["facettes", "Facetten", "Wij corrigeren diverse esthetische aspecten van uw tanden."],
      ["orthodontie", "Orthodontie", "Orthodontische oplossingen op maat om de stand van uw tanden te corrigeren en uw glimlach te verfraaien."],
    ],
    valuesLabel: "Onze engagementen",
    valuesTitle: "Onze waarden",
    values: ["De patiënt staat voorop", "Gedreven en deskundige tandartsen", "Performante technologie", "Respect voor de deontologie"],
    questionTitle: "Een vraag?",
    questionCopy: "Wenst u meer informatie of wilt u een afspraak maken?",
    allCare: "Alle behandelingen bekijken",
    reviewsLabel: "Beoordelingen",
    reviewsTitle: "WAT MEN OVER ONS ZEGT",
    noReviews: "Er zijn momenteel geen geverifieerde beoordelingen gepubliceerd.",
    loadingReviews: "Beoordelingen laden…",
    reviewsError: "De beoordelingen kunnen momenteel niet worden geladen.",
    ctaTitle: "Wij staan klaar wanneer u dat bent.",
    ctaCopy: "Boek online in twee minuten. U ontvangt binnen 24 uur een bevestiging.",
  },
} as const;

export default function HomePage() {
  const { language } = useLanguage();
  const clinicConfig = useSiteSettings();
  const copy = pageCopy[language];
  const heroLabel = clinicConfig.city ? `${copy.heroLabel} · ${clinicConfig.city}` : copy.heroLabel;

  return (
    <div className="home-page">
      <SiteHeader />
      <main>
      <section className="home-hero" id="main-content" tabIndex={-1}>
        <div className="content-shell home-hero__grid">
          <div className="home-hero__content">
            <SectionLabel>{heroLabel}</SectionLabel>
            <h1>{copy.heroLine1}<span>{copy.heroLine2}</span></h1>
            <p>{copy.heroCopy}</p>
            <div className="home-hero__actions">
              <ButtonLink href="/rendez-vous">{copy.appointment}</ButtonLink>
            </div>
          </div>
          <div className="home-hero__visual" aria-hidden="true">
            <Image className="home-hero__logo" src="/brand/cura-tooth.png" alt="" width={656} height={784} sizes="(max-width: 720px) 60vw, 40vw" priority fetchPriority="high" />
          </div>
        </div>
      </section>

      <section className="home-marquee" aria-label={copy.marqueeLabel}>
        <ul className="sr-only">{copy.competences.map(([slug, title]) => <li key={slug}>{title}</li>)}</ul>
        <div className="home-marquee__track" aria-hidden="true">
          {[0, 1].map((loop) => (
            <div className="home-marquee__group" key={loop}>
              {copy.competences.map(([slug, title]) => <span key={slug}>{title}</span>)}
            </div>
          ))}
        </div>
      </section>

      <section className="home-competences">
        <div className="content-shell">
          <SectionLabel>{copy.careLabel}</SectionLabel>
          <h2>{copy.careTitle}</h2>
          <p className="home-competences__subtitle">{copy.careSubtitle}</p>
          <div className="home-competences__grid">
            {copy.competences.map(([slug, title, text]) => (
              <Link className="competence-card" href="/soins" key={slug}>
                <span className="competence-card__media">
                  <Image src={`/images/competences/${slug}.webp`} alt="" fill sizes="(max-width: 720px) 100vw, 50vw" />
                </span>
                <span className="competence-card__body">
                  <h3>{title}</h3>
                  <span>{text}</span>
                </span>
              </Link>
            ))}
          </div>
          <ButtonLink href="/soins">{copy.allCare}</ButtonLink>
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

      <section className="home-question">
        <h2>{copy.questionTitle}</h2>
        <p>{copy.questionCopy}</p>
        <ButtonLink href="/rendez-vous">{copy.appointment}</ButtonLink>
      </section>

      <ReviewsSection label={copy.reviewsLabel} title={copy.reviewsTitle} messages={copy} />

      <section className="home-cta">
        <h2 className="editorial-title">{copy.ctaTitle}</h2>
        <p>{copy.ctaCopy}</p>
        <ButtonLink href="/rendez-vous">{copy.appointment}</ButtonLink>
      </section>
      </main>
      <SiteFooter />
    </div>
  );
}
