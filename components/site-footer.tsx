"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { useLanguage, type Language } from "@/components/language-provider";
import { useSiteSettings } from "@/components/site-settings-provider";

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
    days: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    contactPending: "Coordonnées à confirmer",
    management: "Gestion du cabinet",
    homeLabel: "Accueil",
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
    days: ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"],
    contactPending: "Contactgegevens te bevestigen",
    management: "Praktijkbeheer",
    homeLabel: "Startpagina",
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
    days: readonly string[];
    contactPending: string;
    management: string;
    homeLabel: string;
  }
>;

export function SiteFooter() {
  const { language } = useLanguage();
  const clinicConfig = useSiteSettings();
  const copy = footerCopy[language];
  const hours = copy.days.map((day, index) => [day, clinicConfig.hours[index] || "—"] as const);

  return (
    <footer className="site-footer site-footer--dark">
      <div className="site-footer__grid">
        <div className="site-footer__brand">
          <Logo compact withMark homeLabel={copy.homeLabel} />
          <p>
            {clinicConfig.hasAddress ? (
              <>{clinicConfig.addressLine1}{clinicConfig.addressLine1 && clinicConfig.postalCity && <br />}{clinicConfig.postalCity}</>
            ) : copy.contactPending}
            {clinicConfig.hasPhone && <><br /><a href={`tel:${clinicConfig.phone}`}>{clinicConfig.phoneDisplay}</a></>}
            {clinicConfig.email && <><br /><a href={`mailto:${clinicConfig.email}`}>{clinicConfig.email}</a></>}
          </p>
        </div>
        <div role="navigation" aria-label={copy.careLabel}>
          <p className="footer-label">{copy.careLabel}</p>
          {copy.careLinks.map((care, index) => (
            <Link key={care} href={`/soins#soin-${String(index + 1).padStart(2, "0")}`}>
              {care}
            </Link>
          ))}
        </div>
        <div role="navigation" aria-label={copy.practiceLabel}>
          <p className="footer-label">{copy.practiceLabel}</p>
          {copy.practiceLinks.map(([label, href]) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
        </div>
        <div role="navigation" aria-label={copy.patientsLabel}>
          <p className="footer-label">{copy.patientsLabel}</p>
          {copy.patientLinks.map(([label, href]) => (
            <Link key={label} href={href}>{label}</Link>
          ))}
        </div>
        <div className="site-footer__hours">
          <p className="footer-label">{copy.hoursLabel}</p>
          {hours.map(([day, time]) => (
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
