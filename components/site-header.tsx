"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { useLanguage, type Language } from "@/components/language-provider";
import { useSiteSettings } from "@/components/site-settings-provider";

const headerCopy = {
  fr: {
    schedulePending: "Horaires à confirmer",
    contactPending: "Coordonnées à confirmer",
    languageLabel: "Langue",
    navigationLabel: "Navigation principale",
    homeLabel: "Accueil",
    menuOpen: "Ouvrir le menu",
    menuClose: "Fermer le menu",
    appointment: "PRENDRE RENDEZ-VOUS",
    nav: [
      ["ACCUEIL", "/"],
      ["NOS TRAITEMENTS DENTAIRES", "/soins"],
      ["CABINET", "/cabinet"],
      ["CONTACT", "/contact"],
    ],
  },
  nl: {
    schedulePending: "Openingsuren te bevestigen",
    contactPending: "Contactgegevens te bevestigen",
    languageLabel: "Taal",
    navigationLabel: "Hoofdnavigatie",
    homeLabel: "Startpagina",
    menuOpen: "Menu openen",
    menuClose: "Menu sluiten",
    appointment: "MAAK EEN AFSPRAAK",
    nav: [
      ["START", "/"],
      ["ONZE TANDHEELKUNDIGE BEHANDELINGEN", "/soins"],
      ["PRAKTIJK", "/cabinet"],
      ["CONTACT", "/contact"],
    ],
  },
} satisfies Record<
  Language,
  {
    schedulePending: string;
    contactPending: string;
    languageLabel: string;
    navigationLabel: string;
    homeLabel: string;
    menuOpen: string;
    menuClose: string;
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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className={menuOpen ? "site-header site-header--menu-open" : "site-header"}>
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
        <button
          type="button"
          className="site-header__menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="site-nav"
          aria-label={menuOpen ? copy.menuClose : copy.menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true" />
        </button>
        <nav className="site-nav" id="site-nav" aria-label={copy.navigationLabel}>
          {copy.nav.map(([label, href]) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={active ? "site-nav__link--active" : undefined} aria-current={active ? "page" : undefined} onClick={() => setMenuOpen(false)}>
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
