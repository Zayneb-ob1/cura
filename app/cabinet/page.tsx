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
    intro: "Découvrez l’équipe du cabinet et les domaines de soins présentés sur ce site.",
    teamLoading: "Chargement de l’équipe…",
    teamError: "L’équipe ne peut pas être chargée pour le moment.",
    noTeam: "Aucun profil d’équipe vérifié n’est publié pour le moment.",
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
    intro: "Ontdek het team van de praktijk en de zorggebieden die op deze website worden voorgesteld.",
    teamLoading: "Team laden…",
    teamError: "Het team kan momenteel niet worden geladen.",
    noTeam: "Er is momenteel geen geverifieerd teamprofiel gepubliceerd.",
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
  const [teamState, setTeamState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    fetch("/api/doctors", { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<{ items?: Doctor[] }> : Promise.reject())
      .then((payload) => {
        if (active && Array.isArray(payload.items)) {
          setDoctors(payload.items);
          setTeamState("ready");
        }
      })
      .catch(() => {
        if (active && !controller.signal.aborted) setTeamState("error");
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const team = doctors.map((doctor) => [
    doctor.initials,
    language === "fr" ? doctor.nameFr : doctor.nameNl,
    language === "fr" ? doctor.roleFr : doctor.roleNl,
    language === "fr" ? doctor.bioFr : doctor.bioNl,
  ]);

  return (
    <div className="cabinet-page page-paper">
      <SiteHeader />
      <main>
      <section className="content-shell cabinet-page__intro" id="main-content" tabIndex={-1}>
        <SectionLabel>{copy.label}</SectionLabel>
        <h1 className="editorial-title">{copy.title}</h1>
        <p>{copy.intro}</p>
        {teamState === "loading" ? <p role="status" aria-live="polite">{copy.teamLoading}</p>
          : teamState === "error" ? <p role="alert">{copy.teamError}</p>
          : team.length === 0 ? <p>{copy.noTeam}</p>
          : <div className="team-grid">
          {team.map(([initials, name, role, text], index) => (
            <article key={`${name}-${index}`}><strong>{initials}</strong><h2>{name}</h2><span>{role}</span><p>{text}</p></article>
          ))}
        </div>}
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
      </main>
      <SiteFooter />
    </div>
  );
}
