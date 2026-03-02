import { useState, useEffect, useCallback } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { usePublicSettings } from "../contexts/PublicSettingsContext";
import { FloorPlanEditor } from "./floorplan/FloorPlanEditor";
import { api, API_BASE_URL } from "../lib/api";
import type { FloorPlan } from "../lib/types";
import toast from "react-hot-toast";
import { Spinner } from "./ui/Spinner";
import {
  CalendarIcon,
  BookOpenIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PhotoIcon,
  MapIcon,
  MoonIcon,
  SunIcon,
  SwatchIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ArrowRightIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  exact?: boolean;
  soon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/dashboard", label: "Réservations", icon: CalendarIcon, exact: true },
  { path: "/dashboard/menu", label: "Carte", icon: BookOpenIcon },
  { path: "/dashboard/images", label: "Images", icon: PhotoIcon },
  { path: "/dashboard/clients", label: "Clients", icon: UsersIcon, soon: true },
  { path: "/dashboard/analytics", label: "Statistiques", icon: ChartBarIcon, soon: true },
  { path: "/dashboard/settings", label: "Paramètres", icon: Cog6ToothIcon },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const ps = usePublicSettings();
  const restaurantName = ps?.restaurant_name ?? 'RR Ice';
  const logoSrc = ps?.logo_url ? (ps.logo_url.startsWith('http') ? ps.logo_url : `${API_BASE_URL}${ps.logo_url}`) : '/logo.png';
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [showFloorPlanModal, setShowFloorPlanModal] = useState(false);
  const [floorPlanDirty, setFloorPlanDirty] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [loadingFloorPlan, setLoadingFloorPlan] = useState(false);

  // Close mobile menu on route change
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  const handleCloseFloorPlan = () => {
    if (floorPlanDirty) {
      setShowUnsavedModal(true);
      return;
    }
    setShowFloorPlanModal(false);
    setFloorPlanDirty(false);
  };

  const confirmCloseFloorPlan = () => {
    setShowUnsavedModal(false);
    setShowFloorPlanModal(false);
    setFloorPlanDirty(false);
  };

  // Close mobile menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname, closeMobileMenu]);

  useEffect(() => {
    loadFloorPlan();
  }, []);

  const loadFloorPlan = async () => {
    try {
      const { data } = await api.get<FloorPlan>("/api/floor-plans/current");
      setFloorPlan(data);
      return true;
    } catch {
      setFloorPlan(null);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Déconnexion réussie");
      navigate("/login", { replace: true });
    } catch {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const isActive = (item: NavItem) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-surface-bg">
      {/* ─── Mobile Sidebar Overlay ─── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`bg-white dark:bg-surface-sidebar border-r border-cream-200/30 dark:border-surface-border transition-all duration-300 flex flex-col flex-shrink-0
          ${sidebarOpen ? "w-64" : "w-[68px]"}
          fixed inset-y-0 left-0 z-50 md:static md:z-auto
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        `}
      >
        {/* ─── Logo ─── */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-cream-200/20 dark:border-surface-border flex-shrink-0">
          {sidebarOpen ? (
            <>
              <Link to="/dashboard" className="flex items-center gap-2.5">
                <img src={logoSrc} alt={restaurantName} className="w-8 h-8 object-contain" />
                <span className="font-display font-bold text-gray-900 dark:text-cream-100 text-lg tracking-tight">
                  {restaurantName}
                </span>
              </Link>
              <div className="flex items-center gap-1">
                <Link
                  to="/"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-coffee-600 dark:hover:text-cream-400 hover:bg-cream-50 dark:hover:bg-surface-card transition-all duration-200 text-xs font-medium"
                  title="Voir le site"
                >
                  <span>Site</span>
                  <ArrowRightIcon className="w-3 h-3" />
                </Link>
                <button
                  onClick={closeMobileMenu}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-cream-50 dark:hover:bg-surface-card transition-all md:hidden"
                  aria-label="Fermer le menu"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/dashboard"
              className="mx-auto"
              title={restaurantName}
            >
              <img src={logoSrc} alt={restaurantName} className="w-8 h-8 object-contain" />
            </Link>
          )}
        </div>

        {/* ─── Navigation ─── */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto" aria-label="Navigation principale">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            if (item.soon) {
              return (
                <div
                  key={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 dark:text-gray-600 cursor-default ${
                    sidebarOpen ? "" : "justify-center"
                  }`}
                  title={sidebarOpen ? undefined : `${item.label} (bientôt)`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <span className="flex-1 text-sm">{item.label}</span>
                  )}
                  {sidebarOpen && (
                    <span className="text-[10px] bg-cream-100 dark:bg-surface-card text-gray-400 dark:text-gray-600 px-1.5 py-0.5 rounded-md font-semibold tracking-wide">
                      bientôt
                    </span>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                  sidebarOpen ? "" : "justify-center"
                } ${
                  active
                    ? "bg-cream-100/70 dark:bg-cream-500/[0.08] text-coffee-800 dark:text-cream-200 shadow-soft dark:shadow-none"
                    : "text-gray-500 dark:text-gray-400 hover:bg-cream-50 dark:hover:bg-surface-card hover:text-gray-800 dark:hover:text-gray-200"
                }`}
                title={sidebarOpen ? undefined : item.label}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-cream-600 dark:text-cream-500" : ""}`} />
                {sidebarOpen && <span>{item.label}</span>}
                {active && sidebarOpen && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cream-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ─── Bottom Actions ─── */}
        <div className="px-3 py-3 border-t border-cream-200/20 dark:border-surface-border space-y-0.5">
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 dark:text-gray-500 hover:bg-cream-50 dark:hover:bg-surface-card hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 text-sm ${
              sidebarOpen ? "" : "justify-center"
            }`}
            title={sidebarOpen ? undefined : (theme === "light" ? "Clair" : theme === "dark" ? "Sombre" : "Design")}
            aria-label={`Changer le thème (actuel : ${theme === "light" ? "Clair" : theme === "dark" ? "Sombre" : "Design"})`}
          >
            {theme === "light" ? (
              <SunIcon className="w-5 h-5 flex-shrink-0" />
            ) : theme === "dark" ? (
              <MoonIcon className="w-5 h-5 flex-shrink-0" />
            ) : (
              <SwatchIcon className="w-5 h-5 flex-shrink-0" />
            )}
            {sidebarOpen && (
              <span>{theme === "light" ? "Clair" : theme === "dark" ? "Sombre" : "Design"}</span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 dark:text-gray-500 hover:bg-rose-50 dark:hover:bg-rose-500/[0.06] hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-200 text-sm ${
              sidebarOpen ? "" : "justify-center"
            }`}
            title={sidebarOpen ? undefined : "Déconnexion"}
            aria-label="Se déconnecter"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>

        {/* ─── Collapse Toggle (desktop only) ─── */}
        <div className="px-3 py-2 border-t border-cream-200/20 dark:border-surface-border hidden md:block">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-gray-300 dark:text-gray-600 hover:bg-cream-50 dark:hover:bg-surface-card hover:text-gray-500 dark:hover:text-gray-400 transition-all duration-200 ${
              sidebarOpen ? "" : "justify-center"
            }`}
            aria-label={sidebarOpen ? "Réduire la barre latérale" : "Ouvrir la barre latérale"}
          >
            <Bars3Icon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-xs">Réduire</span>}
          </button>
        </div>
      </aside>

      {/* ─── Main Area ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 md:px-6 h-14 flex-shrink-0 border-b border-cream-200/20 dark:border-surface-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-cream-50 dark:hover:bg-surface-card transition-all md:hidden"
              aria-label="Ouvrir le menu"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            {user && (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Bienvenue, <span className="text-gray-700 dark:text-cream-200 font-medium">{user.name}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={loadingFloorPlan}
              onClick={async () => {
                if (floorPlan) {
                  setShowFloorPlanModal(true);
                } else {
                  setLoadingFloorPlan(true);
                  const loaded = await loadFloorPlan();
                  setLoadingFloorPlan(false);
                  if (loaded) {
                    setShowFloorPlanModal(true);
                  } else {
                    toast.error("Impossible de charger le plan de salle");
                  }
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-cream-200/50 dark:border-surface-border-light text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-cream-200 hover:bg-cream-50 dark:hover:bg-surface-card text-sm font-medium transition-all duration-200 shadow-soft dark:shadow-dark-soft ${loadingFloorPlan ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {loadingFloorPlan ? <Spinner size="xs" className="text-current" /> : <MapIcon className="w-4 h-4" />}
              <span className="hidden sm:inline">Plan de salle</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-hidden">
          <Outlet context={{ floorPlan }} />
        </div>
      </div>

      {/* ─── Floor Plan Modal ─── */}
      {showFloorPlanModal && floorPlan && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-overlay-fade-in" onClick={handleCloseFloorPlan} role="dialog" aria-modal="true" aria-labelledby="floorplan-modal-title">
          <div className="bg-white dark:bg-surface-bg rounded-2xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden shadow-premium dark:shadow-dark-premium border border-cream-200/30 dark:border-surface-border-light animate-modal-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-cream-200/30 dark:border-surface-border bg-cream-50/50 dark:bg-surface-sidebar">
              <h2 id="floorplan-modal-title" className="text-lg font-display font-semibold text-gray-900 dark:text-cream-100">
                {floorPlan.name}
              </h2>
              <button
                onClick={handleCloseFloorPlan}
                className="p-2 rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-cream-100 dark:hover:bg-surface-card transition-all duration-200"
                aria-label="Fermer le plan de salle"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <FloorPlanEditor floorPlan={floorPlan} onUpdate={loadFloorPlan} onDirtyChange={setFloorPlanDirty} />
            </div>
          </div>
        </div>
      )}

      {/* ─── Unsaved Changes Modal ─── */}
      {showUnsavedModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-overlay-fade-in">
          <div className="bg-white dark:bg-surface-card rounded-2xl w-full max-w-sm shadow-2xl border border-cream-200/30 dark:border-surface-border-light overflow-hidden animate-modal-slide-in">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-cream-100 mb-2">
                Modifications non sauvegardées
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Vos changements seront perdus si vous quittez sans sauvegarder.
              </p>
            </div>
            <div className="px-6 pb-6 flex flex-col gap-2">
              <button
                onClick={() => setShowUnsavedModal(false)}
                className="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Continuer l'édition
              </button>
              <button
                onClick={confirmCloseFloorPlan}
                className="w-full py-2.5 text-red-500 dark:text-red-400 rounded-xl font-medium text-sm hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              >
                Quitter sans sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
