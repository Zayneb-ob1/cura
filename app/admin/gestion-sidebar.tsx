"use client";

import { usePathname } from "next/navigation";
import styles from "./gestion.module.css";

const LIENS = [
  { href: "/admin", label: "Dashboard", icon: "⌂" },
  { href: "/admin/reservations", label: "Réservations", icon: "✓" },
  { href: "/admin/agenda", label: "Agenda", icon: "🗓" },
];

export default function AdminSidebar() {
  const path = usePathname();
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sbBrand}>CURA</div>
      <div className={styles.sbLabel}>Administration</div>
      <nav>
        {LIENS.map((l) => (
          <a key={l.href} href={l.href} className={`${styles.navLink} ${path === l.href ? styles.navActive : ""}`}>
            <span className={styles.navIcon} aria-hidden="true">{l.icon}</span>
            {l.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
