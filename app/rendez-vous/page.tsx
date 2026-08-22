"use client";

import { FormEvent, useEffect, useState } from "react";
import { SectionLabel } from "@/components/buttons";
import { useLanguage } from "@/components/language-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { hoursByLanguage, treatmentsByLanguage } from "@/lib/content";

const pageCopy = {
  fr: {
    label: "Prendre rendez-vous", title: "Réservez votre place en deux minutes.", intro: "Choisissez le motif, donnez-nous vos coordonnées et indiquez vos disponibilités. Nous confirmons sous 24 h.",
    appointment: "Le rendez-vous", care: "Soin demandé", unknown: "Je ne sais pas encore", day: "Jour préféré", time: "Moment", morning: "Matin", afternoon: "Après-midi", any: "Sans préférence",
    details: "Vos coordonnées", firstName: "Prénom", lastName: "Nom", email: "E-mail", phone: "Téléphone", note: "Une information utile", placeholder: "Douleur, appréhension, mobilité réduite…",
    consent: "J’accepte que le cabinet utilise ces informations pour traiter ma demande.", send: "Envoyer ma demande", sending: "Envoi en cours…", success: "Votre demande de rendez-vous a bien été envoyée. Nous vous confirmerons l’heure sous 24 h.", error: "Impossible d’envoyer votre demande pour le moment. Veuillez réessayer.",
    confirmation: "Confirmation", next: "Ce qui se passe ensuite", nextCopy: "Nous vous rappelons ou vous écrivons sous 24 h pour confirmer l’heure exacte.", address: "Adresse", hours: "Horaires",
  },
  nl: {
    label: "Maak een afspraak", title: "Reserveer uw afspraak in twee minuten.", intro: "Kies de reden, vul uw gegevens in en geef aan wanneer u beschikbaar bent. We bevestigen binnen 24 uur.",
    appointment: "De afspraak", care: "Gewenste behandeling", unknown: "Ik weet het nog niet", day: "Voorkeursdag", time: "Moment", morning: "Voormiddag", afternoon: "Namiddag", any: "Geen voorkeur",
    details: "Uw gegevens", firstName: "Voornaam", lastName: "Naam", email: "E-mail", phone: "Telefoon", note: "Nuttige informatie", placeholder: "Pijn, bezorgdheid, beperkte mobiliteit…",
    consent: "Ik ga ermee akkoord dat de praktijk deze gegevens gebruikt om mijn aanvraag te behandelen.", send: "Mijn aanvraag versturen", sending: "Bezig met versturen…", success: "Uw afspraakaanvraag is goed verzonden. We bevestigen het tijdstip binnen 24 uur.", error: "Uw aanvraag kan momenteel niet worden verzonden. Probeer het opnieuw.",
    confirmation: "Bevestiging", next: "Wat gebeurt er daarna?", nextCopy: "We bellen of mailen u binnen 24 uur om het exacte tijdstip te bevestigen.", address: "Adres", hours: "Openingsuren",
  },
} as const;

export default function AppointmentPage() {
  const { language } = useLanguage();
  const copy = pageCopy[language];
  const hours = hoursByLanguage[language];
  const treatments = treatmentsByLanguage[language];
  const [care, setCare] = useState("");
  const [submissionState, setSubmissionState] = useState<"idle" | "sending" | "success" | "error">("idle");

  useEffect(() => {
    const task = window.setTimeout(() => {
      const requestedCare = new URLSearchParams(window.location.search).get("care");
      if (requestedCare && /^(0[1-9])$/.test(requestedCare)) setCare(requestedCare);
    }, 0);
    return () => window.clearTimeout(task);
  }, []);

  async function submitAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const selectedCare = String(data.get("care") ?? "");
    const selectedCareName = treatments.find((item) => item.number === selectedCare)?.name ?? copy.unknown;

    setSubmissionState("sending");

    try {
      const response = await fetch("/api/appointment-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          care: selectedCareName,
          day: String(data.get("day") ?? ""),
          time: String(data.get("time") ?? ""),
          firstName: String(data.get("firstName") ?? "").trim(),
          lastName: String(data.get("lastName") ?? "").trim(),
          email: String(data.get("email") ?? "").trim(),
          phone: String(data.get("phone") ?? "").trim(),
          note: String(data.get("note") ?? "").trim(),
          consent: data.get("consent") === "on",
          language,
        }),
      });
      if (!response.ok) throw new Error("Submission failed");

      form.reset();
      setCare("");
      setSubmissionState("success");
      try {
        window.localStorage.setItem("cura-dashboard-update", String(Date.now()));
      } catch {
        // The submission is already saved; dashboard focus refresh remains available.
      }
    } catch {
      setSubmissionState("error");
    }
  }

  return (
    <main className="appointment-page page-paper">
      <SiteHeader />
      <section className="content-shell appointment-page__intro">
        <SectionLabel>{copy.label}</SectionLabel><h1 className="editorial-title">{copy.title}</h1><p>{copy.intro}</p>
      </section>
      <section className="content-shell appointment-layout">
        <form className="appointment-form" onSubmit={submitAppointment} aria-busy={submissionState === "sending"}>
          <div className="appointment-form__section">
            <span>01</span>
            <div>
              <SectionLabel>{copy.appointment}</SectionLabel>
              <div className="appointment-form__grid">
                <div className="form-field appointment-form__wide"><label htmlFor="care">{copy.care}</label><select id="care" name="care" value={care} onChange={(event) => setCare(event.target.value)}><option value="">{copy.unknown}</option>{treatments.map((item) => <option key={item.number} value={item.number}>{item.name}</option>)}</select></div>
                <div className="form-field"><label htmlFor="preferred-day">{copy.day}</label><input id="preferred-day" name="day" type="date" required /></div>
                <div className="form-field"><label htmlFor="preferred-time">{copy.time}</label><select id="preferred-time" name="time"><option>{copy.morning}</option><option>{copy.afternoon}</option><option>{copy.any}</option></select></div>
              </div>
            </div>
          </div>
          <div className="appointment-form__section">
            <span>02</span>
            <div>
              <SectionLabel>{copy.details}</SectionLabel>
              <div className="appointment-form__grid">
                <div className="form-field"><label htmlFor="first-name">{copy.firstName}</label><input id="first-name" name="firstName" required autoComplete="given-name" /></div>
                <div className="form-field"><label htmlFor="last-name">{copy.lastName}</label><input id="last-name" name="lastName" required autoComplete="family-name" /></div>
                <div className="form-field"><label htmlFor="appointment-email">{copy.email}</label><input id="appointment-email" name="email" type="email" required autoComplete="email" /></div>
                <div className="form-field"><label htmlFor="appointment-phone">{copy.phone}</label><input id="appointment-phone" name="phone" type="tel" required autoComplete="tel" /></div>
                <div className="form-field appointment-form__wide"><label htmlFor="note">{copy.note}</label><textarea id="note" name="note" placeholder={copy.placeholder} /></div>
              </div>
            </div>
          </div>
          <label className="appointment-consent"><input type="checkbox" name="consent" required /> {copy.consent}</label>
          <button type="submit" className="button-link button-link--green" disabled={submissionState === "sending"}>{submissionState === "sending" ? copy.sending : copy.send}</button>
          {submissionState !== "idle" && <p className="form-status" role="status" aria-live="polite">{copy[submissionState]}</p>}
        </form>
        <aside className="appointment-summary">
          <article><SectionLabel>{copy.confirmation}</SectionLabel><h2>{copy.next}</h2><p>{copy.nextCopy}</p></article>
          <article><SectionLabel>{copy.address}</SectionLabel><p>Kuringenstraat 511<br />4030 Hasselt<br /><a href="tel:+3211000000">+32 (0)11 00 00 00</a></p></article>
          <article><SectionLabel>{copy.hours}</SectionLabel>{hours.slice(0, 6).map(([day, time]) => <p key={day}><span>{day}</span><b>{time}</b></p>)}</article>
        </aside>
      </section>
      <SiteFooter tone="light" />
    </main>
  );
}
