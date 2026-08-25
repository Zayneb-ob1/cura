"use client";

import { useEffect, useState } from "react";
import styles from "../gestion.module.css";
import AdminSidebar from "../gestion-sidebar";

export default function AgendaPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const src = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_EMBED || "";

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" }).then(async (r) => { const j = await r.json().catch(() => ({ authenticated: false })); setAuthed(Boolean(j.authenticated)); });
  }, []);

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
            <p className={styles.subtitle}>Google Agenda du cabinet (contact@curadental.be). Les rendez-vous confirmés s'y ajoutent automatiquement via les invitations.</p>
          </div>
          <span className={styles.chip}>🗓 contact@curadental.be</span>
        </div>

        <div className={`${styles.card} ${src ? styles.frameCard : ""}`}>
          {src ? (
            <iframe className={styles.frame} src={src} title="Google Agenda Curadental" />
          ) : (
            <div className={styles.notice}>
              <b>Pour afficher Google Agenda ici :</b>
              <ol>
                <li>Crée un compte Google avec <b>contact@curadental.be</b>.</li>
                <li>Google Agenda → Paramètres → <b>Intégrer l'agenda</b> → copie l'URL <code>src</code>.</li>
                <li>Ajoute dans <code>.env.local</code> : <code>NEXT_PUBLIC_GOOGLE_CALENDAR_EMBED=&lt;url&gt;</code>, puis redéploie.</li>
              </ol>
              En attendant, les confirmations envoient déjà une <b>invitation .ics</b> ajoutée automatiquement à l'agenda.
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
