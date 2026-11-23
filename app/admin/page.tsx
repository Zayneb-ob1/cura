"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./admin.module.css";
import { useAdminLanguage } from "./admin-i18n";
import { AdminLoading, AdminLoginScreen, AdminShell, useAdminSession } from "./admin-shell";
import reservationStyles from "./gestion.module.css";

type DataSection = "contacts" | "appointments" | "reviews" | "doctors";
type AdminSection = "overview" | DataSection | "forms" | "site" | "blocked-ips";
type AdminItem = Record<string, unknown> & { id: string | number };

type OverviewData = Record<DataSection, AdminItem[]>;

type Pagination = {
  page: number;
  limit: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type OverviewTotals = Record<DataSection, number>;

type OverviewSummary = {
  newMessages: number;
  pendingAppointments: number;
  publishedReviews: number;
};

type AppointmentPreviews = {
  upcoming: AdminItem[];
  reservations: AdminItem[];
};

type AppointmentActionMode = "confirm" | "propose";

type AppointmentActionDraft = {
  day: string;
  time: string;
  duration: string;
  message: string;
};

type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

type ReviewDraft = {
  name: string;
  quote: string;
  rating: string;
  language: "fr" | "nl";
  published: boolean;
};

type DoctorDraft = {
  initials: string;
  nameFr: string;
  nameNl: string;
  roleFr: string;
  roleNl: string;
  bioFr: string;
  bioNl: string;
  order: string;
  published: boolean;
};

type FormFieldConfig = {
  key: string;
  labelFr: string;
  labelNl: string;
  placeholderFr: string;
  placeholderNl: string;
  required: boolean;
  visible: boolean;
  order: number;
};

type FormConfig = {
  slug: string;
  enabled: boolean;
  titleFr: string;
  titleNl: string;
  descriptionFr: string;
  descriptionNl: string;
  submitLabelFr: string;
  submitLabelNl: string;
  fields: FormFieldConfig[];
};

type FormConfigs = {
  contact: FormConfig;
  appointment: FormConfig;
};

type FormType = keyof FormConfigs;

type ClinicSettings = {
  phoneDisplay: string;
  email: string;
  scheduleFr: string;
  scheduleNl: string;
  emergencyFr: string;
  emergencyNl: string;
};

const sections: Array<{ id: AdminSection; label: string; labelNl: string }> = [
  { id: "reviews", label: "Avis", labelNl: "Beoordelingen" },
  { id: "doctors", label: "Cabinet / Équipe", labelNl: "Praktijk / Team" },
  { id: "forms", label: "Formulaires", labelNl: "Formulieren" },
  { id: "site", label: "Informations du site", labelNl: "Website-informatie" },
  { id: "contacts", label: "Messages", labelNl: "Berichten" },
  { id: "blocked-ips", label: "Adresses IP bloquées", labelNl: "Geblokkeerde IP-adressen" },
  { id: "overview", label: "Vue d’ensemble", labelNl: "Overzicht" },
  { id: "appointments", label: "Réservations", labelNl: "Reservaties" },
];

const hashSections = new Set<AdminSection>(["overview", "reviews", "doctors", "forms", "site", "contacts", "blocked-ips"]);

const formLabels: Record<FormType, { name: string; nameNl: string; href: string }> = {
  contact: { name: "Formulaire de contact", nameNl: "Contactformulier", href: "/contact" },
  appointment: { name: "Formulaire de rendez-vous", nameNl: "Afspraakformulier", href: "/rendez-vous" },
};

const lockedFormFields: Record<FormType, ReadonlySet<string>> = {
  contact: new Set(["name", "email", "subject", "message"]),
  appointment: new Set(["firstName", "lastName", "email", "phone", "day", "consent"]),
};

const sitePages = [
  ["Accueil", "Home", "/"],
  ["Nos soins", "Onze behandelingen", "/soins"],
  ["Le cabinet", "De praktijk", "/cabinet"],
  ["Nouveau patient", "Nieuwe patiënt", "/nouveau-patient"],
  ["Conseils & FAQ", "Tips & FAQ", "/conseils"],
  ["Contact", "Contact", "/contact"],
  ["Prendre rendez-vous", "Afspraak maken", "/rendez-vous"],
] as const;

const emptyOverview: OverviewData = {
  contacts: [],
  appointments: [],
  reviews: [],
  doctors: [],
};

const emptyOverviewTotals: OverviewTotals = {
  contacts: 0,
  appointments: 0,
  reviews: 0,
  doctors: 0,
};

const emptyOverviewSummary: OverviewSummary = {
  newMessages: 0,
  pendingAppointments: 0,
  publishedReviews: 0,
};

const emptyAppointmentPreviews: AppointmentPreviews = {
  upcoming: [],
  reservations: [],
};

const appointmentStatusMeta: Record<AppointmentStatus, { label: string; labelNl: string; background: string; color: string }> = {
  pending: { label: "En attente", labelNl: "In afwachting", background: "#fdf3d8", color: "#8a6d1a" },
  confirmed: { label: "Confirmé", labelNl: "Bevestigd", background: "#dcefe3", color: "#2f6f4f" },
  completed: { label: "Terminé", labelNl: "Afgerond", background: "#ecebe6", color: "#62665f" },
  cancelled: { label: "Annulé", labelNl: "Geannuleerd", background: "#f7e4df", color: "#8b3428" },
};

const emptyPagination: Pagination = {
  page: 1,
  limit: 25,
  pageSize: 25,
  total: 0,
  totalPages: 0,
};

function isDataSection(section: AdminSection): section is DataSection {
  return section === "contacts" || section === "appointments" || section === "reviews" || section === "doctors";
}

const emptyReview: ReviewDraft = {
  name: "",
  quote: "",
  rating: "5",
  language: "fr",
  published: true,
};

const emptyDoctor: DoctorDraft = {
  initials: "DR",
  nameFr: "",
  nameNl: "",
  roleFr: "",
  roleNl: "",
  bioFr: "",
  bioNl: "",
  order: "1",
  published: true,
};

const emptyClinicSettings: ClinicSettings = {
  phoneDisplay: "",
  email: "",
  scheduleFr: "",
  scheduleNl: "",
  emergencyFr: "",
  emergencyNl: "",
};

function asText(value: unknown, fallback = "—") {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function formatDate(value: unknown, locale = "fr-BE") {
  if (typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function dateOnly(value: unknown) {
  if (typeof value !== "string") return "";
  return value.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "";
}

function appointmentClock(item: AdminItem, fallback = "À préciser") {
  const confirmedTime = asText(item.slotTime, "");
  if (/^\d{2}:\d{2}/.test(confirmedTime)) return confirmedTime.slice(0, 5);
  return asText(item.time, fallback);
}

function appointmentTimestamp(item: AdminItem) {
  const day = dateOnly(item.day);
  if (!day) return Number.POSITIVE_INFINITY;
  const slot = asText(item.slotTime, "").match(/^\d{2}:\d{2}/)?.[0] ?? "23:59";
  const timestamp = new Date(`${day}T${slot}:00`).getTime();
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function isUpcomingAppointment(item: AdminItem, now: number) {
  return item.status === "confirmed" && appointmentTimestamp(item) >= now;
}

function formatAppointmentDay(value: unknown, locale = "fr-BE", fallback = "Date à préciser") {
  const day = dateOnly(value);
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

function appointmentStatus(value: unknown): AppointmentStatus {
  return value === "confirmed" || value === "completed" || value === "cancelled" ? value : "pending";
}

async function getErrorMessage(response: Response, fallback = "Une erreur est survenue.") {
  try {
    const payload = (await response.json()) as { error?: string; message?: string };
    return payload.error ?? payload.message ?? fallback;
  } catch {
    return fallback;
  }
}

export default function AdminPage() {
  const { t, language } = useAdminLanguage();
  const locale = language === "nl" ? "nl-BE" : "fr-BE";
  const session = useAdminSession();
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [sectionReady, setSectionReady] = useState(false);
  const [items, setItems] = useState<AdminItem[]>([]);
  const [overviewData, setOverviewData] = useState<OverviewData>(emptyOverview);
  const [overviewTotals, setOverviewTotals] = useState<OverviewTotals>(emptyOverviewTotals);
  const [overviewSummary, setOverviewSummary] = useState<OverviewSummary>(emptyOverviewSummary);
  const [appointmentPreviews, setAppointmentPreviews] = useState<AppointmentPreviews>(emptyAppointmentPreviews);
  const [appointmentAction, setAppointmentAction] = useState<{ item: AdminItem; mode: AppointmentActionMode } | null>(null);
  const [appointmentDraft, setAppointmentDraft] = useState<AppointmentActionDraft>({ day: "", time: "", duration: "30", message: "" });
  const [pagination, setPagination] = useState<Pagination>(emptyPagination);
  const currentPage = useRef(1);
  const previousSection = useRef<AdminSection>("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | number | null>(null);
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft>(emptyReview);
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState<string | number | null>(null);
  const [doctorDraft, setDoctorDraft] = useState<DoctorDraft>(emptyDoctor);
  const [formConfigs, setFormConfigs] = useState<FormConfigs | null>(null);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);
  const [blockedIpDraft, setBlockedIpDraft] = useState("");

  useEffect(() => {
    const syncSectionFromUrl = () => {
      const requestedSection = window.location.hash.slice(1) as AdminSection;
      const nextSection = hashSections.has(requestedSection) ? requestedSection : "overview";
      setShowReviewForm(false);
      setShowDoctorForm(false);
      setActiveSection(nextSection);
      setSectionReady(true);
    };

    syncSectionFromUrl();
    window.addEventListener("hashchange", syncSectionFromUrl);
    window.addEventListener("popstate", syncSectionFromUrl);
    return () => {
      window.removeEventListener("hashchange", syncSectionFromUrl);
      window.removeEventListener("popstate", syncSectionFromUrl);
    };
  }, []);

  const loadItems = useCallback(async (section: AdminSection, requestedPage = currentPage.current) => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      if (section === "overview") {
        const [responses, summaryResponses, appointmentPreviewResponses] = await Promise.all([
          Promise.all((["contacts", "appointments", "reviews", "doctors"] as DataSection[]).map((name) =>
            fetch(`/api/admin/${name}?page=1&limit=25`, {
              credentials: "same-origin",
              cache: "no-store",
            }),
          )),
          Promise.all([
            fetch("/api/admin/contacts?page=1&limit=1&status=new", { credentials: "same-origin", cache: "no-store" }),
            fetch("/api/admin/appointments?page=1&limit=1&status=pending", { credentials: "same-origin", cache: "no-store" }),
            fetch("/api/admin/reviews?page=1&limit=1&published=true", { credentials: "same-origin", cache: "no-store" }),
          ]),
          Promise.all([
            fetch("/api/admin/appointments?page=1&limit=100&status=confirmed", { credentials: "same-origin", cache: "no-store" }),
            fetch("/api/admin/appointments?page=1&limit=100&status=pending", { credentials: "same-origin", cache: "no-store" }),
          ]),
        ]);

        const overviewResponses = [...responses, ...summaryResponses, ...appointmentPreviewResponses];
        if (overviewResponses.some((response) => response.status === 401)) {
          setAuthenticated(false);
          setItems([]);
          setAppointmentPreviews(emptyAppointmentPreviews);
          return;
        }

        const failedResponse = overviewResponses.find((response) => !response.ok);
        if (failedResponse) throw new Error(await getErrorMessage(failedResponse, tRef.current("Une erreur est survenue.", "Er is een fout opgetreden.")));

        const payloads = await Promise.all(
          responses.map((response) => response.json() as Promise<{ items?: AdminItem[]; pagination?: Pagination }>),
        );
        const summaryPayloads = await Promise.all(
          summaryResponses.map((response) => response.json() as Promise<{ pagination?: Pagination }>),
        );
        const appointmentPreviewPayloads = await Promise.all(
          appointmentPreviewResponses.map((response) => response.json() as Promise<{ items?: AdminItem[] }>),
        );
        setOverviewData({
          contacts: Array.isArray(payloads[0].items) ? payloads[0].items : [],
          appointments: Array.isArray(payloads[1].items) ? payloads[1].items : [],
          reviews: Array.isArray(payloads[2].items) ? payloads[2].items : [],
          doctors: Array.isArray(payloads[3].items) ? payloads[3].items : [],
        });
        setOverviewTotals({
          contacts: payloads[0].pagination?.total ?? payloads[0].items?.length ?? 0,
          appointments: payloads[1].pagination?.total ?? payloads[1].items?.length ?? 0,
          reviews: payloads[2].pagination?.total ?? payloads[2].items?.length ?? 0,
          doctors: payloads[3].pagination?.total ?? payloads[3].items?.length ?? 0,
        });
        setOverviewSummary({
          newMessages: summaryPayloads[0].pagination?.total ?? 0,
          pendingAppointments: summaryPayloads[1].pagination?.total ?? 0,
          publishedReviews: summaryPayloads[2].pagination?.total ?? 0,
        });
        const confirmedItems = Array.isArray(appointmentPreviewPayloads[0].items)
          ? appointmentPreviewPayloads[0].items
          : [];
        const pendingItems = Array.isArray(appointmentPreviewPayloads[1].items)
          ? appointmentPreviewPayloads[1].items
          : [];
        const recentAppointments = Array.isArray(payloads[1].items) ? payloads[1].items : [];
        const reservationOverview = Array.from(new Map(
          [...pendingItems, ...recentAppointments].map((item) => [String(item.id), item]),
        ).values());
        setAppointmentPreviews({
          upcoming: confirmedItems
            .filter((item) => isUpcomingAppointment(item, Date.now()))
            .sort((left, right) => appointmentTimestamp(left) - appointmentTimestamp(right))
            .slice(0, 10),
          reservations: reservationOverview
            .sort((left, right) => {
              const leftPending = appointmentStatus(left.status) === "pending" ? 0 : 1;
              const rightPending = appointmentStatus(right.status) === "pending" ? 0 : 1;
              if (leftPending !== rightPending) return leftPending - rightPending;
              return new Date(asText(right.createdAt, "0")).getTime() - new Date(asText(left.createdAt, "0")).getTime();
            })
            .slice(0, 10),
        });
        setPagination(emptyPagination);
        currentPage.current = 1;
        setItems([]);
        setAuthenticated(true);
        return;
      }

      if (section === "site") {
        const response = await fetch("/api/admin/site-settings", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (response.status === 401) {
          setAuthenticated(false);
          setItems([]);
          return;
        }
        if (!response.ok) throw new Error(await getErrorMessage(response, tRef.current("Une erreur est survenue.", "Er is een fout opgetreden.")));
        const payload = (await response.json()) as { settings?: ClinicSettings };
        if (!payload.settings) throw new Error(tRef.current("Informations du cabinet incomplètes.", "Praktijkgegevens onvolledig."));
        setClinicSettings(payload.settings);
        setItems([]);
        setPagination(emptyPagination);
        currentPage.current = 1;
        setAuthenticated(true);
        return;
      }

      if (section === "forms") {
        const response = await fetch("/api/admin/forms", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (response.status === 401) {
          setAuthenticated(false);
          setFormConfigs(null);
          return;
        }
        if (!response.ok) throw new Error(await getErrorMessage(response, tRef.current("Une erreur est survenue.", "Er is een fout opgetreden.")));

        const payload = (await response.json()) as { forms?: FormConfigs };
        if (!payload.forms?.contact || !payload.forms?.appointment) {
          throw new Error(tRef.current("Configuration des formulaires incomplète.", "Formulierconfiguratie onvolledig."));
        }
        setFormConfigs(payload.forms);
        setItems([]);
        setPagination(emptyPagination);
        currentPage.current = 1;
        setAuthenticated(true);
        return;
      }

      const response = await fetch(`/api/admin/${section}?page=${requestedPage}&limit=${emptyPagination.limit}`, {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (response.status === 401) {
        setAuthenticated(false);
        setItems([]);
        return;
      }

      if (!response.ok) throw new Error(await getErrorMessage(response, tRef.current("Une erreur est survenue.", "Er is een fout opgetreden.")));

      const payload = (await response.json()) as { items?: AdminItem[]; pagination?: Pagination };
      setItems(Array.isArray(payload.items) ? payload.items : []);
      const nextPagination = payload.pagination ?? { ...emptyPagination, total: payload.items?.length ?? 0 };
      setPagination(nextPagination);
      currentPage.current = nextPagination.page;
      setAuthenticated(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : tRef.current("Impossible de charger les données.", "De gegevens konden niet worden geladen."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sectionReady) return;
    const sectionChanged = previousSection.current !== activeSection;
    previousSection.current = activeSection;
    if (sectionChanged) currentPage.current = 1;
    const task = window.setTimeout(() => void loadItems(activeSection, currentPage.current), 0);
    return () => window.clearTimeout(task);
  }, [activeSection, loadItems, sectionReady]);

  useEffect(() => {
    if (!authenticated || activeSection === "forms" || activeSection === "site") return;

    let interval: number | undefined;
    let refreshPromise: Promise<void> | null = null;

    const stopPolling = () => {
      if (interval !== undefined) window.clearInterval(interval);
      interval = undefined;
    };
    const refreshDashboard = () => {
      if (document.hidden || refreshPromise) return;
      refreshPromise = loadItems(activeSection).finally(() => {
        refreshPromise = null;
      });
    };
    const startPolling = () => {
      stopPolling();
      if (!document.hidden) interval = window.setInterval(refreshDashboard, 15000);
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
        return;
      }
      refreshDashboard();
      startPolling();
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "cura-dashboard-update" || event.key === "cura-appointments-update") refreshDashboard();
    };

    startPolling();
    window.addEventListener("focus", refreshDashboard);
    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      stopPolling();
      window.removeEventListener("focus", refreshDashboard);
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeSection, authenticated, loadItems]);

  async function handleLoginSuccess() {
    setError("");
    setAuthenticated(true);
    await Promise.all([session.refresh(), loadItems(activeSection)]);
  }

  function openAppointmentAction(item: AdminItem, mode: AppointmentActionMode) {
    setAppointmentAction({ item, mode });
    setAppointmentDraft({
      day: dateOnly(item.day),
      time: asText(item.slotTime, ""),
      duration: asText(item.durationMin, "30"),
      message: "",
    });
    setError("");
    setNotice("");
  }

  function notifyAppointmentUpdate() {
    try {
      const timestamp = String(Date.now());
      window.localStorage.setItem("cura-dashboard-update", timestamp);
      window.localStorage.setItem("cura-appointments-update", timestamp);
      window.dispatchEvent(new Event("cura-appointments-update"));
    } catch {
      // The MySQL mutation is already complete; other views also refresh on focus and polling.
    }
  }

  async function submitAppointmentAction() {
    if (!appointmentAction) return;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/admin/appointments/${encodeURIComponent(String(appointmentAction.item.id))}/action`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: appointmentAction.mode,
          day: appointmentDraft.day,
          time: appointmentDraft.time,
          duration: Number(appointmentDraft.duration),
          message: appointmentDraft.message,
        }),
      });
      const payload = await response.json().catch(() => ({})) as {
        error?: string;
        emailSent?: boolean;
        calendarConfigured?: boolean;
        calendarSynced?: boolean;
      };
      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!response.ok) throw new Error(payload.error || t("Impossible de mettre à jour la réservation.", "De reservatie kon niet worden bijgewerkt."));

      const mode = appointmentAction.mode;
      setAppointmentAction(null);
      notifyAppointmentUpdate();
      await loadItems("overview");
      const warnings: string[] = [];
      if (payload.emailSent === false) warnings.push(t("l’e-mail au patient n’a pas été envoyé", "de e-mail naar de patiënt is niet verzonden"));
      if (mode === "confirm" && payload.calendarConfigured === false) warnings.push(t("Google Agenda n’est pas configuré", "Google Agenda is niet geconfigureerd"));
      if (mode === "confirm" && payload.calendarConfigured && payload.calendarSynced === false) warnings.push(t("la synchronisation Google Agenda a échoué", "de synchronisatie met Google Agenda is mislukt"));
      setNotice(warnings.length > 0
        ? t(`Réservation enregistrée, mais ${warnings.join(" et ")}.`, `Reservatie opgeslagen, maar ${warnings.join(" en ")}.`)
        : mode === "confirm" ? t("Réservation confirmée et ajoutée à l’Agenda.", "Reservatie bevestigd en toegevoegd aan de agenda.") : t("Nouveau créneau proposé au patient.", "Nieuw tijdstip voorgesteld aan de patiënt."));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("Impossible de mettre à jour la réservation.", "De reservatie kon niet worden bijgewerkt."));
    } finally {
      setSaving(false);
    }
  }

  async function cancelAppointment(item: AdminItem) {
    const patient = `${asText(item.firstName, t("Patient", "Patiënt"))} ${asText(item.lastName, "")}`.trim();
    if (!window.confirm(t(`Annuler la réservation de ${patient} et prévenir le patient par e-mail ?`, `De reservatie van ${patient} annuleren en de patiënt per e-mail verwittigen?`))) return;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/admin/appointments/${encodeURIComponent(String(item.id))}/action`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string; emailSent?: boolean };
      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!response.ok) throw new Error(payload.error || t("Impossible d’annuler la réservation.", "De reservatie kon niet worden geannuleerd."));
      notifyAppointmentUpdate();
      await loadItems("overview");
      setNotice(payload.emailSent === false
        ? t("Réservation annulée, mais l’e-mail au patient n’a pas été envoyé.", "Reservatie geannuleerd, maar de e-mail naar de patiënt is niet verzonden.")
        : t("Réservation annulée et patient prévenu.", "Reservatie geannuleerd en patiënt verwittigd."));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("Impossible d’annuler la réservation.", "De reservatie kon niet worden geannuleerd."));
    } finally {
      setSaving(false);
    }
  }

  async function updateItem(id: string | number, fields: Record<string, unknown>) {
    if (!isDataSection(activeSection)) return;
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/${activeSection}/${encodeURIComponent(String(id))}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!response.ok) throw new Error(await getErrorMessage(response, tRef.current("Une erreur est survenue.", "Er is een fout opgetreden.")));
      await loadItems(activeSection);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("Mise à jour impossible.", "Bijwerken mislukt."));
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: string | number) {
    if (!isDataSection(activeSection)) return;
    if (!window.confirm(t("Supprimer définitivement cet élément ?", "Dit element definitief verwijderen?"))) return;
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/${activeSection}/${encodeURIComponent(String(id))}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!response.ok) throw new Error(await getErrorMessage(response, tRef.current("Une erreur est survenue.", "Er is een fout opgetreden.")));
      await loadItems(activeSection);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("Suppression impossible.", "Verwijderen mislukt."));
    } finally {
      setSaving(false);
    }
  }

  async function addBlockedIp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/blocked-ips", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipAddress: blockedIpDraft.trim() }),
      });
      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!response.ok) throw new Error(await getErrorMessage(response, tRef.current("Une erreur est survenue.", "Er is een fout opgetreden.")));
      setBlockedIpDraft("");
      await loadItems("blocked-ips");
      setNotice(t("Adresse IP bloquée.", "IP-adres geblokkeerd."));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("Impossible de bloquer cette adresse IP.", "Dit IP-adres kon niet worden geblokkeerd."));
    } finally {
      setSaving(false);
    }
  }

  async function unblockIp(id: string | number, ipAddress: string) {
    if (!window.confirm(t(`Débloquer l’adresse IP ${ipAddress} ?`, `IP-adres ${ipAddress} deblokkeren?`))) return;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/admin/blocked-ips/${encodeURIComponent(String(id))}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!response.ok) throw new Error(await getErrorMessage(response, tRef.current("Une erreur est survenue.", "Er is een fout opgetreden.")));
      await loadItems("blocked-ips");
      setNotice(t("Adresse IP débloquée.", "IP-adres gedeblokkeerd."));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("Impossible de débloquer cette adresse IP.", "Dit IP-adres kon niet worden gedeblokkeerd."));
    } finally {
      setSaving(false);
    }
  }

  function startReview() {
    setEditingReviewId(null);
    setReviewDraft(emptyReview);
    setShowReviewForm(true);
  }

  function editReview(item: AdminItem) {
    setEditingReviewId(item.id);
    setReviewDraft({
      name: asText(item.name, ""),
      quote: asText(item.quote, ""),
      rating: asText(item.rating, "5"),
      language: item.language === "nl" ? "nl" : "fr",
      published: Boolean(item.published),
    });
    setShowReviewForm(true);
  }

  async function saveReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const endpoint = editingReviewId === null
      ? "/api/admin/reviews"
      : `/api/admin/reviews/${encodeURIComponent(String(editingReviewId))}`;

    try {
      const response = await fetch(endpoint, {
        method: editingReviewId === null ? "POST" : "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reviewDraft,
          rating: Number(reviewDraft.rating),
        }),
      });

      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!response.ok) throw new Error(await getErrorMessage(response, tRef.current("Une erreur est survenue.", "Er is een fout opgetreden.")));

      setShowReviewForm(false);
      setEditingReviewId(null);
      setReviewDraft(emptyReview);
      await loadItems("reviews");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("Enregistrement impossible.", "Opslaan mislukt."));
    } finally {
      setSaving(false);
    }
  }

  function startDoctor() {
    setEditingDoctorId(null);
    setDoctorDraft({ ...emptyDoctor, order: String(pagination.total + 1) });
    setShowDoctorForm(true);
  }

  function editDoctor(item: AdminItem) {
    setEditingDoctorId(item.id);
    setDoctorDraft({
      initials: asText(item.initials, "DR"),
      nameFr: asText(item.nameFr, ""),
      nameNl: asText(item.nameNl, ""),
      roleFr: asText(item.roleFr, ""),
      roleNl: asText(item.roleNl, ""),
      bioFr: asText(item.bioFr, ""),
      bioNl: asText(item.bioNl, ""),
      order: asText(item.order, "1"),
      published: Boolean(item.published),
    });
    setShowDoctorForm(true);
  }

  async function saveDoctor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const endpoint = editingDoctorId === null
      ? "/api/admin/doctors"
      : `/api/admin/doctors/${encodeURIComponent(String(editingDoctorId))}`;

    try {
      const response = await fetch(endpoint, {
        method: editingDoctorId === null ? "POST" : "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...doctorDraft, order: Number(doctorDraft.order) }),
      });
      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!response.ok) throw new Error(await getErrorMessage(response, tRef.current("Une erreur est survenue.", "Er is een fout opgetreden.")));

      setShowDoctorForm(false);
      setEditingDoctorId(null);
      setDoctorDraft(emptyDoctor);
      await loadItems("doctors");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("Enregistrement impossible.", "Opslaan mislukt."));
    } finally {
      setSaving(false);
    }
  }

  function updateFormConfig(formType: FormType, fields: Partial<FormConfig>) {
    setFormConfigs((current) => current
      ? { ...current, [formType]: { ...current[formType], ...fields } }
      : current);
    setNotice("");
  }

  function updateFormField(formType: FormType, key: string, fields: Partial<FormFieldConfig>) {
    setFormConfigs((current) => {
      if (!current) return current;
      return {
        ...current,
        [formType]: {
          ...current[formType],
          fields: current[formType].fields.map((field) => field.key === key ? { ...field, ...fields } : field),
        },
      };
    });
    setNotice("");
  }

  async function saveFormConfig(event: FormEvent<HTMLFormElement>, formType: FormType) {
    event.preventDefault();
    if (!formConfigs) return;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/forms", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formType, ...formConfigs[formType] }),
      });
      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!response.ok) throw new Error(await getErrorMessage(response, tRef.current("Une erreur est survenue.", "Er is een fout opgetreden.")));

      const payload = (await response.json()) as { form?: FormConfig };
      if (payload.form) updateFormConfig(formType, payload.form);
      setNotice(t(`${formLabels[formType].name} enregistré.`, `${formLabels[formType].nameNl} opgeslagen.`));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("Enregistrement impossible.", "Opslaan mislukt."));
    } finally {
      setSaving(false);
    }
  }

  async function saveClinicSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clinicSettings) return;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clinicSettings),
      });
      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!response.ok) throw new Error(await getErrorMessage(response, tRef.current("Une erreur est survenue.", "Er is een fout opgetreden.")));
      const payload = (await response.json()) as { settings?: ClinicSettings };
      setClinicSettings(payload.settings ?? clinicSettings);
      setNotice(t("Informations du cabinet enregistrées.", "Praktijkgegevens opgeslagen."));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("Enregistrement impossible.", "Opslaan mislukt."));
    } finally {
      setSaving(false);
    }
  }

  const totalItems = overviewTotals.contacts + overviewTotals.appointments + overviewTotals.reviews + overviewTotals.doctors;
  const { newMessages, pendingAppointments, publishedReviews } = overviewSummary;
  const recentActivity: Array<{
    id: string;
    section?: AdminSection;
    href?: string;
    type: string;
    title: string;
    detail: string;
    date: unknown;
  }> = [
    ...overviewData.contacts.map((item) => ({
      id: `contact-${item.id}`,
      section: "contacts" as AdminSection,
      type: t("Message", "Bericht"),
      title: asText(item.name, t("Nouveau message", "Nieuw bericht")),
      detail: asText(item.subject, t("Sans objet", "Geen onderwerp")),
      date: item.createdAt,
    })),
    ...overviewData.appointments.map((item) => ({
      id: `appointment-${item.id}`,
      href: "/admin/reservations",
      type: t("Réservation", "Reservatie"),
      title: `${asText(item.firstName, t("Patient", "Patiënt"))} ${asText(item.lastName, "")}`.trim(),
      detail: asText(item.care, t("Soin à préciser", "Behandeling nog te bepalen")),
      date: item.createdAt,
    })),
    ...overviewData.reviews.map((item) => ({
      id: `review-${item.id}`,
      section: "reviews" as AdminSection,
      type: t("Avis", "Beoordeling"),
      title: asText(item.name, t("Nouvel avis", "Nieuwe beoordeling")),
      detail: `${asText(item.rating, "5")} / 5`,
      date: item.createdAt,
    })),
  ]
    .sort((a, b) => new Date(asText(b.date, "0")).getTime() - new Date(asText(a.date, "0")).getTime())
    .slice(0, 6);

  if (authenticated === null) return <AdminLoading />;

  if (!authenticated) return <AdminLoginScreen onSuccess={handleLoginSuccess} />;

  return (
    <AdminShell
      active={activeSection === "appointments" ? "reservations" : activeSection}
      user={session.user}
      onSectionChange={(section) => {
        setShowReviewForm(false);
        setShowDoctorForm(false);
        setActiveSection(section as AdminSection);
      }}
    >
        <section className={styles.content}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>{t("Tableau de bord", "Dashboard")}</p>
              <h1>{(() => { const current = sections.find((section) => section.id === activeSection); return current ? t(current.label, current.labelNl) : ""; })()}</h1>
              <p>
                {loading
                  ? t("Chargement…", "Laden…")
                  : activeSection === "overview"
                    ? t(`${totalItems} éléments gérés`, `${totalItems} beheerde elementen`)
                    : activeSection === "forms"
                      ? t(`${formConfigs ? 2 : 0} formulaires configurés`, `${formConfigs ? 2 : 0} geconfigureerde formulieren`)
                    : activeSection === "site"
                      ? t("Coordonnées et pages publiques", "Contactgegevens en publieke pagina’s")
                      : t(`${pagination.total} élément${pagination.total === 1 ? "" : "s"}`, `${pagination.total} element${pagination.total === 1 ? "" : "en"}`)}
              </p>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.secondaryButton} type="button" onClick={() => void loadItems(activeSection)} disabled={loading}>
                {loading ? t("Actualisation…", "Vernieuwen…") : t("Actualiser", "Vernieuwen")}
              </button>
              {activeSection === "reviews" && (
                <button className={styles.primaryButton} type="button" onClick={startReview}>
                  {t("Ajouter un avis", "Beoordeling toevoegen")}
                </button>
              )}
              {activeSection === "doctors" && (
                <button className={styles.primaryButton} type="button" onClick={startDoctor}>
                  {t("Ajouter un membre", "Teamlid toevoegen")}
                </button>
              )}
            </div>
          </div>

          {error && <p className={styles.error} role="alert">{error}</p>}
          {notice && <p className={styles.notice} role="status">{notice}</p>}

          {activeSection === "reviews" && showReviewForm && (
            <form className={styles.reviewForm} onSubmit={saveReview}>
              <div className={styles.formHeading}>
                <h2>{editingReviewId === null ? t("Nouvel avis", "Nieuwe beoordeling") : t("Modifier l’avis", "Beoordeling bewerken")}</h2>
                <button type="button" className={styles.textButton} onClick={() => setShowReviewForm(false)}>{t("Fermer", "Sluiten")}</button>
              </div>
              <div className={styles.formGrid}>
                <label>
                  {t("Nom", "Naam")}
                  <input required value={reviewDraft.name} onChange={(event) => setReviewDraft((current) => ({ ...current, name: event.target.value }))} />
                </label>
                <label>
                  {t("Note", "Score")}
                  <select value={reviewDraft.rating} onChange={(event) => setReviewDraft((current) => ({ ...current, rating: event.target.value }))}>
                    {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
                  </select>
                </label>
                <label>
                  {t("Langue", "Taal")}
                  <select value={reviewDraft.language} onChange={(event) => setReviewDraft((current) => ({ ...current, language: event.target.value as "fr" | "nl" }))}>
                    <option value="fr">Français</option>
                    <option value="nl">Nederlands</option>
                  </select>
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={reviewDraft.published} onChange={(event) => setReviewDraft((current) => ({ ...current, published: event.target.checked }))} />
                  {t("Publié sur le site", "Gepubliceerd op de website")}
                </label>
                <label className={styles.fullField}>
                  {t("Témoignage", "Getuigenis")}
                  <textarea required rows={4} value={reviewDraft.quote} onChange={(event) => setReviewDraft((current) => ({ ...current, quote: event.target.value }))} />
                </label>
              </div>
              <button className={styles.primaryButton} type="submit" disabled={saving}>
                {saving ? t("Enregistrement…", "Opslaan…") : t("Enregistrer", "Opslaan")}
              </button>
            </form>
          )}

          {activeSection === "doctors" && showDoctorForm && (
            <form className={styles.reviewForm} onSubmit={saveDoctor}>
              <div className={styles.formHeading}>
                <h2>{editingDoctorId === null ? t("Nouveau membre", "Nieuw teamlid") : t("Modifier le membre", "Teamlid bewerken")}</h2>
                <button type="button" className={styles.textButton} onClick={() => setShowDoctorForm(false)}>{t("Fermer", "Sluiten")}</button>
              </div>
              <div className={`${styles.formGrid} ${styles.doctorFormGrid}`}>
                <label>
                  {t("Initiales", "Initialen")}
                  <input required maxLength={4} value={doctorDraft.initials} onChange={(event) => setDoctorDraft((current) => ({ ...current, initials: event.target.value.toUpperCase() }))} />
                </label>
                <label>
                  {t("Ordre", "Volgorde")}
                  <input required type="number" min="0" max="999" value={doctorDraft.order} onChange={(event) => setDoctorDraft((current) => ({ ...current, order: event.target.value }))} />
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={doctorDraft.published} onChange={(event) => setDoctorDraft((current) => ({ ...current, published: event.target.checked }))} />
                  {t("Visible sur le site", "Zichtbaar op de website")}
                </label>
                <span />
                <label>
                  {t("Nom en français", "Naam in het Frans")}
                  <input required value={doctorDraft.nameFr} onChange={(event) => setDoctorDraft((current) => ({ ...current, nameFr: event.target.value }))} />
                </label>
                <label>
                  {t("Nom en néerlandais", "Naam in het Nederlands")}
                  <input required value={doctorDraft.nameNl} onChange={(event) => setDoctorDraft((current) => ({ ...current, nameNl: event.target.value }))} />
                </label>
                <label>
                  {t("Fonction en français", "Functie in het Frans")}
                  <input required value={doctorDraft.roleFr} onChange={(event) => setDoctorDraft((current) => ({ ...current, roleFr: event.target.value }))} />
                </label>
                <label>
                  {t("Fonction en néerlandais", "Functie in het Nederlands")}
                  <input required value={doctorDraft.roleNl} onChange={(event) => setDoctorDraft((current) => ({ ...current, roleNl: event.target.value }))} />
                </label>
                <label className={styles.doctorBioField}>
                  {t("Présentation en français", "Beschrijving in het Frans")}
                  <textarea required rows={3} value={doctorDraft.bioFr} onChange={(event) => setDoctorDraft((current) => ({ ...current, bioFr: event.target.value }))} />
                </label>
                <label className={styles.doctorBioField}>
                  {t("Présentation en néerlandais", "Beschrijving in het Nederlands")}
                  <textarea required rows={3} value={doctorDraft.bioNl} onChange={(event) => setDoctorDraft((current) => ({ ...current, bioNl: event.target.value }))} />
                </label>
              </div>
              <button className={styles.primaryButton} type="submit" disabled={saving}>
                {saving ? t("Enregistrement…", "Opslaan…") : t("Enregistrer le membre", "Teamlid opslaan")}
              </button>
            </form>
          )}

          {activeSection === "overview" ? (
            loading ? (
              <div className={styles.emptyState}>{t("Chargement des données…", "Gegevens laden…")}</div>
            ) : (
              <>
                <div className={styles.prioritySections}>
                  <section className={styles.prioritySection} aria-labelledby="reservations-overview-title">
                    <div className={styles.priorityHeader}>
                      <div>
                        <p className={styles.eyebrow}>{t("Réservations", "Reservaties")}</p>
                        <h2 id="reservations-overview-title">{t("Vue complète des réservations", "Volledig overzicht van de reservaties")}</h2>
                        <p>{t("Les demandes en attente sont affichées en premier, avec leur statut et les actions essentielles.", "Aanvragen in afwachting staan bovenaan, met hun status en de belangrijkste acties.")}</p>
                      </div>
                      <div className={styles.priorityHeaderAside}>
                        <span>{pendingAppointments} {t("en attente", "in afwachting")}</span>
                        <Link className={styles.panelLink} href="/admin/reservations">
                          {t("Voir toutes les réservations", "Alle reservaties bekijken")} <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </div>
                    <div className={reservationStyles.card}>
                      <div className={reservationStyles.tableWrap} role="region" aria-label={t("Aperçu complet des réservations", "Volledig overzicht van de reservaties")} tabIndex={0}>
                        <table className={`${reservationStyles.table} ${reservationStyles.stackTable} ${styles.dashboardReservationTable}`}>
                          <caption className={styles.tableCaption}>{t("Réservations récentes et en attente de traitement", "Recente reservaties en reservaties die op verwerking wachten")}</caption>
                          <thead>
                            <tr>
                              <th>{t("Patient", "Patiënt")}</th>
                              <th>{t("Contact", "Contact")}</th>
                              <th>{t("Soin", "Behandeling")}</th>
                              <th>{t("Date", "Datum")}</th>
                              <th>{t("Heure", "Uur")}</th>
                              <th>{t("Durée", "Duur")}</th>
                              <th>{t("Statut", "Status")}</th>
                              <th>{t("Actions", "Acties")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {appointmentPreviews.reservations.length === 0 ? (
                              <tr>
                                <td className={reservationStyles.empty} colSpan={8}>{t("Aucune réservation pour le moment.", "Nog geen reservaties.")}</td>
                              </tr>
                            ) : appointmentPreviews.reservations.map((item) => {
                              const status = appointmentStatus(item.status);
                              const meta = appointmentStatusMeta[status];
                              const toSpecify = t("À préciser", "Nog te bepalen");
                              const time = status === "confirmed" ? appointmentClock(item, toSpecify) : asText(item.time, toSpecify);
                              return (
                                <tr key={item.id}>
                                  <td data-label={t("Patient", "Patiënt")}><span className={reservationStyles.name}>{asText(item.firstName, t("Patient", "Patiënt"))} {asText(item.lastName, "")}</span></td>
                                  <td data-label={t("Contact", "Contact")}>
                                    {asText(item.email, t("E-mail à préciser", "E-mail nog te bepalen"))}
                                    <br />
                                    <span className={reservationStyles.muted}>{asText(item.phone, t("Téléphone à préciser", "Telefoon nog te bepalen"))}</span>
                                  </td>
                                  <td data-label={t("Soin", "Behandeling")}>{asText(item.care, t("Soin à préciser", "Behandeling nog te bepalen"))}</td>
                                  <td data-label={t("Date", "Datum")}><strong className={styles.tableDate}>{formatAppointmentDay(item.day, locale, t("Date à préciser", "Datum nog te bepalen"))}</strong></td>
                                  <td data-label={t("Heure", "Uur")}>{time}</td>
                                  <td data-label={t("Durée", "Duur")}>{status === "confirmed" ? `${asText(item.durationMin, "30")} min` : t("À confirmer", "Te bevestigen")}</td>
                                  <td data-label={t("Statut", "Status")}>
                                    <span className={reservationStyles.badge} style={{ background: meta.background, color: meta.color }}>
                                      {t(meta.label, meta.labelNl)}
                                    </span>
                                  </td>
                                  <td data-label={t("Actions", "Acties")}>
                                    <div className={reservationStyles.actions}>
                                      {status === "pending" && (
                                        <>
                                          <button className={`${reservationStyles.btn} ${reservationStyles.btnConfirm}`} type="button" onClick={() => openAppointmentAction(item, "confirm")} disabled={saving}>{t("Confirmer", "Bevestigen")}</button>
                                          <button className={`${reservationStyles.btn} ${reservationStyles.btnPropose}`} type="button" onClick={() => openAppointmentAction(item, "propose")} disabled={saving}>{t("Proposer", "Voorstellen")}</button>
                                        </>
                                      )}
                                      {(status === "pending" || status === "confirmed") && (
                                        <button className={`${reservationStyles.btn} ${reservationStyles.btnCancel}`} type="button" onClick={() => void cancelAppointment(item)} disabled={saving}>{t("Annuler", "Annuleren")}</button>
                                      )}
                                      {(status === "completed" || status === "cancelled") && <span className={reservationStyles.muted}>{t("Aucune action", "Geen actie")}</span>}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>

                  <section className={styles.prioritySection} aria-labelledby="agenda-overview-title">
                    <div className={styles.priorityHeader}>
                      <div>
                        <p className={styles.eyebrow}>{t("Agenda", "Agenda")}</p>
                        <h2 id="agenda-overview-title">{t("Prochaines réservations", "Volgende reservaties")}</h2>
                        <p>{t("Les réservations confirmées à venir, classées par date et heure.", "De komende bevestigde reservaties, gesorteerd op datum en uur.")}</p>
                      </div>
                      <div className={styles.priorityHeaderAside}>
                        <span>{appointmentPreviews.upcoming.length} {t("à venir", "gepland")}</span>
                        <Link className={styles.panelLink} href="/admin/agenda">
                          {t("Ouvrir l’agenda", "Agenda openen")} <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </div>
                    <div className={reservationStyles.card}>
                      <div className={reservationStyles.tableWrap} role="region" aria-label={t("Agenda des réservations à venir", "Agenda van de komende reservaties")} tabIndex={0}>
                        <table className={`${reservationStyles.table} ${reservationStyles.stackTable} ${styles.dashboardAgendaTable}`}>
                          <caption className={styles.tableCaption}>{t("Réservations confirmées à venir", "Komende bevestigde reservaties")}</caption>
                          <thead>
                            <tr>
                              <th>{t("Date", "Datum")}</th>
                              <th>{t("Heure", "Uur")}</th>
                              <th>{t("Durée", "Duur")}</th>
                              <th>{t("Patient", "Patiënt")}</th>
                              <th>{t("Soin", "Behandeling")}</th>
                              <th>{t("Statut", "Status")}</th>
                              <th>{t("Actions", "Acties")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {appointmentPreviews.upcoming.length === 0 ? (
                              <tr>
                                <td className={reservationStyles.empty} colSpan={7}>{t("Aucune réservation confirmée à venir.", "Geen komende bevestigde reservaties.")}</td>
                              </tr>
                            ) : appointmentPreviews.upcoming.map((item) => {
                              const status = appointmentStatus(item.status);
                              const meta = appointmentStatusMeta[status];
                              const day = dateOnly(item.day);
                              const time = appointmentClock(item, t("À préciser", "Nog te bepalen"));
                              const dateTime = day && /^\d{2}:\d{2}$/.test(time) ? `${day}T${time}` : day || undefined;
                              return (
                                <tr key={item.id}>
                                  <td data-label={t("Date", "Datum")}>
                                    <time className={styles.tableDate} dateTime={dateTime}>{formatAppointmentDay(item.day, locale, t("Date à préciser", "Datum nog te bepalen"))}</time>
                                  </td>
                                  <td data-label={t("Heure", "Uur")}>{time}</td>
                                  <td data-label={t("Durée", "Duur")}>{asText(item.durationMin, "30")} min</td>
                                  <td data-label={t("Patient", "Patiënt")}>
                                    <span className={reservationStyles.name}>{asText(item.firstName, t("Patient", "Patiënt"))} {asText(item.lastName, "")}</span>
                                    <br />
                                    <span className={reservationStyles.muted}>{asText(item.email, t("Coordonnées à préciser", "Contactgegevens nog te bepalen"))}</span>
                                  </td>
                                  <td data-label={t("Soin", "Behandeling")}>{asText(item.care, t("Soin à préciser", "Behandeling nog te bepalen"))}</td>
                                  <td data-label={t("Statut", "Status")}>
                                    <span className={reservationStyles.badge} style={{ background: meta.background, color: meta.color }}>
                                      {t(meta.label, meta.labelNl)}
                                    </span>
                                  </td>
                                  <td data-label={t("Actions", "Acties")}>
                                    <div className={reservationStyles.actions}>
                                      <button className={`${reservationStyles.btn} ${reservationStyles.btnCancel}`} type="button" onClick={() => void cancelAppointment(item)} disabled={saving}>{t("Annuler", "Annuleren")}</button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                </div>

                <div className={styles.statsGrid}>
                  <button type="button" className={styles.statCard} onClick={() => setActiveSection("contacts")}>
                    <span>{t("Messages", "Berichten")}</span>
                    <strong>{overviewTotals.contacts}</strong>
                    <small className={newMessages > 0 ? styles.statAlert : undefined}>{t(`${newMessages} nouveau${newMessages === 1 ? "" : "x"}`, `${newMessages} nieuw${newMessages === 1 ? "" : "e"}`)}</small>
                  </button>
                  <Link className={styles.statCard} href="/admin/reservations">
                    <span>{t("Réservations", "Reservaties")}</span>
                    <strong>{overviewTotals.appointments}</strong>
                    <small className={pendingAppointments > 0 ? styles.statAlert : undefined}>{t(`${pendingAppointments} à traiter`, `${pendingAppointments} te verwerken`)}</small>
                  </Link>
                  <button type="button" className={styles.statCard} onClick={() => setActiveSection("reviews")}>
                    <span>{t("Avis", "Beoordelingen")}</span>
                    <strong>{overviewTotals.reviews}</strong>
                    <small>{t(`${publishedReviews} publié${publishedReviews === 1 ? "" : "s"}`, `${publishedReviews} gepubliceerd`)}</small>
                  </button>
                  <button type="button" className={styles.statCard} onClick={() => setActiveSection("doctors")}>
                    <span>{t("Équipe", "Team")}</span>
                    <strong>{overviewTotals.doctors}</strong>
                    <small>{t("membres du cabinet", "leden van de praktijk")}</small>
                  </button>
                </div>

                <div className={styles.overviewGrid}>
                  <section className={styles.overviewPanel}>
                    <div className={styles.panelHeading}>
                      <div>
                        <p className={styles.eyebrow}>{t("Aujourd’hui", "Vandaag")}</p>
                        <h2>{t("Activité récente", "Recente activiteit")}</h2>
                      </div>
                      <span>{t(`${recentActivity.length} entrées`, `${recentActivity.length} items`)}</span>
                    </div>
                    {recentActivity.length === 0 ? (
                      <p className={styles.panelEmpty}>{t("Aucune activité pour le moment.", "Nog geen activiteit.")}</p>
                    ) : (
                      <div className={styles.activityList}>
                        {recentActivity.map((activity) => {
                          const content = (
                            <>
                              <span className={styles.activityType}>{activity.type.slice(0, 1)}</span>
                              <span className={styles.activityText}>
                                <strong>{activity.title}</strong>
                                <small>{activity.type} · {activity.detail}</small>
                              </span>
                              <time>{formatDate(activity.date, locale)}</time>
                            </>
                          );
                          return activity.href ? (
                            <Link key={activity.id} href={activity.href}>{content}</Link>
                          ) : (
                            <button
                              key={activity.id}
                              type="button"
                              onClick={() => activity.section && setActiveSection(activity.section)}
                            >
                              {content}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  <aside className={styles.quickPanel}>
                    <div className={styles.panelHeading}>
                      <div>
                        <p className={styles.eyebrow}>{t("Raccourcis", "Snelkoppelingen")}</p>
                        <h2>{t("Actions rapides", "Snelle acties")}</h2>
                      </div>
                    </div>
                    <div className={styles.quickActions}>
                      <Link href="/admin/reservations">
                        <strong>{t("Gérer les réservations", "Reservaties beheren")}</strong>
                        <span>{t("Confirmer ou annuler une demande", "Een aanvraag bevestigen of annuleren")}</span>
                      </Link>
                      <button type="button" onClick={() => setActiveSection("contacts")}>
                        <strong>{t("Lire les messages", "Berichten lezen")}</strong>
                        <span>{t("Répondre aux demandes des patients", "Vragen van patiënten beantwoorden")}</span>
                      </button>
                      <button type="button" onClick={() => { setActiveSection("reviews"); setShowReviewForm(true); }}>
                        <strong>{t("Ajouter un avis", "Beoordeling toevoegen")}</strong>
                        <span>{t("Publier un témoignage sur le site", "Een getuigenis op de website publiceren")}</span>
                      </button>
                      <button type="button" onClick={() => setActiveSection("doctors")}>
                        <strong>{t("Gérer l’équipe", "Team beheren")}</strong>
                        <span>{t("Ajouter ou modifier les médecins", "Tandartsen toevoegen of bewerken")}</span>
                      </button>
                      <button type="button" onClick={() => setActiveSection("forms")}>
                        <strong>{t("Modifier les formulaires", "Formulieren bewerken")}</strong>
                        <span>{t("Gérer les textes et les champs publics", "Teksten en publieke velden beheren")}</span>
                      </button>
                      <button type="button" onClick={() => setActiveSection("site")}>
                        <strong>{t("Voir les pages", "Pagina’s bekijken")}</strong>
                        <span>{t("Ouvrir une page du site", "Een pagina van de website openen")}</span>
                      </button>
                    </div>
                  </aside>
                </div>
              </>
            )
          ) : activeSection === "forms" ? (
            loading ? (
              <div className={styles.emptyState}>{t("Chargement des formulaires…", "Formulieren laden…")}</div>
            ) : !formConfigs ? (
              <div className={styles.emptyState}>{t("Aucune configuration disponible.", "Geen configuratie beschikbaar.")}</div>
            ) : (
              <div className={styles.formManager}>
                {(["contact", "appointment"] as FormType[]).map((formType) => {
                  const config = formConfigs[formType];
                  const meta = formLabels[formType];
                  return (
                    <form className={styles.formConfigCard} key={formType} onSubmit={(event) => void saveFormConfig(event, formType)}>
                      <div className={styles.formConfigHeader}>
                        <div>
                          <p className={styles.eyebrow}>{config.slug}</p>
                          <h2>{t(meta.name, meta.nameNl)}</h2>
                          <a href={meta.href} target="_blank" rel="noreferrer">{t("Voir la page", "Pagina bekijken")} ↗</a>
                        </div>
                        <label className={styles.formSwitch}>
                          <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={(event) => updateFormConfig(formType, { enabled: event.target.checked })}
                          />
                          {t("Formulaire actif", "Formulier actief")}
                        </label>
                      </div>

                      <div className={styles.formSettingsGrid}>
                        <label>
                          {t("Titre en français", "Titel in het Frans")}
                          <input required value={config.titleFr} onChange={(event) => updateFormConfig(formType, { titleFr: event.target.value })} />
                        </label>
                        <label>
                          {t("Titre en néerlandais", "Titel in het Nederlands")}
                          <input required value={config.titleNl} onChange={(event) => updateFormConfig(formType, { titleNl: event.target.value })} />
                        </label>
                        <label>
                          {t("Introduction en français", "Introductie in het Frans")}
                          <textarea rows={3} value={config.descriptionFr} onChange={(event) => updateFormConfig(formType, { descriptionFr: event.target.value })} />
                        </label>
                        <label>
                          {t("Introduction en néerlandais", "Introductie in het Nederlands")}
                          <textarea rows={3} value={config.descriptionNl} onChange={(event) => updateFormConfig(formType, { descriptionNl: event.target.value })} />
                        </label>
                        <label>
                          {t("Bouton en français", "Knop in het Frans")}
                          <input required value={config.submitLabelFr} onChange={(event) => updateFormConfig(formType, { submitLabelFr: event.target.value })} />
                        </label>
                        <label>
                          {t("Bouton en néerlandais", "Knop in het Nederlands")}
                          <input required value={config.submitLabelNl} onChange={(event) => updateFormConfig(formType, { submitLabelNl: event.target.value })} />
                        </label>
                      </div>

                      <div className={styles.fieldsHeading}>
                        <div>
                          <h3>{t("Champs du formulaire", "Formuliervelden")}</h3>
                          <p>{t("Les clés techniques restent fixes pour conserver les envois existants.", "De technische sleutels blijven vast om bestaande inzendingen te behouden.")}</p>
                        </div>
                        <span>{t(`${config.fields.length} champs`, `${config.fields.length} velden`)}</span>
                      </div>

                      <div className={styles.formFields}>
                        {[...config.fields].sort((a, b) => a.order - b.order).map((field) => (
                          <article className={styles.formFieldCard} key={field.key}>
                            <div className={styles.formFieldHeader}>
                              <div className={styles.fieldKey}>
                                <code>{field.key}</code>
                                {lockedFormFields[formType].has(field.key) && <span>{t("Champ essentiel", "Essentieel veld")}</span>}
                              </div>
                              <div className={styles.fieldOptions}>
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={field.visible}
                                    disabled={lockedFormFields[formType].has(field.key)}
                                    onChange={(event) => updateFormField(formType, field.key, { visible: event.target.checked })}
                                  />
                                  {t("Visible", "Zichtbaar")}
                                </label>
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={field.required}
                                    disabled={lockedFormFields[formType].has(field.key)}
                                    onChange={(event) => updateFormField(formType, field.key, { required: event.target.checked })}
                                  />
                                  {t("Obligatoire", "Verplicht")}
                                </label>
                              </div>
                            </div>
                            <div className={styles.fieldEditGrid}>
                              <label>
                                {t("Libellé FR", "Label FR")}
                                <input required value={field.labelFr} onChange={(event) => updateFormField(formType, field.key, { labelFr: event.target.value })} />
                              </label>
                              <label>
                                {t("Libellé NL", "Label NL")}
                                <input required value={field.labelNl} onChange={(event) => updateFormField(formType, field.key, { labelNl: event.target.value })} />
                              </label>
                              <label>
                                {t("Placeholder FR", "Placeholder FR")}
                                <input value={field.placeholderFr} onChange={(event) => updateFormField(formType, field.key, { placeholderFr: event.target.value })} />
                              </label>
                              <label>
                                {t("Placeholder NL", "Placeholder NL")}
                                <input value={field.placeholderNl} onChange={(event) => updateFormField(formType, field.key, { placeholderNl: event.target.value })} />
                              </label>
                              <label className={styles.orderField}>
                                {t("Ordre", "Volgorde")}
                                <input
                                  type="number"
                                  min="0"
                                  value={field.order}
                                  onChange={(event) => updateFormField(formType, field.key, { order: Number(event.target.value) })}
                                />
                              </label>
                            </div>
                          </article>
                        ))}
                      </div>

                      <div className={styles.formConfigActions}>
                        <a className={styles.secondaryButton} href={meta.href} target="_blank" rel="noreferrer">{t("Prévisualiser", "Voorbeeld")}</a>
                        <button className={styles.primaryButton} type="submit" disabled={saving}>
                          {saving ? t("Enregistrement…", "Opslaan…") : t("Enregistrer le formulaire", "Formulier opslaan")}
                        </button>
                      </div>
                    </form>
                  );
                })}
              </div>
            )
          ) : activeSection === "site" ? (
            <div className={styles.siteManager}>
              {clinicSettings ? (
                <form className={`${styles.formConfigCard} ${styles.siteSettingsCard}`} onSubmit={(event) => void saveClinicSettings(event)}>
                  <div className={styles.formConfigHeader}>
                    <div>
                      <p className={styles.eyebrow}>{t("Informations publiques", "Publieke informatie")}</p>
                      <h2>{t("Coordonnées du cabinet", "Contactgegevens van de praktijk")}</h2>
                    </div>
                    <a href="/contact" target="_blank" rel="noreferrer">{t("Prévisualiser", "Voorbeeld")}</a>
                  </div>
                  <div className={styles.formSettingsGrid}>
                    <label>
                      {t("Téléphone", "Telefoon")}
                      <input type="tel" required value={clinicSettings.phoneDisplay} onChange={(event) => setClinicSettings((current) => ({ ...(current ?? emptyClinicSettings), phoneDisplay: event.target.value }))} />
                    </label>
                    <label>
                      {t("E-mail", "E-mail")}
                      <input type="email" required value={clinicSettings.email} onChange={(event) => setClinicSettings((current) => ({ ...(current ?? emptyClinicSettings), email: event.target.value }))} />
                    </label>
                    <label>
                      {t("Horaires courts — FR", "Korte openingsuren — FR")}
                      <input required value={clinicSettings.scheduleFr} onChange={(event) => setClinicSettings((current) => ({ ...(current ?? emptyClinicSettings), scheduleFr: event.target.value }))} />
                    </label>
                    <label>
                      {t("Horaires courts — NL", "Korte openingsuren — NL")}
                      <input required value={clinicSettings.scheduleNl} onChange={(event) => setClinicSettings((current) => ({ ...(current ?? emptyClinicSettings), scheduleNl: event.target.value }))} />
                    </label>
                    <label>
                      {t("Urgences — FR", "Spoed — FR")}
                      <input required value={clinicSettings.emergencyFr} onChange={(event) => setClinicSettings((current) => ({ ...(current ?? emptyClinicSettings), emergencyFr: event.target.value }))} />
                    </label>
                    <label>
                      {t("Urgences — NL", "Spoed — NL")}
                      <input required value={clinicSettings.emergencyNl} onChange={(event) => setClinicSettings((current) => ({ ...(current ?? emptyClinicSettings), emergencyNl: event.target.value }))} />
                    </label>
                  </div>
                  <div className={styles.formConfigActions}>
                    <span className={styles.settingsHint}>{t("Ces informations apparaissent dans l’en-tête, le contact et le pied de page.", "Deze informatie verschijnt in de koptekst, op de contactpagina en in de voettekst.")}</span>
                    <button className={styles.primaryButton} type="submit" disabled={saving}>
                      {saving ? t("Enregistrement…", "Opslaan…") : t("Enregistrer les informations", "Informatie opslaan")}
                    </button>
                  </div>
                </form>
              ) : (
                <div className={styles.emptyState}>{t("Chargement des informations…", "Informatie laden…")}</div>
              )}
              <div className={styles.siteGrid}>
                {sitePages.map(([label, labelNl, href]) => (
                  <a key={href} className={styles.siteCard} href={href} target="_blank" rel="noreferrer">
                    <span>
                      <strong>{t(label, labelNl)}</strong>
                      <small>{href}</small>
                    </span>
                    <b aria-hidden="true">↗</b>
                  </a>
                ))}
              </div>
            </div>
          ) : activeSection === "blocked-ips" ? (
            <div className={styles.formManager}>
              <form className={styles.formConfigCard} onSubmit={(event) => void addBlockedIp(event)}>
                <div className={styles.formConfigHeader}>
                  <div>
                    <p className={styles.eyebrow}>{t("Sécurité des réservations", "Beveiliging van de reservaties")}</p>
                    <h2>{t("Bloquer une adresse IP", "Een IP-adres blokkeren")}</h2>
                  </div>
                </div>
                <div className={styles.formSettingsGrid}>
                  <label className={styles.fullField}>
                    {t("Adresse IPv4 ou IPv6", "IPv4- of IPv6-adres")}
                    <input
                      required
                      maxLength={45}
                      value={blockedIpDraft}
                      onChange={(event) => setBlockedIpDraft(event.target.value)}
                      placeholder={t("192.0.2.10 ou 2001:db8::10", "192.0.2.10 of 2001:db8::10")}
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                    />
                  </label>
                </div>
                <div className={styles.formConfigActions}>
                  <span className={styles.settingsHint}>{t("Les nouvelles demandes de rendez-vous provenant de cette adresse seront refusées.", "Nieuwe afspraakaanvragen van dit adres worden geweigerd.")}</span>
                  <button className={styles.primaryButton} type="submit" disabled={saving || !blockedIpDraft.trim()}>
                    {saving ? t("Blocage…", "Blokkeren…") : t("Bloquer l’adresse IP", "IP-adres blokkeren")}
                  </button>
                </div>
              </form>

              {loading ? (
                <div className={styles.emptyState}>{t("Chargement des adresses IP…", "IP-adressen laden…")}</div>
              ) : items.length === 0 ? (
                <div className={styles.emptyState}>{t("Aucune adresse IP bloquée.", "Geen geblokkeerde IP-adressen.")}</div>
              ) : (
                <div className={styles.records}>
                  {items.map((item) => {
                    const ipAddress = asText(item.ipAddress);
                    return (
                      <article className={styles.record} key={item.id}>
                        <div className={styles.recordMain}>
                          <div className={styles.recordHeading}>
                            <div>
                              <h2>{ipAddress}</h2>
                              <p>{t("Adresse IP bloquée", "Geblokkeerd IP-adres")}</p>
                            </div>
                            <time>{formatDate(item.createdAt, locale)}</time>
                          </div>
                        </div>
                        <div className={styles.recordActions}>
                          <button className={styles.dangerButton} type="button" onClick={() => void unblockIp(item.id, ipAddress)} disabled={saving}>
                            {t("Débloquer", "Deblokkeren")}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          ) : loading ? (
            <div className={styles.emptyState}>{t("Chargement des données…", "Gegevens laden…")}</div>
          ) : items.length === 0 ? (
            <div className={styles.emptyState}>{t("Aucun élément pour le moment.", "Nog geen elementen.")}</div>
          ) : activeSection === "contacts" ? (
            <div className={styles.records}>
              {items.map((item) => (
                <article className={styles.record} key={item.id}>
                  <div className={styles.recordMain}>
                    <div className={styles.recordHeading}>
                      <div>
                        <h2>{asText(item.name)}</h2>
                        <p>{asText(item.subject, t("Sans objet", "Geen onderwerp"))}</p>
                      </div>
                      <time>{formatDate(item.createdAt, locale)}</time>
                    </div>
                    <div className={styles.contactLinks}>
                      <a href={`mailto:${asText(item.email, "")}`}>{asText(item.email)}</a>
                      {Boolean(item.phone) && <a href={`tel:${asText(item.phone, "")}`}>{asText(item.phone)}</a>}
                      {Boolean(item.language) && <span>{asText(item.language).toUpperCase()}</span>}
                    </div>
                    <p className={styles.message}>{asText(item.message)}</p>
                  </div>
                  <div className={styles.recordActions}>
                    <span className={`${styles.statusPill} ${styles["status_" + asText(item.status, "new")] ?? ""}`}>
                      {asText(item.status, "new") === "new" ? t("Nouveau", "Nieuw") : asText(item.status, "new") === "read" ? t("Lu", "Gelezen") : t("Archivé", "Gearchiveerd")}
                    </span>
                    <label>
                      {t("Statut", "Status")}
                      <select value={asText(item.status, "new")} onChange={(event) => void updateItem(item.id, { status: event.target.value })} disabled={saving}>
                        <option value="new">{t("Nouveau", "Nieuw")}</option>
                        <option value="read">{t("Lu", "Gelezen")}</option>
                        <option value="archived">{t("Archivé", "Gearchiveerd")}</option>
                      </select>
                    </label>
                    <button className={styles.dangerButton} type="button" onClick={() => void deleteItem(item.id)} disabled={saving}>{t("Supprimer", "Verwijderen")}</button>
                  </div>
                </article>
              ))}
            </div>
          ) : activeSection === "appointments" ? (
            <div className={styles.records}>
              {items.map((item) => (
                <article className={styles.record} key={item.id}>
                  <div className={styles.recordMain}>
                    <div className={styles.recordHeading}>
                      <div>
                        <h2>{asText(item.firstName)} {asText(item.lastName, "")}</h2>
                        <p>{asText(item.care, t("Soin à préciser", "Behandeling nog te bepalen"))}</p>
                      </div>
                      <time>{formatDate(item.createdAt, locale)}</time>
                    </div>
                    <div className={styles.detailGrid}>
                      <p><span>{t("Date souhaitée", "Gewenste datum")}</span><strong>{asText(item.day)}</strong></p>
                      <p><span>{t("Moment", "Moment")}</span><strong>{asText(item.time)}</strong></p>
                      <p><span>{t("E-mail", "E-mail")}</span><a href={`mailto:${asText(item.email, "")}`}>{asText(item.email)}</a></p>
                      <p><span>{t("Téléphone", "Telefoon")}</span><a href={`tel:${asText(item.phone, "")}`}>{asText(item.phone)}</a></p>
                    </div>
                    {Boolean(item.note) && <p className={styles.message}>{asText(item.note)}</p>}
                  </div>
                  <div className={styles.recordActions}>
                    <label>
                      {t("Statut", "Status")}
                      <select value={asText(item.status, "pending")} onChange={(event) => void updateItem(item.id, { status: event.target.value })} disabled={saving}>
                        <option value="pending">{t("À traiter", "Te verwerken")}</option>
                        <option value="confirmed">{t("Confirmé", "Bevestigd")}</option>
                        <option value="completed">{t("Terminé", "Afgerond")}</option>
                        <option value="cancelled">{t("Annulé", "Geannuleerd")}</option>
                      </select>
                    </label>
                    <button className={styles.dangerButton} type="button" onClick={() => void deleteItem(item.id)} disabled={saving}>{t("Supprimer", "Verwijderen")}</button>
                  </div>
                </article>
              ))}
            </div>
          ) : activeSection === "reviews" ? (
            <div className={styles.reviewGrid}>
              {items.map((item) => (
                <article className={styles.reviewCard} key={item.id}>
                  <div className={styles.reviewMeta}>
                    <span>{"★".repeat(Number(item.rating) || 0)}</span>
                    <span className={item.published ? styles.published : styles.hidden}>{item.published ? t("Publié", "Gepubliceerd") : t("Masqué", "Verborgen")}</span>
                  </div>
                  <blockquote>« {asText(item.quote)} »</blockquote>
                  <div className={styles.reviewByline}>
                    <strong>{asText(item.name)}</strong>
                    <span>{asText(item.language, "fr").toUpperCase()} · {formatDate(item.createdAt, locale)}</span>
                  </div>
                  <div className={styles.cardActions}>
                    <button className={styles.secondaryButton} type="button" onClick={() => void updateItem(item.id, { published: !item.published })} disabled={saving}>
                      {item.published ? t("Masquer", "Verbergen") : t("Publier", "Publiceren")}
                    </button>
                    <button className={styles.secondaryButton} type="button" onClick={() => editReview(item)}>{t("Modifier", "Bewerken")}</button>
                    <button className={styles.dangerButton} type="button" onClick={() => void deleteItem(item.id)} disabled={saving}>{t("Supprimer", "Verwijderen")}</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.doctorGrid}>
              {items.map((item) => (
                <article className={styles.doctorCard} key={item.id}>
                  <div className={styles.doctorCardTop}>
                    <strong className={styles.doctorInitials}>{asText(item.initials, "DR")}</strong>
                    <span className={item.published ? styles.published : styles.hidden}>{item.published ? t("Visible", "Zichtbaar") : t("Masqué", "Verborgen")}</span>
                  </div>
                  <div className={styles.doctorNames}>
                    <div><small>FR</small><h2>{asText(item.nameFr)}</h2><p>{asText(item.roleFr)}</p></div>
                    <div><small>NL</small><h2>{asText(item.nameNl)}</h2><p>{asText(item.roleNl)}</p></div>
                  </div>
                  <p className={styles.doctorBio}>{asText(item.bioFr)}</p>
                  <div className={styles.cardActions}>
                    <button className={styles.secondaryButton} type="button" onClick={() => void updateItem(item.id, { published: !item.published })} disabled={saving}>
                      {item.published ? t("Masquer", "Verbergen") : t("Afficher", "Tonen")}
                    </button>
                    <button className={styles.secondaryButton} type="button" onClick={() => editDoctor(item)}>{t("Modifier", "Bewerken")}</button>
                    <button className={styles.dangerButton} type="button" onClick={() => void deleteItem(item.id)} disabled={saving}>{t("Supprimer", "Verwijderen")}</button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {isDataSection(activeSection) && !loading && pagination.totalPages > 1 && (
            <nav className={styles.pagination} aria-label={t("Pagination des résultats", "Paginering van de resultaten")}>
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => void loadItems(activeSection, pagination.page - 1)}
              >
                {t("Précédent", "Vorige")}
              </button>
              <span>
                {t(`Page ${pagination.page} sur ${pagination.totalPages} · ${pagination.total} éléments`, `Pagina ${pagination.page} van ${pagination.totalPages} · ${pagination.total} elementen`)}
              </span>
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => void loadItems(activeSection, pagination.page + 1)}
              >
                {t("Suivant", "Volgende")}
              </button>
            </nav>
          )}
        </section>

      {appointmentAction && (
        <div className={reservationStyles.overlay} onClick={(event) => { if (event.target === event.currentTarget) setAppointmentAction(null); }}>
          <form
            className={reservationStyles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-appointment-action-title"
            onSubmit={(event) => { event.preventDefault(); void submitAppointmentAction(); }}
          >
            <h2 className={reservationStyles.modalTitle} id="dashboard-appointment-action-title">
              {appointmentAction.mode === "confirm" ? t("Confirmer le rendez-vous", "Afspraak bevestigen") : t("Proposer un autre créneau", "Een ander tijdstip voorstellen")}
            </h2>
            <p className={reservationStyles.modalSub}>
              {asText(appointmentAction.item.firstName, t("Patient", "Patiënt"))} {asText(appointmentAction.item.lastName, "")} — {asText(appointmentAction.item.care, t("Soin à préciser", "Behandeling nog te bepalen"))}
            </p>
            <div className={reservationStyles.grid2}>
              <label className={reservationStyles.field}>
                {t("Date", "Datum")}
                <input className={reservationStyles.input} required type="date" value={appointmentDraft.day} onChange={(event) => setAppointmentDraft((current) => ({ ...current, day: event.target.value }))} />
              </label>
              <label className={reservationStyles.field}>
                {t("Heure", "Uur")}
                <input className={reservationStyles.input} required type="time" value={appointmentDraft.time} onChange={(event) => setAppointmentDraft((current) => ({ ...current, time: event.target.value }))} />
              </label>
            </div>
            {appointmentAction.mode === "confirm" && (
              <label className={reservationStyles.field}>
                {t("Durée (minutes)", "Duur (minuten)")}
                <input className={reservationStyles.input} required min="5" step="5" type="number" value={appointmentDraft.duration} onChange={(event) => setAppointmentDraft((current) => ({ ...current, duration: event.target.value }))} />
              </label>
            )}
            <label className={reservationStyles.field}>
              {t("Message au patient (optionnel)", "Bericht aan de patiënt (optioneel)")}
              <textarea className={reservationStyles.input} rows={3} value={appointmentDraft.message} onChange={(event) => setAppointmentDraft((current) => ({ ...current, message: event.target.value }))} />
            </label>
            <div className={reservationStyles.modalActions}>
              <button className={reservationStyles.ghost} type="button" onClick={() => setAppointmentAction(null)}>{t("Fermer", "Sluiten")}</button>
              <button className={reservationStyles.primary} type="submit" disabled={saving || !appointmentDraft.day || !appointmentDraft.time}>
                {saving ? t("Envoi…", "Verzenden…") : appointmentAction.mode === "confirm" ? t("Confirmer + e-mail", "Bevestigen + e-mail") : t("Proposer + e-mail", "Voorstellen + e-mail")}
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminShell>
  );
}
