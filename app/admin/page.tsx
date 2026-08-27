"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./admin.module.css";
import DashboardNavigation from "./dashboard-navigation";
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

const sections: Array<{ id: AdminSection; label: string; icon: string }> = [
  { id: "reviews", label: "Avis", icon: "☆" },
  { id: "doctors", label: "Cabinet / Équipe", icon: "+" },
  { id: "forms", label: "Formulaires", icon: "▤" },
  { id: "site", label: "Informations du site", icon: "↗" },
  { id: "contacts", label: "Messages", icon: "✉" },
  { id: "blocked-ips", label: "Adresses IP bloquées", icon: "⊘" },
  { id: "overview", label: "Vue d’ensemble", icon: "⌂" },
];

const hashSections = new Set<AdminSection>(["overview", "reviews", "doctors", "forms", "site", "contacts", "blocked-ips"]);

const formLabels: Record<FormType, { name: string; href: string }> = {
  contact: { name: "Formulaire de contact", href: "/contact" },
  appointment: { name: "Formulaire de rendez-vous", href: "/rendez-vous" },
};

const lockedFormFields: Record<FormType, ReadonlySet<string>> = {
  contact: new Set(["name", "email", "subject", "message"]),
  appointment: new Set(["firstName", "lastName", "email", "phone", "day", "consent"]),
};

const sitePages = [
  ["Accueil", "/"],
  ["Nos soins", "/soins"],
  ["Le cabinet", "/cabinet"],
  ["Nouveau patient", "/nouveau-patient"],
  ["Conseils & FAQ", "/conseils"],
  ["Contact", "/contact"],
  ["Prendre rendez-vous", "/rendez-vous"],
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

const appointmentStatusMeta: Record<AppointmentStatus, { label: string; background: string; color: string }> = {
  pending: { label: "En attente", background: "#fdf3d8", color: "#8a6d1a" },
  confirmed: { label: "Confirmé", background: "#dcefe3", color: "#2f6f4f" },
  completed: { label: "Terminé", background: "#ecebe6", color: "#62665f" },
  cancelled: { label: "Annulé", background: "#f7e4df", color: "#8b3428" },
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

function formatDate(value: unknown) {
  if (typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-BE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function dateOnly(value: unknown) {
  if (typeof value !== "string") return "";
  return value.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "";
}

function appointmentClock(item: AdminItem) {
  const confirmedTime = asText(item.slotTime, "");
  if (/^\d{2}:\d{2}/.test(confirmedTime)) return confirmedTime.slice(0, 5);
  return asText(item.time, "À préciser");
}

function appointmentTimestamp(item: AdminItem) {
  const day = dateOnly(item.day);
  if (!day) return Number.POSITIVE_INFINITY;
  const slot = asText(item.slotTime, "").match(/^\d{2}:\d{2}/)?.[0] ?? "23:59";
  const timestamp = new Date(`${day}T${slot}:00`).getTime();
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function isUpcomingAppointment(item: AdminItem) {
  return item.status === "confirmed" && appointmentTimestamp(item) >= Date.now();
}

function formatAppointmentDay(value: unknown) {
  const day = dateOnly(value);
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

function appointmentStatus(value: unknown): AppointmentStatus {
  return value === "confirmed" || value === "completed" || value === "cancelled" ? value : "pending";
}

async function getErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string; message?: string };
    return payload.error ?? payload.message ?? "Une erreur est survenue.";
  } catch {
    return "Une erreur est survenue.";
  }
}

export default function AdminPage() {
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
  const [credentials, setCredentials] = useState({ username: "", password: "" });
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
        if (failedResponse) throw new Error(await getErrorMessage(failedResponse));

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
            .filter(isUpcomingAppointment)
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
        if (!response.ok) throw new Error(await getErrorMessage(response));
        const payload = (await response.json()) as { settings?: ClinicSettings };
        if (!payload.settings) throw new Error("Informations du cabinet incomplètes.");
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
        if (!response.ok) throw new Error(await getErrorMessage(response));

        const payload = (await response.json()) as { forms?: FormConfigs };
        if (!payload.forms?.contact || !payload.forms?.appointment) {
          throw new Error("Configuration des formulaires incomplète.");
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

      if (!response.ok) throw new Error(await getErrorMessage(response));

      const payload = (await response.json()) as { items?: AdminItem[]; pagination?: Pagination };
      setItems(Array.isArray(payload.items) ? payload.items : []);
      const nextPagination = payload.pagination ?? { ...emptyPagination, total: payload.items?.length ?? 0 };
      setPagination(nextPagination);
      currentPage.current = nextPagination.page;
      setAuthenticated(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Impossible de charger les données.");
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

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) throw new Error(await getErrorMessage(response));

      setCredentials({ username: "", password: "" });
      setAuthenticated(true);
      await loadItems(activeSection);
    } catch (requestError) {
      setAuthenticated(false);
      setError(requestError instanceof Error ? requestError.message : "Connexion impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setSaving(true);
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      setAuthenticated(false);
      setItems([]);
      setSaving(false);
    }
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
      if (!response.ok) throw new Error(payload.error || "Impossible de mettre à jour la réservation.");

      const mode = appointmentAction.mode;
      setAppointmentAction(null);
      notifyAppointmentUpdate();
      await loadItems("overview");
      const warnings: string[] = [];
      if (payload.emailSent === false) warnings.push("l’e-mail au patient n’a pas été envoyé");
      if (mode === "confirm" && payload.calendarConfigured === false) warnings.push("Google Agenda n’est pas configuré");
      if (mode === "confirm" && payload.calendarConfigured && payload.calendarSynced === false) warnings.push("la synchronisation Google Agenda a échoué");
      setNotice(warnings.length > 0
        ? `Réservation enregistrée, mais ${warnings.join(" et ")}.`
        : mode === "confirm" ? "Réservation confirmée et ajoutée à l’Agenda." : "Nouveau créneau proposé au patient.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Impossible de mettre à jour la réservation.");
    } finally {
      setSaving(false);
    }
  }

  async function cancelAppointment(item: AdminItem) {
    const patient = `${asText(item.firstName, "Patient")} ${asText(item.lastName, "")}`.trim();
    if (!window.confirm(`Annuler la réservation de ${patient} et prévenir le patient par e-mail ?`)) return;
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
      if (!response.ok) throw new Error(payload.error || "Impossible d’annuler la réservation.");
      notifyAppointmentUpdate();
      await loadItems("overview");
      setNotice(payload.emailSent === false
        ? "Réservation annulée, mais l’e-mail au patient n’a pas été envoyé."
        : "Réservation annulée et patient prévenu.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Impossible d’annuler la réservation.");
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
      if (!response.ok) throw new Error(await getErrorMessage(response));
      await loadItems(activeSection);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Mise à jour impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: string | number) {
    if (!isDataSection(activeSection)) return;
    if (!window.confirm("Supprimer définitivement cet élément ?")) return;
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
      if (!response.ok) throw new Error(await getErrorMessage(response));
      await loadItems(activeSection);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Suppression impossible.");
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
      if (!response.ok) throw new Error(await getErrorMessage(response));
      setBlockedIpDraft("");
      await loadItems("blocked-ips");
      setNotice("Adresse IP bloquée.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Impossible de bloquer cette adresse IP.");
    } finally {
      setSaving(false);
    }
  }

  async function unblockIp(id: string | number, ipAddress: string) {
    if (!window.confirm(`Débloquer l’adresse IP ${ipAddress} ?`)) return;
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
      if (!response.ok) throw new Error(await getErrorMessage(response));
      await loadItems("blocked-ips");
      setNotice("Adresse IP débloquée.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Impossible de débloquer cette adresse IP.");
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
      if (!response.ok) throw new Error(await getErrorMessage(response));

      setShowReviewForm(false);
      setEditingReviewId(null);
      setReviewDraft(emptyReview);
      await loadItems("reviews");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Enregistrement impossible.");
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
      if (!response.ok) throw new Error(await getErrorMessage(response));

      setShowDoctorForm(false);
      setEditingDoctorId(null);
      setDoctorDraft(emptyDoctor);
      await loadItems("doctors");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Enregistrement impossible.");
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
      if (!response.ok) throw new Error(await getErrorMessage(response));

      const payload = (await response.json()) as { form?: FormConfig };
      if (payload.form) updateFormConfig(formType, payload.form);
      setNotice(`${formLabels[formType].name} enregistré.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Enregistrement impossible.");
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
      if (!response.ok) throw new Error(await getErrorMessage(response));
      const payload = (await response.json()) as { settings?: ClinicSettings };
      setClinicSettings(payload.settings ?? clinicSettings);
      setNotice("Informations du cabinet enregistrées.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Enregistrement impossible.");
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
      type: "Message",
      title: asText(item.name, "Nouveau message"),
      detail: asText(item.subject, "Sans objet"),
      date: item.createdAt,
    })),
    ...overviewData.appointments.map((item) => ({
      id: `appointment-${item.id}`,
      href: "/admin/reservations",
      type: "Réservation",
      title: `${asText(item.firstName, "Patient")} ${asText(item.lastName, "")}`.trim(),
      detail: asText(item.care, "Soin à préciser"),
      date: item.createdAt,
    })),
    ...overviewData.reviews.map((item) => ({
      id: `review-${item.id}`,
      section: "reviews" as AdminSection,
      type: "Avis",
      title: asText(item.name, "Nouvel avis"),
      detail: `${asText(item.rating, "5")} / 5`,
      date: item.createdAt,
    })),
  ]
    .sort((a, b) => new Date(asText(b.date, "0")).getTime() - new Date(asText(a.date, "0")).getTime())
    .slice(0, 6);

  if (authenticated === null) {
    return (
      <main id="main-content" tabIndex={-1} className={styles.loginPage}>
        <div className={styles.loadingCard}>Vérification de la session…</div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main id="main-content" tabIndex={-1} className={styles.loginPage}>
        <section className={styles.loginCard} aria-labelledby="admin-login-title">
          <div className={styles.brand}>CURA</div>
          <p className={styles.eyebrow}>Administration</p>
          <h1 id="admin-login-title">Connexion</h1>
          <p className={styles.loginCopy}>Accédez aux demandes, rendez-vous et avis du cabinet.</p>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <label>
              E-mail
              <input
                required
                type="email"
                autoComplete="username"
                value={credentials.username}
                onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))}
              />
            </label>
            <label>
              Mot de passe
              <input
                required
                type="password"
                autoComplete="current-password"
                value={credentials.password}
                onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
              />
            </label>
            <button className={styles.primaryButton} type="submit" disabled={saving}>
              {saving ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main id="main-content" tabIndex={-1} className={styles.dashboard}>
      <header className={styles.topbar}>
        <div>
          <span className={styles.brand}>CURA</span>
          <span className={styles.adminLabel}>Administration</span>
        </div>
        <div className={styles.topbarActions}>
          <a className={styles.topbarLink} href="/" target="_blank" rel="noreferrer">Voir le site</a>
          <button className={styles.secondaryButton} type="button" onClick={handleLogout} disabled={saving}>
            Se déconnecter
          </button>
        </div>
      </header>

      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarIntro}>
            <p>Navigation</p>
            <strong>Gestion du cabinet</strong>
          </div>
          <DashboardNavigation
            activeSection={activeSection}
            onSectionChange={(section) => {
              setShowReviewForm(false);
              setShowDoctorForm(false);
              setActiveSection(section as AdminSection);
            }}
          />
          <div className={styles.sidebarFooter}>
            <span>Connecté en tant que</span>
            <strong>Administrateur</strong>
          </div>
        </aside>

        <section className={styles.content}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Tableau de bord</p>
              <h1>{sections.find((section) => section.id === activeSection)?.label}</h1>
              <p>
                {loading
                  ? "Chargement…"
                  : activeSection === "overview"
                    ? `${totalItems} éléments gérés`
                    : activeSection === "forms"
                      ? `${formConfigs ? 2 : 0} formulaires configurés`
                    : activeSection === "site"
                      ? "Coordonnées et pages publiques"
                      : `${pagination.total} élément${pagination.total === 1 ? "" : "s"}`}
              </p>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.secondaryButton} type="button" onClick={() => void loadItems(activeSection)} disabled={loading}>
                {loading ? "Actualisation…" : "Actualiser"}
              </button>
              {activeSection === "reviews" && (
                <button className={styles.primaryButton} type="button" onClick={startReview}>
                  Ajouter un avis
                </button>
              )}
              {activeSection === "doctors" && (
                <button className={styles.primaryButton} type="button" onClick={startDoctor}>
                  Ajouter un membre
                </button>
              )}
            </div>
          </div>

          {error && <p className={styles.error} role="alert">{error}</p>}
          {notice && <p className={styles.notice} role="status">{notice}</p>}

          {activeSection === "reviews" && showReviewForm && (
            <form className={styles.reviewForm} onSubmit={saveReview}>
              <div className={styles.formHeading}>
                <h2>{editingReviewId === null ? "Nouvel avis" : "Modifier l’avis"}</h2>
                <button type="button" className={styles.textButton} onClick={() => setShowReviewForm(false)}>Fermer</button>
              </div>
              <div className={styles.formGrid}>
                <label>
                  Nom
                  <input required value={reviewDraft.name} onChange={(event) => setReviewDraft((current) => ({ ...current, name: event.target.value }))} />
                </label>
                <label>
                  Note
                  <select value={reviewDraft.rating} onChange={(event) => setReviewDraft((current) => ({ ...current, rating: event.target.value }))}>
                    {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
                  </select>
                </label>
                <label>
                  Langue
                  <select value={reviewDraft.language} onChange={(event) => setReviewDraft((current) => ({ ...current, language: event.target.value as "fr" | "nl" }))}>
                    <option value="fr">Français</option>
                    <option value="nl">Nederlands</option>
                  </select>
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={reviewDraft.published} onChange={(event) => setReviewDraft((current) => ({ ...current, published: event.target.checked }))} />
                  Publié sur le site
                </label>
                <label className={styles.fullField}>
                  Témoignage
                  <textarea required rows={4} value={reviewDraft.quote} onChange={(event) => setReviewDraft((current) => ({ ...current, quote: event.target.value }))} />
                </label>
              </div>
              <button className={styles.primaryButton} type="submit" disabled={saving}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </form>
          )}

          {activeSection === "doctors" && showDoctorForm && (
            <form className={styles.reviewForm} onSubmit={saveDoctor}>
              <div className={styles.formHeading}>
                <h2>{editingDoctorId === null ? "Nouveau membre" : "Modifier le membre"}</h2>
                <button type="button" className={styles.textButton} onClick={() => setShowDoctorForm(false)}>Fermer</button>
              </div>
              <div className={`${styles.formGrid} ${styles.doctorFormGrid}`}>
                <label>
                  Initiales
                  <input required maxLength={4} value={doctorDraft.initials} onChange={(event) => setDoctorDraft((current) => ({ ...current, initials: event.target.value.toUpperCase() }))} />
                </label>
                <label>
                  Ordre
                  <input required type="number" min="0" max="999" value={doctorDraft.order} onChange={(event) => setDoctorDraft((current) => ({ ...current, order: event.target.value }))} />
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={doctorDraft.published} onChange={(event) => setDoctorDraft((current) => ({ ...current, published: event.target.checked }))} />
                  Visible sur le site
                </label>
                <span />
                <label>
                  Nom en français
                  <input required value={doctorDraft.nameFr} onChange={(event) => setDoctorDraft((current) => ({ ...current, nameFr: event.target.value }))} />
                </label>
                <label>
                  Naam in het Nederlands
                  <input required value={doctorDraft.nameNl} onChange={(event) => setDoctorDraft((current) => ({ ...current, nameNl: event.target.value }))} />
                </label>
                <label>
                  Fonction en français
                  <input required value={doctorDraft.roleFr} onChange={(event) => setDoctorDraft((current) => ({ ...current, roleFr: event.target.value }))} />
                </label>
                <label>
                  Functie in het Nederlands
                  <input required value={doctorDraft.roleNl} onChange={(event) => setDoctorDraft((current) => ({ ...current, roleNl: event.target.value }))} />
                </label>
                <label className={styles.doctorBioField}>
                  Présentation en français
                  <textarea required rows={3} value={doctorDraft.bioFr} onChange={(event) => setDoctorDraft((current) => ({ ...current, bioFr: event.target.value }))} />
                </label>
                <label className={styles.doctorBioField}>
                  Beschrijving in het Nederlands
                  <textarea required rows={3} value={doctorDraft.bioNl} onChange={(event) => setDoctorDraft((current) => ({ ...current, bioNl: event.target.value }))} />
                </label>
              </div>
              <button className={styles.primaryButton} type="submit" disabled={saving}>
                {saving ? "Enregistrement…" : "Enregistrer le membre"}
              </button>
            </form>
          )}

          {activeSection === "overview" ? (
            loading ? (
              <div className={styles.emptyState}>Chargement des données…</div>
            ) : (
              <>
                <div className={styles.prioritySections}>
                  <section className={styles.prioritySection} aria-labelledby="reservations-overview-title">
                    <div className={styles.priorityHeader}>
                      <div>
                        <p className={styles.eyebrow}>Réservations</p>
                        <h2 id="reservations-overview-title">Vue complète des réservations</h2>
                        <p>Les demandes en attente sont affichées en premier, avec leur statut et les actions essentielles.</p>
                      </div>
                      <div className={styles.priorityHeaderAside}>
                        <span>{pendingAppointments} en attente</span>
                        <Link className={styles.panelLink} href="/admin/reservations">
                          Voir toutes les réservations <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </div>
                    <div className={reservationStyles.card}>
                      <div className={reservationStyles.tableWrap} role="region" aria-label="Aperçu complet des réservations" tabIndex={0}>
                        <table className={`${reservationStyles.table} ${styles.dashboardReservationTable}`}>
                          <caption className={styles.tableCaption}>Réservations récentes et en attente de traitement</caption>
                          <thead>
                            <tr>
                              <th>Patient</th>
                              <th>Contact</th>
                              <th>Soin</th>
                              <th>Date</th>
                              <th>Heure</th>
                              <th>Durée</th>
                              <th>Statut</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {appointmentPreviews.reservations.length === 0 ? (
                              <tr>
                                <td className={reservationStyles.empty} colSpan={8}>Aucune réservation pour le moment.</td>
                              </tr>
                            ) : appointmentPreviews.reservations.map((item) => {
                              const status = appointmentStatus(item.status);
                              const meta = appointmentStatusMeta[status];
                              const time = status === "confirmed" ? appointmentClock(item) : asText(item.time, "À préciser");
                              return (
                                <tr key={item.id}>
                                  <td><span className={reservationStyles.name}>{asText(item.firstName, "Patient")} {asText(item.lastName, "")}</span></td>
                                  <td>
                                    {asText(item.email, "E-mail à préciser")}
                                    <br />
                                    <span className={reservationStyles.muted}>{asText(item.phone, "Téléphone à préciser")}</span>
                                  </td>
                                  <td>{asText(item.care, "Soin à préciser")}</td>
                                  <td><strong className={styles.tableDate}>{formatAppointmentDay(item.day)}</strong></td>
                                  <td>{time}</td>
                                  <td>{status === "confirmed" ? `${asText(item.durationMin, "30")} min` : "À confirmer"}</td>
                                  <td>
                                    <span className={reservationStyles.badge} style={{ background: meta.background, color: meta.color }}>
                                      {meta.label}
                                    </span>
                                  </td>
                                  <td>
                                    <div className={reservationStyles.actions}>
                                      {status === "pending" && (
                                        <>
                                          <button className={`${reservationStyles.btn} ${reservationStyles.btnConfirm}`} type="button" onClick={() => openAppointmentAction(item, "confirm")} disabled={saving}>Confirmer</button>
                                          <button className={`${reservationStyles.btn} ${reservationStyles.btnPropose}`} type="button" onClick={() => openAppointmentAction(item, "propose")} disabled={saving}>Proposer</button>
                                        </>
                                      )}
                                      {(status === "pending" || status === "confirmed") && (
                                        <button className={`${reservationStyles.btn} ${reservationStyles.btnCancel}`} type="button" onClick={() => void cancelAppointment(item)} disabled={saving}>Annuler</button>
                                      )}
                                      {(status === "completed" || status === "cancelled") && <span className={reservationStyles.muted}>Aucune action</span>}
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
                        <p className={styles.eyebrow}>Agenda</p>
                        <h2 id="agenda-overview-title">Prochaines réservations</h2>
                        <p>Les réservations confirmées à venir, classées par date et heure.</p>
                      </div>
                      <div className={styles.priorityHeaderAside}>
                        <span>{appointmentPreviews.upcoming.length} à venir</span>
                        <Link className={styles.panelLink} href="/admin/agenda">
                          Ouvrir l’agenda <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </div>
                    <div className={reservationStyles.card}>
                      <div className={reservationStyles.tableWrap} role="region" aria-label="Agenda des réservations à venir" tabIndex={0}>
                        <table className={`${reservationStyles.table} ${styles.dashboardAgendaTable}`}>
                          <caption className={styles.tableCaption}>Réservations confirmées à venir</caption>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Heure</th>
                              <th>Durée</th>
                              <th>Patient</th>
                              <th>Soin</th>
                              <th>Statut</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {appointmentPreviews.upcoming.length === 0 ? (
                              <tr>
                                <td className={reservationStyles.empty} colSpan={7}>Aucune réservation confirmée à venir.</td>
                              </tr>
                            ) : appointmentPreviews.upcoming.map((item) => {
                              const status = appointmentStatus(item.status);
                              const meta = appointmentStatusMeta[status];
                              const day = dateOnly(item.day);
                              const time = appointmentClock(item);
                              const dateTime = day && /^\d{2}:\d{2}$/.test(time) ? `${day}T${time}` : day || undefined;
                              return (
                                <tr key={item.id}>
                                  <td>
                                    <time className={styles.tableDate} dateTime={dateTime}>{formatAppointmentDay(item.day)}</time>
                                  </td>
                                  <td>{time}</td>
                                  <td>{asText(item.durationMin, "30")} min</td>
                                  <td>
                                    <span className={reservationStyles.name}>{asText(item.firstName, "Patient")} {asText(item.lastName, "")}</span>
                                    <br />
                                    <span className={reservationStyles.muted}>{asText(item.email, "Coordonnées à préciser")}</span>
                                  </td>
                                  <td>{asText(item.care, "Soin à préciser")}</td>
                                  <td>
                                    <span className={reservationStyles.badge} style={{ background: meta.background, color: meta.color }}>
                                      {meta.label}
                                    </span>
                                  </td>
                                  <td>
                                    <div className={reservationStyles.actions}>
                                      <button className={`${reservationStyles.btn} ${reservationStyles.btnCancel}`} type="button" onClick={() => void cancelAppointment(item)} disabled={saving}>Annuler</button>
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
                    <span>Messages</span>
                    <strong>{overviewTotals.contacts}</strong>
                    <small>{newMessages} nouveau{newMessages === 1 ? "" : "x"}</small>
                  </button>
                  <Link className={styles.statCard} href="/admin/reservations">
                    <span>Réservations</span>
                    <strong>{overviewTotals.appointments}</strong>
                    <small>{pendingAppointments} à traiter</small>
                  </Link>
                  <button type="button" className={styles.statCard} onClick={() => setActiveSection("reviews")}>
                    <span>Avis</span>
                    <strong>{overviewTotals.reviews}</strong>
                    <small>{publishedReviews} publié{publishedReviews === 1 ? "" : "s"}</small>
                  </button>
                  <button type="button" className={styles.statCard} onClick={() => setActiveSection("doctors")}>
                    <span>Équipe</span>
                    <strong>{overviewTotals.doctors}</strong>
                    <small>membres du cabinet</small>
                  </button>
                </div>

                <div className={styles.overviewGrid}>
                  <section className={styles.overviewPanel}>
                    <div className={styles.panelHeading}>
                      <div>
                        <p className={styles.eyebrow}>Aujourd’hui</p>
                        <h2>Activité récente</h2>
                      </div>
                      <span>{recentActivity.length} entrées</span>
                    </div>
                    {recentActivity.length === 0 ? (
                      <p className={styles.panelEmpty}>Aucune activité pour le moment.</p>
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
                              <time>{formatDate(activity.date)}</time>
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
                        <p className={styles.eyebrow}>Raccourcis</p>
                        <h2>Actions rapides</h2>
                      </div>
                    </div>
                    <div className={styles.quickActions}>
                      <Link href="/admin/reservations">
                        <strong>Gérer les réservations</strong>
                        <span>Confirmer ou annuler une demande</span>
                      </Link>
                      <button type="button" onClick={() => setActiveSection("contacts")}>
                        <strong>Lire les messages</strong>
                        <span>Répondre aux demandes des patients</span>
                      </button>
                      <button type="button" onClick={() => { setActiveSection("reviews"); setShowReviewForm(true); }}>
                        <strong>Ajouter un avis</strong>
                        <span>Publier un témoignage sur le site</span>
                      </button>
                      <button type="button" onClick={() => setActiveSection("doctors")}>
                        <strong>Gérer l’équipe</strong>
                        <span>Ajouter ou modifier les médecins</span>
                      </button>
                      <button type="button" onClick={() => setActiveSection("forms")}>
                        <strong>Modifier les formulaires</strong>
                        <span>Gérer les textes et les champs publics</span>
                      </button>
                      <button type="button" onClick={() => setActiveSection("site")}>
                        <strong>Voir les pages</strong>
                        <span>Ouvrir une page du site</span>
                      </button>
                    </div>
                  </aside>
                </div>
              </>
            )
          ) : activeSection === "forms" ? (
            loading ? (
              <div className={styles.emptyState}>Chargement des formulaires…</div>
            ) : !formConfigs ? (
              <div className={styles.emptyState}>Aucune configuration disponible.</div>
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
                          <h2>{meta.name}</h2>
                          <a href={meta.href} target="_blank" rel="noreferrer">Voir la page ↗</a>
                        </div>
                        <label className={styles.formSwitch}>
                          <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={(event) => updateFormConfig(formType, { enabled: event.target.checked })}
                          />
                          Formulaire actif
                        </label>
                      </div>

                      <div className={styles.formSettingsGrid}>
                        <label>
                          Titre en français
                          <input required value={config.titleFr} onChange={(event) => updateFormConfig(formType, { titleFr: event.target.value })} />
                        </label>
                        <label>
                          Titel in het Nederlands
                          <input required value={config.titleNl} onChange={(event) => updateFormConfig(formType, { titleNl: event.target.value })} />
                        </label>
                        <label>
                          Introduction en français
                          <textarea rows={3} value={config.descriptionFr} onChange={(event) => updateFormConfig(formType, { descriptionFr: event.target.value })} />
                        </label>
                        <label>
                          Introductie in het Nederlands
                          <textarea rows={3} value={config.descriptionNl} onChange={(event) => updateFormConfig(formType, { descriptionNl: event.target.value })} />
                        </label>
                        <label>
                          Bouton en français
                          <input required value={config.submitLabelFr} onChange={(event) => updateFormConfig(formType, { submitLabelFr: event.target.value })} />
                        </label>
                        <label>
                          Knop in het Nederlands
                          <input required value={config.submitLabelNl} onChange={(event) => updateFormConfig(formType, { submitLabelNl: event.target.value })} />
                        </label>
                      </div>

                      <div className={styles.fieldsHeading}>
                        <div>
                          <h3>Champs du formulaire</h3>
                          <p>Les clés techniques restent fixes pour conserver les envois existants.</p>
                        </div>
                        <span>{config.fields.length} champs</span>
                      </div>

                      <div className={styles.formFields}>
                        {[...config.fields].sort((a, b) => a.order - b.order).map((field) => (
                          <article className={styles.formFieldCard} key={field.key}>
                            <div className={styles.formFieldHeader}>
                              <div className={styles.fieldKey}>
                                <code>{field.key}</code>
                                {lockedFormFields[formType].has(field.key) && <span>Champ essentiel</span>}
                              </div>
                              <div className={styles.fieldOptions}>
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={field.visible}
                                    disabled={lockedFormFields[formType].has(field.key)}
                                    onChange={(event) => updateFormField(formType, field.key, { visible: event.target.checked })}
                                  />
                                  Visible
                                </label>
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={field.required}
                                    disabled={lockedFormFields[formType].has(field.key)}
                                    onChange={(event) => updateFormField(formType, field.key, { required: event.target.checked })}
                                  />
                                  Obligatoire
                                </label>
                              </div>
                            </div>
                            <div className={styles.fieldEditGrid}>
                              <label>
                                Libellé FR
                                <input required value={field.labelFr} onChange={(event) => updateFormField(formType, field.key, { labelFr: event.target.value })} />
                              </label>
                              <label>
                                Libellé NL
                                <input required value={field.labelNl} onChange={(event) => updateFormField(formType, field.key, { labelNl: event.target.value })} />
                              </label>
                              <label>
                                Placeholder FR
                                <input value={field.placeholderFr} onChange={(event) => updateFormField(formType, field.key, { placeholderFr: event.target.value })} />
                              </label>
                              <label>
                                Placeholder NL
                                <input value={field.placeholderNl} onChange={(event) => updateFormField(formType, field.key, { placeholderNl: event.target.value })} />
                              </label>
                              <label className={styles.orderField}>
                                Ordre
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
                        <a className={styles.secondaryButton} href={meta.href} target="_blank" rel="noreferrer">Prévisualiser</a>
                        <button className={styles.primaryButton} type="submit" disabled={saving}>
                          {saving ? "Enregistrement…" : "Enregistrer le formulaire"}
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
                      <p className={styles.eyebrow}>Informations publiques</p>
                      <h2>Coordonnées du cabinet</h2>
                    </div>
                    <a href="/contact" target="_blank" rel="noreferrer">Prévisualiser</a>
                  </div>
                  <div className={styles.formSettingsGrid}>
                    <label>
                      Téléphone
                      <input type="tel" required value={clinicSettings.phoneDisplay} onChange={(event) => setClinicSettings((current) => ({ ...(current ?? emptyClinicSettings), phoneDisplay: event.target.value }))} />
                    </label>
                    <label>
                      E-mail
                      <input type="email" required value={clinicSettings.email} onChange={(event) => setClinicSettings((current) => ({ ...(current ?? emptyClinicSettings), email: event.target.value }))} />
                    </label>
                    <label>
                      Horaires courts — FR
                      <input required value={clinicSettings.scheduleFr} onChange={(event) => setClinicSettings((current) => ({ ...(current ?? emptyClinicSettings), scheduleFr: event.target.value }))} />
                    </label>
                    <label>
                      Korte openingsuren — NL
                      <input required value={clinicSettings.scheduleNl} onChange={(event) => setClinicSettings((current) => ({ ...(current ?? emptyClinicSettings), scheduleNl: event.target.value }))} />
                    </label>
                    <label>
                      Urgences — FR
                      <input required value={clinicSettings.emergencyFr} onChange={(event) => setClinicSettings((current) => ({ ...(current ?? emptyClinicSettings), emergencyFr: event.target.value }))} />
                    </label>
                    <label>
                      Spoed — NL
                      <input required value={clinicSettings.emergencyNl} onChange={(event) => setClinicSettings((current) => ({ ...(current ?? emptyClinicSettings), emergencyNl: event.target.value }))} />
                    </label>
                  </div>
                  <div className={styles.formConfigActions}>
                    <span className={styles.settingsHint}>Ces informations apparaissent dans l’en-tête, le contact et le pied de page.</span>
                    <button className={styles.primaryButton} type="submit" disabled={saving}>
                      {saving ? "Enregistrement…" : "Enregistrer les informations"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className={styles.emptyState}>Chargement des informations…</div>
              )}
              <div className={styles.siteGrid}>
                {sitePages.map(([label, href]) => (
                  <a key={href} className={styles.siteCard} href={href} target="_blank" rel="noreferrer">
                    <span>
                      <strong>{label}</strong>
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
                    <p className={styles.eyebrow}>Sécurité des réservations</p>
                    <h2>Bloquer une adresse IP</h2>
                  </div>
                </div>
                <div className={styles.formSettingsGrid}>
                  <label className={styles.fullField}>
                    Adresse IPv4 ou IPv6
                    <input
                      required
                      maxLength={45}
                      value={blockedIpDraft}
                      onChange={(event) => setBlockedIpDraft(event.target.value)}
                      placeholder="192.0.2.10 ou 2001:db8::10"
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                    />
                  </label>
                </div>
                <div className={styles.formConfigActions}>
                  <span className={styles.settingsHint}>Les nouvelles demandes de rendez-vous provenant de cette adresse seront refusées.</span>
                  <button className={styles.primaryButton} type="submit" disabled={saving || !blockedIpDraft.trim()}>
                    {saving ? "Blocage…" : "Bloquer l’adresse IP"}
                  </button>
                </div>
              </form>

              {loading ? (
                <div className={styles.emptyState}>Chargement des adresses IP…</div>
              ) : items.length === 0 ? (
                <div className={styles.emptyState}>Aucune adresse IP bloquée.</div>
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
                              <p>Adresse IP bloquée</p>
                            </div>
                            <time>{formatDate(item.createdAt)}</time>
                          </div>
                        </div>
                        <div className={styles.recordActions}>
                          <button className={styles.dangerButton} type="button" onClick={() => void unblockIp(item.id, ipAddress)} disabled={saving}>
                            Débloquer
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          ) : loading ? (
            <div className={styles.emptyState}>Chargement des données…</div>
          ) : items.length === 0 ? (
            <div className={styles.emptyState}>Aucun élément pour le moment.</div>
          ) : activeSection === "contacts" ? (
            <div className={styles.records}>
              {items.map((item) => (
                <article className={styles.record} key={item.id}>
                  <div className={styles.recordMain}>
                    <div className={styles.recordHeading}>
                      <div>
                        <h2>{asText(item.name)}</h2>
                        <p>{asText(item.subject, "Sans objet")}</p>
                      </div>
                      <time>{formatDate(item.createdAt)}</time>
                    </div>
                    <div className={styles.contactLinks}>
                      <a href={`mailto:${asText(item.email, "")}`}>{asText(item.email)}</a>
                      {Boolean(item.phone) && <a href={`tel:${asText(item.phone, "")}`}>{asText(item.phone)}</a>}
                      {Boolean(item.language) && <span>{asText(item.language).toUpperCase()}</span>}
                    </div>
                    <p className={styles.message}>{asText(item.message)}</p>
                  </div>
                  <div className={styles.recordActions}>
                    <label>
                      Statut
                      <select value={asText(item.status, "new")} onChange={(event) => void updateItem(item.id, { status: event.target.value })} disabled={saving}>
                        <option value="new">Nouveau</option>
                        <option value="read">Lu</option>
                        <option value="archived">Archivé</option>
                      </select>
                    </label>
                    <button className={styles.dangerButton} type="button" onClick={() => void deleteItem(item.id)} disabled={saving}>Supprimer</button>
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
                        <p>{asText(item.care, "Soin à préciser")}</p>
                      </div>
                      <time>{formatDate(item.createdAt)}</time>
                    </div>
                    <div className={styles.detailGrid}>
                      <p><span>Date souhaitée</span><strong>{asText(item.day)}</strong></p>
                      <p><span>Moment</span><strong>{asText(item.time)}</strong></p>
                      <p><span>E-mail</span><a href={`mailto:${asText(item.email, "")}`}>{asText(item.email)}</a></p>
                      <p><span>Téléphone</span><a href={`tel:${asText(item.phone, "")}`}>{asText(item.phone)}</a></p>
                    </div>
                    {Boolean(item.note) && <p className={styles.message}>{asText(item.note)}</p>}
                  </div>
                  <div className={styles.recordActions}>
                    <label>
                      Statut
                      <select value={asText(item.status, "pending")} onChange={(event) => void updateItem(item.id, { status: event.target.value })} disabled={saving}>
                        <option value="pending">À traiter</option>
                        <option value="confirmed">Confirmé</option>
                        <option value="completed">Terminé</option>
                        <option value="cancelled">Annulé</option>
                      </select>
                    </label>
                    <button className={styles.dangerButton} type="button" onClick={() => void deleteItem(item.id)} disabled={saving}>Supprimer</button>
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
                    <span className={item.published ? styles.published : styles.hidden}>{item.published ? "Publié" : "Masqué"}</span>
                  </div>
                  <blockquote>« {asText(item.quote)} »</blockquote>
                  <div className={styles.reviewByline}>
                    <strong>{asText(item.name)}</strong>
                    <span>{asText(item.language, "fr").toUpperCase()} · {formatDate(item.createdAt)}</span>
                  </div>
                  <div className={styles.cardActions}>
                    <button className={styles.secondaryButton} type="button" onClick={() => void updateItem(item.id, { published: !item.published })} disabled={saving}>
                      {item.published ? "Masquer" : "Publier"}
                    </button>
                    <button className={styles.secondaryButton} type="button" onClick={() => editReview(item)}>Modifier</button>
                    <button className={styles.dangerButton} type="button" onClick={() => void deleteItem(item.id)} disabled={saving}>Supprimer</button>
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
                    <span className={item.published ? styles.published : styles.hidden}>{item.published ? "Visible" : "Masqué"}</span>
                  </div>
                  <div className={styles.doctorNames}>
                    <div><small>FR</small><h2>{asText(item.nameFr)}</h2><p>{asText(item.roleFr)}</p></div>
                    <div><small>NL</small><h2>{asText(item.nameNl)}</h2><p>{asText(item.roleNl)}</p></div>
                  </div>
                  <p className={styles.doctorBio}>{asText(item.bioFr)}</p>
                  <div className={styles.cardActions}>
                    <button className={styles.secondaryButton} type="button" onClick={() => void updateItem(item.id, { published: !item.published })} disabled={saving}>
                      {item.published ? "Masquer" : "Afficher"}
                    </button>
                    <button className={styles.secondaryButton} type="button" onClick={() => editDoctor(item)}>Modifier</button>
                    <button className={styles.dangerButton} type="button" onClick={() => void deleteItem(item.id)} disabled={saving}>Supprimer</button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {isDataSection(activeSection) && !loading && pagination.totalPages > 1 && (
            <nav className={styles.pagination} aria-label="Pagination des résultats">
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => void loadItems(activeSection, pagination.page - 1)}
              >
                Précédent
              </button>
              <span>
                Page {pagination.page} sur {pagination.totalPages} · {pagination.total} éléments
              </span>
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => void loadItems(activeSection, pagination.page + 1)}
              >
                Suivant
              </button>
            </nav>
          )}
        </section>
      </div>

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
              {appointmentAction.mode === "confirm" ? "Confirmer le rendez-vous" : "Proposer un autre créneau"}
            </h2>
            <p className={reservationStyles.modalSub}>
              {asText(appointmentAction.item.firstName, "Patient")} {asText(appointmentAction.item.lastName, "")} — {asText(appointmentAction.item.care, "Soin à préciser")}
            </p>
            <div className={reservationStyles.grid2}>
              <label className={reservationStyles.field}>
                Date
                <input className={reservationStyles.input} required type="date" value={appointmentDraft.day} onChange={(event) => setAppointmentDraft((current) => ({ ...current, day: event.target.value }))} />
              </label>
              <label className={reservationStyles.field}>
                Heure
                <input className={reservationStyles.input} required type="time" value={appointmentDraft.time} onChange={(event) => setAppointmentDraft((current) => ({ ...current, time: event.target.value }))} />
              </label>
            </div>
            {appointmentAction.mode === "confirm" && (
              <label className={reservationStyles.field}>
                Durée (minutes)
                <input className={reservationStyles.input} required min="5" step="5" type="number" value={appointmentDraft.duration} onChange={(event) => setAppointmentDraft((current) => ({ ...current, duration: event.target.value }))} />
              </label>
            )}
            <label className={reservationStyles.field}>
              Message au patient (optionnel)
              <textarea className={reservationStyles.input} rows={3} value={appointmentDraft.message} onChange={(event) => setAppointmentDraft((current) => ({ ...current, message: event.target.value }))} />
            </label>
            <div className={reservationStyles.modalActions}>
              <button className={reservationStyles.ghost} type="button" onClick={() => setAppointmentAction(null)}>Fermer</button>
              <button className={reservationStyles.primary} type="submit" disabled={saving || !appointmentDraft.day || !appointmentDraft.time}>
                {saving ? "Envoi…" : appointmentAction.mode === "confirm" ? "Confirmer + e-mail" : "Proposer + e-mail"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
