"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { useLanguage, type Language } from "@/components/language-provider";

const headerCopy = {
  fr: {
    schedule: "Lun–Ven 8h30–18h00",
    emergency: "Urgences : appelez avant 10h",
    languageLabel: "Langue",
    navigationLabel: "Navigation principale",
    appointment: "PRENDRE RENDEZ-VOUS",
    nav: [
      ["ACCUEIL", "/"],
      ["SOINS", "/soins"],
      ["CABINET", "/cabinet"],
      ["NOUVEAU PATIENT", "/nouveau-patient"],
      ["CONSEILS", "/conseils"],
      ["CONTACT", "/contact"],
    ],
  },
  nl: {
    schedule: "Ma–Vr 8.30–18.00",
    emergency: "Spoed: bel vóór 10 uur",
    languageLabel: "Taal",
    navigationLabel: "Hoofdnavigatie",
    appointment: "MAAK EEN AFSPRAAK",
    nav: [
      ["START", "/"],
      ["BEHANDELINGEN", "/soins"],
      ["PRAKTIJK", "/cabinet"],
      ["NIEUWE PATIËNT", "/nouveau-patient"],
      ["ADVIES", "/conseils"],
      ["CONTACT", "/contact"],
    ],
  },
} satisfies Record<
  Language,
  {
    schedule: string;
    emergency: string;
    languageLabel: string;
    navigationLabel: string;
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
  const copy = headerCopy[language];

  return (
    <header className="site-header">
      <div className="site-header__utility">
        <div className="site-header__utility-inner">
          <div className="utility-details">
            <span>
              <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5" /><path d="M8 4.5v3.8l2.5 1.5" /></svg>
              {copy.schedule}
            </span>
            <span>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.2 2.2h2.2l1.2 3.2-1.5 1.2a10.5 10.5 0 0 0 4.3 4.3l1.2-1.5 3.2 1.2v2.2c0 .7-.6 1.2-1.3 1.2C6.8 13.7 2.3 9.2 2 3.5c0-.7.5-1.3 1.2-1.3Z" /></svg>
              <a href="tel:+3211000000">+32 (0)11 00 00 00</a>
            </span>
            <a className="utility-details__urgent" href="tel:+3211000000">{copy.emergency}</a>
          </div>
          <div className="utility-languages" aria-label={copy.languageLabel} role="group">
            <span className={language === "fr" ? "utility-languages__active" : undefined}>
              <button
                type="button"
                style={languageButtonStyle}
                aria-pressed={language === "fr"}
                aria-label="Français"
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
                aria-label="Nederlands"
                onClick={() => setLanguage("nl")}
              >
                NL
              </button>
            </span>
          </div>
        </div>
      </div>
      <div className="site-header__inner">
        <div className="site-header__brand"><Logo nameOnly withMark /></div>
        <nav className="site-nav" aria-label={copy.navigationLabel}>
          {copy.nav.map(([label, href]) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={active ? "site-nav__link--active" : undefined}>
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
