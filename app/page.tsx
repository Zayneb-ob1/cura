"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ButtonLink, SectionLabel } from "@/components/buttons";
import { useLanguage } from "@/components/language-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ToothArt } from "@/components/tooth-art";
import { treatmentsByLanguage } from "@/lib/content";
import { clinicConfig } from "@/lib/site-config";

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
    discover: "Découvrir le cabinet",
    appointment: "Prendre rendez-vous",
    careLabel: "Nos soins",
    careTitle: "Tout ce dont vos dents ont besoin, à une seule adresse.",
    details: "Détails",
    allCare: "Tous les soins en détail",
    visitLabel: "Votre première visite",
    visitTitle: "Quatre étapes, aucune surprise.",
    steps: [
      ["I", "Accueil", "Munissez-vous de votre carte d’identité. Nous créons votre dossier et passons en revue vos antécédents."],
      ["II", "Examen", "Bilan complet des dents et des gencives, avec radiographie si nécessaire."],
      ["III", "Plan de soins", "Vous repartez avec un plan écrit : priorités, calendrier et estimation des coûts."],
      ["IV", "Suivi", "Nous vous rappelons votre contrôle annuel. Aucun courrier que vous n’avez pas demandé."],
    ],
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
    figures: [["—", "attente moyenne"], ["—", "soins proposés"], ["—", "jours d’ouverture"]],
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
    discover: "Ontdek de praktijk",
    appointment: "Maak een afspraak",
    careLabel: "Onze behandelingen",
    careTitle: "Alles wat uw gebit nodig heeft, op één adres.",
    details: "Details",
    allCare: "Alle behandelingen bekijken",
    visitLabel: "Uw eerste bezoek",
    visitTitle: "Vier stappen, geen verrassingen.",
    steps: [
      ["I", "Onthaal", "Breng uw identiteitskaart mee. We maken uw dossier aan en overlopen uw medische voorgeschiedenis."],
      ["II", "Onderzoek", "Volledig onderzoek van tanden en tandvlees, met röntgenfoto indien nodig."],
      ["III", "Behandelplan", "U vertrekt met een duidelijk plan: prioriteiten, timing en kostenraming."],
      ["IV", "Opvolging", "We herinneren u aan uw jaarlijkse controle. Geen berichten waar u niet om vroeg."],
    ],
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
    figures: [["—", "gemiddelde wachttijd"], ["—", "behandelingen"], ["—", "openingsdagen"]],
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

const fixtureReviewIds = new Set([
  "review-fr-samira",
  "review-fr-tom",
  "review-fr-nathalie",
  "review-nl-samira",
  "review-nl-tom",
  "review-nl-nathalie",
]);

export default function HomePage() {
  const { language } = useLanguage();
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

    fetch(`/api/reviews?language=${language}`, { cache: "no-store", signal: controller.signal })
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
    .filter((review) => !fixtureReviewIds.has(review.id))
    .map((review) => ({
        id: review.id,
        rating: review.rating,
        stars: "\u2605".repeat(Math.max(1, Math.min(5, review.rating))),
        quote: review.quote,
        name: review.name,
      }));
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
              <Link href="/cabinet" className="home-hero__text-link">{copy.discover}</Link>
              <ButtonLink href="/rendez-vous">{copy.appointment}</ButtonLink>
            </div>
          </div>
          <div className="home-hero__visual" aria-hidden="true">
            <Image className="home-hero__logo" src="/brand/cura-tooth.png" alt="" width={656} height={784} sizes="(max-width: 720px) 60vw, 40vw" priority fetchPriority="high" />
          </div>
        </div>
      </section>

      <section className="home-services">
        <div className="content-shell">
          <SectionLabel>{copy.careLabel}</SectionLabel>
          <h2>{copy.careTitle}</h2>
          <div className="home-services__grid">
            {homeTreatments.map((care, index) => (
              <article className="care-card" key={care.number}>
                <span className="care-card__number">{care.number}</span>
                <div className="care-card__visual"><ToothArt variant={index % 3} /></div>
                <h3>{care.name}</h3>
                <p>{care.short}</p>
                <Link href={`/soins#soin-${care.number}`}>{copy.details} <span>⟶</span></Link>
              </article>
            ))}
          </div>
          <ButtonLink href="/soins">{copy.allCare}</ButtonLink>
        </div>
      </section>

      <section className="home-steps">
        <div className="content-shell">
          <SectionLabel>{copy.visitLabel}</SectionLabel>
          <h2 className="editorial-title">{copy.visitTitle}</h2>
          <div className="home-steps__grid">
            {copy.steps.map(([number, title, text]) => <article key={number}><span aria-hidden="true">{number}</span><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </div>
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
            <div className="home-clinic__numbers">{copy.figures.map(([number, label]) => <p key={label}><strong>{number}</strong><span>{label}</span></p>)}</div>
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
