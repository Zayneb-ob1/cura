"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage, type Language } from "@/components/language-provider";
import { useSiteSettings } from "@/components/site-settings-provider";

// Footer from the Figma design: brand, care links, contact details, language switch, CURA watermark.
const footerCopy = {
  fr: {
    careLabel: "SOINS",
    careLinks: [["Parodontologie", "parodontologie"], ["Esthétique dentaire", "esthetique"], ["Implantologie", "implantologie"], ["Soins généraux", "soins-generaux"], ["Facettes dentaires", "facettes"], ["Chirurgie dentaire", "chirurgie"], ["Endodontie", "endodontie"], ["Orthodontie", "orthodontie"]],
    contactLabel: "Contact",
    address: "Adresse",
    phone: "Tél.",
    contactPending: "Coordonnées à confirmer",
    schedulePending: "Horaires à confirmer",
    languageLabel: "Langue",
    legal: "Mentions légales",
    homeLabel: "Accueil",
  },
  nl: {
    careLabel: "BEHANDELINGEN",
    careLinks: [["Parodontologie", "parodontologie"], ["Esthetische tandheelkunde", "esthetique"], ["Implantologie", "implantologie"], ["Algemene tandzorg", "soins-generaux"], ["Facetten", "facettes"], ["Mondchirurgie", "chirurgie"], ["Endodontie", "endodontie"], ["Orthodontie", "orthodontie"]],
    contactLabel: "Contact",
    address: "Adres",
    phone: "Tel.",
    contactPending: "Contactgegevens te bevestigen",
    schedulePending: "Openingsuren te bevestigen",
    languageLabel: "Taal",
    legal: "Wettelijke vermeldingen",
    homeLabel: "Startpagina",
  },
} satisfies Record<
  Language,
  {
    careLabel: string;
    careLinks: readonly (readonly [string, string])[];
    contactLabel: string;
    address: string;
    phone: string;
    contactPending: string;
    schedulePending: string;
    languageLabel: string;
    legal: string;
    homeLabel: string;
  }
>;

export function SiteFooter() {
  const { language, setLanguage } = useLanguage();
  const clinicConfig = useSiteSettings();
  const copy = footerCopy[language];
  const address = [clinicConfig.addressLine1, clinicConfig.postalCity].filter(Boolean).join(", ");

  return (
    <footer className="cura-footer">
      <Image className="cura-footer__watermark" src="/brand/cura-wordmark.webp" alt="" width={820} height={249} sizes="90vw" aria-hidden="true" />
      <div className="cura-footer__grid">
        <Link className="cura-footer__brand" href="/">
          <Image src="/brand/cura-tooth.png" alt="" width={656} height={784} sizes="44px" />
          <Image src="/brand/cura-wordmark.webp" alt="CURA" width={820} height={249} sizes="140px" />
          <span>TANDARTS PRAKTIJK</span>
          <span className="sr-only"> — {copy.homeLabel}</span>
        </Link>

        <nav aria-label={copy.careLabel}>
          <p className="cura-footer__label">{copy.careLabel}</p>
          <ul>
            {copy.careLinks.map(([care, slug]) => (
              <li key={slug}><Link href={`/soins#${slug}`}>{care}</Link></li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="cura-footer__label">{copy.contactLabel}</p>
          <ul>
            <li>{copy.address} : {address || copy.contactPending}</li>
            <li>
              {copy.phone} : {clinicConfig.hasPhone ? <a href={`tel:${clinicConfig.phone}`}>{clinicConfig.phoneDisplay}</a> : copy.contactPending}
            </li>
            {clinicConfig.email && <li><a href={`mailto:${clinicConfig.email}`}>{clinicConfig.email}</a></li>}
            <li>{clinicConfig.schedule[language] || copy.schedulePending}</li>
          </ul>
        </div>

        <div className="cura-footer__languages" role="group" aria-label={copy.languageLabel}>
          {(["fr", "nl"] as const).map((code) => (
            <button key={code} type="button" aria-pressed={language === code} onClick={() => setLanguage(code)}>
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="cura-footer__bottom">
        <span>© 2026 CURA TANDARTSPRAKTIJK</span>
        <Link href="/mentions-legales">{copy.legal}</Link>
      </div>
    </footer>
  );
}
