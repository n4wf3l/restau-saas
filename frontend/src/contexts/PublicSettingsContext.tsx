import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { getPublicSettings } from "../lib/api";
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

export function PublicSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PublicSettings | null>(null);

  const refresh = useCallback(() => {
    getPublicSettings()
      .then((s) => setSettings(s))
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
