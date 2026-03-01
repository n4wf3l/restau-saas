import { useEffect, useState, useRef, useCallback } from "react";
import {
  getSiteImages,
  createSiteImage,
  updateSiteImage,
  deleteSiteImage,
  reorderSiteImages,
  API_BASE_URL,
} from "../lib/api";
import type { SiteImage } from "../lib/types";
import toast from "react-hot-toast";
import {
  TrashIcon,
  PencilIcon,
  PlusIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { Spinner } from "../components/ui/Spinner";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ModalOverlay } from "../components/ui/ModalOverlay";

type ImageCategory = "hero" | "restaurant" | "carte" | "gallery";

const CATEGORIES: { key: ImageCategory; label: string }[] = [
  { key: "hero", label: "Hero" },
  { key: "restaurant", label: "Restaurant" },
  { key: "carte", label: "Carte" },
  { key: "gallery", label: "Galerie" },
];

function resolveImageUrl(url: string): string {
  if (url.startsWith("http")) return url;
  if (url.startsWith("/storage/")) return `${API_BASE_URL}${url}`;
  return url;
}

export default function SiteImagesPage() {
  const [images, setImages] = useState<SiteImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ImageCategory>("hero");
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SiteImage | null>(null);
  const [editingAlt, setEditingAlt] = useState<SiteImage | null>(null);
  const [altText, setAltText] = useState("");
  const [savingAlt, setSavingAlt] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImages = useCallback(async () => {
    try {
      const data = await getSiteImages();
      setImages(data);
    } catch {
      toast.error("Erreur lors du chargement des images");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const categoryImages = images
    .filter((img) => img.category === activeCategory)
    .sort((a, b) => a.sort_order - b.sort_order);

  // Upload
  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await createSiteImage({ category: activeCategory, image: file });
      }
      toast.success(
        files.length === 1 ? "Image ajoutée" : `${files.length} images ajoutées`
      );
      await loadImages();
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Delete
  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteSiteImage(deleteTarget.id);
      toast.success("Image supprimée");
      setDeleteTarget(null);
      await loadImages();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  // Save alt text
  async function handleSaveAlt() {
    if (!editingAlt) return;
    setSavingAlt(true);
    try {
      await updateSiteImage(editingAlt.id, { alt: altText });
      toast.success("Texte alternatif mis à jour");
      setEditingAlt(null);
      await loadImages();
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSavingAlt(false);
    }
  }

  // Reorder
  async function handleMove(image: SiteImage, direction: "up" | "down") {
    const sorted = [...categoryImages];
    const idx = sorted.findIndex((i) => i.id === image.id);
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    [sorted[idx], sorted[targetIdx]] = [sorted[targetIdx], sorted[idx]];
    const newIds = sorted.map((i) => i.id);

    // Optimistic update
    const updated = images.map((img) => {
      if (img.category !== activeCategory) return img;
      const newIdx = newIds.indexOf(img.id);
      return { ...img, sort_order: newIdx };
    });
    setImages(updated);

    try {
      await reorderSiteImages(activeCategory, newIds);
    } catch {
      toast.error("Erreur lors du réordonnancement");
      await loadImages();
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 sm:px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-cream-50">
            Images du site
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Gérez les images affichées sur le site public
        </p>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
          {/* Category tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {CATEGORIES.map((cat) => {
              const count = images.filter((i) => i.category === cat.key).length;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    activeCategory === cat.key
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-cream-50 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {cat.label}
                  <span className="ml-1.5 text-xs opacity-60">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Image grid */}
          {categoryImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {categoryImages.map((img, idx) => (
                <div
                  key={img.id}
                  className="relative group rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-[4/3] animate-stagger-item"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <img
                    src={resolveImageUrl(img.image_url)}
                    alt={img.alt || ""}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {/* Move up */}
                    {idx > 0 && (
                      <button
                        onClick={() => handleMove(img, "up")}
                        className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                        title="Monter"
                      >
                        <ChevronUpIcon className="w-4 h-4 text-gray-700" />
                      </button>
                    )}
                    {/* Move down */}
                    {idx < categoryImages.length - 1 && (
                      <button
                        onClick={() => handleMove(img, "down")}
                        className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                        title="Descendre"
                      >
                        <ChevronDownIcon className="w-4 h-4 text-gray-700" />
                      </button>
                    )}
                    {/* Edit alt */}
                    <button
                      onClick={() => {
                        setEditingAlt(img);
                        setAltText(img.alt || "");
                      }}
                      className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                      title="Modifier le texte alt"
                    >
                      <PencilIcon className="w-4 h-4 text-gray-700" />
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => setDeleteTarget(img)}
                      className="p-2 bg-red-500/90 rounded-lg hover:bg-red-600 transition-colors"
                      title="Supprimer"
                    >
                      <TrashIcon className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* Sort order badge */}
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-md font-medium">
                    {idx + 1}
                  </div>

                  {/* Alt text badge */}
                  {img.alt && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                      <p className="text-white text-xs truncate">{img.alt}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {categoryImages.length === 0 && (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <PhotoIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucune image dans cette catégorie</p>
            </div>
          )}

          {/* Upload zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleUpload(e.dataTransfer.files);
            }}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-coffee-500 bg-coffee-50 dark:bg-coffee-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
              disabled={uploading}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Spinner size="sm" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Upload en cours...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <PlusIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ajouter des images
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Glissez-déposez ou cliquez · JPG, PNG · Max 5 Mo
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer l'image"
        message="Cette action est irréversible. L'image sera définitivement supprimée du site."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Edit alt modal */}
      {editingAlt && (
        <ModalOverlay onClose={() => setEditingAlt(null)} width="w-96">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-cream-50 mb-4">
            Texte alternatif
          </h3>
          <input
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Description de l'image..."
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-cream-50 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-coffee-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveAlt();
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setEditingAlt(null)}
              className="flex-1 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveAlt}
              disabled={savingAlt}
              className="flex-1 py-2 rounded-lg text-sm font-medium text-white bg-coffee-600 hover:bg-coffee-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {savingAlt && <Spinner size="xs" />}
              Enregistrer
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
