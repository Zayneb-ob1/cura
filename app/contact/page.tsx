"use client";

import { FormEvent, useEffect, useState } from "react";
import { SectionLabel } from "@/components/buttons";
import { useLanguage } from "@/components/language-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { hoursByLanguage } from "@/lib/content";
import { clinicConfig } from "@/lib/site-config";

const pageCopy = {
  fr: {
    contact: "Contact", title: "Où nous trouver.",
    address: "Adresse", directions: "Ouvrir l’itinéraire", hours: "Horaires",
    name: "Nom", email: "E-mail", subject: "Sujet", message: "Message",
    subjects: { general: "Question générale", file: "Dossier", transfer: "Transfert de dossier" },
    send: "Envoyer le message", response: "Nous répondons sous 24 h ouvrées.", sending: "Envoi en cours…", success: "Votre message a bien été envoyé. Nous vous répondrons sous 24 h ouvrées.", error: "Impossible d’envoyer votre message pour le moment. Veuillez réessayer.",
    phoneLabel: "Téléphone", emailLabel: "E-mail", urgencyLabel: "Urgences", faqTitle: "Questions fréquentes",
    addressPending: "Adresse à confirmer",
    contactPending: "À confirmer",
    faqs: [
      ["Faut-il être envoyé par un médecin ?", "Non. Vous pouvez prendre rendez-vous directement avec notre cabinet."],
      ["J’ai peur du dentiste. Que faire ?", "Dites-le-nous lors de votre demande. Nous prévoyons le temps nécessaire pour vous recevoir calmement."],
      ["Comment annuler ?", "Appelez-nous dès que possible, idéalement au moins 24 heures à l’avance."],
      ["Soignez-vous les enfants ?", "Oui. Un agenda séparé est prévu pour les enfants, hors heures de pointe."],
    ],
  },
  nl: {
    contact: "Contact", title: "Waar u ons vindt.",
    address: "Adres", directions: "Route openen", hours: "Openingsuren",
    name: "Naam", email: "E-mail", subject: "Onderwerp", message: "Bericht",
    subjects: { general: "Algemene vraag", file: "Dossier", transfer: "Dossieroverdracht" },
    send: "Bericht versturen", response: "We antwoorden binnen 24 werkuren.", sending: "Bezig met versturen…", success: "Uw bericht is goed verzonden. We antwoorden binnen 24 werkuren.", error: "Uw bericht kan momenteel niet worden verzonden. Probeer het opnieuw.",
    phoneLabel: "Telefoon", emailLabel: "E-mail", urgencyLabel: "Dringend", faqTitle: "Veelgestelde vragen",
    addressPending: "Adres te bevestigen",
    contactPending: "Te bevestigen",
    faqs: [
      ["Heb ik een verwijzing van een arts nodig?", "Nee. U kunt rechtstreeks een afspraak maken bij onze praktijk."],
      ["Ik ben bang voor de tandarts. Wat nu?", "Vertel het ons bij uw aanvraag. We nemen de nodige tijd om u rustig te ontvangen."],
      ["Hoe kan ik annuleren?", "Bel ons zo snel mogelijk, bij voorkeur minstens 24 uur vooraf."],
      ["Behandelen jullie kinderen?", "Ja. Voor kinderen is er een aparte agenda buiten de piekuren."],
    ],
  },
} as const;

type Language = "fr" | "nl";

type EditableField = {
  key: string;
  labelFr: string;
  labelNl: string;
  placeholderFr: string;
  placeholderNl: string;
  required: boolean;
  visible: boolean;
  order: number;
};

type EditableForm = {
  slug: string;
  enabled: boolean;
  titleFr: string;
  titleNl: string;
  descriptionFr: string;
  descriptionNl: string;
  submitLabelFr: string;
  submitLabelNl: string;
  fields: EditableField[];
};

const contactFieldKeys = new Set(["name", "email", "phone", "subject", "message"]);

function localizedFieldValue(field: EditableField, language: Language, property: "label" | "placeholder") {
  if (property === "label") return language === "fr" ? field.labelFr : field.labelNl;
  return language === "fr" ? field.placeholderFr : field.placeholderNl;
}

function isEditableForm(value: unknown): value is EditableForm {
  if (!value || typeof value !== "object") return false;
  const form = value as Partial<EditableForm>;
  return typeof form.slug === "string" &&
    typeof form.enabled === "boolean" &&
    typeof form.titleFr === "string" &&
    typeof form.titleNl === "string" &&
    typeof form.descriptionFr === "string" &&
    typeof form.descriptionNl === "string" &&
    typeof form.submitLabelFr === "string" &&
    typeof form.submitLabelNl === "string" &&
    Array.isArray(form.fields) && form.fields.every((field) => (
    field &&
    typeof field === "object" &&
    typeof field.key === "string" &&
    typeof field.labelFr === "string" &&
    typeof field.labelNl === "string" &&
    typeof field.placeholderFr === "string" &&
    typeof field.placeholderNl === "string" &&
    typeof field.required === "boolean" &&
    typeof field.visible === "boolean" &&
    typeof field.order === "number"
  ));
}

export default function ContactPage() {
  const { language } = useLanguage();
  const copy = pageCopy[language];
  const hours = hoursByLanguage[language];
  const [subject, setSubject] = useState("general");
  const [submissionState, setSubmissionState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [formConfig, setFormConfig] = useState<EditableForm | null>(null);

  const configuredFields = formConfig
    ? [...formConfig.fields]
        .filter((field) => field.visible && contactFieldKeys.has(field.key))
        .sort((first, second) => first.order - second.order)
    : null;

  const fieldLabel = (field: EditableField, fallback: string) => localizedFieldValue(field, language, "label") || fallback;
  const fieldPlaceholder = (field: EditableField) => localizedFieldValue(field, language, "placeholder") || undefined;
  const configuredDescription = language === "fr" ? formConfig?.descriptionFr : formConfig?.descriptionNl;
  const configuredSubmitLabel = language === "fr" ? formConfig?.submitLabelFr : formConfig?.submitLabelNl;

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadFormConfig() {
      try {
        const response = await fetch("/api/forms/contact", { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;
        const result = (await response.json()) as { form?: unknown };
        if (active && isEditableForm(result.form)) setFormConfig(result.form);
      } catch {
        // The static form remains available when the editable configuration cannot be loaded.
      }
    }

    void loadFormConfig();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => {
      if (new URLSearchParams(window.location.search).get("subject") === "transfert-dossier") setSubject("transfer");
    }, 0);
    return () => window.clearTimeout(task);
  }, []);

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const selectedSubject = copy.subjects[subject as keyof typeof copy.subjects];

    setSubmissionState("sending");

    try {
      const response = await fetch("/api/contact-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? "").trim(),
          email: String(data.get("email") ?? "").trim(),
          phone: String(data.get("phone") ?? "").trim(),
          subject: selectedSubject,
          message: String(data.get("message") ?? "").trim(),
          language,
        }),
      });
      if (!response.ok) throw new Error("Submission failed");

      form.reset();
      setSubject("general");
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
    <div className="contact-page page-paper">
      <SiteHeader />
      <main>
      <section className="content-shell contact-page__intro" id="main-content" tabIndex={-1}>
        <SectionLabel>{copy.contact}</SectionLabel>
        <h1 className="editorial-title">{(language === "fr" ? formConfig?.titleFr : formConfig?.titleNl) || copy.title}</h1>
      </section>
      <section className="content-shell contact-layout">
        <div className="contact-cards">
          <article>
            <SectionLabel>{copy.address}</SectionLabel>
            <h2>{clinicConfig.hasAddress ? <>{clinicConfig.addressLine1}<br />{clinicConfig.postalCity}</> : copy.addressPending}</h2>
            <dl className="contact-details">
              <div><dt>{copy.phoneLabel}</dt><dd>{clinicConfig.hasPhone ? <a href={`tel:${clinicConfig.phone}`}>{clinicConfig.phoneDisplay}</a> : copy.contactPending}</dd></div>
              <div><dt>{copy.emailLabel}</dt><dd>{clinicConfig.email ? <a href={`mailto:${clinicConfig.email}`}>{clinicConfig.email}</a> : copy.contactPending}</dd></div>
              <div><dt>{copy.urgencyLabel}</dt><dd>{clinicConfig.hasPhone && clinicConfig.emergency[language] ? <a href={`tel:${clinicConfig.phone}`}>{clinicConfig.emergency[language]}</a> : copy.contactPending}</dd></div>
            </dl>
            {clinicConfig.mapUrl && <a className="contact-directions" href={clinicConfig.mapUrl} target="_blank" rel="noreferrer">{copy.directions}<span aria-hidden="true">→</span></a>}
          </article>
          <article>
            <SectionLabel>{copy.hours}</SectionLabel>
            {hours.map(([day, time]) => <p key={day}><span>{day}</span><b>{time}</b></p>)}
          </article>
        </div>
        <div className="contact-right">
          <form className="contact-form" onSubmit={submitContact} aria-busy={submissionState === "sending"}>
            <div className="contact-form__grid">
              {configuredFields ? configuredFields.map((field) => {
                if (field.key === "name") return <div className="form-field" key={field.key}><label htmlFor="contact-name">{fieldLabel(field, copy.name)}</label><input id="contact-name" name="name" required={field.required} placeholder={fieldPlaceholder(field)} autoComplete="name" /></div>;
                if (field.key === "email") return <div className="form-field" key={field.key}><label htmlFor="contact-email">{fieldLabel(field, copy.email)}</label><input id="contact-email" name="email" type="email" required={field.required} placeholder={fieldPlaceholder(field)} autoComplete="email" /></div>;
                if (field.key === "phone") return <div className="form-field" key={field.key}><label htmlFor="contact-phone">{fieldLabel(field, copy.phoneLabel)}</label><input id="contact-phone" name="phone" type="tel" required={field.required} placeholder={fieldPlaceholder(field)} autoComplete="tel" /></div>;
                if (field.key === "subject") return <div className="form-field contact-form__subject" key={field.key}><label htmlFor="contact-subject">{fieldLabel(field, copy.subject)}</label><select id="contact-subject" name="subject" required={field.required} value={subject} onChange={(event) => setSubject(event.target.value)}><option value="general">{copy.subjects.general}</option><option value="file">{copy.subjects.file}</option><option value="transfer">{copy.subjects.transfer}</option></select></div>;
                if (field.key === "message") return <div className="form-field contact-form__message" key={field.key}><label htmlFor="contact-message">{fieldLabel(field, copy.message)}</label><textarea id="contact-message" name="message" required={field.required} placeholder={fieldPlaceholder(field)} /></div>;
                return null;
              }) : (
                <>
                  <div className="form-field"><label htmlFor="contact-name">{copy.name}</label><input id="contact-name" name="name" required autoComplete="name" /></div>
                  <div className="form-field"><label htmlFor="contact-email">{copy.email}</label><input id="contact-email" name="email" type="email" required autoComplete="email" /></div>
                  <div className="form-field contact-form__subject"><label htmlFor="contact-subject">{copy.subject}</label><select id="contact-subject" name="subject" value={subject} onChange={(event) => setSubject(event.target.value)}><option value="general">{copy.subjects.general}</option><option value="file">{copy.subjects.file}</option><option value="transfer">{copy.subjects.transfer}</option></select></div>
                  <div className="form-field contact-form__message"><label htmlFor="contact-message">{copy.message}</label><textarea id="contact-message" name="message" required /></div>
                </>
              )}
            </div>
            <div className="contact-form__submit">
              <button type="submit" className="button-link button-link--green" disabled={submissionState === "sending" || formConfig?.enabled === false}>{submissionState === "sending" ? copy.sending : configuredSubmitLabel || copy.send}<span aria-hidden="true">→</span></button>
              <p role="status" aria-live="polite">{submissionState === "idle" ? configuredDescription || copy.response : copy[submissionState]}</p>
            </div>
          </form>

          <section className="contact-faq" id="faq">
            <SectionLabel>{copy.faqTitle}</SectionLabel>
            <div>
              {copy.faqs.map(([question, answer]) => (
                <details key={question}>
                  <summary>{question}<span aria-hidden="true">⌄</span></summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </section>
      </main>
      <SiteFooter />
    </div>
  );
}
