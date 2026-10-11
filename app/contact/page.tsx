"use client";

import { FormEvent, useEffect, useState } from "react";
import { SectionLabel } from "@/components/buttons";
import { useLanguage } from "@/components/language-provider";
import { PageCta, PageHero } from "@/components/page-hero";
import { ReviewsSection } from "@/components/reviews-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useSiteSettings } from "@/components/site-settings-provider";
import { formatClinicHour } from "@/lib/site-config";

const pageCopy = {
  fr: {
    contact: "Contact", title: "Où nous trouver.",
    heroLine1: "CLINIQUE DENTAIRE CURA", heroIn: "À", heroLine2: "CONTACTEZ-NOUS…",
    heroCopy: "Vous souhaitez recevoir des informations complémentaires ou nous poser des questions ? N’hésitez pas à nous contacter.",
    appointment: "Prendre rendez-vous", teamLabel: "La clinique", teamTitle: "Une équipe à votre écoute !",
    teamCopy: "Vous souhaitez avoir plus de renseignements ou prendre un rendez-vous ? Posez votre question à l’équipe de Cura, n’hésitez pas à nous contacter.",
    addressCard: "Adresse du cabinet", contactCard: "Nous contacter", practicalCard: "Infos pratiques",
    call: "Téléphonez-nous", writeUs: "Écrivez-nous", hoursPending: "Horaires à confirmer", practicalCopy: "Avec ou sans rendez-vous préalable : appelez-nous pour connaître les disponibilités.",
    formTitle: "Formulaire de contact",
    reviewsLabel: "Avis", reviewsTitle: "CE QU’ON DIT À PROPOS DE NOUS", noReviews: "Aucun avis vérifié n’est publié pour le moment.", loadingReviews: "Chargement des avis…", reviewsError: "Les avis ne peuvent pas être chargés pour le moment.",
    ctaTitle: "Nous sommes prêts quand vous l’êtes.", ctaCopy: "Réservez en ligne en deux minutes. Vous recevez une confirmation sous 24 h.",
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
    heroLine1: "TANDHEELKUNDIGE KLINIEK CURA", heroIn: "IN", heroLine2: "NEEM CONTACT OP…",
    heroCopy: "Wenst u meer informatie of heeft u een vraag? Aarzel niet om ons te contacteren.",
    appointment: "Maak een afspraak", teamLabel: "De kliniek", teamTitle: "Een team dat naar u luistert!",
    teamCopy: "Wenst u meer informatie of wilt u een afspraak maken? Stel uw vraag aan het Cura-team, wij helpen u graag verder.",
    addressCard: "Adres van de praktijk", contactCard: "Contacteer ons", practicalCard: "Praktische info",
    call: "Bel ons", writeUs: "Schrijf ons", hoursPending: "Openingsuren te bevestigen", practicalCopy: "Met of zonder afspraak: bel ons om de beschikbaarheden te kennen.",
    formTitle: "Contactformulier",
    reviewsLabel: "Beoordelingen", reviewsTitle: "WAT MEN OVER ONS ZEGT", noReviews: "Er zijn momenteel geen geverifieerde beoordelingen gepubliceerd.", loadingReviews: "Beoordelingen laden…", reviewsError: "De beoordelingen kunnen momenteel niet worden geladen.",
    ctaTitle: "Wij staan klaar wanneer u dat bent.", ctaCopy: "Boek online in twee minuten. U ontvangt binnen 24 uur een bevestiging.",
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
  const clinicConfig = useSiteSettings();
  const copy = pageCopy[language];
  const hours = (language === "fr" ? ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] : ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"])
    .map((day, index) => [day, formatClinicHour(clinicConfig.hours[index], language)] as const);
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
    <div className="contact-page">
      <SiteHeader />
      <main>
      <PageHero
        title={clinicConfig.city ? `${copy.heroLine1} ${copy.heroIn} ${clinicConfig.city.toUpperCase()}` : copy.heroLine1}
        accent={copy.heroLine2}
        text={copy.heroCopy}
        action={{ href: "/rendez-vous", label: copy.appointment }}
      />

      <section className="contact-team">
        <div className="content-shell">
          <div className="split-intro">
            <div>
              <SectionLabel>{copy.teamLabel}</SectionLabel>
              <h2>{(language === "fr" ? formConfig?.titleFr : formConfig?.titleNl) || copy.teamTitle}</h2>
            </div>
            <p>{copy.teamCopy}</p>
          </div>
          <div className="info-cards">
            <article>
              <h3>{copy.addressCard}</h3>
              <p>{clinicConfig.hasAddress ? <>{clinicConfig.addressLine1}<br />{clinicConfig.postalCity}</> : copy.addressPending}</p>
              {clinicConfig.mapUrl && <a className="info-cards__button" href={clinicConfig.mapUrl} target="_blank" rel="noreferrer">{copy.directions}</a>}
            </article>
            <article>
              <h3>{copy.contactCard}</h3>
              <p>
                {clinicConfig.hasPhone ? <a href={`tel:${clinicConfig.phone}`}>{clinicConfig.phoneDisplay}</a> : `${copy.phoneLabel} : ${copy.contactPending}`}
                <br />
                {clinicConfig.email ? <a href={`mailto:${clinicConfig.email}`}>{clinicConfig.email}</a> : `${copy.emailLabel} : ${copy.contactPending}`}
              </p>
              {clinicConfig.hasPhone ? <a className="info-cards__button" href={`tel:${clinicConfig.phone}`}>{copy.call}</a> : <a className="info-cards__button" href="#contact-form">{copy.writeUs}</a>}
            </article>
            <article>
              <h3>{copy.practicalCard}</h3>
              <dl className="info-cards__hours">
                {clinicConfig.hours.some(Boolean) && hours.map(([day, time]) => <div key={day}><dt>{day}</dt><dd>{time}</dd></div>)}
              </dl>
              {!clinicConfig.hours.some(Boolean) && <p>{copy.hoursPending}</p>}
              <p>{copy.practicalCopy}</p>
              <a className="info-cards__button" href="/rendez-vous">{copy.appointment}</a>
            </article>
          </div>
        </div>
      </section>

      <section className="content-shell contact-layout contact-layout--form" id="contact-form">
        <h2 className="contact-layout__title">{copy.formTitle}</h2>
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

      <ReviewsSection label={copy.reviewsLabel} title={copy.reviewsTitle} messages={copy} />
      <PageCta title={copy.ctaTitle} text={copy.ctaCopy} action={{ href: "/rendez-vous", label: copy.appointment }} />
      </main>
      <SiteFooter />
    </div>
  );
}
