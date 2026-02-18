import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../lib/api";
import type { MenuItem, MenuItemPayload } from "../lib/types";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XCircleIcon,
  CheckCircleIcon,
  CurrencyEuroIcon,
  PhotoIcon,
  Bars3Icon,
  MoonIcon,
  SunIcon,
  CalendarIcon,
  BookOpenIcon,
  ArrowRightOnRectangleIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";

export function MenuPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuItemPayload>({
    name: "",
    ingredients: "",
    price: 0,
    is_halal: false,
    image_url: "",
    category: "",
    is_available: true,
    order: 0,
  });

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      const data = await getMenuItems();
      setMenuItems(data);
    } catch (error) {
      toast.error("Erreur lors du chargement du menu");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, formData);
        toast.success("Plat modifié avec succès");
      } else {
        await createMenuItem(formData);
        toast.success("Plat ajouté avec succès");
      }
      setShowModal(false);
      resetForm();
      loadMenuItems();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      ingredients: item.ingredients || "",
      price: item.price,
      is_halal: item.is_halal,
      image_url: item.image_url || "",
      category: item.category || "",
      is_available: item.is_available,
      order: item.order,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce plat ?")) return;
    try {
      await deleteMenuItem(id);
      toast.success("Plat supprimé");
      loadMenuItems();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      ingredients: "",
      price: 0,
      is_halal: false,
      image_url: "",
      category: "",
      is_available: true,
      order: 0,
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Déconnexion réussie");
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const categories = [...new Set(menuItems.map((item) => item.category).filter(Boolean))];

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
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-coffee-900 transition-colors"
            >
              <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-cream-400" />
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
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <CalendarIcon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Réservations</span>}
          </a>
          <a
            href="/dashboard/menu"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-coffee-100 dark:bg-coffee-600/20 text-coffee-700 dark:text-coffee-300 border border-coffee-200 dark:border-coffee-600/30 transition-colors font-medium"
          >
            <BookOpenIcon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Menu</span>}
          </a>
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-coffee-900/20 space-y-1">
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
                Carte du Menu
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Gérez les plats de votre restaurant
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <PlusIcon className="w-5 h-5" />
              Ajouter un plat
            </button>
          </div>
        </header>

        {/* Menu Items Grid */}
        <div className="flex-1 overflow-auto p-6">
          {menuItems.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Aucun plat
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Commencez par ajouter votre premier plat
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                Ajouter un plat
              </button>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              {categories.length > 0 ? (
                categories.map((category) => (
                  <div key={category} className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      {category || "Sans catégorie"}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {menuItems
                        .filter((item) => item.category === category)
                        .map((item) => (
                          <MenuItemCard
                            key={item.id}
                            item={item}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menuItems.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingItem ? "Modifier le plat" : "Ajouter un plat"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XCircleIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom du plat *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Burger Classic"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ingrédients
                </label>
                <textarea
                  value={formData.ingredients}
                  onChange={(e) =>
                    setFormData({ ...formData, ingredients: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Pain, steak, salade, tomate, oignon..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prix (€) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="12.50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Catégorie
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Entrées, Plats, Desserts..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL de l'image
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_halal}
                    onChange={(e) =>
                      setFormData({ ...formData, is_halal: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Halal
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_available: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Disponible
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingItem ? "Mettre à jour" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Menu Item Card Component
function MenuItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      {item.image_url && (
        <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}
      {!item.image_url && (
        <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <PhotoIcon className="w-16 h-16 text-gray-400 dark:text-gray-600" />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {item.name}
          </h3>
          {item.is_halal && (
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
              Halal
            </span>
          )}
        </div>

        {item.ingredients && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {item.ingredients}
          </p>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 text-lg font-bold text-gray-900 dark:text-white">
            <CurrencyEuroIcon className="w-5 h-5" />
            {item.price.toFixed(2)}
          </div>
          {!item.is_available && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full">
              Indisponible
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(item)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
          >
            <PencilIcon className="w-4 h-4" />
            Modifier
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
          >
            <TrashIcon className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
