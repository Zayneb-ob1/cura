"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAdminLanguage } from "../admin-i18n";
import { AdminPage, AdminPageHeader, roleLabel, shellStyles as s, type AdminRole, type AdminUser } from "../admin-shell";

const MIN_PASSWORD = 10;

type UserItem = {
  id: string | number;
  email: string;
  name: string;
  role: AdminRole;
  active: boolean;
  createdAt?: string | null;
  lastLoginAt?: string | null;
};

type Translate = (fr: string, nl: string) => string;

function errorText(code: string | undefined, t: Translate) {
  switch (code) {
    case "LAST_OWNER": return t("Il doit rester au moins un propriétaire actif.", "Er moet minstens één actieve eigenaar overblijven.");
    case "CANNOT_DEMOTE_SELF": return t("Vous ne pouvez pas retirer votre propre rôle de propriétaire.", "U kunt uw eigen eigenaarsrol niet intrekken.");
    case "CANNOT_DELETE_SELF": return t("Vous ne pouvez pas supprimer votre propre compte.", "U kunt uw eigen account niet verwijderen.");
    case "EMAIL_EXISTS": return t("Un utilisateur avec cet e-mail existe déjà.", "Er bestaat al een gebruiker met dit e-mailadres.");
    case "INVALID_EMAIL": return t("Adresse e-mail invalide.", "Ongeldig e-mailadres.");
    case "PASSWORD_TOO_SHORT": return t(`Le mot de passe doit contenir au moins ${MIN_PASSWORD} caractères.`, `Het wachtwoord moet minstens ${MIN_PASSWORD} tekens bevatten.`);
    case "OWNER_ONLY": return t("Accès réservé aux propriétaires.", "Toegang voorbehouden aan eigenaars.");
    case "USER_STORE_UNAVAILABLE": return t("Les comptes utilisateurs sont momentanément indisponibles.", "De gebruikersaccounts zijn tijdelijk niet beschikbaar.");
    default: return code || t("Une erreur est survenue.", "Er is een fout opgetreden.");
  }
}

function UsersContent({ user }: { user: AdminUser | null }) {
  const { t, language } = useAdminLanguage();
  const [items, setItems] = useState<UserItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(user?.role !== "owner");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState({ name: "", email: "", role: "admin" as AdminRole, password: "" });
  const [resetFor, setResetFor] = useState<string | number | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users", { credentials: "same-origin", cache: "no-store" });
      if (response.status === 401) { window.location.assign("/admin"); return; }
      if (response.status === 403) { setForbidden(true); return; }
      const payload = await response.json().catch(() => ({})) as { items?: UserItem[]; currentUserId?: string | number; error?: string };
      if (!response.ok) throw new Error(payload.error);
      setItems(Array.isArray(payload.items) ? payload.items : []);
      setCurrentUserId(payload.currentUserId ?? null);
    } catch (requestError) {
      setError(errorText(requestError instanceof Error ? requestError.message : undefined, t));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (user?.role !== "owner") return;
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load only once, not on language change
  }, [user?.role]);

  async function mutate(url: string, method: string, body: unknown, success: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(url, {
        method,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (response.status === 401) { window.location.assign("/admin"); return false; }
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error);
      setNotice(success);
      await load();
      return true;
    } catch (requestError) {
      setError(errorText(requestError instanceof Error ? requestError.message : undefined, t));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function addUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.password.length < MIN_PASSWORD) { setError(errorText("PASSWORD_TOO_SHORT", t)); return; }
    const ok = await mutate("/api/admin/users", "POST", { ...draft, email: draft.email.trim(), name: draft.name.trim() }, t("Utilisateur ajouté.", "Gebruiker toegevoegd."));
    if (ok) setDraft({ name: "", email: "", role: "admin", password: "" });
  }

  async function submitReset(event: FormEvent<HTMLFormElement>, item: UserItem) {
    event.preventDefault();
    if (resetPassword.length < MIN_PASSWORD) { setError(errorText("PASSWORD_TOO_SHORT", t)); return; }
    const ok = await mutate(`/api/admin/users/${encodeURIComponent(String(item.id))}`, "PATCH", { password: resetPassword }, t("Mot de passe réinitialisé.", "Wachtwoord opnieuw ingesteld."));
    if (ok) { setResetFor(null); setResetPassword(""); }
  }

  function removeUser(item: UserItem) {
    if (!window.confirm(t(`Supprimer définitivement le compte de ${item.name || item.email} ?`, `Het account van ${item.name || item.email} definitief verwijderen?`))) return;
    void mutate(`/api/admin/users/${encodeURIComponent(String(item.id))}`, "DELETE", undefined, t("Utilisateur supprimé.", "Gebruiker verwijderd."));
  }

  const dateFormat = new Intl.DateTimeFormat(language === "nl" ? "nl-BE" : "fr-BE", { dateStyle: "medium", timeStyle: "short" });
  const formatDate = (value?: string | null) => {
    if (!value) return t("Jamais", "Nooit");
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : dateFormat.format(date);
  };

  const header = (
    <AdminPageHeader
      eyebrow={t("Sécurité", "Beveiliging")}
      title={t("Utilisateurs", "Gebruikers")}
      description={t("Comptes ayant accès à l’administration. Les mots de passe ne sont jamais affichés.", "Accounts met toegang tot het beheer. Wachtwoorden worden nooit getoond.")}
    />
  );

  if (forbidden) {
    return (
      <>
        {header}
        <section className={s.card}>
          <h2>{t("Accès réservé aux propriétaires", "Toegang voorbehouden aan eigenaars")}</h2>
          <p className={s.hint}>{t("Seul un propriétaire peut gérer les utilisateurs. Contactez un propriétaire du cabinet si vous avez besoin d’un accès.", "Alleen een eigenaar kan gebruikers beheren. Neem contact op met een eigenaar van de praktijk als u toegang nodig hebt.")}</p>
        </section>
      </>
    );
  }

  return (
    <>
      {header}
      {error && <p className={s.alertError} role="alert">{error}</p>}
      {notice && <p className={s.alertSuccess} role="status">{notice}</p>}

      <section className={s.card} aria-labelledby="users-list-title">
        <h2 id="users-list-title">{t("Comptes", "Accounts")} ({items.length})</h2>
        {loading ? (
          <p className={s.hint}>{t("Chargement…", "Laden…")}</p>
        ) : items.length === 0 ? (
          <p className={s.hint}>{t("Aucun utilisateur.", "Geen gebruikers.")}</p>
        ) : (
          <div className={s.userList}>
            {items.map((item) => {
              const isSelf = String(item.id) === String(currentUserId);
              const url = `/api/admin/users/${encodeURIComponent(String(item.id))}`;
              return (
                <article className={s.userRow} key={item.id}>
                  <div>
                    <strong>{item.name || "—"} {isSelf && <span className={`${s.badge} ${s.badgeGrey}`}>{t("Vous", "U")}</span>}</strong>
                    <small>{item.email}</small>
                  </div>
                  <div className={s.userMeta}>
                    <span className={`${s.badge} ${item.role === "owner" ? s.badgeGold : s.badgeGrey}`}>{roleLabel(item.role, t)}</span>
                    <span className={`${s.badge} ${item.active ? s.badgeGreen : s.badgeRed}`}>{item.active ? t("Actif", "Actief") : t("Désactivé", "Gedeactiveerd")}</span>
                    <span>{t("Dernière connexion", "Laatste aanmelding")} : {formatDate(item.lastLoginAt)}</span>
                  </div>
                  <div className={s.actionsRow}>
                    <select
                        className={s.input}
                        style={{ width: "auto" }}
                        value={item.role}
                        disabled={busy}
                        aria-label={t("Rôle", "Rol")}
                        onChange={(event) => void mutate(url, "PATCH", { role: event.target.value }, t("Rôle modifié.", "Rol gewijzigd."))}
                      >
                        <option value="owner">{t("Propriétaire", "Eigenaar")}</option>
                        <option value="admin">{t("Administrateur", "Beheerder")}</option>
                      </select>
                    <button className={s.buttonSecondary} type="button" disabled={busy}
                      onClick={() => void mutate(url, "PATCH", { active: !item.active }, item.active ? t("Compte désactivé.", "Account gedeactiveerd.") : t("Compte activé.", "Account geactiveerd."))}>
                      {item.active ? t("Désactiver", "Deactiveren") : t("Activer", "Activeren")}
                    </button>
                    <button className={s.buttonSecondary} type="button" disabled={busy}
                      onClick={() => { setResetFor(resetFor === item.id ? null : item.id); setResetPassword(""); }}>
                      {t("Nouveau mot de passe", "Nieuw wachtwoord")}
                    </button>
                    <button className={s.buttonDanger} type="button" disabled={busy || isSelf} onClick={() => removeUser(item)}>
                      {t("Supprimer", "Verwijderen")}
                    </button>
                  </div>
                  {resetFor === item.id && (
                    <form className={s.inlineForm} onSubmit={(event) => void submitReset(event, item)}>
                      <input className={s.input} type="password" required minLength={MIN_PASSWORD} autoComplete="new-password"
                        aria-label={t("Nouveau mot de passe", "Nieuw wachtwoord")}
                        placeholder={t(`Nouveau mot de passe (min. ${MIN_PASSWORD} caractères)`, `Nieuw wachtwoord (min. ${MIN_PASSWORD} tekens)`)}
                        value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} />
                      <button className={s.buttonPrimary} type="submit" disabled={busy}>{t("Enregistrer", "Opslaan")}</button>
                      <button className={s.buttonSecondary} type="button" onClick={() => setResetFor(null)}>{t("Fermer", "Sluiten")}</button>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className={s.card} aria-labelledby="users-add-title">
        <h2 id="users-add-title">{t("Ajouter un utilisateur", "Gebruiker toevoegen")}</h2>
        <form className={s.form} onSubmit={addUser}>
          <div className={s.formGrid}>
            <label className={s.label}>
              {t("Nom", "Naam")}
              <input className={s.input} required value={draft.name} onChange={(event) => setDraft((d) => ({ ...d, name: event.target.value }))} />
            </label>
            <label className={s.label}>
              {t("E-mail", "E-mail")}
              <input className={s.input} required type="email" autoComplete="off" value={draft.email} onChange={(event) => setDraft((d) => ({ ...d, email: event.target.value }))} />
            </label>
            <label className={s.label}>
              {t("Rôle", "Rol")}
              <select className={s.input} value={draft.role} onChange={(event) => setDraft((d) => ({ ...d, role: event.target.value as AdminRole }))}>
                <option value="admin">{t("Administrateur", "Beheerder")}</option>
                <option value="owner">{t("Propriétaire", "Eigenaar")}</option>
              </select>
            </label>
            <label className={s.label}>
              {t("Mot de passe initial", "Initieel wachtwoord")}
              <input className={s.input} required type="password" minLength={MIN_PASSWORD} autoComplete="new-password" value={draft.password} onChange={(event) => setDraft((d) => ({ ...d, password: event.target.value }))} />
            </label>
          </div>
          <p className={s.hint}>{t(`Au moins ${MIN_PASSWORD} caractères. Communiquez-le à la personne de manière sûre ; elle pourra le changer dans « Mon compte ».`, `Minstens ${MIN_PASSWORD} tekens. Bezorg het veilig aan de persoon; die kan het wijzigen via ‘Mijn account’.`)}</p>
          <div className={s.actionsRow}>
            <button className={s.buttonPrimary} type="submit" disabled={busy}>{busy ? t("Enregistrement…", "Opslaan…") : t("Ajouter l’utilisateur", "Gebruiker toevoegen")}</button>
          </div>
        </form>
      </section>
    </>
  );
}

export default function UtilisateursPage() {
  return <AdminPage active="utilisateurs">{(user) => <UsersContent user={user} />}</AdminPage>;
}
