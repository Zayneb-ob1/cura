"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useLanguage } from "@/components/language-provider";
import type { ContentOverrides } from "@/lib/content-catalog";

const SiteContentContext = createContext<ContentOverrides>({});

export function SiteContentProvider({ children, overrides }: { children: ReactNode; overrides: ContentOverrides }) {
  return <SiteContentContext.Provider value={overrides}>{children}</SiteContentContext.Provider>;
}

/** Returns c(key, fallback): the text edited in the dashboard for the current language, or the page's own text. */
export function useSiteContent() {
  const overrides = useContext(SiteContentContext);
  const { language } = useLanguage();
  return useCallback((key: string, fallback: string) => overrides[key]?.[language] || fallback, [overrides, language]);
}
