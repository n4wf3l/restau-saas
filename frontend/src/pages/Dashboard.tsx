import { useEffect, useState } from "react";
import { getReservations, updateReservationStatus, deleteReservation } from "../lib/api";
import type { Reservation } from "../lib/types";
import toast from "react-hot-toast";
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

type TabType = "all" | "pending" | "confirmed";

export function Dashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("all");

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      const data = await getReservations();
      setReservations(data);
    } catch {
      toast.error("Erreur lors du chargement des réservations");
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateReservationStatus(id, status);
      toast.success("Statut mis à jour");
      loadReservations();
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette réservation ?")) return;
    try {
      await deleteReservation(id);
      toast.success("Réservation supprimée");
      loadReservations();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const filteredReservations = reservations.filter((res) => {
    if (activeTab === "all") return true;
    return res.status === activeTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300";
      case "confirmed":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300";
      case "cancelled":
        return "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300";
      case "completed":
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "En attente";
      case "confirmed": return "Confirmée";
      case "cancelled": return "Annulée";
      case "completed": return "Terminée";
      default: return status;
    }
  };

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: "all", label: "Toutes", count: reservations.length },
    { key: "pending", label: "En attente", count: reservations.filter((r) => r.status === "pending").length },
    { key: "confirmed", label: "Confirmées", count: reservations.filter((r) => r.status === "confirmed").length },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pb-0">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Réservations
        </h1>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-gray-200 dark:border-gray-800 mt-4">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-coffee-600 text-coffee-700 dark:text-coffee-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
              <span
                className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.key
                    ? "bg-coffee-50 dark:bg-coffee-900/20 text-coffee-600 dark:text-coffee-400"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Reservations List */}
      <div className="flex-1 overflow-auto p-6">
        {filteredReservations.length === 0 ? (
          <div className="text-center py-16">
            <CalendarIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              Aucune réservation
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Les réservations apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="grid gap-3 max-w-5xl">
            {filteredReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800 p-5 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {reservation.customer_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {reservation.customer_email}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}
                  >
                    {getStatusLabel(reservation.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      Table
                    </div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{reservation.table.name}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{reservation.table.floor}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                      <ClockIcon className="w-3.5 h-3.5" />
                      Date & Heure
                    </div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {new Date(reservation.arrival_time).toLocaleDateString("fr-FR")}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(reservation.arrival_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                      <UsersIcon className="w-3.5 h-3.5" />
                      Personnes
                    </div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{reservation.party_size}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Créée le</div>
                    <div className="text-sm text-gray-800 dark:text-gray-200">
                      {new Date(reservation.created_at).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                </div>

                {reservation.notes && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Notes</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">{reservation.notes}</div>
                  </div>
                )}

                <div className="flex gap-2">
                  {reservation.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleStatusChange(reservation.id, "confirmed")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                        Confirmer
                      </button>
                      <button
                        onClick={() => handleStatusChange(reservation.id, "cancelled")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        <XCircleIcon className="w-4 h-4" />
                        Annuler
                      </button>
                    </>
                  )}
                  {reservation.status === "confirmed" && (
                    <button
                      onClick={() => handleStatusChange(reservation.id, "completed")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-coffee-600 text-cream-50 rounded-lg hover:bg-coffee-500 transition-colors text-sm font-medium"
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                      Terminée
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(reservation.id)}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
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
    </div>
  );
}
