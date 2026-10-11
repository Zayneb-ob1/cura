"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ButtonLink, SectionLabel } from "@/components/buttons";
import { useLanguage } from "@/components/language-provider";
import { PageCta, PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const pageCopy = {
  fr: {
    heroLine1: "VOUS SOUHAITEZ RETROUVER VOTRE PLUS",
    heroLine2: "BEAU SOURIRE ?",
    heroCopy: "Découvrez les différents soins dentaires réalisés au sein de la clinique Cura.",
    appointment: "Prendre rendez-vous",
    label: "Nos soins",
    title: "Nos actes",
    subtitle: "Huit soins, de la prévention à la reconstruction.",
    book: "Prendre rendez-vous pour ce soin",
    acts: [
      ["parodontologie", "Parodontologie", "La parodontologie traite les maladies des gencives et de l’os qui soutient les dents : saignements, déchaussement, mauvaise haleine. Un nettoyage approfondi et un suivi régulier permettent de stabiliser la situation."],
      ["esthetique", "Esthétique dentaire", "L’esthétique dentaire regroupe les soins qui améliorent la teinte, la forme et l’harmonie du sourire, jusqu’aux réhabilitations complètes, toujours dans le respect de la santé des dents."],
      ["implantologie", "Implantologie", "L’implant remplace la racine d’une dent manquante. Il supporte une couronne fixe qui retrouve l’aspect et la fonction d’une dent naturelle."],
      ["soins-generaux", "Soins généraux", "Contrôle, détartrage, traitement des caries : les soins courants préservent votre santé bucco-dentaire et permettent de détecter tôt les problèmes."],
      ["facettes", "Facettes dentaires", "Les facettes sont de fines pellicules collées sur la face visible des dents pour corriger leur couleur, leur forme ou de petits espaces."],
      ["chirurgie", "Chirurgie dentaire", "Extractions, dents de sagesse et petites interventions chirurgicales sont réalisées avec précision, sous anesthésie locale et dans le confort."],
      ["endodontie", "Endodontie", "L’endodontie traite l’intérieur de la dent : le traitement de canal soulage la douleur et conserve une dent atteinte par une carie profonde ou une infection."],
      ["orthodontie", "Orthodontie", "L’orthodontie corrige l’alignement des dents et les problèmes d’occlusion afin d’améliorer l’équilibre du sourire et le confort au quotidien."],
    ],
    info: [
      ["Pourquoi prendre soin de sa santé bucco-dentaire ?", "Prendre soin de ses dents permet de prévenir les problèmes bucco-dentaires, de préserver la santé des gencives et de maintenir un sourire sain et harmonieux. Chez Cura, nous vous accompagnons à chaque étape grâce à une prise en charge adaptée à vos besoins, qu’il s’agisse de prévention, de soins thérapeutiques ou d’amélioration esthétique du sourire."],
      ["Les soins dentaires chez Cura", "Nous proposons une approche personnalisée pour répondre aux besoins de chaque patient. Nos soins incluent la dentisterie générale, la parodontologie, l’implantologie, l’orthodontie, l’esthétique dentaire et l’endodontie. Chaque traitement débute par une consultation permettant d’évaluer votre santé bucco-dentaire et de définir les solutions les plus adaptées à votre situation."],
      ["Les tarifs des soins dentaires ?", "Les tarifs varient selon la nature du traitement et les soins nécessaires. Un devis personnalisé vous sera proposé après votre consultation, afin de vous informer clairement sur les différentes étapes et leur coût."],
    ],
    pricing: "Voir les tarifs indicatifs",
    ctaTitle: <>Pour une évaluation personnalisée<br />et un devis sur-mesure</>,
    ctaCopy: "Réservez en ligne en deux minutes. Vous recevez une confirmation sous 24 h.",
  },
  nl: {
    heroLine1: "WILT U OPNIEUW STRALEN MET UW",
    heroLine2: "MOOISTE GLIMLACH?",
    heroCopy: "Ontdek de verschillende tandheelkundige behandelingen in de Cura-kliniek.",
    appointment: "Maak een afspraak",
    label: "Onze behandelingen",
    title: "Onze behandelingen",
    subtitle: "Acht behandelingen, van preventie tot herstel.",
    book: "Een afspraak maken voor deze behandeling",
    acts: [
      ["parodontologie", "Parodontologie", "Parodontologie behandelt aandoeningen van het tandvlees en het bot rond de tanden: bloedend tandvlees, terugtrekkend tandvlees, slechte adem. Een grondige reiniging en regelmatige opvolging stabiliseren de situatie."],
      ["esthetique", "Esthetische tandheelkunde", "Esthetische tandheelkunde verbetert de kleur, vorm en harmonie van uw glimlach, tot volledige rehabilitaties, steeds met respect voor de gezondheid van uw tanden."],
      ["implantologie", "Implantologie", "Een implantaat vervangt de wortel van een ontbrekende tand. Het draagt een vaste kroon die eruitziet en werkt als een natuurlijke tand."],
      ["soins-generaux", "Algemene tandzorg", "Controle, tandsteenverwijdering, behandeling van gaatjes: de dagelijkse zorg bewaart uw mondgezondheid en spoort problemen vroeg op."],
      ["facettes", "Facetten", "Facetten zijn dunne schilfers die op de zichtbare kant van de tanden worden gekleefd om kleur, vorm of kleine openingen te corrigeren."],
      ["chirurgie", "Mondchirurgie", "Extracties, wijsheidstanden en kleine chirurgische ingrepen gebeuren nauwkeurig, onder plaatselijke verdoving en comfortabel."],
      ["endodontie", "Endodontie", "Endodontie behandelt de binnenkant van de tand: een wortelkanaalbehandeling verlicht de pijn en bewaart een tand met een diepe cariës of infectie."],
      ["orthodontie", "Orthodontie", "Orthodontie corrigeert de stand van de tanden en de beet, voor een evenwichtige glimlach en meer comfort in het dagelijks leven."],
    ],
    info: [
      ["Waarom zorgen voor uw mondgezondheid?", "Goed zorgen voor uw tanden voorkomt mondproblemen, beschermt uw tandvlees en houdt uw glimlach gezond en harmonieus. Bij Cura begeleiden we u bij elke stap met zorg op maat, of het nu gaat om preventie, behandeling of een mooiere glimlach."],
      ["De tandzorg bij Cura", "We kiezen voor een persoonlijke aanpak die aansluit bij de noden van elke patiënt. Onze zorg omvat algemene tandheelkunde, parodontologie, implantologie, orthodontie, esthetische tandheelkunde en endodontie. Elke behandeling start met een consultatie om uw mondgezondheid te beoordelen en de meest geschikte oplossingen te bepalen."],
      ["Wat kost een tandheelkundige behandeling?", "De tarieven hangen af van de aard van de behandeling en de nodige zorg. Na uw consultatie krijgt u een persoonlijke offerte, zodat u duidelijk weet welke stappen er volgen en wat ze kosten."],
    ],
    pricing: "Richtprijzen bekijken",
    ctaTitle: <>Voor een persoonlijke beoordeling<br />en een offerte op maat</>,
    ctaCopy: "Boek online in twee minuten. U ontvangt binnen 24 uur een bevestiging.",
  },
} as const;

export default function SoinsPage() {
  const { language } = useLanguage();
  const copy = pageCopy[language];

  // Open acts are state so a re-render never collapses them; the last one starts open as in the design.
  const listRef = useRef<HTMLDivElement>(null);
  const [openActs, setOpenActs] = useState<ReadonlySet<string>>(() => new Set(["orthodontie"]));
  const setActOpen = (slug: string, open: boolean) => setOpenActs((current) => {
    if (current.has(slug) === open) return current;
    const next = new Set(current);
    if (open) next.add(slug); else next.delete(slug);
    return next;
  });

  // Footer links point to /soins#<slug>: open that act when arriving or when the hash changes.
  useEffect(() => {
    const openFromHash = () => {
      const slug = decodeURIComponent(window.location.hash.slice(1));
      // Scoped to this list: the router can keep a hidden copy of the previous page with the same ids.
      const target = slug ? listRef.current?.querySelector(`#${CSS.escape(slug)}`) : null;
      if (!(target instanceof HTMLDetailsElement)) return;
      setActOpen(slug, true);
      target.scrollIntoView({ block: "start" });
    };
    const task = window.setTimeout(openFromHash, 0);
    window.addEventListener("hashchange", openFromHash);
    return () => {
      window.clearTimeout(task);
      window.removeEventListener("hashchange", openFromHash);
    };
  }, []);

  return (
    <div className="care-page">
      <SiteHeader />
      <main>
        <PageHero
          title={copy.heroLine1}
          accent={copy.heroLine2}
          text={copy.heroCopy}
          action={{ href: "/rendez-vous", label: copy.appointment }}
          photo="/images/competences/esthetique.webp"
        />

        <section className="care-acts">
          <div className="content-shell care-acts__grid">
            <div className="care-acts__intro">
              <SectionLabel>{copy.label}</SectionLabel>
              <h2>{copy.title}</h2>
              <p>{copy.subtitle}</p>
              <Image className="care-acts__watermark" src="/brand/cura-tooth.png" alt="" width={656} height={784} sizes="30vw" aria-hidden="true" />
            </div>
            <div className="care-acts__list" ref={listRef}>
              {copy.acts.map(([slug, name, text]) => (
                <details className="care-act" id={slug} key={slug} open={openActs.has(slug)} onToggle={(event) => setActOpen(slug, event.currentTarget.open)}>
                  <summary>{name}<span aria-hidden="true" /></summary>
                  <div className="care-act__body">
                    <p>{text}</p>
                    <a href="/rendez-vous#reserver">{copy.book} →</a>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="info-rows">
          <div className="content-shell">
            {copy.info.map(([title, text]) => (
              <article className="info-row" key={title}>
                <h2>{title}</h2>
                <p>{text}</p>
              </article>
            ))}
            <div className="info-rows__action"><ButtonLink href="/tarifs" tone="outline">{copy.pricing}</ButtonLink></div>
          </div>
        </section>

        <PageCta title={copy.ctaTitle} text={copy.ctaCopy} action={{ href: "/rendez-vous", label: copy.appointment }} />
      </main>
      <SiteFooter />
    </div>
  );
}
