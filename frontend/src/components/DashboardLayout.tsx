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
  ArrowRightIcon,
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
  { path: "/dashboard/settings", label: "Paramètres", icon: Cog6ToothIcon },
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
    <div className="h-screen flex bg-gray-50 dark:bg-[#141311]">
      {/* ─── Sidebar ─── */}
      <aside
        className={`bg-white dark:bg-[#0e0d0c] border-r border-cream-200/30 dark:border-[#1e1b18] transition-all duration-300 flex flex-col flex-shrink-0 ${
          sidebarOpen ? "w-64" : "w-[68px]"
        }`}
      >
        {/* ─── Logo ─── */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-cream-200/20 dark:border-[#1e1b18] flex-shrink-0">
          {sidebarOpen ? (
            <>
              <Link to="/dashboard" className="flex items-center gap-2.5">
                <BuildingStorefrontIcon className="w-6 h-6 text-cream-600 dark:text-cream-500" />
                <span className="font-display font-bold text-gray-900 dark:text-cream-100 text-lg tracking-tight">
                  RR Ice
                </span>
              </Link>
              <Link
                to="/"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-coffee-600 dark:hover:text-cream-400 hover:bg-cream-50 dark:hover:bg-[#1c1a17] transition-all duration-200 text-xs font-medium"
                title="Voir le site"
              >
                <span>Site</span>
                <ArrowRightIcon className="w-3 h-3" />
              </Link>
            </>
          ) : (
            <Link
              to="/"
              className="mx-auto p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-cream-600 dark:hover:text-cream-400 hover:bg-cream-50 dark:hover:bg-[#1c1a17] transition-all duration-200"
              title="Voir le site"
            >
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          )}
        </div>

        {/* ─── Navigation ─── */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
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
                    <span className="text-[10px] bg-cream-100 dark:bg-[#1c1a17] text-gray-400 dark:text-gray-600 px-1.5 py-0.5 rounded-md font-semibold tracking-wide">
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
                    : "text-gray-500 dark:text-gray-400 hover:bg-cream-50 dark:hover:bg-[#1c1a17] hover:text-gray-800 dark:hover:text-gray-200"
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
        <div className="px-3 py-3 border-t border-cream-200/20 dark:border-[#1e1b18] space-y-0.5">
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 dark:text-gray-500 hover:bg-cream-50 dark:hover:bg-[#1c1a17] hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 text-sm ${
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
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 dark:text-gray-500 hover:bg-rose-50 dark:hover:bg-rose-500/[0.06] hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-200 text-sm ${
              sidebarOpen ? "" : "justify-center"
            }`}
            title={sidebarOpen ? undefined : "Déconnexion"}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>

        {/* ─── Collapse Toggle ─── */}
        <div className="px-3 py-2 border-t border-cream-200/20 dark:border-[#1e1b18]">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-gray-300 dark:text-gray-600 hover:bg-cream-50 dark:hover:bg-[#1c1a17] hover:text-gray-500 dark:hover:text-gray-400 transition-all duration-200 ${
              sidebarOpen ? "" : "justify-center"
            }`}
          >
            <Bars3Icon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-xs">Réduire</span>}
          </button>
        </div>
      </aside>

      {/* ─── Main Area ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 h-14 flex-shrink-0 border-b border-cream-200/20 dark:border-[#1e1b18]">
          <div className="flex items-center gap-3">
            {user && (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Bienvenue, <span className="text-gray-700 dark:text-cream-200 font-medium">{user.name}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFloorPlanModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cream-200/50 dark:border-[#2a2724] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-cream-200 hover:bg-cream-50 dark:hover:bg-[#1c1a17] text-sm font-medium transition-all duration-200 shadow-soft dark:shadow-dark-soft"
            >
              <MapIcon className="w-4 h-4" />
              {<span className="hidden sm:inline">Plan de salle</span>}
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141311] rounded-2xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden shadow-premium dark:shadow-dark-premium border border-cream-200/30 dark:border-[#2a2724]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-cream-200/30 dark:border-[#1e1b18] bg-cream-50/50 dark:bg-[#0e0d0c]">
              <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-cream-100">
                {floorPlan.name}
              </h2>
              <button
                onClick={() => setShowFloorPlanModal(false)}
                className="p-2 rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-cream-100 dark:hover:bg-[#1c1a17] transition-all duration-200"
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
