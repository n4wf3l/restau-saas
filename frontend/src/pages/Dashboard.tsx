import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { FloorPlanEditor } from "../components/floorplan/FloorPlanEditor";
import { api } from "../lib/api";
import { getReservations, updateReservationStatus, deleteReservation } from "../lib/api";
import type { FloorPlan, Reservation } from "../lib/types";
import toast from "react-hot-toast";
import {
  CalendarIcon,
  ClockIcon,
  BookOpenIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  MoonIcon,
  SunIcon,
  Bars3Icon,
  MapIcon,
  ArrowRightOnRectangleIcon,
  BuildingStorefrontIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

type TabType = "all" | "pending" | "confirmed";

export function Dashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showFloorPlanModal, setShowFloorPlanModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("all");

  useEffect(() => {
    loadFloorPlan();
    loadReservations();
  }, []);

  const loadFloorPlan = async () => {
    try {
      const { data } = await api.get<FloorPlan>("/api/floor-plans/current");
      setFloorPlan(data);
    } catch (error: any) {
      toast.error("Erreur lors du chargement du plan");
    }
  };

  const loadReservations = async () => {
    try {
      const data = await getReservations();
      setReservations(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des réservations");
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateReservationStatus(id, status);
      toast.success("Statut mis à jour");
      loadReservations();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette réservation ?")) return;
    try {
      await deleteReservation(id);
      toast.success("Réservation supprimée");
      loadReservations();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleLogout = async() => {
    try {
      await logout();
      toast.success("Déconnexion réussie");
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const filteredReservations = reservations.filter((res) => {
    if (activeTab === "all") return true;
    return res.status === activeTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "confirmed":
        return "Confirmée";
      case "cancelled":
        return "Annulée";
      case "completed":
        return "Terminée";
      default:
        return status;
    }
  };

  const tabs: { key: TabType; label: string; count: number }[] = [
    {
      key: "all",
      label: "Toutes",
      count: reservations.length,
    },
    {
      key: "pending",
      label: "En attente",
      count: reservations.filter((r) => r.status === "pending").length,
    },
    {
      key: "confirmed",
      label: "Confirmées",
      count: reservations.filter((r) => r.status === "confirmed").length,
    },
  ];

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside
        className={`bg-white dark:bg-coffee-950 border-r border-gray-200 dark:border-coffee-800 transition-all duration-300 flex flex-col ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 dark:border-coffee-900/20 flex items-center justify-between">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <BuildingStorefrontIcon className="w-6 h-6 text-coffee-400" />
              <h2 className="font-display font-bold text-gray-900 dark:text-cream-100">RR Ice</h2>
            </div>
          ) : (
            <BuildingStorefrontIcon className="w-6 h-6 text-coffee-400 mx-auto" />
          )}
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>

        {/* Collapse button when closed */}
        {!sidebarOpen && (
          <div className="p-2 flex justify-center border-b border-gray-200 dark:border-coffee-900/20">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-coffee-900 transition-colors"
            >
              <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-cream-400" />
            </button>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1">
          <a
            href="/dashboard"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-coffee-100 dark:bg-coffee-600/20 text-coffee-700 dark:text-coffee-300 border border-coffee-200 dark:border-coffee-600/30 transition-colors font-medium"
          >
            <CalendarIcon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Réservations</span>}
          </a>
          <a
            href="/dashboard/menu"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-cream-300 hover:bg-gray-100 dark:hover:bg-coffee-900 transition-colors"
          >
            <BookOpenIcon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Menu</span>}
          </a>
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-coffee-900/20 space-y-1">
          <button
            onClick={() => setShowFloorPlanModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 bg-coffee-600 text-cream-50 rounded-lg hover:bg-coffee-500 transition-colors text-sm font-medium shadow-lg shadow-coffee-600/20"
          >
            <MapIcon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Plan de salle</span>}
          </button>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-100 dark:bg-coffee-900 text-gray-700 dark:text-cream-300 rounded-lg hover:bg-gray-200 dark:hover:bg-coffee-800 transition-colors text-sm"
          >
            {theme === "light" ? (
              <>
                <MoonIcon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>Dark mode</span>}
              </>
            ) : (
              <>
                <SunIcon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>Light mode</span>}
              </>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors text-sm border border-red-200 dark:border-red-900/20"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Réservations
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Bienvenue, {user?.name}
              </p>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6">
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? "border-coffee-600 text-coffee-600 dark:text-coffee-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === tab.key
                      ? "bg-coffee-100 dark:bg-coffee-900/30 text-coffee-600 dark:text-coffee-400  "
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Reservations List */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
          {filteredReservations.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Aucune réservation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Les réservations apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="grid gap-4 max-w-5xl mx-auto">
              {filteredReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {reservation.customer_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {reservation.customer_email}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        reservation.status
                      )}`}
                    >
                      {getStatusLabel(reservation.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Table</span>
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">{reservation.table.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {reservation.table.floor}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>Date & Heure</span>
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {new Date(reservation.arrival_time).toLocaleDateString(
                          "fr-FR"
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(reservation.arrival_time).toLocaleTimeString(
                          "fr-FR",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <UsersIcon className="w-4 h-4" />
                        <span>Personnes</span>
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">{reservation.party_size}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Créée le</div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(reservation.created_at).toLocaleDateString(
                          "fr-FR"
                        )}
                      </div>
                    </div>
                  </div>

                  {reservation.notes && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {reservation.notes}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {reservation.status === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            handleStatusChange(reservation.id, "confirmed")
                          }
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          Confirmer
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(reservation.id, "cancelled")
                          }
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          <XCircleIcon className="w-4 h-4" />
                          Annuler
                        </button>
                      </>
                    )}
                    {reservation.status === "confirmed" && (
                      <button
                        onClick={() =>
                          handleStatusChange(reservation.id, "completed")
                        }
                        className="flex items-center gap-2 px-4 py-2 bg-coffee-600 text-cream-50 rounded-lg hover:bg-coffee-500 transition-colors text-sm font-medium"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                        Marquer comme terminée
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(reservation.id)}
                      className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floor Plan Modal */}
      {showFloorPlanModal && floorPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Plan de salle - {floorPlan.name}
              </h2>
              <button
                onClick={() => setShowFloorPlanModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XCircleIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <FloorPlanEditor
                floorPlan={floorPlan}
                onUpdate={loadFloorPlan}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
