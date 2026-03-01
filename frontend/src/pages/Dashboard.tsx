import { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { getReservations, getSettings, getPublicTables, createAdminReservation, updateReservation, updateReservationStatus, deleteReservation, restoreReservation } from "../lib/api";
import type { Reservation, FloorPlan, RestaurantSettings, PublicTable } from "../lib/types";
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
  ExclamationTriangleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { Spinner } from "../components/ui/Spinner";

type TabType = "pending" | "confirmed" | "all" | "cancelled" | "events" | "no_show";

const AUTO_REFRESH_MS = 30_000;

export function Dashboard() {
  const { floorPlan } = useOutletContext<{ floorPlan: FloorPlan | null }>();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "tomorrow" | "week" | "custom">("all");
  const [customDate, setCustomDate] = useState("");

  // Create / Edit reservation panel
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createPanelReady, setCreatePanelReady] = useState(false);
  const [tables, setTables] = useState<PublicTable[]>([]);
  const [creating, setCreating] = useState(false);
  const [editingRes, setEditingRes] = useState<Reservation | null>(null);
  const [newRes, setNewRes] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    date: "",
    time: "19:00",
    party_size: 2,
    table_id: 0,
    notes: "",
  });

  const loadReservations = useCallback(async () => {
    try {
      const data = await getReservations(true);
      setReservations(data);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const data = await getSettings();
      setSettings(data);
      // If auto_confirm is on and we're on pending tab, switch to confirmed
      if (data.auto_confirm && activeTab === "pending") {
        setActiveTab("confirmed");
      }
    } catch {
      // Non-critical
    }
  }, []);

  // Initial load + auto-refresh
  useEffect(() => {
    loadReservations();
    loadSettings();
    const interval = setInterval(loadReservations, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadReservations, loadSettings]);

  const handleStatus = async (id: number, status: string) => {
    try {
      await updateReservationStatus(id, status);
      if (status === "no_show") {
        toast.success("Réservation marquée comme no-show");
      } else {
        toast.success(status === "confirmed" ? "Réservation confirmée" : status === "cancelled" ? "Réservation refusée" : "Statut mis à jour");
      }
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

  const handleRestore = async (id: number) => {
    try {
      await restoreReservation(id);
      toast.success("Réservation restaurée");
      loadReservations();
    } catch {
      toast.error("Erreur lors de la restauration");
    }
  };

  const openCreateModal = async () => {
    setShowCreateModal(true);
    setTimeout(() => setCreatePanelReady(true), 20);
    try {
      const t = await getPublicTables();
      setTables(t);
    } catch {
      // Tables will be empty
    }
  };

  const closeCreateModal = () => {
    setCreatePanelReady(false);
    setTimeout(() => {
      setShowCreateModal(false);
      setEditingRes(null);
      setNewRes({ customer_name: "", customer_email: "", customer_phone: "", date: "", time: "19:00", party_size: 2, table_id: 0, notes: "" });
    }, 300);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRes.table_id) { toast.error("Veuillez sélectionner une table"); return; }
    if (!newRes.date || !newRes.time) { toast.error("Date et heure requises"); return; }

    setCreating(true);
    try {
      await createAdminReservation({
        customer_name: newRes.customer_name,
        customer_email: newRes.customer_email,
        customer_phone: newRes.customer_phone || undefined,
        arrival_time: `${newRes.date} ${newRes.time}`,
        party_size: newRes.party_size,
        table_id: newRes.table_id,
        notes: newRes.notes || undefined,
      });
      toast.success("Réservation créée");
      closeCreateModal();
      loadReservations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = async (res: Reservation) => {
    const [date, time] = res.arrival_time.split(" ");
    setEditingRes(res);
    setNewRes({
      customer_name: res.customer_name,
      customer_email: res.customer_email,
      customer_phone: res.customer_phone || "",
      date,
      time: time || "19:00",
      party_size: res.party_size,
      table_id: res.table.id || 0,
      notes: res.notes || "",
    });
    setShowCreateModal(true);
    setTimeout(() => setCreatePanelReady(true), 20);
    try {
      const t = await getPublicTables();
      setTables(t);
    } catch {}
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRes) return;
    if (!newRes.date || !newRes.time) { toast.error("Date et heure requises"); return; }

    setCreating(true);
    try {
      await updateReservation(editingRes.id, {
        customer_name: newRes.customer_name,
        customer_email: newRes.customer_email,
        customer_phone: newRes.customer_phone || null,
        arrival_time: `${newRes.date} ${newRes.time}`,
        party_size: newRes.party_size,
        notes: newRes.notes || null,
      });
      toast.success("Réservation modifiée");
      closeCreateModal();
      loadReservations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erreur lors de la modification");
    } finally {
      setCreating(false);
    }
  };

  // Date matching helper
  const matchesDate = (arrivalTime: string): boolean => {
    if (dateFilter === "all") return true;
    const d = new Date(arrivalTime);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (dateFilter === "today") return d.toDateString() === today.toDateString();
    if (dateFilter === "tomorrow") return d.toDateString() === tomorrow.toDateString();
    if (dateFilter === "week") {
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + 7);
      return d >= today && d < weekEnd;
    }
    if (dateFilter === "custom" && customDate) {
      return d.toISOString().slice(0, 10) === customDate;
    }
    return true;
  };

  // Search matching helper
  const matchesSearch = (r: Reservation): boolean => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.customer_name.toLowerCase().includes(q) ||
      r.customer_email.toLowerCase().includes(q) ||
      (r.customer_phone?.toLowerCase().includes(q) ?? false) ||
      (r.table.name?.toLowerCase().includes(q) ?? false)
    );
  };

  const filtered = reservations.filter((r) => {
    // Status/tab filter
    const matchesTab =
      activeTab === "events" ? r.is_event :
      activeTab === "no_show" ? r.status === "no_show" :
      activeTab === "all" ? true :
      r.status === activeTab;

    return matchesTab && matchesDate(r.arrival_time) && matchesSearch(r);
  });

  // Counts reflect search + date filters so tabs stay accurate
  const base = reservations.filter((r) => matchesDate(r.arrival_time) && matchesSearch(r));
  const counts = {
    pending: base.filter((r) => r.status === "pending").length,
    confirmed: base.filter((r) => r.status === "confirmed").length,
    cancelled: base.filter((r) => r.status === "cancelled").length,
    no_show: base.filter((r) => r.status === "no_show").length,
    events: base.filter((r) => r.is_event).length,
    all: base.length,
  };

  const tabs: { key: TabType; label: string; count: number; color: string }[] = [
    // Only show pending tab if auto_confirm is OFF
    ...(settings?.auto_confirm
      ? []
      : [{ key: "pending" as TabType, label: "En attente", count: counts.pending, color: "text-cream-600 dark:text-cream-400" }]),
    { key: "confirmed", label: "Confirmées", count: counts.confirmed, color: "text-emerald-500" },
    { key: "events", label: "Événements", count: counts.events, color: "text-violet-400" },
    { key: "no_show", label: "No-show", count: counts.no_show, color: "text-orange-400" },
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
    no_show: {
      border: "border-l-orange-400",
      badge: "bg-orange-50 dark:bg-orange-500/10",
      badgeText: "text-orange-700 dark:text-orange-400",
      dot: "bg-orange-400",
      label: "No-show",
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

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 pt-6 pb-5 flex-shrink-0">
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-cream-50 tracking-tight">
            Réservations
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Chargement...
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-3">
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-coffee-600 text-cream-50 rounded-xl text-sm font-semibold hover:bg-coffee-500 active:scale-[0.97] transition-all duration-200 shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Nouvelle réservation
            </button>
          {!settings?.auto_confirm && counts.pending > 0 && (
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
        </div>

        {/* ─── Search + Date Filters ─── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, email, téléphone..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200/60 dark:border-[#2a2724] rounded-xl bg-white dark:bg-[#1c1a17] text-gray-800 dark:text-cream-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-coffee-500/30 focus:border-coffee-500/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Date filters */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <FunnelIcon className="w-4 h-4 text-gray-400 dark:text-gray-600 mr-1 hidden sm:block" />
            {([
              { key: "all", label: "Tout" },
              { key: "today", label: "Aujourd'hui" },
              { key: "tomorrow", label: "Demain" },
              { key: "week", label: "7 jours" },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => { setDateFilter(f.key); setCustomDate(""); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  dateFilter === f.key
                    ? "bg-coffee-600 text-cream-50 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#242220] hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
            <input
              type="date"
              value={dateFilter === "custom" ? customDate : ""}
              onChange={(e) => {
                setDateFilter("custom");
                setCustomDate(e.target.value);
              }}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 cursor-pointer ${
                dateFilter === "custom"
                  ? "border-coffee-500/50 bg-coffee-50 dark:bg-coffee-900/20 text-coffee-700 dark:text-cream-300"
                  : "border-gray-200/60 dark:border-[#2a2724] bg-white dark:bg-[#1c1a17] text-gray-500 dark:text-gray-400"
              } focus:outline-none focus:ring-2 focus:ring-coffee-500/30`}
            />
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <div className="flex gap-1.5 flex-wrap">
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

      {/* ─── No-show explanation banner ─── */}
      {activeTab === "no_show" && (
        <div className="mx-6 mb-4 p-4 bg-orange-50/60 dark:bg-orange-500/[0.05] border border-orange-200/40 dark:border-orange-500/10 rounded-xl flex gap-3 animate-fadeIn">
          <ExclamationTriangleIcon className="w-5 h-5 text-orange-500 dark:text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <span className="font-semibold text-gray-900 dark:text-cream-50">Réservations no-show</span>
            <br />
            Les réservations marquées comme no-show sont archivées ici. Vous pouvez les restaurer à tout moment pour conserver l'historique.
          </div>
        </div>
      )}

      {/* ─── Reservation Cards ─── */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-20 h-20 rounded-2xl bg-cream-100/50 dark:bg-cream-500/[0.05] flex items-center justify-center mb-5">
              <CalendarIcon className="w-10 h-10 text-cream-300 dark:text-cream-500/30" />
            </div>
            <p className="text-lg font-display font-semibold text-gray-400 dark:text-gray-500">
              Aucune réservation
            </p>
            <p className="text-sm text-gray-300 dark:text-gray-600 mt-1.5">
              {searchQuery || dateFilter !== "all"
                ? "Aucun résultat pour ces filtres"
                : activeTab === "no_show" ? "Aucune réservation no-show" : "Les nouvelles demandes apparaîtront ici"}
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

                      {/* Edit button */}
                      {res.status !== "cancelled" && res.status !== "no_show" && (
                        <button
                          onClick={() => openEditModal(res)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-coffee-600 dark:text-cream-400 bg-coffee-50 dark:bg-coffee-900/15 border border-coffee-200/50 dark:border-coffee-500/15 hover:bg-coffee-100 dark:hover:bg-coffee-900/30 active:scale-[0.98] transition-all duration-200"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                          Modifier
                        </button>
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
                        onClick={(e) => { e.stopPropagation(); handleStatus(res.id, "no_show"); }}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 text-gray-400 dark:text-gray-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 active:scale-[0.98] transition-all duration-200 font-medium text-sm"
                      >
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        No-show
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

                  {/* ─── Actions: No-show ─── */}
                  {res.status === "no_show" && (
                    <div className="flex border-t border-gray-100 dark:border-[#2a2724]">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRestore(res.id); }}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 text-gray-500 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-[0.98] transition-all duration-200 rounded-bl-2xl font-medium text-sm"
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                        Restaurer
                      </button>
                      <div className="w-px bg-gray-100 dark:bg-[#2a2724]" />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(res.id); }}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 text-gray-400 dark:text-gray-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 active:scale-[0.98] transition-all duration-200 rounded-br-2xl text-sm"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Supprimer
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

      {/* ─── Create Reservation Slide Panel ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-black transition-opacity duration-300 ${createPanelReady ? "opacity-50" : "opacity-0"}`}
            onClick={closeCreateModal}
          />
          <div
            className={`absolute top-0 right-0 bottom-0 w-full max-w-lg bg-white dark:bg-[#1c1a17] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
              createPanelReady ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-[#2a2724]">
              <h2 className="text-lg font-display font-bold text-gray-900 dark:text-cream-50">
                {editingRes ? "Modifier la réservation" : "Nouvelle réservation"}
              </h2>
              <button onClick={closeCreateModal} className="p-2 -mr-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#242220] transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Panel Form */}
            <form onSubmit={editingRes ? handleEdit : handleCreate} className="flex-1 overflow-auto px-6 py-5 space-y-5">
              {/* Client info */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Client</label>
                <div className="space-y-3">
                  <input
                    required
                    type="text"
                    placeholder="Nom du client *"
                    value={newRes.customer_name}
                    onChange={(e) => setNewRes({ ...newRes, customer_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-[#2a2724] rounded-xl bg-white dark:bg-[#141311] text-gray-800 dark:text-cream-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-coffee-500/30 focus:border-coffee-500/50"
                  />
                  <input
                    required
                    type="email"
                    placeholder="Email *"
                    value={newRes.customer_email}
                    onChange={(e) => setNewRes({ ...newRes, customer_email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-[#2a2724] rounded-xl bg-white dark:bg-[#141311] text-gray-800 dark:text-cream-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-coffee-500/30 focus:border-coffee-500/50"
                  />
                  <input
                    type="tel"
                    placeholder="Téléphone"
                    value={newRes.customer_phone}
                    onChange={(e) => setNewRes({ ...newRes, customer_phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-[#2a2724] rounded-xl bg-white dark:bg-[#141311] text-gray-800 dark:text-cream-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-coffee-500/30 focus:border-coffee-500/50"
                  />
                </div>
              </div>

              {/* Date / Time / Party size */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Créneau</label>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    required
                    type="date"
                    value={newRes.date}
                    onChange={(e) => setNewRes({ ...newRes, date: e.target.value })}
                    className="col-span-1 px-3 py-2.5 text-sm border border-gray-200 dark:border-[#2a2724] rounded-xl bg-white dark:bg-[#141311] text-gray-800 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-coffee-500/30 focus:border-coffee-500/50"
                  />
                  <input
                    required
                    type="time"
                    value={newRes.time}
                    onChange={(e) => setNewRes({ ...newRes, time: e.target.value })}
                    className="col-span-1 px-3 py-2.5 text-sm border border-gray-200 dark:border-[#2a2724] rounded-xl bg-white dark:bg-[#141311] text-gray-800 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-coffee-500/30 focus:border-coffee-500/50"
                  />
                  <div className="relative">
                    <UserGroupIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      required
                      type="number"
                      min={1}
                      max={50}
                      value={newRes.party_size}
                      onChange={(e) => setNewRes({ ...newRes, party_size: Number(e.target.value) })}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 dark:border-[#2a2724] rounded-xl bg-white dark:bg-[#141311] text-gray-800 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-coffee-500/30 focus:border-coffee-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Table selection (only for new reservations) */}
              {!editingRes && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Table</label>
                  {tables.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-600 italic">Aucune table configurée</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto">
                      {tables.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setNewRes({ ...newRes, table_id: t.id })}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                            newRes.table_id === t.id
                              ? "border-coffee-500 bg-coffee-50 dark:bg-coffee-900/20 text-coffee-700 dark:text-cream-300 ring-2 ring-coffee-500/20"
                              : "border-gray-200 dark:border-[#2a2724] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#242220]"
                          }`}
                        >
                          <span className="truncate">{t.name}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0">{t.total_seats}p</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Notes</label>
                <textarea
                  value={newRes.notes}
                  onChange={(e) => setNewRes({ ...newRes, notes: e.target.value })}
                  rows={3}
                  placeholder="Notes internes (optionnel)"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-[#2a2724] rounded-xl bg-white dark:bg-[#141311] text-gray-800 dark:text-cream-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-coffee-500/30 focus:border-coffee-500/50 resize-none"
                />
              </div>
            </form>

            {/* Panel Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-[#2a2724] flex gap-3">
              <button
                type="button"
                onClick={closeCreateModal}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-[#242220] rounded-xl hover:bg-gray-200 dark:hover:bg-[#2a2724] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={editingRes ? handleEdit : handleCreate}
                disabled={creating}
                className="flex-1 py-2.5 text-sm font-semibold text-cream-50 bg-coffee-600 rounded-xl hover:bg-coffee-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {creating ? <Spinner size="sm" /> : <CheckIcon className="w-4 h-4" />}
                {creating
                  ? (editingRes ? "Modification..." : "Création...")
                  : (editingRes ? "Enregistrer" : "Confirmer")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
