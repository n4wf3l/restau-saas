import { useEffect, useState, useRef } from "react";
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
  CurrencyEuroIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { Spinner } from "../components/ui/Spinner";

export function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    loadMenuItems();
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
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setImagePreview(item.image_url ? (item.image_url.startsWith('http') ? item.image_url : `http://localhost:8000${item.image_url}`) : null);
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

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce plat ?")) return;
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

  const categories = [...new Set(menuItems.map((item) => item.category).filter(Boolean))];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Carte du Menu
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Gérez les plats de votre restaurant
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-coffee-600 text-cream-50 rounded-lg hover:bg-coffee-500 transition-colors text-sm font-medium"
        >
          <PlusIcon className="w-4 h-4" />
          Ajouter un plat
        </button>
      </div>

      {/* Menu Items Grid */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Spinner />
          </div>
        ) : menuItems.length === 0 ? (
          <div className="text-center py-16">
            <PhotoIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              Aucun plat
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Commencez par ajouter votre premier plat
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-coffee-600 text-cream-50 rounded-lg hover:bg-coffee-500 transition-colors text-sm font-medium"
            >
              <PlusIcon className="w-4 h-4" />
              Ajouter un plat
            </button>
          </div>
        ) : (
          <div className="max-w-7xl">
            {categories.length > 0 ? (
              categories.map((category) => (
                <div key={category} className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {category || "Sans catégorie"}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {menuItems
                      .filter((item) => item.category === category)
                      .map((item) => (
                        <MenuItemCard key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
                      ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto border border-gray-200 dark:border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingItem ? "Modifier le plat" : "Ajouter un plat"}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom du plat *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-coffee-500/50 focus:border-coffee-500 text-sm"
                  placeholder="Ex: Burger Classic"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ingrédients
                </label>
                <textarea
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-coffee-500/50 focus:border-coffee-500 text-sm"
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
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-coffee-500/50 focus:border-coffee-500 text-sm"
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
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-coffee-500/50 focus:border-coffee-500 text-sm"
                    placeholder="Entrées, Plats, Desserts..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Image du plat
                </label>
                {imagePreview && (
                  <div className="relative mb-2 w-full h-36 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData({ ...formData, image: null });
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                    >
                      <XCircleIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 w-full px-3 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:border-coffee-500/50 transition-colors">
                  <PhotoIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formData.image ? formData.image.name : "Choisir une image..."}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFormData({ ...formData, image: file });
                      if (file) {
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_halal}
                    onChange={(e) => setFormData({ ...formData, is_halal: e.target.checked })}
                    className="w-4 h-4 text-coffee-600 bg-gray-100 border-gray-300 rounded focus:ring-coffee-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Halal</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="w-4 h-4 text-coffee-600 bg-gray-100 border-gray-300 rounded focus:ring-coffee-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Disponible</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-coffee-600 text-cream-50 rounded-lg hover:bg-coffee-500 font-medium transition-colors"
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
    <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
      {item.image_url ? (
        <div className="relative h-44 bg-gray-100 dark:bg-gray-800">
          <img
            src={item.image_url.startsWith('http') ? item.image_url : `http://localhost:8000${item.image_url}`}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        </div>
      ) : (
        <div className="h-44 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
          <PhotoIcon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
          {item.is_halal && (
            <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-full">
              Halal
            </span>
          )}
        </div>

        {item.ingredients && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{item.ingredients}</p>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 text-lg font-bold text-gray-900 dark:text-white">
            <CurrencyEuroIcon className="w-5 h-5" />
            {Number(item.price).toFixed(2)}
          </div>
          {!item.is_available && (
            <span className="px-2 py-0.5 text-[10px] font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-full">
              Indisponible
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(item)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
          >
            <PencilIcon className="w-3.5 h-3.5" />
            Modifier
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors text-sm"
          >
            <TrashIcon className="w-3.5 h-3.5" />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
