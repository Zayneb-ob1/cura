"use client";

import { useState, type FormEvent } from "react";
import { useAdminLanguage } from "../admin-i18n";
import { AdminPage, AdminPageHeader, roleLabel, shellStyles as s, type AdminUser } from "../admin-shell";

const MIN_PASSWORD = 10;

function AccountContent({ user }: { user: AdminUser | null }) {
  const { t } = useAdminLanguage();
  const [draft, setDraft] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function serverError(code: string | undefined) {
    switch (code) {
      case "WRONG_CURRENT_PASSWORD": return t("Le mot de passe actuel est incorrect.", "Het huidige wachtwoord is onjuist.");
      case "PASSWORD_TOO_SHORT": return t(`Le nouveau mot de passe doit contenir au moins ${MIN_PASSWORD} caractères.`, `Het nieuwe wachtwoord moet minstens ${MIN_PASSWORD} tekens bevatten.`);
      case "TOO_MANY_ATTEMPTS": return t("Trop de tentatives. Réessayez plus tard.", "Te veel pogingen. Probeer het later opnieuw.");
      case "USER_STORE_UNAVAILABLE": return t("Les comptes utilisateurs sont momentanément indisponibles.", "De gebruikersaccounts zijn tijdelijk niet beschikbaar.");
      default: return t("Impossible de modifier le mot de passe.", "Het wachtwoord kon niet worden gewijzigd.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (draft.newPassword.length < MIN_PASSWORD) {
      setError(serverError("PASSWORD_TOO_SHORT"));
      return;
    }
    if (draft.newPassword !== draft.confirm) {
      setError(t("Les deux nouveaux mots de passe ne correspondent pas.", "De twee nieuwe wachtwoorden komen niet overeen."));
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/account/password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: draft.currentPassword, newPassword: draft.newPassword }),
      });
      if (response.status === 401) {
        window.location.assign("/admin");
        return;
      }
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(serverError(payload.error));
      setDraft({ currentPassword: "", newPassword: "", confirm: "" });
      setSuccess(t("Votre mot de passe a été modifié.", "Uw wachtwoord is gewijzigd."));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : serverError(undefined));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AdminPageHeader eyebrow={t("Sécurité", "Beveiliging")} title={t("Mon compte", "Mijn account")} description={t("Vos informations de connexion et votre mot de passe.", "Uw aanmeldgegevens en wachtwoord.")} />

      <section className={s.card} aria-labelledby="account-info-title">
        <h2 id="account-info-title">{t("Informations", "Gegevens")}</h2>
        <dl className={s.dl}>
          <dt>{t("Nom", "Naam")}</dt><dd>{user?.name || "—"}</dd>
          <dt>{t("E-mail", "E-mail")}</dt><dd>{user?.username || "—"}</dd>
          <dt>{t("Rôle", "Rol")}</dt><dd><span className={`${s.badge} ${s.badgeGold}`}>{roleLabel(user?.role, t)}</span></dd>
        </dl>
      </section>

      <section className={s.card} aria-labelledby="account-password-title">
        <h2 id="account-password-title">{t("Changer le mot de passe", "Wachtwoord wijzigen")}</h2>
        {error && <p className={s.alertError} role="alert">{error}</p>}
        {success && <p className={s.alertSuccess} role="status">{success}</p>}
        <form className={s.form} onSubmit={submit}>
          <input type="text" name="username" autoComplete="username" value={user?.username ?? ""} readOnly hidden />
          <label className={s.label}>
            {t("Mot de passe actuel", "Huidig wachtwoord")}
            <input className={s.input} type="password" required autoComplete="current-password" value={draft.currentPassword}
              onChange={(event) => setDraft((d) => ({ ...d, currentPassword: event.target.value }))} />
          </label>
          <div className={s.formGrid}>
            <label className={s.label}>
              {t("Nouveau mot de passe", "Nieuw wachtwoord")}
              <input className={s.input} type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" value={draft.newPassword}
                onChange={(event) => setDraft((d) => ({ ...d, newPassword: event.target.value }))} />
            </label>
            <label className={s.label}>
              {t("Confirmer le nouveau mot de passe", "Bevestig het nieuwe wachtwoord")}
              <input className={s.input} type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" value={draft.confirm}
                onChange={(event) => setDraft((d) => ({ ...d, confirm: event.target.value }))} />
            </label>
          </div>
          <p className={s.hint}>{t(`Au moins ${MIN_PASSWORD} caractères.`, `Minstens ${MIN_PASSWORD} tekens.`)}</p>
          <div className={s.actionsRow}>
            <button className={s.buttonPrimary} type="submit" disabled={busy}>
              {busy ? t("Enregistrement…", "Opslaan…") : t("Modifier le mot de passe", "Wachtwoord wijzigen")}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

export default function ComptePage() {
  return <AdminPage active="compte">{(user) => <AccountContent user={user} />}</AdminPage>;
}
