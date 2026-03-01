import { useEffect, useState, useCallback } from "react";
import { getSettings, updateSettings } from "../lib/api";
import type { RestaurantSettings, OpeningHours, DayHours, ClosureDate, SocialLinks, SocialLink } from "../lib/types";
import toast from "react-hot-toast";
import {
  CalendarIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  TableCellsIcon,
  NoSymbolIcon,
  PlusIcon,
  XMarkIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { Spinner } from "../components/ui/Spinner";

const DAYS: { key: string; label: string }[] = [
  { key: "monday", label: "Lundi" },
  { key: "tuesday", label: "Mardi" },
  { key: "wednesday", label: "Mercredi" },
  { key: "thursday", label: "Jeudi" },
  { key: "friday", label: "Vendredi" },
  { key: "saturday", label: "Samedi" },
  { key: "sunday", label: "Dimanche" },
];

const DEFAULT_HOURS: DayHours = { open: "11:00", close: "23:00", closed: false };

const SOCIAL_NETWORKS: { key: string; label: string; placeholder: string }[] = [
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@..." },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@..." },
  { key: "snapchat", label: "Snapchat", placeholder: "https://snapchat.com/add/..." },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/..." },
];

// ─── Toggle Switch ───
function ToggleSwitch({
  enabled,
  onChange,
  disabled = false,
}: {
  enabled: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-surface-card ${
        enabled
          ? "bg-cream-600 dark:bg-cream-500"
          : "bg-gray-200 dark:bg-surface-input-border"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ─── Toggle Row ───
function ToggleRow({
  icon: Icon,
  label,
  description,
  tag,
  enabled,
  onChange,
  disabled = false,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  description: string;
  tag?: string;
  enabled: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex gap-3 flex-1 min-w-0">
        <Icon className="w-5 h-5 text-cream-600 dark:text-cream-500 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-cream-50 flex items-center gap-2">
            {label}
            {tag && (
              <span className="text-[10px] bg-cream-100 dark:bg-cream-500/10 text-cream-600 dark:text-cream-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                {tag}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} disabled={disabled} />
    </div>
  );
}

// ─── Number Setting ───
function NumberSetting({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  icon: Icon,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex gap-3 flex-1 min-w-0">
        <Icon className="w-5 h-5 text-cream-600 dark:text-cream-500 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-cream-50">
            {label}
          </div>
          {description && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (!isNaN(v) && v >= min && v <= max) onChange(v);
          }}
          min={min}
          max={max}
          step={step}
          className="w-20 px-3 py-2 border border-gray-200 dark:border-surface-input-border rounded-lg bg-white dark:bg-surface-input text-gray-900 dark:text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500 tabular-nums"
        />
        <span className="text-sm text-gray-400 dark:text-gray-500 min-w-[32px]">
          {suffix}
        </span>
      </div>
    </div>
  );
}

// ─── Section Card ───
function SettingsSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-surface-card rounded-2xl ring-1 ring-gray-200/40 dark:ring-surface-border-light shadow-card dark:shadow-dark-card">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-surface-border-light flex items-center gap-2.5">
        <Icon className="w-5 h-5 text-cream-600 dark:text-cream-500" />
        <h2 className="text-base font-display font-semibold text-gray-900 dark:text-cream-50">
          {title}
        </h2>
      </div>
      <div className="px-5 divide-y divide-gray-100 dark:divide-surface-border-light">
        {children}
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function SettingsPage() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [savedSettings, setSavedSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const data = await getSettings();
      setSettings(data);
      setSavedSettings(data);
    } catch {
      toast.error("Erreur lors du chargement des paramètres");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const isDirty = settings && savedSettings
    ? JSON.stringify(settings) !== JSON.stringify(savedSettings)
    : false;

  const handleUpdate = (
    field: keyof RestaurantSettings,
    value: number | boolean | OpeningHours | ClosureDate[] | SocialLinks | null
  ) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value } as RestaurantSettings);
  };

  const handleSave = async () => {
    if (!settings || !isDirty) return;
    setSaving(true);
    try {
      const updated = await updateSettings({
        reservations_enabled: settings.reservations_enabled,
        auto_confirm: settings.auto_confirm,
        send_confirmation_email: settings.send_confirmation_email,
        service_duration_minutes: settings.service_duration_minutes,
        buffer_minutes: settings.buffer_minutes,
        max_occupancy_pct: settings.max_occupancy_pct,
        auto_optimize_tables: settings.auto_optimize_tables,
        opening_hours: settings.opening_hours,
        closure_dates: settings.closure_dates,
        menu_manual_visible: settings.menu_manual_visible,
        menu_pdf_visible: settings.menu_pdf_visible,
        social_links: settings.social_links,
      } as any);
      setSettings(updated);
      setSavedSettings(updated);
      toast.success("Paramètres sauvegardés");
    } catch (err) {
      // Settings save failed
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  // Opening hours helpers — always return a deep copy to avoid mutating React state
  const getHours = (): OpeningHours => {
    const src = settings?.opening_hours;
    const h: OpeningHours = {};
    for (const d of DAYS) {
      const dh = src?.[d.key];
      h[d.key] = dh ? { open: dh.open, close: dh.close, closed: dh.closed } : { ...DEFAULT_HOURS };
    }
    return h;
  };

  const updateDay = (dayKey: string, field: keyof DayHours, value: string | boolean) => {
    const hours = getHours(); // already a fresh copy
    hours[dayKey] = { ...hours[dayKey], [field]: value };
    handleUpdate("opening_hours", hours);
  };

  const hasOpeningHours = !!settings?.opening_hours;

  const enableOpeningHours = (enable: boolean) => {
    if (enable) {
      const h: OpeningHours = {};
      for (const d of DAYS) h[d.key] = { ...DEFAULT_HOURS };
      handleUpdate("opening_hours", h);
    } else {
      handleUpdate("opening_hours", null);
    }
  };

  // Closure dates helpers
  const [newClosureDate, setNewClosureDate] = useState("");
  const [newClosureReason, setNewClosureReason] = useState("");

  const closureDates: ClosureDate[] = settings?.closure_dates || [];

  const addClosureDate = () => {
    if (!newClosureDate) { toast.error("Sélectionnez une date"); return; }
    if (closureDates.some((c) => c.date === newClosureDate)) { toast.error("Cette date est déjà bloquée"); return; }
    const updated = [...closureDates, { date: newClosureDate, reason: newClosureReason }]
      .sort((a, b) => a.date.localeCompare(b.date));
    handleUpdate("closure_dates", updated);
    setNewClosureDate("");
    setNewClosureReason("");
  };

  const removeClosureDate = (date: string) => {
    const updated = closureDates.filter((c) => c.date !== date);
    handleUpdate("closure_dates", updated.length > 0 ? updated : null);
  };

  // Social links helpers
  const getSocialLinks = (): SocialLinks => {
    const src = settings?.social_links;
    const links: SocialLinks = {};
    for (const net of SOCIAL_NETWORKS) {
      const existing = src?.[net.key];
      links[net.key] = existing ? { enabled: existing.enabled, url: existing.url } : { enabled: false, url: "" };
    }
    return links;
  };

  const updateSocialLink = (key: string, field: keyof SocialLink, value: string | boolean) => {
    const links = getSocialLinks();
    links[key] = { ...links[key], [field]: value };
    handleUpdate("social_links", links);
  };

  return (
    <div className="flex flex-col h-full">
      {/* ─── Header ─── */}
      <div className="px-6 pt-6 pb-5 flex-shrink-0 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-cream-50 tracking-tight">
            Paramètres
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Configurez le comportement de votre restaurant
          </p>
        </div>
        {settings && (
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || saving}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors shadow-sm ${
              isDirty
                ? "text-cream-50 bg-coffee-600 hover:bg-coffee-500"
                : "text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-surface-input cursor-not-allowed"
            } ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {saving && <Spinner size="sm" />}
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        )}
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Spinner />
          </div>
        ) : settings ? (
          <div className="space-y-6">
            {/* ─── Section: Réservations ─── */}
            <SettingsSection title="Réservations" icon={CalendarIcon}>
              <ToggleRow
                icon={NoSymbolIcon}
                label="Activer les réservations"
                description="Lorsque désactivé, toute l'interface de réservation est masquée sur le site public (boutons, formulaire, page de réservation)."
                enabled={settings.reservations_enabled}
                onChange={(v) => handleUpdate("reservations_enabled", v)}
              />
              <ToggleRow
                icon={ShieldCheckIcon}
                label="Confirmation automatique"
                description="Les réservations passent directement en « confirmée » sans validation manuelle. L'onglet « En attente » sera masqué sur le dashboard."
                enabled={settings.auto_confirm}
                onChange={(v) => handleUpdate("auto_confirm", v)}
              />
              <ToggleRow
                icon={EnvelopeIcon}
                label="Email de double confirmation"
                description="Envoyer un email de confirmation au client après sa réservation."
                tag="bientôt"
                enabled={settings.send_confirmation_email}
                onChange={(v) => handleUpdate("send_confirmation_email", v)}
              />
            </SettingsSection>

            {/* ─── Section: Horaires d'ouverture ─── */}
            <SettingsSection title="Horaires d'ouverture" icon={ClockIcon}>
              <ToggleRow
                icon={ClockIcon}
                label="Définir les horaires"
                description="Bloquer les réservations en dehors de vos heures d'ouverture. Sans horaires définis, les clients peuvent réserver à toute heure."
                enabled={hasOpeningHours}
                onChange={enableOpeningHours}
              />
              {hasOpeningHours && (
                <div className="py-4 space-y-2">
                  {DAYS.map((day) => {
                    const dh = getHours()[day.key] || DEFAULT_HOURS;
                    return (
                      <div key={day.key} className="flex items-center gap-3">
                        <span className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
                          {day.label}
                        </span>
                        <ToggleSwitch
                          enabled={!dh.closed}
                          onChange={(open) => updateDay(day.key, "closed", !open)}
                        />
                        {dh.closed ? (
                          <span className="text-xs text-gray-400 dark:text-gray-500 italic ml-1">Fermé</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={dh.open}
                              onChange={(e) => updateDay(day.key, "open", e.target.value)}
                              className="px-2.5 py-1.5 text-sm border border-gray-200 dark:border-surface-input-border rounded-lg bg-white dark:bg-surface-input text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500 tabular-nums"
                            />
                            <span className="text-xs text-gray-400">—</span>
                            <input
                              type="time"
                              value={dh.close}
                              onChange={(e) => updateDay(day.key, "close", e.target.value)}
                              className="px-2.5 py-1.5 text-sm border border-gray-200 dark:border-surface-input-border rounded-lg bg-white dark:bg-surface-input text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500 tabular-nums"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </SettingsSection>

            {/* ─── Section: Fermetures exceptionnelles ─── */}
            <SettingsSection title="Fermetures exceptionnelles" icon={CalendarDaysIcon}>
              <div className="py-4">
                <div className="flex gap-3 mb-1">
                  <CalendarDaysIcon className="w-5 h-5 text-cream-600 dark:text-cream-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-cream-50 mb-0.5">Jours de fermeture</div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                      Bloquez des dates spécifiques (jours fériés, vacances, événements privés). Les clients ne pourront pas réserver ces jours-là.
                    </p>
                  </div>
                </div>

                {/* Add closure form */}
                <div className="flex items-end gap-2 mt-4 ml-8">
                  <div className="flex-1">
                    <input
                      type="date"
                      value={newClosureDate}
                      onChange={(e) => setNewClosureDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-surface-input-border rounded-lg bg-white dark:bg-surface-input text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newClosureReason}
                      onChange={(e) => setNewClosureReason(e.target.value)}
                      placeholder="Raison (optionnel)"
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-surface-input-border rounded-lg bg-white dark:bg-surface-input text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addClosureDate}
                    disabled={!newClosureDate}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-cream-50 bg-coffee-600 rounded-lg hover:bg-coffee-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Ajouter
                  </button>
                </div>

                {/* List of closure dates */}
                {closureDates.length > 0 && (
                  <div className="mt-4 ml-8 space-y-1.5">
                    {closureDates.map((c) => {
                      const d = new Date(c.date + "T00:00:00");
                      const formatted = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
                      const isPast = c.date < new Date().toISOString().slice(0, 10);
                      return (
                        <div
                          key={c.date}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border ${
                            isPast
                              ? "border-gray-100 dark:border-surface-border-light bg-gray-50/50 dark:bg-surface-bg opacity-60"
                              : "border-rose-200/40 dark:border-rose-500/15 bg-rose-50/30 dark:bg-rose-500/[0.04]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`text-sm font-medium ${isPast ? "text-gray-400" : "text-gray-700 dark:text-gray-200"}`}>
                              {formatted}
                            </span>
                            {c.reason && (
                              <span className="text-xs text-gray-400 dark:text-gray-500">— {c.reason}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeClosureDate(c.date)}
                            className="p-1 text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </SettingsSection>

            {/* ─── Section: Gestion des tables ─── */}
            <SettingsSection title="Gestion des tables" icon={TableCellsIcon}>
              <NumberSetting
                icon={ClockIcon}
                label="Durée de service par table"
                description="Temps qu'une réservation bloque une table (en minutes)"
                value={settings.service_duration_minutes}
                onChange={(v) => handleUpdate("service_duration_minutes", v)}
                min={15}
                max={480}
                step={15}
                suffix="min"
              />
              <NumberSetting
                icon={ClockIcon}
                label="Buffer entre réservations"
                description="Temps de nettoyage / préparation entre deux services"
                value={settings.buffer_minutes}
                onChange={(v) => handleUpdate("buffer_minutes", v)}
                min={0}
                max={120}
                step={5}
                suffix="min"
              />
              <NumberSetting
                icon={UserGroupIcon}
                label="Capacité maximale"
                description="Pourcentage de places autorisées simultanément"
                value={settings.max_occupancy_pct}
                onChange={(v) => handleUpdate("max_occupancy_pct", v)}
                min={10}
                max={100}
                step={5}
                suffix="%"
              />
              <ToggleRow
                icon={TableCellsIcon}
                label="Optimisation auto des tables"
                description="Attribue automatiquement la plus petite table disponible au client, au lieu de le laisser choisir."
                enabled={settings.auto_optimize_tables}
                onChange={(v) => handleUpdate("auto_optimize_tables", v)}
              />
            </SettingsSection>

            {/* ─── Section: No-show ─── */}
            <SettingsSection title="No-show" icon={ExclamationTriangleIcon}>
              <div className="py-4">
                <div className="flex gap-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-cream-600 dark:text-cream-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-cream-50 mb-1">
                      Gestion des no-shows
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                      Vous pouvez marquer une réservation comme{" "}
                      <strong className="text-gray-600 dark:text-cream-300">
                        « no-show »
                      </strong>{" "}
                      depuis la page Réservations. La réservation sera archivée
                      et un onglet dédié vous permettra de la consulter ou de la
                      restaurer à tout moment.
                    </p>
                  </div>
                </div>
              </div>
            </SettingsSection>

            {/* ─── Section: Réseaux sociaux ─── */}
            <SettingsSection title="Réseaux sociaux" icon={GlobeAltIcon}>
              <div className="py-4 space-y-3">
                {SOCIAL_NETWORKS.map((net) => {
                  const link = getSocialLinks()[net.key];
                  return (
                    <div key={net.key} className="flex items-center gap-3">
                      <span className="w-24 text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
                        {net.label}
                      </span>
                      <ToggleSwitch
                        enabled={link.enabled}
                        onChange={(v) => updateSocialLink(net.key, "enabled", v)}
                      />
                      {link.enabled && (
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateSocialLink(net.key, "url", e.target.value)}
                          placeholder={net.placeholder}
                          className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-surface-input-border rounded-lg bg-white dark:bg-surface-input text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500"
                        />
                      )}
                      {!link.enabled && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 italic ml-1">Désactivé</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </SettingsSection>
          </div>
        ) : null}
      </div>
    </div>
  );
}
