import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { getPublicSettings, getTenantSlug } from "../lib/api";
import type { OpeningHours, ClosureDate, SocialLinks } from "../lib/types";

export interface PublicSettings {
  reservations_enabled: boolean;
  auto_optimize_tables: boolean;
  service_duration_minutes: number;
  opening_hours: OpeningHours | null;
  closure_dates: ClosureDate[] | null;
  menu_pdf_url: string | null;
  menu_manual_visible: boolean;
  menu_pdf_visible: boolean;
  social_links: SocialLinks | null;
  restaurant_name: string;
  logo_url: string | null;
}

interface PublicSettingsContextValue {
  settings: PublicSettings | null;
  refresh: () => void;
}

const PublicSettingsContext = createContext<PublicSettingsContextValue>({ settings: null, refresh: () => {} });

function settingsCacheKey(): string | null {
  const slug = getTenantSlug();
  return slug ? `publicSettings:${slug}` : null;
}

function readSettingsCache(): PublicSettings | null {
  const key = settingsCacheKey();
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as PublicSettings) : null;
  } catch {
    return null;
  }
}

export function PublicSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PublicSettings | null>(() => readSettingsCache());

  const refresh = useCallback(() => {
    getPublicSettings()
      .then((s) => {
        setSettings(s);
        const key = settingsCacheKey();
        if (key) {
          try { localStorage.setItem(key, JSON.stringify(s)); } catch { /* quota */ }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <PublicSettingsContext.Provider value={{ settings, refresh }}>
      {children}
    </PublicSettingsContext.Provider>
  );
}

export function usePublicSettings() {
  return useContext(PublicSettingsContext).settings;
}

export function useRefreshPublicSettings() {
  return useContext(PublicSettingsContext).refresh;
}
