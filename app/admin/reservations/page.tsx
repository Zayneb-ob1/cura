"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "../gestion.module.css";
import AdminSidebar from "../gestion-sidebar";

interface Rdv {
  id: string;
  firstName?: string; lastName?: string; email?: string; phone?: string;
  care?: string; day?: string; time?: string; note?: string; status?: string;
  slotTime?: string; durationMin?: number; proposedDay?: string; proposedTime?: string;
  [cle: string]: unknown;
}

const fmt = (v?: string) => (v ? String(v).slice(0, 10).split("-").reverse().join("/") : "—");

const BADGE: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: "En attente", bg: "#fdf3d8", fg: "#8a6d1a" },
  confirmed: { label: "Confirmé", bg: "#dcefe3", fg: "#2f6f4f" },
  cancelled: { label: "Annulé / proposé", bg: "#f7e4df", fg: "#8b3428" },
  completed: { label: "Terminé", bg: "#ecebe6", fg: "#62665f" },
};

export default function ReservationsPage() {
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
      if (!response.ok) throw new Error(result.error || "Impossible de mettre à jour la réservation.");
      setModal(null);
      await charger();
      try {
        window.localStorage.setItem("cura-appointments-update", String(Date.now()));
        window.dispatchEvent(new Event("cura-appointments-update"));
      } catch {
        // The reservation is already saved; Agenda will refresh on its next load.
      }
      const warnings: string[] = [];
      if (result.emailSent === false) warnings.push("l’e-mail au patient n’a pas été envoyé");
      if (mode === "confirm" && result.calendarConfigured === false) warnings.push("Google Agenda n’est pas configuré");
      if (mode === "confirm" && result.calendarConfigured && result.calendarSynced === false) warnings.push("la synchronisation Google Agenda a échoué");
      if (warnings.length > 0) {
        window.alert(`Le statut a été enregistré, mais ${warnings.join(" et ")}.`);
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Impossible de mettre à jour la réservation.");
    } finally { setBusy(false); }
  };

  const annuler = async (rdv: Rdv) => {
    if (!confirm("Annuler ce rendez-vous et prévenir le patient par email ?")) return;
    await fetch(`/api/admin/appointments/${rdv.id}/action`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel" }) });
    await charger();
  };

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
            <h1 className={styles.title}>Réservations</h1>
            <p className={styles.subtitle}>Rendez-vous en attente de confirmation. Confirmez (heure + durée → email et invitation agenda) ou proposez un autre créneau.</p>
          </div>
          <div className={styles.filters}>
            <button className={`${styles.filterBtn} ${filtre === "pending" ? styles.filterActive : ""}`} onClick={() => setFiltre("pending")}>En attente</button>
            <button className={`${styles.filterBtn} ${filtre === "all" ? styles.filterActive : ""}`} onClick={() => setFiltre("all")}>Toutes</button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr>
                <th>Patient</th><th>Contact</th><th>Soin</th><th>Souhait</th><th>Créneau confirmé</th><th>Statut</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {liste.length === 0 && <tr><td className={styles.empty} colSpan={7}>Aucune réservation {filtre === "pending" ? "en attente" : ""}.</td></tr>}
                {liste.map((r) => {
                  const b = BADGE[String(r.status)] ?? BADGE.pending;
                  return (
                    <tr key={r.id}>
                      <td><span className={styles.name}>{r.firstName} {r.lastName}</span></td>
                      <td>{r.email}<br /><span className={styles.muted}>{r.phone}</span></td>
                      <td>{r.care || "—"}</td>
                      <td>{fmt(r.day)}{r.time ? <span className={styles.muted}> · {r.time}</span> : ""}</td>
                      <td>{r.status === "confirmed" ? <b style={{ color: "#2f6f4f" }}>{fmt(r.day)} · {r.slotTime} <span className={styles.muted}>({r.durationMin}min)</span></b> : r.proposedDay ? <span style={{ color: "#a9761f" }}>Proposé : {fmt(r.proposedDay)} · {r.proposedTime}</span> : <span className={styles.muted}>—</span>}</td>
                      <td><span className={styles.badge} style={{ background: b.bg, color: b.fg }}>{b.label}</span></td>
                      <td>
                        <div className={styles.actions}>
                          {r.status !== "confirmed" && <button className={`${styles.btn} ${styles.btnConfirm}`} onClick={() => ouvrir(r, "confirm")}>Confirmer</button>}
                          <button className={`${styles.btn} ${styles.btnPropose}`} onClick={() => ouvrir(r, "propose")}>Proposer</button>
                          <button className={`${styles.btn} ${styles.btnCancel}`} onClick={() => annuler(r)}>Annuler</button>
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
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>{modal.mode === "confirm" ? "Confirmer le rendez-vous" : "Proposer un autre créneau"}</h3>
            <p className={styles.modalSub}>{modal.rdv.firstName} {modal.rdv.lastName} — {modal.rdv.care || "soin"}</p>
            <div className={styles.grid2}>
              <label className={styles.field}>Date<input className={styles.input} type="date" value={form.day} onChange={(e) => setForm((f) => ({ ...f, day: e.target.value }))} /></label>
              <label className={styles.field}>Heure<input className={styles.input} type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} /></label>
            </div>
            {modal.mode === "confirm" && (
              <label className={styles.field}>Durée (minutes)<input className={styles.input} type="number" step="5" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} /></label>
            )}
            <label className={styles.field}>Message au patient (optionnel)<textarea className={styles.input} rows={3} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} /></label>
            <div className={styles.modalActions}>
              <button className={styles.ghost} onClick={() => setModal(null)}>Annuler</button>
              <button className={styles.primary} disabled={busy || !form.time} onClick={envoyer}>{busy ? "Envoi…" : modal.mode === "confirm" ? "Confirmer + email" : "Proposer + email"}</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
