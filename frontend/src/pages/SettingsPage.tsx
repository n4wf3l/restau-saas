import { useEffect, useState, useCallback } from "react";
import { getSettings, updateSettings } from "../lib/api";
import type { RestaurantSettings } from "../lib/types";
import toast from "react-hot-toast";
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  TableCellsIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";
import { Spinner } from "../components/ui/Spinner";

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
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#1c1a17] ${
        enabled
          ? "bg-cream-600 dark:bg-cream-500"
          : "bg-gray-200 dark:bg-gray-600"
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
          className="w-20 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-cream-500/50 focus:border-cream-500 tabular-nums"
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
    <div className="bg-white dark:bg-[#1c1a17] rounded-2xl ring-1 ring-gray-200/40 dark:ring-[#2a2724] shadow-card dark:shadow-dark-card">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2a2724] flex items-center gap-2.5">
        <Icon className="w-5 h-5 text-cream-600 dark:text-cream-500" />
        <h2 className="text-base font-display font-semibold text-gray-900 dark:text-cream-50">
          {title}
        </h2>
      </div>
      <div className="px-5 divide-y divide-gray-100 dark:divide-[#2a2724]">
        {children}
      </div>
    </div>
  );
}

// ─── Main Page ───
export function SettingsPage() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch {
      toast.error("Erreur lors du chargement des paramètres");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleUpdate = async (
    field: keyof RestaurantSettings,
    value: number | boolean
  ) => {
    if (!settings) return;

    const prev = settings;
    setSettings({ ...settings, [field]: value });

    setSaving(true);
    try {
      const updated = await updateSettings({ [field]: value } as any);
      setSettings(updated);
      toast.success("Paramètre mis à jour");
    } catch {
      setSettings(prev);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ─── Header ─── */}
      <div className="px-6 pt-6 pb-5 flex-shrink-0">
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-cream-50 tracking-tight">
          Paramètres
        </h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Configurez le comportement de votre restaurant
          {saving && (
            <span className="ml-2 text-cream-600 dark:text-cream-400 animate-pulse-soft">
              Sauvegarde...
            </span>
          )}
        </p>
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Spinner />
          </div>
        ) : settings ? (
          <div className="max-w-3xl space-y-6">
            {/* ─── Section: Réservations ─── */}
            <SettingsSection title="Réservations" icon={CalendarIcon}>
              <ToggleRow
                icon={NoSymbolIcon}
                label="Activer les réservations"
                description="Lorsque désactivé, toute l'interface de réservation est masquée sur le site public (boutons, formulaire, page de réservation)."
                tag="bientôt"
                enabled={true}
                onChange={() => {}}
                disabled
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
          </div>
        ) : null}
      </div>
    </div>
  );
}
