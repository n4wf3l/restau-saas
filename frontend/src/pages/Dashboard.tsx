import { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { getReservations, updateReservationStatus, deleteReservation } from "../lib/api";
import type { Reservation, FloorPlan } from "../lib/types";
import toast from "react-hot-toast";
import {
  CalendarIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  UserGroupIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  InformationCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

type TabType = "pending" | "confirmed" | "all" | "cancelled" | "events";

const AUTO_REFRESH_MS = 30_000;

export function Dashboard() {
  const { floorPlan } = useOutletContext<{ floorPlan: FloorPlan | null }>();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReservations = useCallback(async () => {
    try {
      const data = await getReservations();
      setReservations(data);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + auto-refresh
  useEffect(() => {
    loadReservations();
    const interval = setInterval(loadReservations, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadReservations]);

  const handleStatus = async (id: number, status: string) => {
    try {
      await updateReservationStatus(id, status);
      toast.success(status === "confirmed" ? "Réservation confirmée" : status === "cancelled" ? "Réservation refusée" : "Statut mis à jour");
      loadReservations();
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteReservation(id);
      toast.success("Supprimée");
      loadReservations();
    } catch {
      toast.error("Erreur");
    }
  };

  const filtered = reservations.filter((r) => {
    if (activeTab === "events") return r.is_event;
    if (activeTab === "all") return true;
    return r.status === activeTab;
  });

  const counts = {
    pending: reservations.filter((r) => r.status === "pending").length,
    confirmed: reservations.filter((r) => r.status === "confirmed").length,
    cancelled: reservations.filter((r) => r.status === "cancelled").length,
    events: reservations.filter((r) => r.is_event).length,
    all: reservations.length,
  };

  const tabs: { key: TabType; label: string; count: number; color: string }[] = [
    { key: "pending", label: "En attente", count: counts.pending, color: "text-cream-600 dark:text-cream-400" },
    { key: "confirmed", label: "Confirmées", count: counts.confirmed, color: "text-emerald-500" },
    { key: "events", label: "Événements", count: counts.events, color: "text-violet-400" },
    { key: "all", label: "Toutes", count: counts.all, color: "text-gray-400" },
    { key: "cancelled", label: "Annulées", count: counts.cancelled, color: "text-rose-400" },
  ];

  const statusStyles: Record<string, { border: string; badge: string; badgeText: string; dot: string; label: string }> = {
    pending: {
      border: "border-l-cream-500",
      badge: "bg-cream-100 dark:bg-cream-500/10",
      badgeText: "text-cream-700 dark:text-cream-400",
      dot: "bg-cream-500",
      label: "En attente",
    },
    confirmed: {
      border: "border-l-emerald-400",
      badge: "bg-emerald-50 dark:bg-emerald-500/10",
      badgeText: "text-emerald-700 dark:text-emerald-400",
      dot: "bg-emerald-500",
      label: "Confirmée",
    },
    cancelled: {
      border: "border-l-rose-400",
      badge: "bg-rose-50 dark:bg-rose-500/10",
      badgeText: "text-rose-600 dark:text-rose-400",
      dot: "bg-rose-400",
      label: "Refusée",
    },
    completed: {
      border: "border-l-gray-300 dark:border-l-gray-600",
      badge: "bg-gray-100 dark:bg-gray-500/10",
      badgeText: "text-gray-500 dark:text-gray-400",
      dot: "bg-gray-400",
      label: "Terminée",
    },
  };

  const getStyle = (s: string) => statusStyles[s] || statusStyles.completed;

  const formatDate = (dt: string) => {
    const d = new Date(dt);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const isToday = d.toDateString() === today.toDateString();
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    if (isToday) return { date: "Aujourd'hui", time, highlight: true };
    if (isTomorrow) return { date: "Demain", time, highlight: false };
    return {
      date: d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }),
      time,
      highlight: false,
    };
  };

  return (
    <div className="flex flex-col h-full">
      {/* ─── Header ─── */}
      <div className="px-6 pt-6 pb-5 flex-shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-cream-50 tracking-tight">
              Réservations
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Mise à jour auto &middot; 30s
            </p>
          </div>
          {counts.pending > 0 && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-cream-100/80 dark:bg-cream-500/[0.08] border border-cream-300/40 dark:border-cream-500/15 rounded-xl shadow-soft dark:shadow-glow-gold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cream-500 opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cream-600 dark:bg-cream-500" />
              </span>
              <span className="text-sm font-semibold text-coffee-700 dark:text-cream-300">
                {counts.pending} en attente
              </span>
            </div>
          )}
        </div>

        {/* ─── Tabs ─── */}
        <div className="flex gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-white dark:bg-[#1c1a17] shadow-card dark:shadow-dark-card border border-cream-200/50 dark:border-[#2a2724] text-gray-900 dark:text-cream-50"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-[#1c1a17]/50"
              }`}
            >
              {tab.label}
              <span className={`text-xs font-bold tabular-nums ${activeTab === tab.key ? tab.color : "text-gray-300 dark:text-gray-600"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Events explanation banner ─── */}
      {activeTab === "events" && (
        <div className="mx-6 mb-4 p-4 bg-violet-50/60 dark:bg-violet-500/[0.05] border border-violet-200/40 dark:border-violet-500/10 rounded-xl flex gap-3 animate-fadeIn">
          <InformationCircleIcon className="w-5 h-5 text-violet-500 dark:text-violet-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <span className="font-semibold text-gray-900 dark:text-cream-50">Comment fonctionnent les événements ?</span>
            <br />
            Les demandes d'événement (anniversaires, groupes...) ne réservent aucune table automatiquement. Le client a envoyé une demande — contactez-le par téléphone ou email pour organiser le placement des tables, confirmer les détails, puis cliquez sur « Confirmer » ou « Refuser ».
          </div>
        </div>
      )}

      {/* ─── Reservation Cards ─── */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-cream-200 dark:border-[#2a2724] border-t-cream-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-20 h-20 rounded-2xl bg-cream-100/50 dark:bg-cream-500/[0.05] flex items-center justify-center mb-5">
              <CalendarIcon className="w-10 h-10 text-cream-300 dark:text-cream-500/30" />
            </div>
            <p className="text-lg font-display font-semibold text-gray-400 dark:text-gray-500">
              Aucune réservation
            </p>
            <p className="text-sm text-gray-300 dark:text-gray-600 mt-1.5">
              Les nouvelles demandes apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
            {filtered.map((res) => {
              const st = getStyle(res.status);
              const dt = formatDate(res.arrival_time);
              const isExpanded = expandedId === res.id;

              return (
                <div
                  key={res.id}
                  onClick={() => setExpandedId(isExpanded ? null : res.id)}
                  className={`bg-white dark:bg-[#1c1a17] rounded-2xl ring-1 ring-gray-200/40 dark:ring-[#2a2724] border-l-[3px] ${st.border} shadow-card dark:shadow-dark-card hover:shadow-card-hover dark:hover:shadow-dark-card-hover hover:-translate-y-[1px] transition-all duration-200 cursor-pointer select-none`}
                >
                  {/* ─── Card Header ─── */}
                  <div className="px-5 pt-5 pb-3">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-cream-50 truncate flex items-center gap-2">
                          {res.customer_name}
                          {res.is_event && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-bold uppercase tracking-wider flex-shrink-0">
                              <SparklesIcon className="w-3 h-3" />
                              Événement
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${st.badge} ${st.badgeText}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {res.is_event ? "Événement" : <>{res.table.name} &middot; {res.table.floor}</>}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className={`text-sm font-bold ${dt.highlight ? "text-cream-600 dark:text-cream-400" : "text-gray-500 dark:text-gray-400"}`}>
                          {dt.date}
                        </div>
                        <div className="text-2xl font-display font-bold text-gray-900 dark:text-cream-50 tabular-nums">
                          {dt.time}
                        </div>
                      </div>
                    </div>

                    {/* ─── Quick Info ─── */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <UserGroupIcon className="w-4 h-4" />
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{res.party_size}</span> pers.
                      </span>
                      {res.customer_phone && (
                        <span className="flex items-center gap-1.5">
                          <PhoneIcon className="w-4 h-4" />
                          {res.customer_phone}
                        </span>
                      )}
                      {res.notes && (
                        <span className="flex items-center gap-1 text-cream-600 dark:text-cream-400">
                          <ChatBubbleLeftIcon className="w-4 h-4" />
                          <span className="text-xs">Note</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ─── Expanded Details ─── */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-gray-100/80 dark:border-[#2a2724] pt-4 animate-slideUp" onClick={(e) => e.stopPropagation()}>
                      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                        <div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-semibold mb-1">Email</div>
                          <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                            <EnvelopeIcon className="w-3.5 h-3.5" />
                            {res.customer_email}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-semibold mb-1">Téléphone</div>
                          <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                            <PhoneIcon className="w-3.5 h-3.5" />
                            {res.customer_phone || "—"}
                          </div>
                        </div>
                      </div>

                      {res.is_event && res.event_details && (
                        <div className="mb-4 p-3.5 bg-violet-50/50 dark:bg-violet-500/[0.04] rounded-xl border border-violet-200/40 dark:border-violet-500/10">
                          <div className="text-[10px] text-violet-600 dark:text-violet-400 font-bold uppercase tracking-widest mb-1.5">Détails événement</div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{res.event_details}</p>
                        </div>
                      )}

                      {res.notes && (
                        <div className="mb-4 p-3.5 bg-cream-50/50 dark:bg-cream-500/[0.04] rounded-xl border border-cream-200/40 dark:border-cream-500/10">
                          <div className="text-[10px] text-cream-600 dark:text-cream-500 font-bold uppercase tracking-widest mb-1.5">Notes</div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{res.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─── Actions: Pending ─── */}
                  {res.status === "pending" && (
                    <div className="flex border-t border-gray-100 dark:border-[#2a2724]">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatus(res.id, "confirmed"); }}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-50/50 dark:bg-emerald-500/[0.06] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white active:bg-emerald-600 active:scale-[0.98] transition-all duration-200 rounded-bl-2xl font-semibold text-sm"
                      >
                        <CheckIcon className="w-5 h-5" />
                        Confirmer
                      </button>
                      <div className="w-px bg-gray-100 dark:bg-[#2a2724]" />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatus(res.id, "cancelled"); }}
                        className="flex-1 flex items-center justify-center gap-2 py-4 text-gray-400 dark:text-gray-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 active:scale-[0.98] transition-all duration-200 rounded-br-2xl font-medium text-sm"
                      >
                        <XMarkIcon className="w-5 h-5" />
                        Refuser
                      </button>
                    </div>
                  )}

                  {/* ─── Actions: Confirmed ─── */}
                  {res.status === "confirmed" && (
                    <div className="flex border-t border-gray-100 dark:border-[#2a2724]">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatus(res.id, "completed"); }}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 text-gray-500 dark:text-gray-400 hover:bg-cream-50 dark:hover:bg-[#242220] hover:text-gray-700 dark:hover:text-cream-200 active:scale-[0.98] transition-all duration-200 rounded-bl-2xl font-medium text-sm"
                      >
                        <CheckIcon className="w-4 h-4" />
                        Terminer
                      </button>
                      <div className="w-px bg-gray-100 dark:bg-[#2a2724]" />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(res.id); }}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 text-gray-400 dark:text-gray-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 active:scale-[0.98] transition-all duration-200 rounded-br-2xl text-sm"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* ─── Actions: Done/Cancelled ─── */}
                  {(res.status === "cancelled" || res.status === "completed") && (
                    <div className="flex border-t border-gray-100 dark:border-[#2a2724]">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(res.id); }}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 text-gray-400 dark:text-gray-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 active:scale-[0.98] transition-all duration-200 rounded-b-2xl text-sm"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
