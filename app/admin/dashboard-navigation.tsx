"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./admin.module.css";

const primaryLinks = [
  { href: "/admin/reservations", label: "Réservations", icon: "✓", strong: true },
  { href: "/admin/agenda", label: "Agenda", icon: "▣", strong: false },
] as const;

const sectionLinks = [
  { id: "reviews", label: "Avis", icon: "☆" },
  { id: "doctors", label: "Cabinet / Équipe", icon: "+" },
  { id: "forms", label: "Formulaires", icon: "▤" },
  { id: "site", label: "Informations du site", icon: "↗" },
  { id: "contacts", label: "Messages", icon: "✉" },
  { id: "blocked-ips", label: "Adresses IP bloquées", icon: "⊘" },
  { id: "overview", label: "Vue d’ensemble", icon: "⌂" },
] as const;

type DashboardNavigationProps = {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
};

export default function DashboardNavigation({ activeSection, onSectionChange }: DashboardNavigationProps) {
  const pathname = usePathname();

  function selectSection(section: string) {
    if (!onSectionChange) return;
    const nextUrl = section === "overview" ? "/admin" : `/admin#${section}`;
    window.history.pushState(null, "", nextUrl);
    onSectionChange(section);
  }

  return (
    <nav className={styles.tabs} aria-label="Sections de l’administration">
      <div className={styles.primaryTabs}>
        {primaryLinks.map((link) => (
          <Link
            key={link.href}
            className={`${styles.primaryTab} ${link.strong ? styles.primaryTabStrong : ""} ${pathname === link.href ? styles.primaryRouteActive : ""}`}
            href={link.href}
            aria-current={pathname === link.href ? "page" : undefined}
          >
            <span aria-hidden="true">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>
      {sectionLinks.map((section) => {
        const isActive = pathname === "/admin" && activeSection === section.id;
        if (onSectionChange) {
          return (
            <button
              key={section.id}
              type="button"
              className={isActive ? styles.activeTab : styles.tab}
              onClick={() => selectSection(section.id)}
              aria-current={isActive ? "page" : undefined}
            >
              <span aria-hidden="true">{section.icon}</span>
              {section.label}
            </button>
          );
        }
        return (
          <Link key={section.id} className={styles.tab} href={section.id === "overview" ? "/admin" : `/admin#${section.id}`}>
            <span aria-hidden="true">{section.icon}</span>
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
