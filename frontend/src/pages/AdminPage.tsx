import { useEffect, useState } from "react";
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
} from "@heroicons/react/24/outline";

const statusLabels: Record<string, { label: string; color: string; icon: typeof CheckCircleIcon }> = {
  active:    { label: "Actif",      color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20", icon: CheckCircleIcon },
  pending:   { label: "En attente", color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20",        icon: ClockIcon },
  suspended: { label: "Suspendu",   color: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20",                 icon: XCircleIcon },
};

export default function AdminPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

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

  const handleStatusChange = async (restaurant: Restaurant, newStatus: string) => {
    setActionLoading(restaurant.id);
    try {
      await updateAdminRestaurant(restaurant.id, { status: newStatus });
      toast.success(`${restaurant.name} — statut mis à jour`);
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
      toast.success(`Module mis à jour`);
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
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-cream-100">
            Gestion des restaurants
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {restaurants.length} restaurant{restaurants.length > 1 ? 's' : ''} enregistré{restaurants.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-4">
          {restaurants.map((r) => {
            const status = statusLabels[r.status] || statusLabels.pending;
            const StatusIcon = status.icon;
            const isLoading = actionLoading === r.id;
            const modules = r.modules;
            const owner = r.users?.[0];

            return (
              <div
                key={r.id}
                className="bg-white dark:bg-[#1c1a17] border border-gray-200/60 dark:border-gray-700/40 rounded-2xl p-5 md:p-6 shadow-card dark:shadow-dark-card"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-display font-bold text-gray-900 dark:text-cream-100 truncate">
                        {r.name}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 space-y-0.5">
                      <p>Slug: <span className="font-mono text-gray-700 dark:text-gray-300">{r.slug}</span></p>
                      {owner && (
                        <p>Propriétaire: <span className="text-gray-700 dark:text-gray-300">{owner.email}</span></p>
                      )}
                      <p>Inscrit le: {new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 md:items-end flex-shrink-0">
                    {/* Status buttons */}
                    <div className="flex gap-2">
                      {r.status !== 'active' && (
                        <button
                          onClick={() => handleStatusChange(r, 'active')}
                          disabled={isLoading}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                        >
                          {isLoading ? <Spinner size="xs" className="text-white" /> : 'Activer'}
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

                    {/* Modules toggles */}
                    {modules && (
                      <div className="flex gap-2">
                        <ModuleToggle
                          icon={GlobeAltIcon}
                          label="Site web"
                          enabled={modules.website_enabled}
                          loading={isLoading}
                          onToggle={(v) => handleModuleToggle(r, 'website_enabled', v)}
                        />
                        <ModuleToggle
                          icon={BookOpenIcon}
                          label="Menu"
                          enabled={modules.menu_enabled}
                          loading={isLoading}
                          onToggle={(v) => handleModuleToggle(r, 'menu_enabled', v)}
                        />
                        <ModuleToggle
                          icon={CalendarIcon}
                          label="Réservation"
                          enabled={modules.reservations_enabled}
                          loading={isLoading}
                          onToggle={(v) => handleModuleToggle(r, 'reservations_enabled', v)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ModuleToggle({
  icon: Icon,
  label,
  enabled,
  loading,
  onToggle,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  enabled: boolean;
  loading: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      disabled={loading}
      title={`${label}: ${enabled ? 'activé' : 'désactivé'}`}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
        enabled
          ? 'bg-coffee-100 dark:bg-coffee-900/30 text-coffee-700 dark:text-coffee-300'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
