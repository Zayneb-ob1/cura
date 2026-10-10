"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { useLanguage, type Language } from "@/components/language-provider";
import { useSiteSettings } from "@/components/site-settings-provider";

const headerCopy = {
  fr: {
    schedulePending: "Horaires à confirmer",
    contactPending: "Coordonnées à confirmer",
    emergencyPending: "Urgences : informations à confirmer",
    languageLabel: "Langue",
    navigationLabel: "Navigation principale",
    homeLabel: "Accueil",
    appointment: "PRENDRE RENDEZ-VOUS",
    nav: [
      ["ACCUEIL", "/"],
      ["SOINS", "/soins"],
      ["URGENCES", "/urgences"],
      ["CABINET", "/cabinet"],
      ["TARIFS", "/tarifs"],
      ["NOUVEAU PATIENT", "/nouveau-patient"],
      ["CONSEILS", "/conseils"],
      ["CONTACT", "/contact"],
    ],
  },
  nl: {
    schedulePending: "Openingsuren te bevestigen",
    contactPending: "Contactgegevens te bevestigen",
    emergencyPending: "Spoed: informatie te bevestigen",
    languageLabel: "Taal",
    navigationLabel: "Hoofdnavigatie",
    homeLabel: "Startpagina",
    appointment: "MAAK EEN AFSPRAAK",
    nav: [
      ["START", "/"],
      ["BEHANDELINGEN", "/soins"],
      ["SPOED", "/urgences"],
      ["PRAKTIJK", "/cabinet"],
      ["TARIEVEN", "/tarifs"],
      ["NIEUWE PATIËNT", "/nouveau-patient"],
      ["ADVIES", "/conseils"],
      ["CONTACT", "/contact"],
    ],
  },
} satisfies Record<
  Language,
  {
    schedulePending: string;
    contactPending: string;
    emergencyPending: string;
    languageLabel: string;
    navigationLabel: string;
    homeLabel: string;
    appointment: string;
    nav: readonly (readonly [string, string])[];
  }
>;

const languageButtonStyle = {
  appearance: "none",
  background: "none",
  border: 0,
  padding: 0,
  color: "inherit",
  font: "inherit",
  letterSpacing: "inherit",
  cursor: "pointer",
} as const;

export function SiteHeader() {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();
  const clinicConfig = useSiteSettings();
  const copy = headerCopy[language];

  return (
    <header className="site-header">
      <div className="site-header__utility">
        <div className="site-header__utility-inner">
          <div className="utility-details">
            <span>
              <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5" /><path d="M8 4.5v3.8l2.5 1.5" /></svg>
              {clinicConfig.schedule[language] || copy.schedulePending}
            </span>
            <span>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.2 2.2h2.2l1.2 3.2-1.5 1.2a10.5 10.5 0 0 0 4.3 4.3l1.2-1.5 3.2 1.2v2.2c0 .7-.6 1.2-1.3 1.2C6.8 13.7 2.3 9.2 2 3.5c0-.7.5-1.3 1.2-1.3Z" /></svg>
              {clinicConfig.hasPhone
                ? <a href={`tel:${clinicConfig.phone}`}>{clinicConfig.phoneDisplay}</a>
                : copy.contactPending}
            </span>
            {clinicConfig.hasPhone && clinicConfig.emergency[language]
              ? <a className="utility-details__urgent" href={`tel:${clinicConfig.phone}`}>{clinicConfig.emergency[language]}</a>
              : <span className="utility-details__urgent">{copy.emergencyPending}</span>}
          </div>
          <div className="utility-languages" aria-label={copy.languageLabel} role="group">
            <span className={language === "fr" ? "utility-languages__active" : undefined}>
              <button
                type="button"
                style={languageButtonStyle}
                aria-pressed={language === "fr"}
                aria-label="FR — Français"
                onClick={() => setLanguage("fr")}
              >
                FR
              </button>
            </span>
            <i aria-hidden="true">·</i>
            <span className={language === "nl" ? "utility-languages__active" : undefined}>
              <button
                type="button"
                style={languageButtonStyle}
                aria-pressed={language === "nl"}
                aria-label="NL — Nederlands"
                onClick={() => setLanguage("nl")}
              >
                NL
              </button>
            </span>
          </div>
        </div>
      </div>
      <div className="site-header__inner">
        <div className="site-header__brand"><Logo withMark homeLabel={copy.homeLabel} priority /></div>
        <nav className="site-nav" aria-label={copy.navigationLabel}>
          {copy.nav.map(([label, href]) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={active ? "site-nav__link--active" : undefined} aria-current={active ? "page" : undefined}>
                {label}
              </Link>
            );
          })}
        </nav>
        <Link className="site-header__appointment" href="/rendez-vous">
          {copy.appointment}
        </Link>
      </div>
    </header>
  );
}
