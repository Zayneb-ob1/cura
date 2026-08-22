"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Language = "fr" | "nl";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const LANGUAGE_STORAGE_KEY = "cura-language";
const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLanguage(value: string | null): value is Language {
  return value === "fr" || value === "nl";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr");

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    document.documentElement.lang = nextLanguage;

    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch {
      // The language still changes when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    let active = true;
    let storedLanguage: string | null = null;

    try {
      storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    } catch {
      // Keep French as the default when browser storage is unavailable.
    }

    const initialLanguage = isLanguage(storedLanguage) ? storedLanguage : "fr";
    const task = window.setTimeout(() => {
      if (!active) return;
      setLanguageState(initialLanguage);
      document.documentElement.lang = initialLanguage;
    }, 0);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === LANGUAGE_STORAGE_KEY && isLanguage(event.newValue)) {
        setLanguageState(event.newValue);
        document.documentElement.lang = event.newValue;
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      active = false;
      window.clearTimeout(task);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}
