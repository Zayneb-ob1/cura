"use client";

import { FormEvent, useEffect, useState } from "react";
import { SectionLabel } from "@/components/buttons";
import { useLanguage } from "@/components/language-provider";
import { ContactFormSection } from "@/components/contact-form-section";
import { PageCta, PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useSiteSettings } from "@/components/site-settings-provider";
import { treatmentsByLanguage } from "@/lib/content";

const pageCopy = {
  fr: {
    heroLine1: "PRENDRE RENDEZ-VOUS CHEZ", heroLine2: "CURA",
    heroCopy: "Bénéficiez de soins dentaires personnalisés et d’une qualité supérieure, adaptés à vos besoins.",
    introTitle: "Prendre rendez-vous chez Cura",
    introText: ["Parce que chaque patient est différent, il est important de déterminer avec justesse votre besoin et d’adapter nos soins.", "Si vous souhaitez obtenir un devis, vous devez d’abord vous rendre au cabinet pour que nous évaluions ensemble l’intervention nécessaire.", "Pour cela, contactez-nous par e-mail, par téléphone, ou remplissez le formulaire ci-dessous pour convenir d’un rendez-vous.", "Nous avons hâte d’échanger avec vous."],
    callClinic: "Appeler la clinique", sendMail: "Envoyer un e-mail", bookOnline: "Réserver en ligne", bookNow: "Réservez maintenant",
    reasonsTitle: "Pour quelles raisons prendre rendez-vous ?",
    reasonsIntro: "Chez Cura, nous proposons une prise en charge personnalisée pour préserver votre santé bucco-dentaire et sublimer votre sourire.",
    reasons: ["Soins dentaires courants : consultations, détartrage, extractions et endodontie.", "Esthétique du sourire : blanchiment et facettes dentaires.", "Orthodontie et prothèses : appareils, gouttières et couronnes.", "Implantologie : implants dentaires et soins gingivaux.", "Bilans spécialisés : bilans parodontaux et orthodontiques.", "Suivi et deuxième avis : évaluation et conseils personnalisés."],
    alsoTitle: "Vous pouvez également prendre rendez-vous pour",
    also: ["Traumatisme dentaire", "Douleur et rage de dents", "Hémorragie dentaire"],
    alsoCopy: "Nous mettons tout en œuvre pour vous recevoir dans la journée et procéder aux premiers soins indispensables pour soulager la douleur et préserver votre capital dentaire.",
    urgent: "Voir la page urgences",
    ctaTitle: <>Pour une évaluation personnalisée<br />et un devis sur-mesure</>, ctaCopy: "Réservez en ligne en deux minutes. Vous recevez une confirmation sous 24 h.", ctaButton: "Prendre rendez-vous",
    label: "Prendre rendez-vous", title: "Réservez votre place en deux minutes.", intro: "Choisissez le motif, donnez-nous vos coordonnées et indiquez vos disponibilités. Nous confirmons sous 24 h.",
    appointment: "Le rendez-vous", care: "Soin demandé", unknown: "Je ne sais pas encore", day: "Jour préféré", time: "Moment", morning: "Matin", afternoon: "Après-midi", any: "Sans préférence",
    details: "Vos coordonnées", firstName: "Prénom", lastName: "Nom", email: "E-mail", phone: "Téléphone", note: "Une information utile", placeholder: "Douleur, appréhension, mobilité réduite…",
    consent: "J’accepte que le cabinet utilise ces informations pour traiter ma demande.", send: "Envoyer ma demande", sending: "Envoi en cours…", success: "Votre demande de rendez-vous a bien été envoyée. Nous vous confirmerons l’heure sous 24 h.", error: "Impossible d’envoyer votre demande pour le moment. Veuillez réessayer.",
    confirmation: "Confirmation", next: "Ce qui se passe ensuite", nextCopy: "Nous vous rappelons ou vous écrivons sous 24 h pour confirmer l’heure exacte.", address: "Adresse", addressPending: "Coordonnées à confirmer", hours: "Horaires",
  },
  nl: {
    heroLine1: "EEN AFSPRAAK MAKEN BIJ", heroLine2: "CURA",
    heroCopy: "Geniet van persoonlijke tandzorg van hoge kwaliteit, afgestemd op uw noden.",
    introTitle: "Een afspraak maken bij Cura",
    introText: ["Omdat elke patiënt anders is, is het belangrijk om uw noden juist in te schatten en onze zorg daarop af te stemmen.", "Wenst u een offerte? Kom dan eerst langs in de praktijk, zodat we samen de nodige behandeling kunnen bepalen.", "Contacteer ons daarvoor per e-mail of telefoon, of vul het formulier hieronder in om een afspraak te maken.", "We kijken ernaar uit u te ontmoeten."],
    callClinic: "De kliniek bellen", sendMail: "Een e-mail sturen", bookOnline: "Online reserveren", bookNow: "Reserveer nu",
    reasonsTitle: "Waarvoor kunt u een afspraak maken?",
    reasonsIntro: "Bij Cura bieden we persoonlijke zorg om uw mondgezondheid te bewaren en uw glimlach te verfraaien.",
    reasons: ["Dagelijkse tandzorg: consultaties, tandsteenverwijdering, extracties en endodontie.", "Esthetiek van de glimlach: bleken en facetten.", "Orthodontie en prothesen: beugels, aligners en kronen.", "Implantologie: tandimplantaten en tandvleeszorg.", "Gespecialiseerde onderzoeken: parodontale en orthodontische bilans.", "Opvolging en tweede advies: beoordeling en persoonlijk advies."],
    alsoTitle: "U kunt ook een afspraak maken voor",
    also: ["Tandtrauma", "Pijn en hevige tandpijn", "Bloeding in de mond"],
    alsoCopy: "We doen er alles aan om u dezelfde dag te ontvangen en de eerste zorg te geven om de pijn te verlichten en uw tanden te bewaren.",
    urgent: "Naar de spoedpagina",
    ctaTitle: <>Voor een persoonlijke beoordeling<br />en een offerte op maat</>, ctaCopy: "Boek online in twee minuten. U ontvangt binnen 24 uur een bevestiging.", ctaButton: "Maak een afspraak",
    label: "Maak een afspraak", title: "Reserveer uw afspraak in twee minuten.", intro: "Kies de reden, vul uw gegevens in en geef aan wanneer u beschikbaar bent. We bevestigen binnen 24 uur.",
    appointment: "De afspraak", care: "Gewenste behandeling", unknown: "Ik weet het nog niet", day: "Voorkeursdag", time: "Moment", morning: "Voormiddag", afternoon: "Namiddag", any: "Geen voorkeur",
    details: "Uw gegevens", firstName: "Voornaam", lastName: "Naam", email: "E-mail", phone: "Telefoon", note: "Nuttige informatie", placeholder: "Pijn, bezorgdheid, beperkte mobiliteit…",
    consent: "Ik ga ermee akkoord dat de praktijk deze gegevens gebruikt om mijn aanvraag te behandelen.", send: "Mijn aanvraag versturen", sending: "Bezig met versturen…", success: "Uw afspraakaanvraag is goed verzonden. We bevestigen het tijdstip binnen 24 uur.", error: "Uw aanvraag kan momenteel niet worden verzonden. Probeer het opnieuw.",
    confirmation: "Bevestiging", next: "Wat gebeurt er daarna?", nextCopy: "We bellen of mailen u binnen 24 uur om het exacte tijdstip te bevestigen.", address: "Adres", addressPending: "Contactgegevens te bevestigen", hours: "Openingsuren",
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

const appointmentFieldKeys = new Set(["care", "day", "time", "firstName", "lastName", "email", "phone", "note", "consent"]);
const appointmentDetailsKeys = new Set(["care", "day", "time"]);
const patientDetailsKeys = new Set(["firstName", "lastName", "email", "phone", "note"]);

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

function limitDateToFourDigitYear(event: FormEvent<HTMLInputElement>) {
  const input = event.currentTarget;
  const normalized = input.value.replace(/^(\d{4})\d+(-\d{2}-\d{2})$/, "$1$2");
  if (normalized !== input.value) input.value = normalized;
}

/** Appointment page of Figma frame 8; the contact page shows it with the contact form added. */
export function AppointmentView({ withContactForm = false }: { withContactForm?: boolean }) {
  const { language } = useLanguage();
  const clinicConfig = useSiteSettings();
  const copy = pageCopy[language];
  const treatments = treatmentsByLanguage[language];
  const [care, setCare] = useState("");
  const [submissionState, setSubmissionState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [formConfig, setFormConfig] = useState<EditableForm | null>(null);

  const configuredFields = formConfig
    ? [...formConfig.fields]
        .filter((field) => field.visible && appointmentFieldKeys.has(field.key))
        .sort((first, second) => first.order - second.order)
    : null;
  const appointmentFields = configuredFields?.filter((field) => appointmentDetailsKeys.has(field.key));
  const patientFields = configuredFields?.filter((field) => patientDetailsKeys.has(field.key));
  const consentField = configuredFields?.find((field) => field.key === "consent");
  const fieldLabel = (field: EditableField, fallback: string) => localizedFieldValue(field, language, "label") || fallback;
  const fieldPlaceholder = (field: EditableField) => localizedFieldValue(field, language, "placeholder") || undefined;
  const configuredDescription = language === "fr" ? formConfig?.descriptionFr : formConfig?.descriptionNl;
  const configuredSubmitLabel = language === "fr" ? formConfig?.submitLabelFr : formConfig?.submitLabelNl;

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadFormConfig() {
      try {
        const response = await fetch("/api/forms/appointment", { cache: "no-store", signal: controller.signal });
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

  function renderAppointmentField(field: EditableField) {
    if (field.key === "care") return <div className="form-field appointment-form__wide" key={field.key}><label htmlFor="care">{fieldLabel(field, copy.care)}</label><select id="care" name="care" required={field.required} value={care} onChange={(event) => setCare(event.target.value)}><option value="">{fieldPlaceholder(field) || copy.unknown}</option>{treatments.map((item) => <option key={item.number} value={item.number}>{item.name}</option>)}</select></div>;
    if (field.key === "day") return <div className="form-field" key={field.key}><label htmlFor="preferred-day">{fieldLabel(field, copy.day)}</label><input id="preferred-day" name="day" type="date" max="9999-12-31" onInput={limitDateToFourDigitYear} required={field.required} /></div>;
    if (field.key === "time") return <div className="form-field" key={field.key}><label htmlFor="preferred-time">{fieldLabel(field, copy.time)}</label><select id="preferred-time" name="time" required={field.required}><option>{copy.morning}</option><option>{copy.afternoon}</option><option>{copy.any}</option></select></div>;
    if (field.key === "firstName") return <div className="form-field" key={field.key}><label htmlFor="first-name">{fieldLabel(field, copy.firstName)}</label><input id="first-name" name="firstName" required={field.required} placeholder={fieldPlaceholder(field)} autoComplete="given-name" /></div>;
    if (field.key === "lastName") return <div className="form-field" key={field.key}><label htmlFor="last-name">{fieldLabel(field, copy.lastName)}</label><input id="last-name" name="lastName" required={field.required} placeholder={fieldPlaceholder(field)} autoComplete="family-name" /></div>;
    if (field.key === "email") return <div className="form-field" key={field.key}><label htmlFor="appointment-email">{fieldLabel(field, copy.email)}</label><input id="appointment-email" name="email" type="email" required={field.required} placeholder={fieldPlaceholder(field)} autoComplete="email" /></div>;
    if (field.key === "phone") return <div className="form-field" key={field.key}><label htmlFor="appointment-phone">{fieldLabel(field, copy.phone)}</label><input id="appointment-phone" name="phone" type="tel" required={field.required} placeholder={fieldPlaceholder(field)} autoComplete="tel" /></div>;
    if (field.key === "note") return <div className="form-field appointment-form__wide" key={field.key}><label htmlFor="note">{fieldLabel(field, copy.note)}</label><textarea id="note" name="note" required={field.required} placeholder={fieldPlaceholder(field) || copy.placeholder} /></div>;
    return null;
  }

  return (
    <div className="appointment-page">
      <SiteHeader />
      <main>
      <PageHero title={copy.heroLine1} accent={copy.heroLine2} text={copy.heroCopy} visual="none" />

      <section className="booking-intro">
        <div className="content-shell split-intro">
          <div>
            <SectionLabel>{copy.label}</SectionLabel>
            <h2>{copy.introTitle}</h2>
            <div className="booking-intro__actions">
              {clinicConfig.hasPhone && <a className="button-link button-link--green" href={`tel:${clinicConfig.phone}`}>{copy.callClinic}</a>}
              {clinicConfig.email && <a className="button-link button-link--green" href={`mailto:${clinicConfig.email}`}>{copy.sendMail}</a>}
              <a className="button-link button-link--green" href="#reserver">{copy.bookOnline}</a>
            </div>
          </div>
          <div className="booking-intro__text">
            {(configuredDescription ? [configuredDescription] : copy.introText).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </div>
      </section>

      <section className="content-shell appointment-layout" id="reserver">
        <h2 className="appointment-layout__title">{(language === "fr" ? formConfig?.titleFr : formConfig?.titleNl) || copy.bookNow}</h2>
        <form className="appointment-form" onSubmit={submitAppointment} aria-busy={submissionState === "sending"}>
          <div className="appointment-form__section">
            <span aria-hidden="true">01</span>
            <div>
              <SectionLabel>{copy.appointment}</SectionLabel>
              <div className="appointment-form__grid">
                {appointmentFields ? appointmentFields.map(renderAppointmentField) : (
                  <>
                    <div className="form-field appointment-form__wide"><label htmlFor="care">{copy.care}</label><select id="care" name="care" value={care} onChange={(event) => setCare(event.target.value)}><option value="">{copy.unknown}</option>{treatments.map((item) => <option key={item.number} value={item.number}>{item.name}</option>)}</select></div>
                    <div className="form-field"><label htmlFor="preferred-day">{copy.day}</label><input id="preferred-day" name="day" type="date" max="9999-12-31" onInput={limitDateToFourDigitYear} required /></div>
                    <div className="form-field"><label htmlFor="preferred-time">{copy.time}</label><select id="preferred-time" name="time"><option>{copy.morning}</option><option>{copy.afternoon}</option><option>{copy.any}</option></select></div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="appointment-form__section">
            <span aria-hidden="true">02</span>
            <div>
              <SectionLabel>{copy.details}</SectionLabel>
              <div className="appointment-form__grid">
                {patientFields ? patientFields.map(renderAppointmentField) : (
                  <>
                    <div className="form-field"><label htmlFor="first-name">{copy.firstName}</label><input id="first-name" name="firstName" required autoComplete="given-name" /></div>
                    <div className="form-field"><label htmlFor="last-name">{copy.lastName}</label><input id="last-name" name="lastName" required autoComplete="family-name" /></div>
                    <div className="form-field"><label htmlFor="appointment-email">{copy.email}</label><input id="appointment-email" name="email" type="email" required autoComplete="email" /></div>
                    <div className="form-field"><label htmlFor="appointment-phone">{copy.phone}</label><input id="appointment-phone" name="phone" type="tel" required autoComplete="tel" /></div>
                    <div className="form-field appointment-form__wide"><label htmlFor="note">{copy.note}</label><textarea id="note" name="note" placeholder={copy.placeholder} /></div>
                  </>
                )}
              </div>
            </div>
          </div>
          {configuredFields ? consentField && <label className="appointment-consent"><input type="checkbox" name="consent" required={consentField.required} /> {fieldLabel(consentField, copy.consent)}</label> : <label className="appointment-consent"><input type="checkbox" name="consent" required /> {copy.consent}</label>}
          <button type="submit" className="button-link button-link--green" disabled={submissionState === "sending" || formConfig?.enabled === false}>{submissionState === "sending" ? copy.sending : configuredSubmitLabel || copy.send}</button>
          {submissionState !== "idle" && <p className="form-status" role="status" aria-live="polite">{copy[submissionState]}</p>}
        </form>
      </section>

      <section className="info-rows info-rows--paper">
        <div className="content-shell">
          <article className="info-row">
            <h2>{copy.reasonsTitle}</h2>
            <div><p>{copy.reasonsIntro}</p><ul>{copy.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div>
          </article>
          <article className="info-row">
            <h2>{copy.alsoTitle}</h2>
            <div><ul>{copy.also.map((item) => <li key={item}>{item}</li>)}</ul><p>{copy.alsoCopy}</p><a className="info-row__link" href="/urgences">{copy.urgent} →</a></div>
          </article>
        </div>
      </section>

      {withContactForm && <ContactFormSection />}

      <PageCta title={copy.ctaTitle} text={copy.ctaCopy} action={{ href: "#reserver", label: copy.ctaButton }} />
      </main>
      <SiteFooter />
    </div>
  );
}
