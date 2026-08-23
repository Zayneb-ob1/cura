"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { useLanguage, type Language } from "@/components/language-provider";

const footerCopy = {
  fr: {
    careLabel: "SOINS",
    careLinks: [
      "Contrôle annuel",
      "Plombage",
      "Détartrage & surfaçage",
      "Traitement de canal",
      "Extraction",
      "Prothèse dentaire",
    ],
    practiceLabel: "CABINET",
    practiceLinks: [
      ["L'équipe", "/cabinet"],
      ["Conseils", "/conseils"],
      ["Contact", "/contact"],
    ],
    patientsLabel: "PATIENTS",
    patientLinks: [
      ["Première visite", "/nouveau-patient"],
      ["Prendre rendez-vous", "/rendez-vous"],
      ["Avis", "/#avis"],
      ["FAQ", "/conseils#faq"],
      ["Mentions légales", "/mentions-legales"],
    ],
    hoursLabel: "HORAIRES",
    hours: [
      ["Lun", "08:30-18:00"],
      ["Mar", "08:30-18:00"],
      ["Mer", "08:30-18:00"],
      ["Jeu", "08:30-18:00"],
      ["Ven", "08:30-17:00"],
      ["Sam", "09:00-13:00"],
      ["Dim", "Fermé"],
    ],
    management: "Gestion du cabinet",
  },
  nl: {
    careLabel: "BEHANDELINGEN",
    careLinks: [
      "Jaarlijkse controle",
      "Vulling",
      "Tandsteenverwijdering & dieptereiniging",
      "Wortelkanaalbehandeling",
      "Extractie",
      "Tandprothese",
    ],
    practiceLabel: "PRAKTIJK",
    practiceLinks: [
      ["Het team", "/cabinet"],
      ["Advies", "/conseils"],
      ["Contact", "/contact"],
    ],
    patientsLabel: "PATIËNTEN",
    patientLinks: [
      ["Eerste bezoek", "/nouveau-patient"],
      ["Maak een afspraak", "/rendez-vous"],
      ["Beoordelingen", "/#avis"],
      ["Veelgestelde vragen", "/conseils#faq"],
      ["Wettelijke vermeldingen", "/mentions-legales"],
    ],
    hoursLabel: "OPENINGSUREN",
    hours: [
      ["Ma", "08:30-18:00"],
      ["Di", "08:30-18:00"],
      ["Wo", "08:30-18:00"],
      ["Do", "08:30-18:00"],
      ["Vr", "08:30-17:00"],
      ["Za", "09:00-13:00"],
      ["Zo", "Gesloten"],
    ],
    management: "Praktijkbeheer",
  },
} satisfies Record<
  Language,
  {
    careLabel: string;
    careLinks: readonly string[];
    practiceLabel: string;
    practiceLinks: readonly (readonly [string, string])[];
    patientsLabel: string;
    patientLinks: readonly (readonly [string, string])[];
    hoursLabel: string;
    hours: readonly (readonly [string, string])[];
    management: string;
  }
>;

export function SiteFooter() {
  const { language } = useLanguage();
  const copy = footerCopy[language];

  return (
    <footer className="site-footer site-footer--dark">
      <span className="site-footer__background-word" aria-hidden="true">CURA</span>
      <div className="site-footer__grid">
        <div className="site-footer__brand">
          <Logo compact withMark />
          <p>
            Kuringenstraat 511
            <br />
            4030 Hasselt
            <br />
            <a href="tel:+3211000000">+32 (0)11 00 00 00</a>
          </p>
        </div>
        <div>
          <p className="footer-label">{copy.careLabel}</p>
          {copy.careLinks.map((care, index) => (
            <Link key={care} href={`/soins#soin-${String(index + 1).padStart(2, "0")}`}>
              {care}
            </Link>
          ))}
        </div>
        <div>
          <p className="footer-label">{copy.practiceLabel}</p>
          {copy.practiceLinks.map(([label, href]) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
        </div>
        <div>
          <p className="footer-label">{copy.patientsLabel}</p>
          {copy.patientLinks.map(([label, href]) => (
            <Link key={label} href={href}>{label}</Link>
          ))}
        </div>
        <div className="site-footer__hours">
          <p className="footer-label">{copy.hoursLabel}</p>
          {copy.hours.map(([day, time]) => (
            <div key={day}>
              <span>{day}</span>
              <span>{time}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>© 2026 CURA Tandartspraktijk</span>
        <Link href="/admin">{copy.management}</Link>
      </div>
    </footer>
  );
}
