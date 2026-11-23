"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "../gestion.module.css";
import { useAdminLanguage } from "../admin-i18n";
import { AdminPageHeader, AdminPage } from "../admin-shell";

interface Rdv {
  id: string;
  firstName?: string; lastName?: string; email?: string; phone?: string;
  care?: string; day?: string; time?: string; note?: string; status?: string;
  slotTime?: string; durationMin?: number; proposedDay?: string; proposedTime?: string;
  [cle: string]: unknown;
}

const fmt = (v?: string) => (v ? String(v).slice(0, 10).split("-").reverse().join("/") : "—");

const BADGE: Record<string, { fr: string; nl: string; bg: string; fg: string }> = {
  pending: { fr: "En attente", nl: "In afwachting", bg: "#fdf3d8", fg: "#8a6d1a" },
  confirmed: { fr: "Confirmé", nl: "Bevestigd", bg: "#dcefe3", fg: "#2f6f4f" },
  cancelled: { fr: "Annulé / proposé", nl: "Geannuleerd / voorgesteld", bg: "#f7e4df", fg: "#8b3428" },
  completed: { fr: "Terminé", nl: "Afgerond", bg: "#ecebe6", fg: "#62665f" },
};

export default function ReservationsPage() {
  return <AdminPage active="reservations">{() => <ReservationsContent />}</AdminPage>;
}

function ReservationsContent() {
  const { t } = useAdminLanguage();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [items, setItems] = useState<Rdv[]>([]);
  const [filtre, setFiltre] = useState<"pending" | "all">("pending");
  const [modal, setModal] = useState<{ rdv: Rdv; mode: "confirm" | "propose" } | null>(null);
  const [form, setForm] = useState({ day: "", time: "", duration: "30", message: "" });
  const [busy, setBusy] = useState(false);

  const charger = useCallback(async () => {
    const s = await fetch("/api/admin/session", { cache: "no-store" });
    const sj = await s.json().catch(() => ({ authenticated: false }));
    if (!sj.authenticated) { setAuthed(false); return; }
    setAuthed(true);
    const r = await fetch("/api/admin/appointments", { cache: "no-store" });
    const j = await r.json();
    setItems(Array.isArray(j.items) ? j.items : []);
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void charger(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [charger]);

  const liste = items
    .filter((r) => (filtre === "pending" ? r.status === "pending" : true))
    .sort((a, b) => String(a.day).localeCompare(String(b.day)));

  const ouvrir = (rdv: Rdv, mode: "confirm" | "propose") => {
    setForm({ day: String(rdv.day ?? "").slice(0, 10), time: rdv.slotTime || "", duration: String(rdv.durationMin || 30), message: "" });
    setModal({ rdv, mode });
  };

  const envoyer = async () => {
    if (!modal) return;
    setBusy(true);
    try {
      const mode = modal.mode;
      const response = await fetch(`/api/admin/appointments/${modal.rdv.id}/action`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: modal.mode === "confirm" ? "confirm" : "propose", day: form.day, time: form.time, duration: Number(form.duration), message: form.message }),
      });
      const result = await response.json().catch(() => ({})) as {
        error?: string;
        emailSent?: boolean;
        calendarConfigured?: boolean;
        calendarSynced?: boolean;
      };
      if (!response.ok) throw new Error(result.error || t("Impossible de mettre à jour la réservation.", "De reservatie kon niet worden bijgewerkt."));
      setModal(null);
      await charger();
      try {
        window.localStorage.setItem("cura-appointments-update", String(Date.now()));
        window.dispatchEvent(new Event("cura-appointments-update"));
      } catch {
        // The reservation is already saved; Agenda will refresh on its next load.
      }
      const warnings: string[] = [];
      if (result.emailSent === false) warnings.push(t("l’e-mail au patient n’a pas été envoyé", "de e-mail naar de patiënt is niet verzonden"));
      if (mode === "confirm" && result.calendarConfigured === false) warnings.push(t("Google Agenda n’est pas configuré", "Google Agenda is niet geconfigureerd"));
      if (mode === "confirm" && result.calendarConfigured && result.calendarSynced === false) warnings.push(t("la synchronisation Google Agenda a échoué", "de synchronisatie met Google Agenda is mislukt"));
      if (warnings.length > 0) {
        window.alert(t(`Le statut a été enregistré, mais ${warnings.join(" et ")}.`, `De status is opgeslagen, maar ${warnings.join(" en ")}.`));
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : t("Impossible de mettre à jour la réservation.", "De reservatie kon niet worden bijgewerkt."));
    } finally { setBusy(false); }
  };

  const annuler = async (rdv: Rdv) => {
    if (!confirm(t("Annuler ce rendez-vous et prévenir le patient par e-mail ?", "Deze afspraak annuleren en de patiënt per e-mail verwittigen?"))) return;
    await fetch(`/api/admin/appointments/${rdv.id}/action`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel" }) });
    await charger();
  };

  if (authed === false) {
    return <p>{t("Session expirée.", "Sessie verlopen.")} <a className={styles.back} href="/admin">{t("Se reconnecter", "Opnieuw aanmelden")}</a></p>;
  }

  return (
    <>
      <div className={styles.inner}>
        <AdminPageHeader
          eyebrow={t("Activité", "Activiteit")}
          title={t("Réservations", "Reservaties")}
          description={t("Rendez-vous en attente de confirmation. Confirmez (heure + durée → e-mail et invitation agenda) ou proposez un autre créneau.", "Afspraken die op bevestiging wachten. Bevestig (uur + duur → e-mail en agenda-uitnodiging) of stel een ander tijdstip voor.")}
          actions={(
            <div className={styles.filters} role="group" aria-label={t("Filtrer", "Filteren")}>
              <button type="button" aria-pressed={filtre === "pending"} className={`${styles.filterBtn} ${filtre === "pending" ? styles.filterActive : ""}`} onClick={() => setFiltre("pending")}>{t("En attente", "In afwachting")} ({items.filter((r) => r.status === "pending").length})</button>
              <button type="button" aria-pressed={filtre === "all"} className={`${styles.filterBtn} ${filtre === "all" ? styles.filterActive : ""}`} onClick={() => setFiltre("all")}>{t("Toutes", "Alle")} ({items.length})</button>
            </div>
          )}
        />

        <div className={styles.card}>
          <div className={styles.tableWrap}>
            <table className={`${styles.table} ${styles.stackTable}`}>
              <thead><tr>
                <th>{t("Patient", "Patiënt")}</th><th>{t("Contact", "Contact")}</th><th>{t("Soin", "Behandeling")}</th><th>{t("Souhait", "Voorkeur")}</th><th>{t("Créneau confirmé", "Bevestigd tijdstip")}</th><th>{t("Statut", "Status")}</th><th>{t("Actions", "Acties")}</th>
              </tr></thead>
              <tbody>
                {liste.length === 0 && <tr><td className={styles.empty} colSpan={7}>{filtre === "pending" ? t("Aucune réservation en attente.", "Geen reservaties in afwachting.") : t("Aucune réservation.", "Geen reservaties.")}</td></tr>}
                {liste.map((r) => {
                  const b = BADGE[String(r.status)] ?? BADGE.pending;
                  return (
                    <tr key={r.id}>
                      <td data-label={t("Patient", "Patiënt")}><span className={styles.name}>{r.firstName} {r.lastName}</span></td>
                      <td data-label={t("Contact", "Contact")}>{r.email}<br /><span className={styles.muted}>{r.phone}</span></td>
                      <td data-label={t("Soin", "Behandeling")}>{r.care || "—"}</td>
                      <td data-label={t("Souhait", "Voorkeur")}>{fmt(r.day)}{r.time ? <span className={styles.muted}> · {r.time}</span> : ""}</td>
                      <td data-label={t("Créneau confirmé", "Bevestigd tijdstip")}>{r.status === "confirmed" ? <b style={{ color: "#2f6f4f" }}>{fmt(r.day)} · {r.slotTime} <span className={styles.muted}>({r.durationMin} min)</span></b> : r.proposedDay ? <span style={{ color: "#a9761f" }}>{t("Proposé", "Voorgesteld")} : {fmt(r.proposedDay)} · {r.proposedTime}</span> : <span className={styles.muted}>—</span>}</td>
                      <td data-label={t("Statut", "Status")}><span className={styles.badge} style={{ background: b.bg, color: b.fg }}>{t(b.fr, b.nl)}</span></td>
                      <td data-label={t("Actions", "Acties")}>
                        <div className={styles.actions}>
                          {r.status !== "confirmed" && <button type="button" className={`${styles.btn} ${styles.btnConfirm}`} onClick={() => ouvrir(r, "confirm")}>{t("Confirmer", "Bevestigen")}</button>}
                          <button type="button" className={`${styles.btn} ${styles.btnPropose}`} onClick={() => ouvrir(r, "propose")}>{t("Proposer", "Voorstellen")}</button>
                          <button type="button" className={`${styles.btn} ${styles.btnCancel}`} onClick={() => annuler(r)}>{t("Annuler", "Annuleren")}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal && (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="reservation-modal-title">
            <h3 className={styles.modalTitle} id="reservation-modal-title">{modal.mode === "confirm" ? t("Confirmer le rendez-vous", "Afspraak bevestigen") : t("Proposer un autre créneau", "Een ander tijdstip voorstellen")}</h3>
            <p className={styles.modalSub}>{modal.rdv.firstName} {modal.rdv.lastName} — {modal.rdv.care || t("soin", "behandeling")}</p>
            <div className={styles.grid2}>
              <label className={styles.field}>{t("Date", "Datum")}<input className={styles.input} type="date" value={form.day} onChange={(e) => setForm((f) => ({ ...f, day: e.target.value }))} /></label>
              <label className={styles.field}>{t("Heure", "Uur")}<input className={styles.input} type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} /></label>
            </div>
            {modal.mode === "confirm" && (
              <label className={styles.field}>{t("Durée (minutes)", "Duur (minuten)")}<input className={styles.input} type="number" step="5" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} /></label>
            )}
            <label className={styles.field}>{t("Message au patient (optionnel)", "Bericht aan de patiënt (optioneel)")}<textarea className={styles.input} rows={3} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} /></label>
            <div className={styles.modalActions}>
              <button type="button" className={styles.ghost} onClick={() => setModal(null)}>{t("Fermer", "Sluiten")}</button>
              <button type="button" className={styles.primary} disabled={busy || !form.time} onClick={envoyer}>{busy ? t("Envoi…", "Verzenden…") : modal.mode === "confirm" ? t("Confirmer + e-mail", "Bevestigen + e-mail") : t("Proposer + e-mail", "Voorstellen + e-mail")}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
