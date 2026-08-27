import "server-only";

import { createHash, createSign } from "node:crypto";

type CalendarAppointment = {
  id?: string | number;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  care?: string;
  [key: string]: unknown;
};

export type GoogleCalendarSyncResult = {
  configured: boolean;
  synced: boolean;
  eventId?: string;
  eventUrl?: string;
};

function addMinutes(day: string, time: string, durationMin: number) {
  const date = new Date(`${day}T${time}:00Z`);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid appointment date or time");
  date.setUTCMinutes(date.getUTCMinutes() + durationMin);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}T${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}:00`;
}

type ServiceAccountCredentials = {
  clientEmail: string;
  privateKey: string;
  subject?: string;
};

function environmentValue(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function serviceAccountCredentials(): ServiceAccountCredentials | null {
  const rawJson = environmentValue(
    "GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON",
    "GOOGLE_SERVICE_ACCOUNT_JSON",
    "GOOGLE_SERVICE_ACCOUNT_KEY",
    "GOOGLE_APPLICATION_CREDENTIALS_JSON",
    "GOOGLE_CREDENTIALS",
  );
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson) as {
        client_email?: string;
        private_key?: string;
        delegated_subject?: string;
      };
      if (parsed.client_email?.trim() && parsed.private_key?.trim()) {
        return {
          clientEmail: parsed.client_email.trim(),
          privateKey: parsed.private_key.replaceAll("\\n", "\n"),
          subject: parsed.delegated_subject?.trim() || undefined,
        };
      }
    } catch {
      throw new Error("Google Calendar service account configuration is invalid");
    }
  }

  const clientEmail = environmentValue(
    "GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL",
    "GOOGLE_SERVICE_ACCOUNT_EMAIL",
    "GOOGLE_CLIENT_EMAIL",
    "GCP_SERVICE_ACCOUNT_EMAIL",
  );
  const privateKey = environmentValue(
    "GOOGLE_CALENDAR_PRIVATE_KEY",
    "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
    "GOOGLE_PRIVATE_KEY",
    "GCP_PRIVATE_KEY",
  );
  if (!clientEmail || !privateKey) return null;
  return {
    clientEmail,
    privateKey: privateKey.replaceAll("\\n", "\n"),
    subject: environmentValue("GOOGLE_CALENDAR_SERVICE_ACCOUNT_SUBJECT", "GOOGLE_SERVICE_ACCOUNT_SUBJECT"),
  };
}

async function oauthRefreshAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  const payload = await response.json() as { access_token?: string; error?: string; error_description?: string };
  if (!response.ok) {
    const reason = [payload.error, payload.error_description].filter(Boolean).join(": ");
    throw new Error(`Google OAuth token request failed (${response.status})${reason ? `: ${reason}` : ""}`);
  }
  if (!payload.access_token) throw new Error("Google OAuth response did not include an access token");
  return payload.access_token;
}

async function serviceAccountAccessToken(credentials: ServiceAccountCredentials) {
  const now = Math.floor(Date.now() / 1_000);
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const assertionParts = [
    encode({ alg: "RS256", typ: "JWT" }),
    encode({
      iss: credentials.clientEmail,
      scope: "https://www.googleapis.com/auth/calendar",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3_600,
      ...(credentials.subject ? { sub: credentials.subject } : {}),
    }),
  ];
  const unsignedAssertion = assertionParts.join(".");
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedAssertion);
  signer.end();
  const assertion = `${unsignedAssertion}.${signer.sign(credentials.privateKey, "base64url")}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Google service account token request failed (${response.status})`);
  const payload = await response.json() as { access_token?: string };
  if (!payload.access_token) throw new Error("Google service account response did not include an access token");
  return payload.access_token;
}

async function googleAccessToken() {
  const directAccessToken = environmentValue("GOOGLE_CALENDAR_ACCESS_TOKEN", "GOOGLE_ACCESS_TOKEN");
  if (directAccessToken) return directAccessToken;

  let clientId = environmentValue("GOOGLE_CALENDAR_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_CLIENT_ID");
  let clientSecret = environmentValue("GOOGLE_CALENDAR_CLIENT_SECRET", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_CLIENT_SECRET");
  let refreshToken = environmentValue("GOOGLE_CALENDAR_REFRESH_TOKEN", "GOOGLE_OAUTH_REFRESH_TOKEN", "GOOGLE_REFRESH_TOKEN");
  const oauthJson = environmentValue(
    "GOOGLE_CALENDAR_OAUTH_JSON",
    "GOOGLE_CALENDAR_CREDENTIALS",
    "GOOGLE_OAUTH_CREDENTIALS",
  );
  if (oauthJson && (!clientId || !clientSecret || !refreshToken)) {
    try {
      const parsed = JSON.parse(oauthJson) as {
        client_id?: string;
        client_secret?: string;
        refresh_token?: string;
        installed?: { client_id?: string; client_secret?: string; refresh_token?: string };
        web?: { client_id?: string; client_secret?: string; refresh_token?: string };
      };
      const nested = parsed.installed ?? parsed.web;
      clientId ||= parsed.client_id?.trim() || nested?.client_id?.trim();
      clientSecret ||= parsed.client_secret?.trim() || nested?.client_secret?.trim();
      refreshToken ||= parsed.refresh_token?.trim() || nested?.refresh_token?.trim();
    } catch {
      throw new Error("Google Calendar OAuth configuration is invalid");
    }
  }
  if (clientId && clientSecret && refreshToken) {
    return oauthRefreshAccessToken(clientId, clientSecret, refreshToken);
  }

  const serviceAccount = serviceAccountCredentials();
  return serviceAccount ? serviceAccountAccessToken(serviceAccount) : null;
}

export async function syncConfirmedAppointmentToGoogleCalendar(
  appointment: CalendarAppointment,
  options: { day?: string; time?: string; duration?: number; message?: string },
): Promise<GoogleCalendarSyncResult> {
  const calendarId = environmentValue(
    "GOOGLE_CALENDAR_ID",
    "NEXT_PUBLIC_GOOGLE_CALENDAR_ID",
    "GOOGLE_CALENDAR_EMAIL",
    "CONTACT_EMAIL",
  );
  const accessToken = await googleAccessToken();

  if (!accessToken || !calendarId) {
    return { configured: false, synced: false };
  }

  const day = options.day?.slice(0, 10) ?? "";
  const time = options.time?.slice(0, 5) ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error("A valid date and time are required for Google Calendar sync");
  }

  const duration = Number(options.duration) > 0 ? Number(options.duration) : 30;
  const timeZone = process.env.GOOGLE_CALENDAR_TIME_ZONE?.trim()
    || process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_TIME_ZONE?.trim()
    || "Europe/Brussels";
  const identifier = String(appointment.id ?? `${day}-${time}-${appointment.email ?? "appointment"}`);
  const eventId = `cura${createHash("sha256").update(identifier).digest("hex").slice(0, 36)}`;
  const patient = `${appointment.firstName ?? appointment.first_name ?? ""} ${appointment.lastName ?? appointment.last_name ?? ""}`.trim();
  const care = String(appointment.care ?? "").trim();
  const description = [
    patient ? `Patient: ${patient}` : "",
    appointment.email ? `E-mail: ${appointment.email}` : "",
    appointment.phone ? `Téléphone: ${appointment.phone}` : "",
    care ? `Soin: ${care}` : "",
    options.message?.trim() ? `Note: ${options.message.trim()}` : "",
  ].filter(Boolean).join("\n");
  const event = {
    id: eventId,
    summary: `Rendez-vous CURA${care ? ` — ${care}` : ""}`,
    description,
    start: { dateTime: `${day}T${time}:00`, timeZone },
    end: { dateTime: addMinutes(day, time, duration), timeZone },
    attendees: appointment.email ? [{ email: appointment.email }] : undefined,
    transparency: "opaque",
    extendedProperties: { private: { curaAppointmentId: identifier } },
  };

  const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
  const existing = await fetch(`${baseUrl}/${encodeURIComponent(eventId)}`, {
    headers,
    cache: "no-store",
  });
  const target = existing.status === 404
    ? `${baseUrl}?sendUpdates=none`
    : `${baseUrl}/${encodeURIComponent(eventId)}?sendUpdates=none`;
  if (!existing.ok && existing.status !== 404) {
    throw new Error(`Google Calendar lookup failed (${existing.status})`);
  }

  const response = await fetch(target, {
    method: existing.status === 404 ? "POST" : "PUT",
    headers,
    body: JSON.stringify(event),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Google Calendar event sync failed (${response.status})`);
  const result = await response.json() as { id?: string; htmlLink?: string };
  return {
    configured: true,
    synced: true,
    eventId: result.id ?? eventId,
    eventUrl: result.htmlLink,
  };
}
