import { useEffect, useMemo, useState } from "react";
import { getAdminRestaurants, updateAdminRestaurant, updateAdminRestaurantModules } from "../lib/api";
import type { Restaurant } from "../lib/types";
import toast from "react-hot-toast";
import { Spinner } from "../components/ui/Spinner";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  GlobeAltIcon,
  BookOpenIcon,
  CalendarIcon,
  PhoneIcon,
  PhotoIcon,
  SparklesIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";

const statusLabels: Record<string, { label: string; color: string; icon: typeof CheckCircleIcon }> = {
  active:    { label: "Actif",      color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20", icon: CheckCircleIcon },
  pending:   { label: "En attente", color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20",        icon: ClockIcon },
  suspended: { label: "Suspendu",   color: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20",                 icon: XCircleIcon },
};

const MODULE_META: Array<{
  key: 'reservations_enabled' | 'menu_enabled' | 'website_enabled' | 'contact_enabled' | 'gallery_enabled' | 'events_enabled' | 'cancellation_enabled';
  label: string;
  icon: typeof CheckCircleIcon;
}> = [
  { key: 'website_enabled',      label: 'Site web',       icon: GlobeAltIcon },
  { key: 'menu_enabled',         label: 'Menu',           icon: BookOpenIcon },
  { key: 'reservations_enabled', label: 'Réservations',   icon: CalendarIcon },
  { key: 'events_enabled',       label: 'Événements',     icon: SparklesIcon },
  { key: 'cancellation_enabled', label: 'Annulation',     icon: ArrowUturnLeftIcon },
  { key: 'contact_enabled',      label: 'Contact',        icon: PhoneIcon },
  { key: 'gallery_enabled',      label: 'Galerie',        icon: PhotoIcon },
];

const THEMES: Array<'coffee' | 'noir' | 'sable'> = ['coffee', 'noir', 'sable'];
const LAYOUTS: Array<'classic' | 'cinematic'> = ['classic', 'cinematic'];

export default function AdminPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all');

  const load = async () => {
    try {
      const data = await getAdminRestaurants();
      setRestaurants(data);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const c = { all: restaurants.length, pending: 0, active: 0, suspended: 0 };
    restaurants.forEach(r => { c[r.status as 'pending' | 'active' | 'suspended']++; });
    return c;
  }, [restaurants]);

  const filtered = useMemo(() => (
    filter === 'all' ? restaurants : restaurants.filter(r => r.status === filter)
  ), [restaurants, filter]);

  const handleStatusChange = async (restaurant: Restaurant, newStatus: string) => {
    // Guard: activating a tenant with zero enabled modules leaves them staring
    // at an empty account. Warn once so the superadmin can cancel and pick a plan.
    if (restaurant.status === 'pending' && newStatus === 'active') {
      const mods = restaurant.modules;
      const hasAny = mods && MODULE_META.some(({ key }) => (mods as unknown as Record<string, boolean>)[key]);
      if (!hasAny && !window.confirm(
        `Activer ${restaurant.name} sans aucun module ne lui donnera rien à faire dans son espace. Continuer quand même ?`,
      )) {
        return;
      }
    }

    setActionLoading(restaurant.id);
    try {
      await updateAdminRestaurant(restaurant.id, { status: newStatus });
      if (restaurant.status === 'pending' && newStatus === 'active') {
        toast.success(`${restaurant.name} validé — email envoyé au propriétaire`);
      } else {
        toast.success(`${restaurant.name} — statut mis à jour`);
      }
      await load();
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setActionLoading(null);
    }
  };

  const handleModuleToggle = async (restaurant: Restaurant, module: string, value: boolean) => {
    setActionLoading(restaurant.id);
    try {
      await updateAdminRestaurantModules(restaurant.id, { [module]: value });
      await load();
    } catch {
      toast.error("Erreur lors de la mise à jour du module");
    } finally {
      setActionLoading(null);
    }
  };

  const handleThemeLayoutChange = async (
    restaurant: Restaurant,
    field: 'theme' | 'layout',
    value: string | null,
  ) => {
    setActionLoading(restaurant.id);
    try {
      await updateAdminRestaurantModules(restaurant.id, { [field]: value });
      toast.success(`${field === 'theme' ? 'Thème' : 'Layout'} mis à jour`);
      await load();
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-cream-100">
            Gestion des restaurants
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {restaurants.length} restaurant{restaurants.length > 1 ? 's' : ''} enregistré{restaurants.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {(['all', 'pending', 'active', 'suspended'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                filter === f
                  ? 'border-coffee-600 text-coffee-700 dark:text-coffee-300'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {f === 'all' ? 'Tous' : statusLabels[f].label}
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map((r) => {
            const status = statusLabels[r.status] || statusLabels.pending;
            const StatusIcon = status.icon;
            const isLoading = actionLoading === r.id;
            const modules = r.modules;
            const owner = r.users?.[0];
            const isPending = r.status === 'pending';

            return (
              <div
                key={r.id}
                className={`bg-white dark:bg-[#1c1a17] border rounded-2xl p-5 md:p-6 shadow-card dark:shadow-dark-card ${
                  isPending
                    ? 'border-amber-300 dark:border-amber-700/50'
                    : 'border-gray-200/60 dark:border-gray-700/40'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-display font-bold text-gray-900 dark:text-cream-100 truncate">
                        {r.name}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 space-y-0.5">
                      <p>Slug : <span className="font-mono text-gray-700 dark:text-gray-300">{r.slug}</span></p>
                      {owner && (
                        <p>Propriétaire : <span className="text-gray-700 dark:text-gray-300">{owner.email}</span></p>
                      )}
                      <p>Inscrit le : {new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>

                  {/* Status action buttons */}
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    {isPending && (
                      <button
                        onClick={() => handleStatusChange(r, 'active')}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                      >
                        {isLoading ? <Spinner size="xs" className="text-white" /> : <CheckCircleIcon className="w-4 h-4" />}
                        Valider
                      </button>
                    )}
                    {!isPending && r.status !== 'active' && (
                      <button
                        onClick={() => handleStatusChange(r, 'active')}
                        disabled={isLoading}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                      >
                        {isLoading ? <Spinner size="xs" className="text-white" /> : 'Réactiver'}
                      </button>
                    )}
                    {r.status !== 'suspended' && (
                      <button
                        onClick={() => handleStatusChange(r, 'suspended')}
                        disabled={isLoading}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                      >
                        Suspendre
                      </button>
                    )}
                    {r.status === 'suspended' && (
                      <button
                        onClick={() => handleStatusChange(r, 'pending')}
                        disabled={isLoading}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
                      >
                        Remettre en attente
                      </button>
                    )}
                  </div>
                </div>

                {/* Modules grid */}
                {modules && (
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                      Fonctionnalités {isPending && '— cochez ce qui sera activé avant de valider'}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {MODULE_META.map(({ key, label, icon: Icon }) => {
                        const enabled = Boolean((modules as unknown as Record<string, boolean>)[key]);
                        return (
                          <button
                            key={key}
                            onClick={() => handleModuleToggle(r, key, !enabled)}
                            disabled={isLoading}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
                              enabled
                                ? 'bg-coffee-50 dark:bg-coffee-900/20 border-coffee-300 dark:border-coffee-700 text-coffee-800 dark:text-coffee-200'
                                : 'bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-500'
                            }`}
                          >
                            <Icon className={`w-4 h-4 flex-shrink-0 ${enabled ? '' : 'opacity-60'}`} />
                            <span className="truncate">{label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Theme + layout override */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                          Thème imposé
                        </label>
                        <select
                          value={modules.theme ?? ''}
                          onChange={(e) => handleThemeLayoutChange(r, 'theme', e.target.value || null)}
                          disabled={isLoading}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-cream-100 disabled:opacity-50"
                        >
                          <option value="">Choix libre du tenant</option>
                          {THEMES.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                          Layout imposé
                        </label>
                        <select
                          value={modules.layout ?? ''}
                          onChange={(e) => handleThemeLayoutChange(r, 'layout', e.target.value || null)}
                          disabled={isLoading}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-cream-100 disabled:opacity-50"
                        >
                          <option value="">Choix libre du tenant</option>
                          {LAYOUTS.map(l => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            Aucun restaurant dans cette catégorie.
          </div>
        )}
      </div>
    </div>
  );
}
