"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { AdminLanguageSwitch, useAdminLanguage } from "./admin-i18n";
import s from "./admin-shell.module.css";

export type AdminRole = "owner" | "admin";
export type AdminUser = { username: string; name: string; role: AdminRole };
export type AdminNavKey =
  | "overview" | "reservations" | "agenda" | "contacts"
  | "contenu" | "reviews" | "doctors" | "forms" | "site"
  | "blocked-ips" | "utilisateurs" | "compte";

type SessionState =
  | { status: "loading"; user: null }
  | { status: "anonymous"; user: null }
  | { status: "authenticated"; user: AdminUser | null };

/** Reads /api/admin/session; `refresh` re-reads it (after login, for instance). */
export function useAdminSession() {
  const [state, setState] = useState<SessionState>({ status: "loading", user: null });

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/session", { credentials: "same-origin", cache: "no-store" });
      const payload = await response.json().catch(() => ({})) as { authenticated?: boolean; user?: AdminUser };
      if (!response.ok || !payload.authenticated) {
        setState({ status: "anonymous", user: null });
        return;
      }
      setState({ status: "authenticated", user: payload.user ?? null });
    } catch {
      setState({ status: "anonymous", user: null });
    }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(task);
  }, [refresh]);

  return { ...state, refresh };
}

export function roleLabel(role: AdminRole | undefined, t: (fr: string, nl: string) => string) {
  return role === "owner" ? t("Propriétaire", "Eigenaar") : t("Administrateur", "Beheerder");
}

export async function adminLogout() {
  try {
    await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
  } finally {
    window.location.assign("/admin");
  }
}

type NavItem = { key: AdminNavKey; fr: string; nl: string; icon: string; href: string; hash?: string };

const NAV_GROUPS: Array<{ fr: string; nl: string; items: NavItem[] }> = [
  {
    fr: "Activité", nl: "Activiteit", items: [
      { key: "overview", fr: "Vue d’ensemble", nl: "Overzicht", icon: "⌂", href: "/admin", hash: "overview" },
      { key: "reservations", fr: "Réservations", nl: "Reservaties", icon: "✓", href: "/admin/reservations" },
      { key: "agenda", fr: "Agenda", nl: "Agenda", icon: "▣", href: "/admin/agenda" },
      { key: "contacts", fr: "Messages", nl: "Berichten", icon: "✉", href: "/admin#contacts", hash: "contacts" },
    ],
  },
  {
    fr: "Site", nl: "Website", items: [
      { key: "contenu", fr: "Contenu du site", nl: "Inhoud van de website", icon: "✎", href: "/admin/contenu" },
      { key: "reviews", fr: "Avis", nl: "Beoordelingen", icon: "☆", href: "/admin#reviews", hash: "reviews" },
      { key: "doctors", fr: "Équipe", nl: "Team", icon: "+", href: "/admin#doctors", hash: "doctors" },
      { key: "forms", fr: "Formulaires", nl: "Formulieren", icon: "▤", href: "/admin#forms", hash: "forms" },
      { key: "site", fr: "Informations du site", nl: "Website-informatie", icon: "↗", href: "/admin#site", hash: "site" },
    ],
  },
  {
    fr: "Sécurité", nl: "Beveiliging", items: [
      { key: "blocked-ips", fr: "Adresses IP bloquées", nl: "Geblokkeerde IP-adressen", icon: "⊘", href: "/admin#blocked-ips", hash: "blocked-ips" },
      { key: "utilisateurs", fr: "Utilisateurs", nl: "Gebruikers", icon: "☺", href: "/admin/utilisateurs" },
      { key: "compte", fr: "Mon compte", nl: "Mijn account", icon: "⚙", href: "/admin/compte" },
    ],
  },
];

type AdminShellProps = {
  active: AdminNavKey | string;
  user: AdminUser | null;
  /** On /admin, hash sections switch in place instead of navigating. */
  onSectionChange?: (section: string) => void;
  children: ReactNode;
};

export function AdminShell({ active, user, onSectionChange, children }: AdminShellProps) {
  const { t } = useAdminLanguage();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function selectHash(event: MouseEvent, item: NavItem) {
    setOpen(false);
    if (!onSectionChange || !item.hash || pathname !== "/admin") return;
    event.preventDefault();
    window.history.pushState(null, "", item.hash === "overview" ? "/admin" : `/admin#${item.hash}`);
    onSectionChange(item.hash);
  }

  return (
    <div className={s.shell}>
      <header className={s.mobileBar}>
        <Link href="/admin" className={s.mobileBrand} aria-label="CURA">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/cura-tooth.png" alt="" width={28} height={28} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/cura-wordmark.webp" alt="CURA" className={s.wordmark} />
        </Link>
        <button
          type="button"
          className={s.menuButton}
          aria-expanded={open}
          aria-controls="admin-sidebar"
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true">{open ? "✕" : "☰"}</span>
          {t("Menu", "Menu")}
        </button>
      </header>

      <aside id="admin-sidebar" className={s.sidebar} data-open={open ? "true" : "false"}>
        <Link href="/admin" className={s.brand} aria-label={t("CURA — Administration", "CURA — Beheer")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/cura-tooth.png" alt="" width={34} height={34} />
          <span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/cura-wordmark.webp" alt="CURA" className={s.wordmark} />
            <small>{t("Administration", "Beheer")}</small>
          </span>
        </Link>

        <nav className={s.nav} aria-label={t("Sections de l’administration", "Beheersecties")}>
          {NAV_GROUPS.map((group) => {
            const items = group.items.filter((item) => item.key !== "utilisateurs" || user?.role === "owner");
            return (
              <div className={s.navGroup} key={group.fr}>
                <p className={s.navGroupTitle}>{t(group.fr, group.nl)}</p>
                {items.map((item) => {
                  const isActive = active === item.key;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={isActive ? `${s.navLink} ${s.navLinkActive}` : s.navLink}
                      aria-current={isActive ? "page" : undefined}
                      onClick={(event) => selectHash(event, item)}
                    >
                      <span className={s.navIcon} aria-hidden="true">{item.icon}</span>
                      {t(item.fr, item.nl)}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className={s.sidebarFooter}>
          <div className={s.userCard}>
            <span className={s.avatar} aria-hidden="true">{(user?.name || user?.username || "?").slice(0, 1).toUpperCase()}</span>
            <span className={s.userText}>
              <strong>{user?.name || t("Utilisateur", "Gebruiker")}</strong>
              <small>{user?.username}</small>
              <em>{roleLabel(user?.role, t)}</em>
            </span>
          </div>
          <div className={s.footerRow}>
            <AdminLanguageSwitch className={s.langSwitch} />
            <a className={s.siteLink} href="/" target="_blank" rel="noreferrer">{t("Voir le site", "Website bekijken")} ↗</a>
          </div>
          <button
            type="button"
            className={s.logout}
            disabled={loggingOut}
            onClick={() => { setLoggingOut(true); void adminLogout(); }}
          >
            {loggingOut ? t("Déconnexion…", "Afmelden…") : t("Se déconnecter", "Afmelden")}
          </button>
        </div>
      </aside>

      {open && <div className={s.backdrop} onClick={() => setOpen(false)} aria-hidden="true" />}

      <main id="main-content" tabIndex={-1} className={s.main}>
        {children}
      </main>
    </div>
  );
}

/** Full-screen login used by every admin page when there is no session. */
export function AdminLoginScreen({ onSuccess }: { onSuccess: () => void | Promise<void> }) {
  const { t } = useAdminLanguage();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        if (response.status === 401) throw new Error(t("E-mail ou mot de passe incorrect.", "E-mailadres of wachtwoord is onjuist."));
        if (response.status === 429) throw new Error(t("Trop de tentatives. Réessayez plus tard.", "Te veel pogingen. Probeer het later opnieuw."));
        throw new Error(t("Connexion impossible.", "Aanmelden mislukt."));
      }
      setCredentials({ username: "", password: "" });
      await onSuccess();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("Connexion impossible.", "Aanmelden mislukt."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className={s.loginPage}>
      <section className={s.loginCard} aria-labelledby="admin-login-title">
        <div className={s.loginTop}>
          <div className={s.loginBrand}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/cura-tooth.png" alt="" width={36} height={36} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/cura-wordmark.webp" alt="CURA" className={s.wordmark} />
          </div>
          <AdminLanguageSwitch className={s.langSwitch} />
        </div>
        <div className={s.loginBody}>
          <p className={s.eyebrow}>{t("Administration", "Beheer")}</p>
          <h1 id="admin-login-title">{t("Connexion", "Aanmelden")}</h1>
          <p className={s.loginCopy}>{t("Accédez aux demandes, rendez-vous et avis du cabinet.", "Toegang tot de aanvragen, afspraken en beoordelingen van de praktijk.")}</p>
          {error && <p className={s.alertError} role="alert">{error}</p>}
          <form onSubmit={submit} className={s.form}>
            <label className={s.label}>
              {t("E-mail", "E-mail")}
              <input className={s.input} required type="email" autoComplete="username" value={credentials.username}
                onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))} />
            </label>
            <label className={s.label}>
              {t("Mot de passe", "Wachtwoord")}
              <input className={s.input} required type="password" autoComplete="current-password" value={credentials.password}
                onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))} />
            </label>
            <button className={s.buttonPrimary} type="submit" disabled={busy}>
              {busy ? t("Connexion…", "Aanmelden…") : t("Se connecter", "Aanmelden")}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export function AdminLoading() {
  const { t } = useAdminLanguage();
  return (
    <main id="main-content" tabIndex={-1} className={s.loginPage}>
      <div className={s.loadingCard}>{t("Vérification de la session…", "Sessie wordt gecontroleerd…")}</div>
    </main>
  );
}

/** Session gate + shell for the stand-alone admin pages. */
export function AdminPage({ active, children }: { active: AdminNavKey; children: (user: AdminUser | null) => ReactNode }) {
  const session = useAdminSession();
  if (session.status === "loading") return <AdminLoading />;
  if (session.status === "anonymous") return <AdminLoginScreen onSuccess={session.refresh} />;
  return <AdminShell active={active} user={session.user}>{children(session.user)}</AdminShell>;
}

/** Page heading used inside the shell. */
export function AdminPageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className={s.pageHeader}>
      <div>
        {eyebrow && <p className={s.eyebrow}>{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className={s.pageDescription}>{description}</p>}
      </div>
      {actions && <div className={s.pageActions}>{actions}</div>}
    </div>
  );
}

export { s as shellStyles };
