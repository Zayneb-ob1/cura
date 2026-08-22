"use client";

import { useEffect, useState } from "react";
import { SectionLabel } from "@/components/buttons";
import { useLanguage } from "@/components/language-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const pageCopy = {
  fr: {
    label: "Le cabinet",
    title: "Une équipe, une adresse, et le temps d’écouter.",
    intro: "CURA réunit à Hasselt les soins généraux, la prothèse et l’implantologie — pour vous éviter d’aller de cabinet en cabinet.",
    team: [
      ["DR", "Dr. [Nom]", "Dentiste · soins généraux", "Contrôle, soins conservateurs, endodontie. Assure le suivi de la majorité des patients."],
      ["DR", "Dr. [Nom]", "Prothèse & implantologie", "Couronnes, facettes, prothèses et implants, de la planification à la pose."],
      ["MD", "[Prénom]", "Hygiène & accueil", "Détartrage, conseils d’hygiène, et le premier visage que vous croisez."],
    ],
    equipment: "Équipement",
    equipmentTitle: "Une technique qui raccourcit la visite, pas la facture.",
    equipmentItems: ["Radiographie panoramique numérique", "Caméra intra-orale — vous voyez ce que nous voyons", "Détartrage à ultrasons", "Endodontie rotative pour des traitements de canal plus courts", "Stérilisation autoclave classe B, tracée"],
    practice: "Pratique",
    practiceTitle: "Préparer votre visite",
    practiceItems: [["À apporter", "Carte d’identité"], ["Médicaments", "Liste ou boîtes"], ["Anciennes radios", "Si disponibles"], ["Paiement", "Bancontact, espèces"], ["Annulation", "24 h à l’avance"]],
  },
  nl: {
    label: "De praktijk",
    title: "Eén team, één adres en tijd om te luisteren.",
    intro: "CURA verenigt in Hasselt algemene tandzorg, prothetiek en implantologie. U hoeft niet van praktijk naar praktijk te gaan.",
    team: [
      ["DR", "Dr. [Naam]", "Tandarts · algemene zorg", "Controle, conserverende zorg en endodontie. Volgt het merendeel van onze patiënten op."],
      ["DR", "Dr. [Naam]", "Prothetiek & implantologie", "Planning, chirurgie en vaste restauraties, van het eerste onderzoek tot de controle."],
      ["MD", "[Voornaam]", "Hygiëne & onthaal", "Tandsteenverwijdering, advies over mondhygiëne en het eerste gezicht dat u ontmoet."],
    ],
    equipment: "Uitrusting",
    equipmentTitle: "Techniek die het bezoek verkort, niet de rekening.",
    equipmentItems: ["Digitale panoramische radiografie", "Intra-orale camera — u ziet wat wij zien", "Ultrasone tandsteenverwijdering", "Roterende endodontie voor kortere wortelkanaalbehandelingen", "Traceerbare klasse B-autoclaafsterilisatie"],
    practice: "Praktisch",
    practiceTitle: "Bereid uw bezoek voor",
    practiceItems: [["Mee te brengen", "Identiteitskaart"], ["Medicatie", "Lijst of doosjes"], ["Oude röntgenfoto’s", "Indien beschikbaar"], ["Betaling", "Bancontact, contant"], ["Annulering", "24 uur vooraf"]],
  },
} as const;

type Doctor = {
  id: string;
  initials: string;
  nameFr: string;
  nameNl: string;
  roleFr: string;
  roleNl: string;
  bioFr: string;
  bioNl: string;
};

export default function CabinetPage() {
  const { language } = useLanguage();
  const copy = pageCopy[language];
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/doctors", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ items?: Doctor[] }> : Promise.reject())
      .then((payload) => {
        if (active && Array.isArray(payload.items)) setDoctors(payload.items);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const team = doctors.length > 0
    ? doctors.map((doctor) => [
        doctor.initials,
        language === "fr" ? doctor.nameFr : doctor.nameNl,
        language === "fr" ? doctor.roleFr : doctor.roleNl,
        language === "fr" ? doctor.bioFr : doctor.bioNl,
      ])
    : copy.team;

  return (
    <main className="cabinet-page page-paper">
      <SiteHeader />
      <section className="content-shell cabinet-page__intro">
        <SectionLabel>{copy.label}</SectionLabel>
        <h1 className="editorial-title">{copy.title}</h1>
        <p>{copy.intro}</p>
        <div className="team-grid">
          {team.map(([initials, name, role, text]) => (
            <article key={role}><strong>{initials}</strong><h2>{name}</h2><span>{role}</span><p>{text}</p></article>
          ))}
        </div>
      </section>
      <section className="content-shell cabinet-equipment">
        <div>
          <SectionLabel>{copy.equipment}</SectionLabel>
          <h2 className="editorial-title">{copy.equipmentTitle}</h2>
          <ul>{copy.equipmentItems.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <aside className="cabinet-practice">
          <div>
            <SectionLabel>{copy.practice}</SectionLabel>
            <h3>{copy.practiceTitle}</h3>
            <dl>
              {copy.practiceItems.map(([label, value]) => (
                <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          </div>
        </aside>
      </section>
      <SiteFooter />
    </main>
  );
}
