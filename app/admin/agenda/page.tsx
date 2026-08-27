"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "../gestion.module.css";
import AdminSidebar from "../gestion-sidebar";

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

const STATUS_META: Record<string, { label: string; background: string; color: string }> = {
  pending: { label: "En attente", background: "#fdf3d8", color: "#8a6d1a" },
  confirmed: { label: "Confirmée", background: "#dcefe3", color: "#2f6f4f" },
};

function dayOnly(value?: string) {
  return value?.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "";
}

function reservationTime(reservation: AgendaReservation) {
  const value = reservation.status === "confirmed"
    ? reservation.slotTime || reservation.time
    : reservation.time || reservation.slotTime;
  return value?.trim() || "À préciser";
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

function formatAgendaDay(value?: string) {
  const day = dayOnly(value);
  if (!day) return "Date à préciser";
  const parsed = new Date(`${day}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return day;
  return new Intl.DateTimeFormat("fr-BE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export default function AgendaPage() {
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
      if (!firstResponse.ok) throw new Error("Impossible de charger les réservations.");

      const firstPage = await firstResponse.json() as AppointmentPage;
      const allItems = Array.isArray(firstPage.items) ? [...firstPage.items] : [];
      const totalPages = Math.max(1, Number(firstPage.pagination?.totalPages) || 1);

      for (let page = 2; page <= totalPages; page += 1) {
        const response = await fetch(`/api/admin/appointments?page=${page}&limit=100`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Impossible de charger toutes les réservations.");
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
        setAgendaError(error instanceof Error ? error.message : "Impossible de charger l’agenda.");
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
    return <div className={styles.layout}><AdminSidebar /><div className={styles.content}><p>Session expirée. <a className={styles.back} href="/admin">Se reconnecter</a></p></div></div>;
  }

  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.content}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <div>
            <a className={styles.back} href="/admin">← Retour au dashboard</a>
            <h1 className={styles.title}>Agenda</h1>
            <p className={styles.subtitle}>Les réservations à venir sont chargées automatiquement depuis le dashboard.</p>
          </div>
          <div className={styles.calendarActions}>
            <span className={styles.chip}>Agenda · {calendarId}</span>
            <a className={styles.calendarLink} href={googleCalendarUrl} target="_blank" rel="noreferrer">
              Ouvrir dans Google Agenda <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        <div className={styles.agendaStack}>
          <section aria-labelledby="agenda-reservations-title">
            <div className={styles.agendaSectionHeader}>
              <div>
                <p className={styles.agendaEyebrow}>Réservations</p>
                <h2 id="agenda-reservations-title">Agenda des réservations</h2>
                <p>Demandes en attente et réservations confirmées, classées par date et heure.</p>
              </div>
              <div className={styles.agendaSectionActions}>
                <span className={styles.chip}>{reservations.length} à venir</span>
                <button className={styles.filterBtn} type="button" onClick={() => void loadAgenda()} disabled={agendaLoading}>
                  {agendaLoading ? "Actualisation…" : "Actualiser"}
                </button>
              </div>
            </div>

            {agendaError && <p className={styles.agendaError} role="alert">{agendaError}</p>}

            <div className={styles.card} aria-live="polite">
              <div className={styles.tableWrap} role="region" aria-label="Agenda des réservations" tabIndex={0}>
                <table className={`${styles.table} ${styles.agendaTable}`}>
                  <thead>
                    <tr>
                      <th>Date et heure</th>
                      <th>Patient</th>
                      <th>Soin</th>
                      <th>Durée</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agendaLoading ? (
                      <tr><td className={styles.empty} colSpan={5}>Chargement des réservations…</td></tr>
                    ) : reservations.length === 0 ? (
                      <tr><td className={styles.empty} colSpan={5}>Aucune réservation à venir.</td></tr>
                    ) : reservations.map((reservation) => {
                      const status = reservation.status === "confirmed" ? "confirmed" : "pending";
                      const statusMeta = STATUS_META[status];
                      const day = dayOnly(reservation.day);
                      const time = reservationTime(reservation);
                      const dateTime = /^\d{2}:\d{2}/.test(time) ? `${day}T${time.slice(0, 5)}` : day;
                      const patient = `${reservation.firstName ?? ""} ${reservation.lastName ?? ""}`.trim() || "Patient";
                      return (
                        <tr key={reservation.id}>
                          <td>
                            <time className={styles.agendaDate} dateTime={dateTime}>
                              <strong>{formatAgendaDay(reservation.day)}</strong>
                              <span>{time}</span>
                            </time>
                          </td>
                          <td><span className={styles.name}>{patient}</span></td>
                          <td>{reservation.care?.trim() || "Soin à préciser"}</td>
                          <td>{reservation.durationMin ? `${reservation.durationMin} min` : "—"}</td>
                          <td>
                            <span className={styles.badge} style={{ background: statusMeta.background, color: statusMeta.color }}>
                              {statusMeta.label}
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
                <h2 id="google-calendar-title">Agenda Google du cabinet</h2>
                <p>Connectez-vous au compte Google autorisé si cet agenda privé le demande.</p>
              </div>
            </div>
            <div className={`${styles.card} ${styles.frameCard}`}>
              <iframe
                className={styles.frame}
                src={src}
                title="Google Agenda CURA"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </section>
        </div>
      </div>
      </div>
    </div>
  );
}
