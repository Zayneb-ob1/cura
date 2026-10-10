"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ButtonLink, SectionLabel } from "@/components/buttons";
import { useLanguage } from "@/components/language-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useSiteSettings } from "@/components/site-settings-provider";
import { ValueIcon } from "@/components/value-icons";
import { treatmentsByLanguage } from "@/lib/content";

type PublicReview = {
  id: string;
  name: string;
  quote: string;
  rating: number;
  language?: "fr" | "nl";
};

const pageCopy = {
  fr: {
    heroLabel: "Cabinet dentaire",
    heroLine1: "PRENDRE SOIN DE",
    heroLine2: "TRAIT POUR TRAIT.",
    heroCopy: "Du contrôle annuel à l’implant : un seul cabinet, une seule équipe, et le temps de tout vous expliquer calmement — avant de commencer.",
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
    clinicLabel: "Le cabinet",
    clinicTitle: "Un cabinet pensé pour celui qui n’aime pas le dentiste.",
    clinicLead: "Des espaces calmes, des explications claires, et des soins qui s’arrêtent dès que vous levez la main. La peur du dentiste n’est pas une faiblesse — c’est une donnée avec laquelle nous travaillons.",
    clinicPoints: [
      "Radiographie numérique — jusqu’à 80 % de rayonnement en moins",
      "Stérilisation aux normes, visible par tous",
      "Devis avant tout soin dépassant 150 €",
      "Agenda enfants séparé, hors heures de pointe",
    ],
    figuresLabel: "En chiffres",
    figuresTitle: "Ce que vous pouvez attendre",
    figures: ["min d’attente en moyenne", "soins proposés", "jours d’ouverture"],
    figuresNote: "Informations pratiques à confirmer auprès du cabinet.",
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
    heroLine1: "ZORG VOOR UW GEBIT",
    heroLine2: "TOT IN ELK DETAIL.",
    heroCopy: "Van de jaarlijkse controle tot een implantaat: één praktijk, één team en de tijd om alles rustig uit te leggen — vóór we beginnen.",
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
    clinicLabel: "De praktijk",
    clinicTitle: "Een praktijk voor wie niet graag naar de tandarts gaat.",
    clinicLead: "Rustige ruimtes, heldere uitleg en behandelingen die stoppen zodra u uw hand opsteekt. Angst voor de tandarts is geen zwakte — het is iets waarmee we rekening houden.",
    clinicPoints: [
      "Digitale radiografie — tot 80% minder straling",
      "Sterilisatie volgens de normen, zichtbaar voor iedereen",
      "Een offerte vóór elke behandeling boven 150 €",
      "Aparte kinderagenda, buiten de piekuren",
    ],
    figuresLabel: "In cijfers",
    figuresTitle: "Wat u kunt verwachten",
    figures: ["min gemiddelde wachttijd", "behandelingen", "openingsdagen"],
    figuresNote: "Praktische informatie te bevestigen bij de praktijk.",
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
  const homeTreatments = treatmentsByLanguage[language];
  const [managedReviews, setManagedReviews] = useState<PublicReview[] | null>(null);
  const [reviewsState, setReviewsState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const loadingTask = window.setTimeout(() => {
      if (active) {
        setManagedReviews(null);
        setReviewsState("loading");
      }
    }, 0);

    fetch("/api/reviews", { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load reviews");
        return response.json() as Promise<{ items: PublicReview[] }>;
      })
      .then(({ items }) => {
        window.clearTimeout(loadingTask);
        if (active) {
          setManagedReviews(items);
          setReviewsState("ready");
        }
      })
      .catch(() => {
        window.clearTimeout(loadingTask);
        if (active && !controller.signal.aborted) {
          setManagedReviews(null);
          setReviewsState("error");
        }
      });

    return () => {
      active = false;
      window.clearTimeout(loadingTask);
      controller.abort();
    };
  }, [language]);

  const visibleReviews = (managedReviews ?? [])
    .map((review) => ({
        id: review.id,
        rating: review.rating,
        stars: "\u2605".repeat(Math.max(1, Math.min(5, review.rating))),
        quote: review.quote,
        name: review.name,
      }));
  const openDays = clinicConfig.hours.filter((value) => value && value !== "closed").length;
  // Only values backed by site data: the average wait time is not tracked anywhere yet.
  const figureValues = ["—", String(homeTreatments.length), openDays > 0 ? String(openDays) : "—"];
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
        <ul className="sr-only">{homeTreatments.map((care) => <li key={care.number}>{care.name}</li>)}</ul>
        <div className="home-marquee__track" aria-hidden="true">
          {[0, 1].map((loop) => (
            <div className="home-marquee__group" key={loop}>
              {homeTreatments.map((care) => <span key={care.number}>{care.name}</span>)}
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

      <section className="home-clinic">
        <div className="content-shell home-clinic__grid">
          <div>
            <SectionLabel>{copy.clinicLabel}</SectionLabel>
            <h2 className="editorial-title">{copy.clinicTitle}</h2>
            <p className="home-clinic__lead">{copy.clinicLead}</p>
            <ul>{copy.clinicPoints.map((point) => <li key={point}>{point}</li>)}</ul>
          </div>
          <aside>
            <Image className="home-clinic__watermark" src="/brand/cura-tooth.png" alt="" width={656} height={784} sizes="(max-width: 720px) 80vw, 40vw" quality={45} aria-hidden="true" />
            <SectionLabel>{copy.figuresLabel}</SectionLabel>
            <h3>{copy.figuresTitle}</h3>
            <div className="home-clinic__numbers">{copy.figures.map((label, index) => <p key={label}><strong>{figureValues[index]}</strong><span>{label}</span></p>)}</div>
            <small>{copy.figuresNote}</small>
          </aside>
        </div>
      </section>

      <section className="home-reviews" id="avis">
        <div className="content-shell">
          <SectionLabel>{copy.reviewsLabel}</SectionLabel>
          <h2 className="editorial-title">{copy.reviewsTitle}</h2>
          {reviewsState === "loading" ? (
            <p role="status" aria-live="polite">{copy.loadingReviews}</p>
          ) : reviewsState === "error" ? (
            <p role="alert">{copy.reviewsError}</p>
          ) : visibleReviews.length > 0 ? (
            <div className="home-reviews__grid">
              {visibleReviews.map((review) => <article key={review.id}><span className="home-reviews__stars" aria-label={`${review.rating} / 5`}>{review.stars}</span><blockquote>{review.quote}</blockquote><p>{review.name}</p></article>)}
            </div>
          ) : <p>{copy.noReviews}</p>}
        </div>
      </section>

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
