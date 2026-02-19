import { useState, useEffect } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { FloorPlanEditor } from "./floorplan/FloorPlanEditor";
import { api } from "../lib/api";
import type { FloorPlan } from "../lib/types";
import toast from "react-hot-toast";
import {
  CalendarIcon,
  BookOpenIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  MapIcon,
  MoonIcon,
  SunIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  BuildingStorefrontIcon,
  XCircleIcon,
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
  { path: "/dashboard/clients", label: "Clients", icon: UsersIcon, soon: true },
  { path: "/dashboard/analytics", label: "Statistiques", icon: ChartBarIcon, soon: true },
  { path: "/dashboard/settings", label: "Paramètres", icon: Cog6ToothIcon, soon: true },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [showFloorPlanModal, setShowFloorPlanModal] = useState(false);

  useEffect(() => {
    loadFloorPlan();
  }, []);

  const loadFloorPlan = async () => {
    try {
      const { data } = await api.get<FloorPlan>("/api/floor-plans/current");
      setFloorPlan(data);
    } catch {
      // Floor plan might not exist yet
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
    <div className="h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside
        className={`bg-white dark:bg-gray-900 border-r border-gray-200/80 dark:border-gray-800 transition-all duration-300 flex flex-col flex-shrink-0 ${
          sidebarOpen ? "w-60" : "w-[68px]"
        }`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 flex-shrink-0">
          {sidebarOpen ? (
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <BuildingStorefrontIcon className="w-6 h-6 text-coffee-500" />
              <span className="font-display font-bold text-gray-900 dark:text-cream-100 text-lg">
                RR Ice
              </span>
            </Link>
          ) : (
            <Link to="/dashboard" className="mx-auto">
              <BuildingStorefrontIcon className="w-6 h-6 text-coffee-500" />
            </Link>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            if (item.soon) {
              return (
                <div
                  key={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 dark:text-gray-600 cursor-default ${
                    sidebarOpen ? "" : "justify-center"
                  }`}
                  title={sidebarOpen ? undefined : `${item.label} (bientôt)`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <span className="flex-1 text-sm">{item.label}</span>
                  )}
                  {sidebarOpen && (
                    <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 px-1.5 py-0.5 rounded font-medium">
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                  sidebarOpen ? "" : "justify-center"
                } ${
                  active
                    ? "bg-coffee-50 dark:bg-coffee-900/20 text-coffee-700 dark:text-coffee-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
                title={sidebarOpen ? undefined : item.label}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-coffee-600 dark:text-coffee-400" : ""}`} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-sm ${
              sidebarOpen ? "" : "justify-center"
            }`}
            title={sidebarOpen ? undefined : (theme === "light" ? "Dark mode" : "Light mode")}
          >
            {theme === "light" ? (
              <MoonIcon className="w-5 h-5 flex-shrink-0" />
            ) : (
              <SunIcon className="w-5 h-5 flex-shrink-0" />
            )}
            {sidebarOpen && (
              <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 transition-colors text-sm ${
              sidebarOpen ? "" : "justify-center"
            }`}
            title={sidebarOpen ? undefined : "Déconnexion"}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>

        {/* Sidebar toggle */}
        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ${
              sidebarOpen ? "" : "justify-center"
            }`}
          >
            <Bars3Icon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-xs">Réduire</span>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar - transparent */}
        <header className="flex items-center justify-between px-6 h-14 flex-shrink-0">
          <div className="flex items-center gap-3">
            {user && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Bienvenue, <span className="text-gray-700 dark:text-gray-200 font-medium">{user.name}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFloorPlanModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 text-sm font-medium transition-colors shadow-sm"
            >
              <MapIcon className="w-4 h-4" />
              {<span className="hidden sm:inline">Plan de salle</span>}
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>

      {/* Floor Plan Modal */}
      {showFloorPlanModal && floorPlan && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-cream-100">
                {floorPlan.name}
              </h2>
              <button
                onClick={() => setShowFloorPlanModal(false)}
                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <FloorPlanEditor floorPlan={floorPlan} onUpdate={loadFloorPlan} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
