"use client";

import { ButtonLink, SectionLabel } from "@/components/buttons";
import { useLanguage } from "@/components/language-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const pageCopy = {
  fr: {
    label: "Conseils & questions",
    title: "Réponses courtes aux questions qu’on n’ose pas poser.",
    intro: "Des repères simples pour décider quand appeler, quoi surveiller et comment préparer votre visite.",
    contact: "Nous contacter",
    advice: [
      ["Une douleur peut-elle attendre demain ?", "Douleur brève au froid : souvent oui. Douleur qui pulse, réveille ou s’accompagne de gonflement : appelez aujourd’hui."],
      ["Pourquoi mes gencives saignent-elles ?", "Le plus souvent, le saignement signale une inflammation. Un nettoyage professionnel et une technique adaptée suffisent souvent à l’arrêter."],
      ["Puis-je venir avec mon enfant ?", "Oui. Les rendez-vous enfants sont placés hors des heures de pointe et commencent toujours par une découverte du fauteuil."],
    ],
    faqTitle: "Les réponses essentielles.",
    faq: [
      ["Prenez-vous de nouveaux patients ?", "Oui. Commencez par le formulaire de première visite ou appelez directement le cabinet."],
      ["Les soins des enfants sont-ils remboursés ?", "L’essentiel des soins dentaires est remboursé avant 18 ans selon les règles de l’INAMI."],
      ["Puis-je payer en plusieurs fois ?", "Un étalement peut être convenu pour les traitements importants, avant le début des soins."],
      ["Que faire si j’ai peur ?", "Dites-le dès la réservation. Nous adaptons le rythme, expliquons chaque geste et convenons d’un signal d’arrêt."],
    ],
  },
  nl: {
    label: "Advies & vragen",
    title: "Korte antwoorden op vragen die u misschien niet durft te stellen.",
    intro: "Eenvoudige richtlijnen om te beslissen wanneer u moet bellen, waarop u moet letten en hoe u uw bezoek voorbereidt.",
    contact: "Contact opnemen",
    advice: [
      ["Kan tandpijn wachten tot morgen?", "Een korte pijnprikkel bij koude kan vaak wachten. Kloppende pijn, pijn die u wakker houdt of zwelling: bel vandaag."],
      ["Waarom bloedt mijn tandvlees?", "Meestal wijst bloeding op een ontsteking. Een professionele reiniging en aangepaste poetstechniek volstaan vaak om ze te stoppen."],
      ["Mag ik met mijn kind komen?", "Ja. Kinderafspraken plannen we buiten de piekuren en beginnen altijd met rustig kennismaken met de stoel."],
    ],
    faqTitle: "De belangrijkste antwoorden.",
    faq: [
      ["Nemen jullie nieuwe patiënten aan?", "Ja. Begin met het formulier voor een eerste bezoek of bel de praktijk rechtstreeks."],
      ["Wordt tandzorg voor kinderen terugbetaald?", "De meeste tandzorg wordt vóór 18 jaar terugbetaald volgens de regels van het RIZIV."],
      ["Kan ik in termijnen betalen?", "Voor grotere behandelingen kan vóór de start een betalingsregeling worden afgesproken."],
      ["Wat als ik bang ben?", "Vertel het bij de reservatie. We passen het tempo aan, leggen elke stap uit en spreken een stopsignaal af."],
    ],
  },
} as const;

export default function AdvicePage() {
  const { language } = useLanguage();
  const copy = pageCopy[language];

  return (
    <main className="advice-page page-paper">
      <SiteHeader />
      <section className="content-shell advice-page__intro">
        <SectionLabel>{copy.label}</SectionLabel>
        <h1 className="editorial-title">{copy.title}</h1>
        <p>{copy.intro}</p>
      </section>
      <section className="content-shell advice-cards">
        {copy.advice.map(([title, text], index) => (
          <article key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{text}</p><ButtonLink href="/contact" tone="outline">{copy.contact}</ButtonLink></article>
        ))}
      </section>
      <section className="content-shell faq-section" id="faq">
        <SectionLabel>FAQ</SectionLabel>
        <h2 className="editorial-title">{copy.faqTitle}</h2>
        <div>{copy.faq.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div>
      </section>
      <SiteFooter />
    </main>
  );
}
