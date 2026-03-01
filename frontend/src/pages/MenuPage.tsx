import { useEffect, useState, useRef } from "react";
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getSettings,
  updateSettings,
  uploadMenuPdf,
  deleteMenuPdf,
  API_BASE_URL,
} from "../lib/api";
import type { MenuItem, MenuItemPayload } from "../lib/types";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  Squares2X2Icon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";
import { Spinner } from "../components/ui/Spinner";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ToggleSwitch } from "../components/ui/ToggleSwitch";

type MenuTab = "manual" | "pdf" | "api";

/* ═══════════════════════ MenuPage ═══════════════════════ */

export default function MenuPage() {
  const [activeTab, setActiveTab] = useState<MenuTab>("manual");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [panelReady, setPanelReady] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF tab state
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfDeleting, setPdfDeleting] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const [pdfDeleteConfirm, setPdfDeleteConfirm] = useState(false);

  // Visibility toggles
  const [manualVisible, setManualVisible] = useState(true);
  const [pdfVisible, setPdfVisible] = useState(false);

  const [formData, setFormData] = useState<MenuItemPayload>({
    name: "",
    ingredients: "",
    price: 0,
    is_halal: false,
    image: null,
    category: "",
    is_available: true,
    order: 0,
  });

  /* ─── Open / close animation ─── */
  useEffect(() => {
    if (showModal) {
      const t = setTimeout(() => setPanelReady(true), 20);
      return () => clearTimeout(t);
    } else {
      setPanelReady(false);
    }
  }, [showModal]);

  /* ─── Data ─── */
  useEffect(() => {
    loadMenuItems();
    getSettings()
      .then((s) => {
        setCurrentPdfUrl(s.menu_pdf_url);
        setManualVisible(s.menu_manual_visible);
        setPdfVisible(s.menu_pdf_visible);
      })
      .catch(() => {})
      .finally(() => setLoadingPdf(false));
  }, []);

  const loadMenuItems = async () => {
    try {
      const data = await getMenuItems();
      setMenuItems(data);
    } catch {
      toast.error("Erreur lors du chargement du menu");
    } finally {
      setLoading(false);
    }
  };

  /* ─── Form handlers ─── */
  const canSubmitItem = formData.name.trim().length > 0 && formData.price >= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error("Le nom du plat est requis"); return; }
    if (formData.price < 0) { toast.error("Le prix ne peut pas être négatif"); return; }
    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, formData);
        toast.success("Plat modifié avec succès");
      } else {
        await createMenuItem(formData);
        toast.success("Plat ajouté avec succès");
      }
      closeModal();
      loadMenuItems();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setImagePreview(
      item.image_url
        ? item.image_url.startsWith("http")
          ? item.image_url
          : `${API_BASE_URL}${item.image_url}`
        : null
    );
    setFormData({
      name: item.name,
      ingredients: item.ingredients || "",
      price: item.price,
      is_halal: item.is_halal,
      image: null,
      category: item.category || "",
      is_available: item.is_available,
      order: item.order,
    });
    setShowModal(true);
  };

  const handleDeleteRequest = (item: MenuItem) => {
    setDeleteConfirm({ id: item.id, name: item.name });
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMenuItem(id);
      toast.success("Plat supprimé");
      loadMenuItems();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFormData({
      name: "",
      ingredients: "",
      price: 0,
      is_halal: false,
      image: null,
      category: "",
      is_available: true,
      order: 0,
    });
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    if (!panelReady) return;
    setPanelReady(false);
    setTimeout(() => {
      setShowModal(false);
      resetForm();
    }, 300);
  };

  /* ─── PDF handlers ─── */
  const handlePdfUpload = async () => {
    if (!pdfFile) return;
    setPdfUploading(true);
    try {
      const settings = await uploadMenuPdf(pdfFile);
      setCurrentPdfUrl(settings.menu_pdf_url);
      setPdfFile(null);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
      toast.success("Menu PDF importé avec succès");
    } catch {
      toast.error("Erreur lors de l'import du PDF");
    } finally {
      setPdfUploading(false);
    }
  };

  const handlePdfDelete = async () => {
    setPdfDeleting(true);
    try {
      await deleteMenuPdf();
      setCurrentPdfUrl(null);
      toast.success("PDF supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setPdfDeleting(false);
    }
  };

  /* ─── Visibility toggle handler ─── */
  const handleVisibilityToggle = async (field: 'menu_manual_visible' | 'menu_pdf_visible', value: boolean) => {
    if (field === 'menu_manual_visible') setManualVisible(value);
    else setPdfVisible(value);
    try {
      await updateSettings({ [field]: value });
    } catch {
      // Revert on error
      if (field === 'menu_manual_visible') setManualVisible(!value);
      else setPdfVisible(!value);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  /* ─── Filtering ─── */
  const allCategories = [
    ...new Set(menuItems.map((i) => i.category).filter(Boolean)),
  ] as string[];

  const filteredItems = menuItems.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !item.name.toLowerCase().includes(q) &&
        !(item.ingredients && item.ingredients.toLowerCase().includes(q)) &&
        !(item.category && item.category.toLowerCase().includes(q))
      )
        return false;
    }
    if (activeFilter === "all") return true;
    if (activeFilter === "halal") return item.is_halal;
    if (activeFilter === "available") return item.is_available;
    if (activeFilter === "unavailable") return !item.is_available;
    return item.category === activeFilter;
  });

  const displayCategories = [
    ...new Set(filteredItems.map((i) => i.category).filter(Boolean)),
  ];

  const filterChips = [
    { key: "all", label: "Tout", count: menuItems.length },
    {
      key: "halal",
      label: "Halal",
      count: menuItems.filter((i) => i.is_halal).length,
    },
    {
      key: "available",
      label: "Disponible",
      count: menuItems.filter((i) => i.is_available).length,
    },
    {
      key: "unavailable",
      label: "Indisponible",
      count: menuItems.filter((i) => !i.is_available).length,
    },
    ...allCategories.map((c) => ({
      key: c,
      label: c,
      count: menuItems.filter((i) => i.category === c).length,
    })),
  ];

  /* ─── Render ─── */
  const tabs: {
    key: MenuTab;
    label: string;
    icon: React.ReactNode;
    disabled?: boolean;
    tag?: string;
    toggleChecked?: boolean;
    toggleDisabled?: boolean;
    onToggle?: (v: boolean) => void;
  }[] = [
    {
      key: "manual",
      label: "Gestion manuelle",
      icon: <PencilIcon className="w-4 h-4" />,
      toggleChecked: manualVisible,
      onToggle: (v) => handleVisibilityToggle('menu_manual_visible', v),
    },
    {
      key: "pdf",
      label: "Importer un PDF",
      icon: <DocumentTextIcon className="w-4 h-4" />,
      toggleChecked: pdfVisible,
      onToggle: (v) => handleVisibilityToggle('menu_pdf_visible', v),
    },
    {
      key: "api",
      label: "Widget / API",
      icon: <CodeBracketIcon className="w-4 h-4" />,
      disabled: true,
      tag: "bientôt",
      toggleChecked: false,
      toggleDisabled: true,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-cream-50 tracking-tight">
            Carte du Menu
          </h1>
          {!loading && (
            <button
              onClick={openModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-coffee-600 text-cream-50 rounded-xl text-sm font-semibold hover:bg-coffee-500 active:scale-[0.97] transition-all duration-200 shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Ajouter un plat
            </button>
          )}
        </div>

        {!loading && (
        <>
        {/* ── Tabs ── */}
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <div key={tab.key} className="flex items-center gap-2 -mb-px">
              <button
                onClick={() => !tab.disabled && setActiveTab(tab.key)}
                disabled={tab.disabled}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-coffee-600 text-coffee-600 dark:text-coffee-400 dark:border-coffee-400"
                    : tab.disabled
                    ? "border-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.tag && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-full">
                    {tab.tag}
                  </span>
                )}
              </button>
              {/* Visibility toggle */}
              <div
                className={`mr-2 ${tab.toggleDisabled ? "opacity-30" : ""}`}
                title={tab.toggleChecked ? "Visible côté client" : "Masqué côté client"}
              >
                <ToggleSwitch
                  checked={tab.toggleChecked ?? false}
                  onChange={(v) => !tab.toggleDisabled && tab.onToggle?.(v)}
                />
              </div>
            </div>
          ))}
        </div>
        </>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Spinner />
        </div>
      ) : (
      <div className="flex-1 flex flex-col overflow-hidden">
      {/* ═══ Tab: Gestion manuelle ═══ */}
      {activeTab === "manual" && (
        <>
          {/* ── Toolbar ── */}
          <div className="px-6 pt-4 pb-2">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, catégorie, ingrédients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200/60 dark:border-surface-border-light rounded-xl bg-white dark:bg-surface-card text-gray-800 dark:text-cream-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-coffee-500/30 focus:border-coffee-500/50 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label="Effacer la recherche"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* View mode toggle */}
              <div className="flex border border-gray-200/60 dark:border-surface-border-light rounded-xl overflow-hidden flex-shrink-0 self-center">
                <button
                  onClick={() => setViewMode("card")}
                  className={`p-2 transition-colors ${
                    viewMode === "card"
                      ? "bg-coffee-600 text-cream-50"
                      : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  title="Vue carte"
                >
                  <Squares2X2Icon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition-colors ${
                    viewMode === "list"
                      ? "bg-coffee-600 text-cream-50"
                      : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  title="Vue liste"
                >
                  <Bars3Icon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Filter Chips ── */}
          <div className="px-6 py-3 flex gap-2 overflow-x-auto">
            {filterChips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => setActiveFilter(chip.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  activeFilter === chip.key
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {chip.label}
                <span
                  className={`ml-1.5 ${
                    activeFilter === chip.key
                      ? "text-gray-400 dark:text-gray-500"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {chip.count}
                </span>
              </button>
            ))}
          </div>

          {/* ── Content ── */}
          <div className="flex-1 overflow-auto px-6 pb-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <PhotoIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              {searchQuery || activeFilter !== "all"
                ? "Aucun résultat"
                : "Aucun plat"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery
                ? `Aucun plat ne correspond à « ${searchQuery} »`
                : activeFilter !== "all"
                ? "Aucun plat dans ce filtre"
                : "Commencez par ajouter votre premier plat"}
            </p>
            {!searchQuery && activeFilter === "all" && (
              <button
                onClick={openModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-coffee-600 text-cream-50 rounded-lg hover:bg-coffee-500 transition-colors text-sm font-medium"
              >
                <PlusIcon className="w-4 h-4" />
                Ajouter un plat
              </button>
            )}
          </div>
        ) : viewMode === "card" ? (
          <div className="max-w-7xl">
            {displayCategories.length > 0 ? (
              displayCategories.map((category) => (
                <div key={category} className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {category || "Sans catégorie"}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems
                      .filter((item) => item.category === category)
                      .map((item, i) => (
                        <AdminMenuCard
                          key={item.id}
                          item={item}
                          onEdit={handleEdit}
                          onDelete={handleDeleteRequest}
                          animIndex={i}
                        />
                      ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item, i) => (
                  <AdminMenuCard
                    key={item.id}
                    item={item}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                    animIndex={i}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-5xl">
            {displayCategories.length > 0 ? (
              displayCategories.map((category) => (
                <div key={category} className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 px-1">
                    {category || "Sans catégorie"}
                  </h2>
                  <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredItems
                      .filter((item) => item.category === category)
                      .map((item, i) => (
                        <AdminMenuRow
                          key={item.id}
                          item={item}
                          onEdit={handleEdit}
                          onDelete={handleDeleteRequest}
                          animIndex={i}
                        />
                      ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                {filteredItems.map((item, i) => (
                  <AdminMenuRow
                    key={item.id}
                    item={item}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                    animIndex={i}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
        </>
      )}

      {/* ═══ Tab: Importer un PDF ═══ */}
      {activeTab === "pdf" && (
        <div className="flex-1 overflow-auto px-6 py-6">
          <div className="max-w-2xl mx-auto">
            {loadingPdf ? (
              <div className="flex items-center justify-center py-24">
                <Spinner />
              </div>
            ) : currentPdfUrl ? (
              /* ── PDF existant ── */
              <div className="space-y-6">
                <div className="bg-white dark:bg-surface-card rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                      <DocumentTextIcon className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        Menu PDF actuel
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {currentPdfUrl.split('/').pop()}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <a
                        href={`${API_BASE_URL}${currentPdfUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-sm font-medium text-coffee-600 dark:text-coffee-400 border border-coffee-200 dark:border-coffee-800 rounded-lg hover:bg-coffee-50 dark:hover:bg-coffee-900/20 transition-colors"
                      >
                        Voir
                      </a>
                      <button
                        onClick={() => setPdfDeleteConfirm(true)}
                        disabled={pdfDeleting}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                      >
                        {pdfDeleting ? "Suppression..." : "Supprimer"}
                      </button>
                    </div>
                  </div>

                  {/* PDF Preview */}
                  <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <iframe
                      src={`${API_BASE_URL}${currentPdfUrl}`}
                      className="w-full h-[500px]"
                      title="Aperçu du menu PDF"
                    />
                  </div>
                </div>

                {/* Replace PDF */}
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Vous pouvez remplacer le PDF actuel en important un nouveau fichier.
                  </p>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  />
                  <button
                    onClick={() => pdfInputRef.current?.click()}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Choisir un nouveau PDF
                  </button>
                  {pdfFile && (
                    <div className="mt-3 flex items-center justify-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{pdfFile.name}</span>
                      <button
                        onClick={handlePdfUpload}
                        disabled={pdfUploading}
                        className="px-4 py-1.5 bg-coffee-600 text-cream-50 rounded-lg hover:bg-coffee-500 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {pdfUploading ? "Import..." : "Remplacer"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ── Pas de PDF — zone d'upload ── */
              <div className="space-y-6">
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                />

                <div
                  onClick={() => !pdfFile && pdfInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-4 w-full py-16 border-2 border-dashed rounded-xl transition-all ${
                    pdfFile
                      ? "border-coffee-400 dark:border-coffee-500 bg-coffee-50/50 dark:bg-coffee-900/10"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:border-coffee-400 dark:hover:border-coffee-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-surface-input flex items-center justify-center">
                    <CloudArrowUpIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  {pdfFile ? (
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {pdfFile.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Glissez votre menu PDF ici ou cliquez pour parcourir
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Format PDF uniquement — max 10 MB
                      </p>
                    </div>
                  )}
                </div>

                {pdfFile && (
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => {
                        setPdfFile(null);
                        if (pdfInputRef.current) pdfInputRef.current.value = "";
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handlePdfUpload}
                      disabled={pdfUploading}
                      className="flex items-center gap-2 px-6 py-2 bg-coffee-600 text-cream-50 rounded-lg hover:bg-coffee-500 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {pdfUploading ? (
                        <>
                          <Spinner size="xs" className="text-current" />
                          Import en cours...
                        </>
                      ) : (
                        <>
                          <CloudArrowUpIcon className="w-4 h-4" />
                          Importer le PDF
                        </>
                      )}
                    </button>
                  </div>
                )}

                <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                  Le PDF sera affiché directement sur la page menu publique de votre restaurant.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Tab: Widget / API ═══ */}
      {activeTab === "api" && (
        <div className="flex-1 overflow-auto px-6 py-6">
          <div className="max-w-2xl mx-auto opacity-50 pointer-events-none">
            <div className="bg-white dark:bg-surface-card rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
                <CodeBracketIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Widget / API
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Intégrez votre menu via un widget externe ou une API tierce.
                Cette fonctionnalité sera bientôt disponible.
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
      )}

      {/* ═══ Uber-style Slide Panel ═══ */}
      {showModal && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black transition-opacity duration-300 ${
              panelReady ? "opacity-50" : "opacity-0"
            }`}
            onClick={closeModal}
          />

          {/* Panel */}
          <div
            className={`absolute top-0 right-0 bottom-0 w-full max-w-lg bg-white dark:bg-surface-card shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
              panelReady ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingItem ? "Modifier le plat" : "Nouveau plat"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 -mr-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Panel Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-auto">
              <div className="p-6 space-y-6">
                {/* ─ Image Upload ─ */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setFormData((prev) => ({ ...prev, image: file }));
                    if (file) setImagePreview(URL.createObjectURL(file));
                  }}
                />

                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-[16/9]">
                    <img
                      src={imagePreview}
                      alt="Aperçu"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData((prev) => ({ ...prev, image: null }));
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                      className="absolute top-3 right-3 p-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white hover:bg-black/80 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white text-xs font-medium cursor-pointer hover:bg-black/80 transition-colors"
                    >
                      Changer
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-3 w-full py-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:border-coffee-400 dark:hover:border-coffee-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-surface-input flex items-center justify-center group-hover:bg-coffee-100 dark:group-hover:bg-coffee-900/30 transition-colors">
                      <CloudArrowUpIcon className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-coffee-500 transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ajouter une photo
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        JPG, PNG — max 5 MB
                      </p>
                    </div>
                  </div>
                )}

                {/* ─ Name ─ */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
                    Nom du plat <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-coffee-500/40 focus:border-coffee-500 text-sm placeholder-gray-400"
                    placeholder="Ex: Tagine d'agneau aux pruneaux"
                  />
                </div>

                {/* ─ Ingredients ─ */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
                    Description / Ingrédients
                  </label>
                  <textarea
                    value={formData.ingredients}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        ingredients: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-coffee-500/40 focus:border-coffee-500 text-sm placeholder-gray-400 resize-none"
                    placeholder="Agneau, pruneaux, amandes, cannelle, miel..."
                  />
                </div>

                {/* ─ Price + Category ─ */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
                      Prix <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            price: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full px-4 py-3 pr-10 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-coffee-500/40 focus:border-coffee-500 text-sm placeholder-gray-400"
                        placeholder="0.00"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                        €
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
                      Catégorie
                    </label>
                    <input
                      type="text"
                      list="categories-list"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-coffee-500/40 focus:border-coffee-500 text-sm placeholder-gray-400"
                      placeholder="Entrées, Plats..."
                    />
                    <datalist id="categories-list">
                      {allCategories.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* ─ Divider ─ */}
                <div className="border-t border-gray-100 dark:border-gray-800" />

                {/* ─ Toggles ─ */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                        Certifié Halal
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Affiche le badge Halal sur la carte
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={formData.is_halal || false}
                      onChange={(v) =>
                        setFormData((prev) => ({ ...prev, is_halal: v }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                        Disponible
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Visible sur la carte publique
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={formData.is_available ?? true}
                      onChange={(v) =>
                        setFormData((prev) => ({ ...prev, is_available: v }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* ─ Sticky Footer ─ */}
              <div className="sticky bottom-0 bg-white dark:bg-surface-card border-t border-gray-100 dark:border-gray-800 p-6 space-y-3">
                <button
                  type="submit"
                  disabled={!canSubmitItem}
                  className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {editingItem ? "Mettre à jour" : "Ajouter le plat"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full py-3 text-gray-500 dark:text-gray-400 rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Menu Item Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Supprimer ce plat"
        message={`Supprimer « ${deleteConfirm?.name || ""} » de votre carte ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={() => {
          if (deleteConfirm) handleDelete(deleteConfirm.id);
          setDeleteConfirm(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Delete PDF Confirmation */}
      <ConfirmDialog
        open={pdfDeleteConfirm}
        title="Supprimer le menu PDF"
        message="Le fichier PDF sera supprimé définitivement. Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={() => {
          setPdfDeleteConfirm(false);
          handlePdfDelete();
        }}
        onCancel={() => setPdfDeleteConfirm(false)}
      />
    </div>
  );
}

/* ═══════════════════════ Card View ═══════════════════════ */

interface AdminMenuItemProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  animIndex?: number;
}

function AdminMenuCard({ item, onEdit, onDelete, animIndex = 0 }: AdminMenuItemProps) {
  return (
    <div
      className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 transition-colors flex flex-col animate-stagger-item"
      style={{ animationDelay: `${animIndex * 60}ms` }}
    >
      {item.image_url && (
        <div className="relative h-36 bg-gray-100 dark:bg-gray-800">
          <img
            src={
              item.image_url.startsWith("http")
                ? item.image_url
                : `${API_BASE_URL}${item.image_url}`
            }
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
            {item.name}
          </h3>
          <div className="flex gap-1 shrink-0">
            {item.is_halal && (
              <span className="px-1.5 py-0.5 text-[9px] font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-full">
                Halal
              </span>
            )}
            {!item.is_available && (
              <span className="px-1.5 py-0.5 text-[9px] font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-full">
                Indispo.
              </span>
            )}
          </div>
        </div>

        {item.ingredients && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
            {item.ingredients}
          </p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-700/50">
          <span className="font-bold text-gray-900 dark:text-white text-sm tabular-nums">
            {Number(item.price).toFixed(2)}€
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
              title="Modifier"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(item)}
              className="p-1.5 text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
              title="Supprimer"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ List View ═══════════════════════ */

function AdminMenuRow({ item, onEdit, onDelete, animIndex = 0 }: AdminMenuItemProps) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors animate-stagger-item"
      style={{ animationDelay: `${animIndex * 60}ms` }}
    >
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
        {item.image_url ? (
          <img
            src={
              item.image_url.startsWith("http")
                ? item.image_url
                : `${API_BASE_URL}${item.image_url}`
            }
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PhotoIcon className="w-5 h-5 text-gray-300 dark:text-gray-600" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {item.name}
          </h3>
          {item.is_halal && (
            <span className="px-1.5 py-0.5 text-[9px] font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-full shrink-0">
              Halal
            </span>
          )}
          {!item.is_available && (
            <span className="px-1.5 py-0.5 text-[9px] font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-full shrink-0">
              Indisponible
            </span>
          )}
        </div>
        {item.ingredients && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {item.ingredients}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 font-bold text-gray-900 dark:text-white text-sm shrink-0 tabular-nums">
        {Number(item.price).toFixed(2)}€
      </div>

      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => onEdit(item)}
          className="p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
          title="Modifier"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(item)}
          className="p-1.5 text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
          title="Supprimer"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
