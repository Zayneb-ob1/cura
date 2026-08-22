"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import styles from "./admin.module.css";

type DataSection = "contacts" | "appointments" | "reviews" | "doctors";
type AdminSection = "overview" | DataSection | "site";
type AdminItem = Record<string, unknown> & { id: string | number };

type OverviewData = Record<DataSection, AdminItem[]>;

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

const sections: Array<{ id: AdminSection; label: string; icon: string }> = [
  { id: "overview", label: "Vue d’ensemble", icon: "⌂" },
  { id: "contacts", label: "Messages", icon: "✉" },
  { id: "appointments", label: "Rendez-vous", icon: "◷" },
  { id: "reviews", label: "Avis", icon: "☆" },
  { id: "doctors", label: "Cabinet / Équipe", icon: "+" },
  { id: "site", label: "Pages du site", icon: "↗" },
];

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
  const [items, setItems] = useState<AdminItem[]>([]);
  const [overviewData, setOverviewData] = useState<OverviewData>(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | number | null>(null);
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft>(emptyReview);
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState<string | number | null>(null);
  const [doctorDraft, setDoctorDraft] = useState<DoctorDraft>(emptyDoctor);

  const loadItems = useCallback(async (section: AdminSection) => {
    setLoading(true);
    setError("");

    try {
      if (section === "overview") {
        const responses = await Promise.all(
          (["contacts", "appointments", "reviews", "doctors"] as DataSection[]).map((name) =>
            fetch(`/api/admin/${name}`, {
              credentials: "same-origin",
              cache: "no-store",
            }),
          ),
        );

        if (responses.some((response) => response.status === 401)) {
          setAuthenticated(false);
          setItems([]);
          return;
        }

        const failedResponse = responses.find((response) => !response.ok);
        if (failedResponse) throw new Error(await getErrorMessage(failedResponse));

        const payloads = await Promise.all(
          responses.map((response) => response.json() as Promise<{ items?: AdminItem[] }>),
        );
        setOverviewData({
          contacts: Array.isArray(payloads[0].items) ? payloads[0].items : [],
          appointments: Array.isArray(payloads[1].items) ? payloads[1].items : [],
          reviews: Array.isArray(payloads[2].items) ? payloads[2].items : [],
          doctors: Array.isArray(payloads[3].items) ? payloads[3].items : [],
        });
        setItems([]);
        setAuthenticated(true);
        return;
      }

      if (section === "site") {
        const response = await fetch("/api/admin/session", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) {
          setAuthenticated(false);
          return;
        }
        setItems([]);
        setAuthenticated(true);
        return;
      }

      const response = await fetch(`/api/admin/${section}`, {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (response.status === 401) {
        setAuthenticated(false);
        setItems([]);
        return;
      }

      if (!response.ok) throw new Error(await getErrorMessage(response));

      const payload = (await response.json()) as { items?: AdminItem[] };
      setItems(Array.isArray(payload.items) ? payload.items : []);
      setAuthenticated(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => void loadItems(activeSection), 0);
    return () => window.clearTimeout(task);
  }, [activeSection, loadItems]);

  useEffect(() => {
    if (!authenticated) return;

    const refreshDashboard = () => void loadItems(activeSection);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "cura-dashboard-update") refreshDashboard();
    };
    const interval = window.setInterval(refreshDashboard, 15000);

    window.addEventListener("focus", refreshDashboard);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshDashboard);
      window.removeEventListener("storage", handleStorage);
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
    setDoctorDraft({ ...emptyDoctor, order: String(items.length + 1) });
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

  const totalItems = overviewData.contacts.length + overviewData.appointments.length + overviewData.reviews.length + overviewData.doctors.length;
  const newMessages = overviewData.contacts.filter((item) => asText(item.status, "new") === "new").length;
  const pendingAppointments = overviewData.appointments.filter((item) => asText(item.status, "pending") === "pending").length;
  const publishedReviews = overviewData.reviews.filter((item) => Boolean(item.published)).length;
  const recentActivity = [
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
      section: "appointments" as AdminSection,
      type: "Rendez-vous",
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
      <main className={styles.loginPage}>
        <div className={styles.loadingCard}>Vérification de la session…</div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className={styles.loginPage}>
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
    <main className={styles.dashboard}>
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
          <nav className={styles.tabs} aria-label="Sections de l’administration">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={activeSection === section.id ? styles.activeTab : styles.tab}
                onClick={() => {
                  setShowReviewForm(false);
                  setShowDoctorForm(false);
                  setActiveSection(section.id);
                }}
              >
                <span aria-hidden="true">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </nav>
          <div className={styles.sidebarFooter}>
            <span>Connecté en tant que</span>
            <strong>admin@gmail.com</strong>
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
                    : activeSection === "site"
                      ? `${sitePages.length} pages disponibles`
                      : `${items.length} élément${items.length === 1 ? "" : "s"}`}
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
                <div className={styles.statsGrid}>
                  <button type="button" className={styles.statCard} onClick={() => setActiveSection("contacts")}>
                    <span>Messages</span>
                    <strong>{overviewData.contacts.length}</strong>
                    <small>{newMessages} nouveau{newMessages === 1 ? "" : "x"}</small>
                  </button>
                  <button type="button" className={styles.statCard} onClick={() => setActiveSection("appointments")}>
                    <span>Rendez-vous</span>
                    <strong>{overviewData.appointments.length}</strong>
                    <small>{pendingAppointments} à traiter</small>
                  </button>
                  <button type="button" className={styles.statCard} onClick={() => setActiveSection("reviews")}>
                    <span>Avis</span>
                    <strong>{overviewData.reviews.length}</strong>
                    <small>{publishedReviews} publié{publishedReviews === 1 ? "" : "s"}</small>
                  </button>
                  <button type="button" className={styles.statCard} onClick={() => setActiveSection("doctors")}>
                    <span>Équipe</span>
                    <strong>{overviewData.doctors.length}</strong>
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
                        {recentActivity.map((activity) => (
                          <button key={activity.id} type="button" onClick={() => setActiveSection(activity.section)}>
                            <span className={styles.activityType}>{activity.type.slice(0, 1)}</span>
                            <span className={styles.activityText}>
                              <strong>{activity.title}</strong>
                              <small>{activity.type} · {activity.detail}</small>
                            </span>
                            <time>{formatDate(activity.date)}</time>
                          </button>
                        ))}
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
                      <button type="button" onClick={() => setActiveSection("appointments")}>
                        <strong>Gérer les rendez-vous</strong>
                        <span>Confirmer ou annuler une demande</span>
                      </button>
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
                      <button type="button" onClick={() => setActiveSection("site")}>
                        <strong>Voir les pages</strong>
                        <span>Ouvrir une page du site</span>
                      </button>
                    </div>
                  </aside>
                </div>
              </>
            )
          ) : activeSection === "site" ? (
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
        </section>
      </div>
    </main>
  );
}
