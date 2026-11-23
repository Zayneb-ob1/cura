"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "../gestion.module.css";
import { useAdminLanguage } from "../admin-i18n";
import { AdminPageHeader, AdminPage } from "../admin-shell";

const DEFAULT_CALENDAR_ID = "contact@curadental.be";
const DEFAULT_CALENDAR_TIME_ZONE = "Europe/Brussels";

type AgendaReservation = {
  id: string | number;
  firstName?: string;
  lastName?: string;
  care?: string;
  day?: string;
  time?: string;
  slotTime?: string;
  durationMin?: number;
  status?: string;
};

type AppointmentPage = {
  items?: AgendaReservation[];
  pagination?: { totalPages?: number };
};

const STATUS_META: Record<string, { fr: string; nl: string; background: string; color: string }> = {
  pending: { fr: "En attente", nl: "In afwachting", background: "#fdf3d8", color: "#8a6d1a" },
  confirmed: { fr: "Confirmée", nl: "Bevestigd", background: "#dcefe3", color: "#2f6f4f" },
};

function dayOnly(value?: string) {
  return value?.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "";
}

function reservationTime(reservation: AgendaReservation) {
  const value = reservation.status === "confirmed"
    ? reservation.slotTime || reservation.time
    : reservation.time || reservation.slotTime;
  return value?.trim() || "";
}

function reservationTimestamp(reservation: AgendaReservation) {
  const day = dayOnly(reservation.day);
  const clock = reservationTime(reservation).match(/^\d{2}:\d{2}/)?.[0] ?? "23:59";
  const value = new Date(`${day}T${clock}:00`).getTime();
  return Number.isNaN(value) ? Number.POSITIVE_INFINITY : value;
}

function localDay() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatAgendaDay(value: string | undefined, locale: string, fallback: string) {
  const day = dayOnly(value);
  if (!day) return fallback;
  const parsed = new Date(`${day}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return day;
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export default function AgendaPage() {
  return <AdminPage active="agenda">{() => <AgendaContent />}</AdminPage>;
}

function AgendaContent() {
  const { t, language } = useAdminLanguage();
  const locale = language === "nl" ? "nl-BE" : "fr-BE";
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [reservations, setReservations] = useState<AgendaReservation[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(true);
  const [agendaError, setAgendaError] = useState("");
  const loadSequence = useRef(0);
  const calendarId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID?.trim() || DEFAULT_CALENDAR_ID;
  const calendarTimeZone = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_TIME_ZONE?.trim() || DEFAULT_CALENDAR_TIME_ZONE;
  const embedParameters = new URLSearchParams({
    src: calendarId,
    ctz: calendarTimeZone,
    mode: "WEEK",
    showTitle: "0",
    showPrint: "0",
    showCalendars: "0",
    wkst: "2",
  });
  const src = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_EMBED?.trim()
    || `https://calendar.google.com/calendar/embed?${embedParameters.toString()}`;
  const googleCalendarUrl = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(calendarId)}`;

  const loadAgenda = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setAgendaLoading(true);
    setAgendaError("");

    try {
      const sessionResponse = await fetch("/api/admin/session", { credentials: "same-origin", cache: "no-store" });
      const session = await sessionResponse.json().catch(() => ({ authenticated: false }));
      if (!sessionResponse.ok || !session.authenticated) {
        setAuthed(false);
        setReservations([]);
        return;
      }
      setAuthed(true);

      const firstResponse = await fetch("/api/admin/appointments?page=1&limit=100", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (firstResponse.status === 401) {
        setAuthed(false);
        setReservations([]);
        return;
      }
      if (!firstResponse.ok) throw new Error("LOAD_FAILED");

      const firstPage = await firstResponse.json() as AppointmentPage;
      const allItems = Array.isArray(firstPage.items) ? [...firstPage.items] : [];
      const totalPages = Math.max(1, Number(firstPage.pagination?.totalPages) || 1);

      for (let page = 2; page <= totalPages; page += 1) {
        const response = await fetch(`/api/admin/appointments?page=${page}&limit=100`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) throw new Error("LOAD_FAILED");
        const payload = await response.json() as AppointmentPage;
        if (Array.isArray(payload.items)) allItems.push(...payload.items);
      }

      const today = localDay();
      const uniqueItems = Array.from(new Map(allItems.map((item) => [String(item.id), item])).values());
      if (sequence !== loadSequence.current) return;
      setReservations(uniqueItems
        .filter((item) => {
          const status = item.status || "pending";
          const day = dayOnly(item.day);
          return (status === "pending" || status === "confirmed") && Boolean(day) && day >= today;
        })
        .sort((left, right) => reservationTimestamp(left) - reservationTimestamp(right)));
    } catch (error) {
      if (sequence === loadSequence.current) {
        setAgendaError(error instanceof Error && error.message !== "LOAD_FAILED" ? error.message : "LOAD_FAILED");
      }
    } finally {
      if (sequence === loadSequence.current) setAgendaLoading(false);
    }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => void loadAgenda(), 0);
    const refreshInterval = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadAgenda();
    }, 30_000);
    const handleFocus = () => void loadAgenda();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void loadAgenda();
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "cura-appointments-update") void loadAgenda();
    };
    const handleAppointmentUpdate = () => void loadAgenda();
    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("cura-appointments-update", handleAppointmentUpdate);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearTimeout(task);
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("cura-appointments-update", handleAppointmentUpdate);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadAgenda]);

  if (authed === false) {
    return <p>{t("Session expirée.", "Sessie verlopen.")} <a className={styles.back} href="/admin">{t("Se reconnecter", "Opnieuw aanmelden")}</a></p>;
  }

  return (
      <div className={styles.inner}>
        <AdminPageHeader
          eyebrow={t("Activité", "Activiteit")}
          title={t("Agenda", "Agenda")}
          description={t("Les réservations à venir sont chargées automatiquement depuis le tableau de bord.", "De komende reservaties worden automatisch geladen vanuit het dashboard.")}
          actions={(
            <div className={styles.calendarActions}>
              <span className={styles.chip}>{t("Agenda", "Agenda")} · {calendarId}</span>
              <a className={styles.calendarLink} href={googleCalendarUrl} target="_blank" rel="noreferrer">
                {t("Ouvrir dans Google Agenda", "Openen in Google Agenda")} <span aria-hidden="true">↗</span>
              </a>
            </div>
          )}
        />

        <div className={styles.agendaStack}>
          <section aria-labelledby="agenda-reservations-title">
            <div className={styles.agendaSectionHeader}>
              <div>
                <p className={styles.agendaEyebrow}>{t("Réservations", "Reservaties")}</p>
                <h2 id="agenda-reservations-title">{t("Agenda des réservations", "Agenda van de reservaties")}</h2>
                <p>{t("Demandes en attente et réservations confirmées, classées par date et heure.", "Aanvragen in afwachting en bevestigde reservaties, gesorteerd op datum en uur.")}</p>
              </div>
              <div className={styles.agendaSectionActions}>
                <span className={styles.chip}>{reservations.length} {t("à venir", "gepland")}</span>
                <button className={styles.filterBtn} type="button" onClick={() => void loadAgenda()} disabled={agendaLoading}>
                  {agendaLoading ? t("Actualisation…", "Vernieuwen…") : t("Actualiser", "Vernieuwen")}
                </button>
              </div>
            </div>

            {agendaError && <p className={styles.agendaError} role="alert">{agendaError === "LOAD_FAILED" ? t("Impossible de charger l’agenda.", "De agenda kon niet worden geladen.") : agendaError}</p>}

            <div className={styles.card} aria-live="polite">
              <div className={styles.tableWrap} role="region" aria-label={t("Agenda des réservations", "Agenda van de reservaties")} tabIndex={0}>
                <table className={`${styles.table} ${styles.agendaTable} ${styles.stackTable}`}>
                  <thead>
                    <tr>
                      <th>{t("Date et heure", "Datum en uur")}</th>
                      <th>{t("Patient", "Patiënt")}</th>
                      <th>{t("Soin", "Behandeling")}</th>
                      <th>{t("Durée", "Duur")}</th>
                      <th>{t("Statut", "Status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agendaLoading ? (
                      <tr><td className={styles.empty} colSpan={5}>{t("Chargement des réservations…", "Reservaties laden…")}</td></tr>
                    ) : reservations.length === 0 ? (
                      <tr><td className={styles.empty} colSpan={5}>{t("Aucune réservation à venir.", "Geen komende reservaties.")}</td></tr>
                    ) : reservations.map((reservation) => {
                      const status = reservation.status === "confirmed" ? "confirmed" : "pending";
                      const statusMeta = STATUS_META[status];
                      const day = dayOnly(reservation.day);
                      const time = reservationTime(reservation) || t("À préciser", "Nog te bepalen");
                      const dateTime = /^\d{2}:\d{2}/.test(time) ? `${day}T${time.slice(0, 5)}` : day;
                      const patient = `${reservation.firstName ?? ""} ${reservation.lastName ?? ""}`.trim() || t("Patient", "Patiënt");
                      return (
                        <tr key={reservation.id}>
                          <td data-label={t("Date et heure", "Datum en uur")}>
                            <time className={styles.agendaDate} dateTime={dateTime}>
                              <strong>{formatAgendaDay(reservation.day, locale, t("Date à préciser", "Datum nog te bepalen"))}</strong>
                              <span>{time}</span>
                            </time>
                          </td>
                          <td data-label={t("Patient", "Patiënt")}><span className={styles.name}>{patient}</span></td>
                          <td data-label={t("Soin", "Behandeling")}>{reservation.care?.trim() || t("Soin à préciser", "Behandeling nog te bepalen")}</td>
                          <td data-label={t("Durée", "Duur")}>{reservation.durationMin ? `${reservation.durationMin} min` : "—"}</td>
                          <td data-label={t("Statut", "Status")}>
                            <span className={styles.badge} style={{ background: statusMeta.background, color: statusMeta.color }}>
                              {t(statusMeta.fr, statusMeta.nl)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section aria-labelledby="google-calendar-title">
            <div className={styles.agendaSectionHeader}>
              <div>
                <p className={styles.agendaEyebrow}>Google Calendar</p>
                <h2 id="google-calendar-title">{t("Agenda Google du cabinet", "Google Agenda van de praktijk")}</h2>
                <p>{t("Connectez-vous au compte Google autorisé si cet agenda privé le demande.", "Meld u aan met het toegestane Google-account als deze privéagenda daarom vraagt.")}</p>
              </div>
            </div>
            <div className={`${styles.card} ${styles.frameCard}`}>
              <iframe
                className={styles.frame}
                src={src}
                title={t("Google Agenda CURA", "Google Agenda CURA")}
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </section>
        </div>
      </div>
  );
}
