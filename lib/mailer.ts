import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "127.0.0.1",
  port: Number(process.env.SMTP_PORT ?? 25),
  secure: false,
  tls: { rejectUnauthorized: false },
});

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
  await transport.sendMail({
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

function genererICS(opts: {
  uid: string; start: Date; durationMin: number; summary: string;
  description: string; location: string; organizer: string; attendee: string;
}): string {
  const end = new Date(opts.start.getTime() + opts.durationMin * 60000);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Curadental//RDV//FR", "CALSCALE:GREGORIAN", "METHOD:REQUEST",
    "BEGIN:VEVENT", `UID:${opts.uid}`, `DTSTAMP:${stamp}`,
    `DTSTART:${fmtLocal(opts.start)}`, `DTEND:${fmtLocal(end)}`,
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
  opts: { day?: string; time?: string; duration?: number; message?: string },
): Promise<void> {
  const to = String(rdv.email ?? "");
  if (!to) return;
  const prenom = String(rdv.firstName ?? rdv.first_name ?? "");
  const nom = String(rdv.lastName ?? rdv.last_name ?? "");
  const soin = String(rdv.care ?? "");
  const jour = opts.day || String(rdv.day ?? "");
  const heure = opts.time || "";
  const duree = Number(opts.duration ?? rdv.duration_min ?? 30);
  const jourFr = jour ? jour.slice(0, 10).split("-").reverse().join("/") : "";

  let sujet = ""; let titre = ""; let corps = ""; let couleur = "#1ba098";
  const attachments: Array<{ filename: string; content: string; contentType: string }> = [];

  if (statut === "confirmed") {
    sujet = `Votre rendez-vous est confirmé — ${jourFr} à ${heure}`;
    titre = "Rendez-vous confirmé";
    corps = `<p>Bonjour ${prenom} ${nom},</p>
      <p>Votre rendez-vous ${soin ? `pour <b>${soin}</b> ` : ""}est <b>confirmé</b> :</p>
      <p style="font-size:20px;color:#0b3d5c"><b>${jourFr} à ${heure}</b> <span style="color:#888;font-size:14px">(${duree} min)</span></p>
      <p>Une invitation est jointe à cet email : ouvrez-la pour l'ajouter à votre agenda.</p>
      ${opts.message ? `<p>${opts.message}</p>` : ""}`;
    if (jour && heure) {
      const start = new Date(`${jour.slice(0, 10)}T${heure}:00`);
      attachments.push({
        filename: "rendez-vous.ics",
        content: genererICS({
          uid: `${rdv.id ?? Date.now()}@curadental.be`, start, durationMin: duree,
          summary: `RDV Curadental${soin ? " - " + soin : ""}`, description: `Rendez-vous ${soin}`,
          location: "Cabinet Curadental", organizer: CONTACT, attendee: to,
        }),
        contentType: "text/calendar; method=REQUEST; charset=UTF-8",
      });
    }
  } else if (statut === "proposed") {
    couleur = "#d97706";
    sujet = `Nouveau créneau proposé — ${jourFr} à ${heure}`;
    titre = "Nouveau créneau proposé";
    corps = `<p>Bonjour ${prenom} ${nom},</p>
      <p>Le créneau demandé n'est pas disponible. Nous vous proposons&nbsp;:</p>
      <p style="font-size:20px;color:#0b3d5c"><b>${jourFr} à ${heure}</b></p>
      <p>${opts.message || "Merci de nous confirmer si cela vous convient (répondez à cet email)."}</p>`;
  } else {
    couleur = "#dc2626";
    sujet = "Votre demande de rendez-vous";
    titre = "Rendez-vous annulé";
    corps = `<p>Bonjour ${prenom} ${nom},</p>
      <p>Votre demande de rendez-vous a été annulée.</p>
      <p>${opts.message || "N'hésitez pas à reprendre rendez-vous quand vous le souhaitez."}</p>`;
  }

  const html = `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:auto">
    <div style="background:${couleur};color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
      <h2 style="margin:0;font-size:20px">${titre}</h2></div>
    <div style="border:1px solid #eee;border-top:0;padding:24px;border-radius:0 0 12px 12px;color:#222">
      ${corps}
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
      <p style="color:#888;font-size:13px">Cabinet dentaire <b>Curadental</b> · <a href="https://curadental.be" style="color:${couleur}">curadental.be</a></p>
    </div></div>`;

  await transport.sendMail({
    from: `"Cabinet Curadental" <${CONTACT}>`,
    to,
    cc: statut === "confirmed" ? CONTACT : undefined,
    replyTo: CONTACT,
    subject: sujet,
    text: `${titre}\n\n${corps.replace(/<[^>]+>/g, "").replace(/\n\s+/g, "\n").trim()}`,
    html,
    attachments,
  });
}
