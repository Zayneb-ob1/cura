"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ClinicConfig } from "@/lib/site-config";

const SiteSettingsContext = createContext<ClinicConfig | null>(null);

export function SiteSettingsProvider({
  children,
  initialSettings,
}: {
  children: ReactNode;
  initialSettings: ClinicConfig;
}) {
  return <SiteSettingsContext.Provider value={initialSettings}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const settings = useContext(SiteSettingsContext);
  if (!settings) throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  return settings;
}
