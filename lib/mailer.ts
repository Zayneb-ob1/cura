import nodemailer from "nodemailer";

function booleanEnvironmentValue(name: string, fallback: boolean) {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) return fallback;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  throw new Error(`${name} must be true or false`);
}

function mailTransport() {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) throw new Error("SMTP is not configured: SMTP_HOST is required");

  const configuredPort = process.env.SMTP_PORT?.trim();
  const secure = booleanEnvironmentValue("SMTP_SECURE", configuredPort === "465");
  const port = configuredPort ? Number(configuredPort) : secure ? 465 : 587;
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("SMTP_PORT must be a valid TCP port");
  }

  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  if (Boolean(user) !== Boolean(password)) {
    throw new Error("SMTP_USER and SMTP_PASSWORD must be configured together");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && password ? { user, pass: password } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    tls: {
      rejectUnauthorized: booleanEnvironmentValue("SMTP_TLS_REJECT_UNAUTHORIZED", true),
    },
  });
}

const CONTACT = process.env.CONTACT_EMAIL ?? "contact@curadental.be";

interface ContactData {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  language?: string;
  [cle: string]: unknown;
}

export async function envoyerContact(data: ContactData): Promise<void> {
  const esc = (v?: string) => String(v ?? "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `
    <h2 style="font-family:sans-serif">Nouveau message de contact — curadental.be</h2>
    <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif">
      <tr><td style="background:#f4f6f8"><b>Nom</b></td><td>${esc(data.name)}</td></tr>
      <tr><td style="background:#f4f6f8"><b>Email</b></td><td>${esc(data.email)}</td></tr>
      <tr><td style="background:#f4f6f8"><b>Téléphone</b></td><td>${esc(data.phone)}</td></tr>
      <tr><td style="background:#f4f6f8"><b>Sujet</b></td><td>${esc(data.subject)}</td></tr>
      <tr><td style="background:#f4f6f8"><b>Langue</b></td><td>${esc(data.language)}</td></tr>
    </table>
    <p style="white-space:pre-wrap;font-family:sans-serif">${esc(data.message)}</p>
  `;
  await mailTransport().sendMail({
    from: `"Site Curadental" <${CONTACT}>`,
    to: CONTACT,
    replyTo: data.email || undefined,
    subject: `Contact site${data.subject ? " — " + data.subject : ""}`,
    text:
      `Nom: ${data.name ?? ""}\n` +
      `Email: ${data.email ?? ""}\n` +
      `Téléphone: ${data.phone ?? ""}\n` +
      `Sujet: ${data.subject ?? ""}\n` +
      `Langue: ${data.language ?? ""}\n\n` +
      `${data.message ?? ""}`,
    html,
  });
}


function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function fmtLocal(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

const INTERNAL_CONFIRMATION_TEXT = /(?:\bTEST(?:[\s_-]+FLOW)?[\s_-]*\d*\b|\bE2E\b|\bend[\s-]+to[\s-]+end(?:\s+only)?\b|\bdebug\b|\baudit\b)/i;

function patientFacingMessage(value?: string) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !INTERNAL_CONFIRMATION_TEXT.test(line))
    .join("\n");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeGoogleCalendarEventUrl(value?: string) {
  if (!value) return "";
  try {
    const url = new URL(value);
    const allowedHosts = new Set(["calendar.google.com", "www.google.com"]);
    return url.protocol === "https:" && allowedHosts.has(url.hostname) ? url.toString() : "";
  } catch {
    return "";
  }
}

function genererICS(opts: {
  uid: string; start: Date; durationMin: number; summary: string;
  description: string; location: string; organizer: string; attendee: string; timeZone: string;
}): string {
  const end = new Date(opts.start.getTime() + opts.durationMin * 60000);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Curadental//RDV//FR", "CALSCALE:GREGORIAN", "METHOD:REQUEST",
    `X-WR-TIMEZONE:${opts.timeZone}`,
    "BEGIN:VEVENT", `UID:${opts.uid}`, `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${opts.timeZone}:${fmtLocal(opts.start)}`, `DTEND;TZID=${opts.timeZone}:${fmtLocal(end)}`,
    `SUMMARY:${opts.summary}`, `DESCRIPTION:${opts.description}`, `LOCATION:${opts.location}`,
    `ORGANIZER;CN=Cabinet Curadental:mailto:${opts.organizer}`,
    `ATTENDEE;CN=${opts.attendee};RSVP=TRUE:mailto:${opts.attendee}`,
    "STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

interface RdvData {
  id?: string | number;
  firstName?: string; first_name?: string;
  lastName?: string; last_name?: string;
  email?: string; care?: string; day?: string;
  duration_min?: number;
  [cle: string]: unknown;
}

type StatutRdv = "confirmed" | "proposed" | "cancelled";

export async function envoyerStatutRdv(
  rdv: RdvData,
  statut: StatutRdv,
  opts: { day?: string; time?: string; duration?: number; message?: string; calendarEventUrl?: string },
): Promise<void> {
  const to = String(rdv.email ?? "");
  if (!to) return;
  const soin = String(rdv.care ?? "");
  const jour = opts.day || String(rdv.day ?? "");
  const heure = opts.time || "";
  const duree = Number(opts.duration ?? rdv.duration_min ?? 30);
  const jourFr = jour ? jour.slice(0, 10).split("-").reverse().join("/") : "";
  const messagePatient = patientFacingMessage(opts.message);
  const calendarEventUrl = safeGoogleCalendarEventUrl(opts.calendarEventUrl);
  if (opts.message?.trim() && !messagePatient) {
    console.info("Internal confirmation text omitted from patient email", { appointmentId: rdv.id });
  }

  const salutationHtml = "Bonjour,";
  const soinHtml = escapeHtml(soin);
  const messageHtml = escapeHtml(messagePatient).replaceAll("\n", "<br>");
  const calendarEventText = calendarEventUrl ? `\n${calendarEventUrl}` : "";

  let sujet = ""; let titre = ""; let corps = ""; let couleur = "#1ba098";
  const attachments: Array<{ filename: string; content: string; contentType: string }> = [];

  if (statut === "confirmed") {
    sujet = `Votre rendez-vous est confirmé — ${jourFr} à ${heure}`;
    titre = "Rendez-vous confirmé";
    corps = `<p>${salutationHtml}</p>
      <p>Votre rendez-vous ${soin ? `pour <b>${soinHtml}</b> ` : ""}est <b>confirmé</b> :</p>
      <p style="font-size:20px;color:#0b3d5c"><b>${jourFr} à ${heure}</b> <span style="color:#888;font-size:14px">(${duree} min)</span></p>
      <p>Une invitation est jointe à cet email : ouvrez-la pour l'ajouter à votre agenda.</p>
      ${calendarEventUrl ? `<p><a href="${escapeHtml(calendarEventUrl)}" style="color:#0b3d5c;font-weight:600">Ouvrir dans Google Agenda</a></p>` : ""}
      ${messageHtml ? `<p>${messageHtml}</p>` : ""}`;
    if (jour && heure) {
      const start = new Date(`${jour.slice(0, 10)}T${heure}:00`);
      attachments.push({
        filename: "rendez-vous.ics",
        content: genererICS({
          uid: `${rdv.id ?? Date.now()}@curadental.be`, start, durationMin: duree,
          summary: `RDV Curadental${soin ? " - " + soin : ""}`, description: `Rendez-vous ${soin}`,
          location: "Cabinet Curadental", organizer: CONTACT, attendee: to,
          timeZone: process.env.GOOGLE_CALENDAR_TIME_ZONE?.trim()
            || process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_TIME_ZONE?.trim()
            || "Europe/Brussels",
        }),
        contentType: "text/calendar; method=REQUEST; charset=UTF-8",
      });
    }
  } else if (statut === "proposed") {
    couleur = "#d97706";
    sujet = `Nouveau créneau proposé — ${jourFr} à ${heure}`;
    titre = "Nouveau créneau proposé";
    corps = `<p>${salutationHtml}</p>
      <p>Le créneau demandé n'est pas disponible. Nous vous proposons&nbsp;:</p>
      <p style="font-size:20px;color:#0b3d5c"><b>${jourFr} à ${heure}</b></p>
      <p>${messageHtml || "Merci de nous confirmer si cela vous convient (répondez à cet email)."}</p>`;
  } else {
    couleur = "#dc2626";
    sujet = "Votre demande de rendez-vous";
    titre = "Rendez-vous annulé";
    corps = `<p>${salutationHtml}</p>
      <p>Votre demande de rendez-vous a été annulée.</p>
      <p>${messageHtml || "N'hésitez pas à reprendre rendez-vous quand vous le souhaitez."}</p>`;
  }

  const html = `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:auto">
    <div style="background:${couleur};color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
      <h2 style="margin:0;font-size:20px">${titre}</h2></div>
    <div style="border:1px solid #eee;border-top:0;padding:24px;border-radius:0 0 12px 12px;color:#222">
      ${corps}
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
      <p style="color:#888;font-size:13px">Cabinet dentaire <b>Curadental</b> · <a href="https://curadental.be" style="color:${couleur}">curadental.be</a></p>
    </div></div>`;

  await mailTransport().sendMail({
    from: `"Cabinet Curadental" <${CONTACT}>`,
    to,
    cc: statut === "confirmed" ? CONTACT : undefined,
    replyTo: CONTACT,
    subject: sujet,
    text: `${titre}\n\n${corps.replace(/<[^>]+>/g, "").replace(/\n\s+/g, "\n").trim()}${calendarEventText}`,
    html,
    attachments,
  });
}
