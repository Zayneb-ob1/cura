"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AdminLanguage = "fr" | "nl";

const STORAGE_KEY = "cura-admin-language";

type AdminLanguageContextValue = {
  language: AdminLanguage;
  setLanguage: (language: AdminLanguage) => void;
  /** Picks the French or Dutch text: t("Réservations", "Reservaties"). */
  t: (fr: string, nl: string) => string;
};

const AdminLanguageContext = createContext<AdminLanguageContextValue>({
  language: "fr",
  setLanguage: () => undefined,
  t: (fr) => fr,
});

/** Dashboard language (FR/NL), remembered in this browser; independent from the public site language. */
export function AdminLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AdminLanguage>("fr");

  useEffect(() => {
    const task = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === "fr" || stored === "nl") setLanguageState(stored);
      } catch {
        // French stays the default when storage is unavailable.
      }
    }, 0);
    return () => window.clearTimeout(task);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: AdminLanguage) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The choice still applies to the current page.
    }
  }, []);

  const value = useMemo<AdminLanguageContextValue>(() => ({
    language,
    setLanguage,
    t: (fr, nl) => (language === "nl" ? nl : fr),
  }), [language, setLanguage]);

  return <AdminLanguageContext.Provider value={value}>{children}</AdminLanguageContext.Provider>;
}

export function useAdminLanguage() {
  return useContext(AdminLanguageContext);
}

/** FR / NL switch for the dashboard header or sidebar. */
export function AdminLanguageSwitch({ className }: { className?: string }) {
  const { language, setLanguage } = useAdminLanguage();
  return (
    <div className={className} role="group" aria-label="Langue / Taal">
      {(["fr", "nl"] as const).map((code) => (
        <button key={code} type="button" aria-pressed={language === code} onClick={() => setLanguage(code)}>
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
