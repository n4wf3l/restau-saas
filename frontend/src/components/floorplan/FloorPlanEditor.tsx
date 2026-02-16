import { useState, useEffect, useRef } from "react";
import type { FloorPlan, FloorPlanItem } from "../../lib/types";
import { api } from "../../lib/api";
import toast from "react-hot-toast";

interface FloorPlanEditorProps {
  floorPlan: FloorPlan;
  onUpdate: () => void;
}

type ToolType = "table" | "chair" | "wall" | "empty" | "eraser";

const CELL_SIZE = 40; // pixels

const ITEM_CONFIG: Record<ToolType, { color: string; emoji: string; label: string; key: string }> = {
  table: { color: "bg-amber-600", emoji: "🪑", label: "Table", key: "1" },
  chair: { color: "bg-blue-500", emoji: "💺", label: "Chaise", key: "2" },
  wall: { color: "bg-gray-700", emoji: "🧱", label: "Mur", key: "3" },
  empty: { color: "bg-white", emoji: "⬜", label: "Vide", key: "4" },
  eraser: { color: "bg-red-500", emoji: "🗑️", label: "Gomme", key: "E" },
};

export function FloorPlanEditor({ floorPlan, onUpdate }: FloorPlanEditorProps) {
  const [items, setItems] = useState<FloorPlanItem[]>(floorPlan.items || []);
  const [selectedTool, setSelectedTool] = useState<ToolType>("table");
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(floorPlan.items || []);
  }, [floorPlan]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tools selection
      if (e.key === "1") setSelectedTool("table");
      if (e.key === "2") setSelectedTool("chair");
      if (e.key === "3") setSelectedTool("wall");
      if (e.key === "4") setSelectedTool("empty");
      if (e.key === "e" || e.key === "E") setSelectedTool("eraser");
      
      // Rotation
      if (e.key === "r" || e.key === "R") {
        setRotation((prev) => ((prev + 90) % 360) as 0 | 90 | 180 | 270);
      }
      
      // Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getItemAt = (x: number, y: number): FloorPlanItem | undefined => {
    return items.find((item) => item.x === x && item.y === y);
  };

  const handleCellClick = (x: number, y: number) => {
    if (selectedTool === "eraser") {
      setItems((prev) => prev.filter((item) => !(item.x === x && item.y === y)));
    } else {
      const existingItem = getItemAt(x, y);
      if (existingItem) {
        setItems((prev) =>
          prev.map((item) =>
            item.x === x && item.y === y
              ? { ...item, type: selectedTool, rotation }
              : item
          )
        );
      } else {
        const newItem: FloorPlanItem = {
          id: Date.now(),
          floor_plan_id: floorPlan.id,
          type: selectedTool,
          x,
          y,
          rotation,
          meta: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setItems((prev) => [...prev, newItem]);
      }
    }
    setLastSaved(null); // Mark as unsaved
  };

  const handleCellMouseEnter = (x: number, y: number) => {
    setHoveredCell({ x, y });
    if (isDragging) {
      handleCellClick(x, y);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/api/floor-plans/current/items", { items });
      toast.success("Sauvegardé !");
      setLastSaved(new Date());
      onUpdate();
    } catch (error: any) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    if (confirm("Voulez-vous vraiment effacer tout le plan ?")) {
      setItems([]);
      setLastSaved(null);
    }
  };

  const cycleRotation = () => {
    setRotation((prev) => ((prev + 90) % 360) as 0 | 90 | 180 | 270);
  };

  const countByType = (type: ToolType) => items.filter((i) => i.type === type).length;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* SIDEBAR Gauche - Outils */}
      <aside className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-3 flex-shrink-0">
        <div className="text-xs font-semibold text-gray-400 mb-2">OUTILS</div>
        {(["table", "chair", "wall", "empty", "eraser"] as ToolType[]).map((tool) => {
          const config = ITEM_CONFIG[tool];
          return (
            <button
              key={tool}
              onClick={() => setSelectedTool(tool)}
              className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center transition-all ${
                selectedTool === tool
                  ? "bg-blue-600 text-white shadow-lg scale-110"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
              title={`${config.label} (${config.key})`}
            >
              <span className="text-2xl">{config.emoji}</span>
              <span className="text-[9px] font-medium mt-0.5">{config.key}</span>
            </button>
          );
        })}
        
        <div className="flex-1" />
        
        {/* Stats */}
        <div className="text-center px-2">
          <div className="text-[10px] text-gray-400 mb-1">ITEMS</div>
          <div className="text-lg font-bold text-gray-700">{items.length}</div>
        </div>
      </aside>

      {/* CANVAS Principal */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
        {/* Topbar Canvas */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between gap-4 flex-shrink-0">
          {/* Zoom */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Zoom:</span>
            <button
              onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.1))}
              className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
              disabled={zoom <= 0.5}
            >
              −
            </button>
            <span className="text-xs font-mono text-gray-700 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((prev) => Math.min(2, prev + 0.1))}
              className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
              disabled={zoom >= 2}
            >
              +
            </button>
          </div>

          {/* Rotation */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Rotation:</span>
            <button
              onClick={cycleRotation}
              className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 font-medium"
            >
              {rotation}° (R)
            </button>
          </div>

          {/* Dimensions */}
          <div className="text-xs text-gray-500">
            <span className="font-mono">{floorPlan.width}×{floorPlan.height}</span>
            <span className="ml-2">
              🪑 {countByType("table")} | 💺 {countByType("chair")} | 🧱 {countByType("wall")}
            </span>
          </div>

          {/* Save Status */}
          <div className="flex items-center gap-3">
            {lastSaved ? (
              <span className="text-xs text-green-600 font-medium">
                ✓ Sauvegardé
              </span>
            ) : items.length > 0 ? (
              <span className="text-xs text-orange-600 font-medium">
                • Non sauvegardé
              </span>
            ) : null}
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {saving ? "..." : "💾 Sauvegarder (Ctrl+S)"}
            </button>
            
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Grid Container avec scroll */}
        <div
          ref={canvasRef}
          className="flex-1 overflow-auto p-8 bg-gray-100 relative"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: `${CELL_SIZE * zoom}px ${CELL_SIZE * zoom}px`,
          }}
        >
          {/* Grid */}
          <div
            style={{
              width: floorPlan.width * CELL_SIZE * zoom,
              height: floorPlan.height * CELL_SIZE * zoom,
              display: "grid",
              gridTemplateColumns: `repeat(${floorPlan.width}, ${CELL_SIZE * zoom}px)`,
              gridTemplateRows: `repeat(${floorPlan.height}, ${CELL_SIZE * zoom}px)`,
              gap: "1px",
              backgroundColor: "#e5e7eb",
              margin: "auto",
              boxShadow: "0 10px 50px rgba(0,0,0,0.1)",
            }}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => {
              setIsDragging(false);
              setHoveredCell(null);
            }}
          >
            {Array.from({ length: floorPlan.height }).map((_, y) =>
              Array.from({ length: floorPlan.width }).map((_, x) => {
                const item = getItemAt(x, y);
                const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
                const showPreview = isHovered && selectedTool !== "eraser";

                return (
                  <div
                    key={`${x}-${y}`}
                    onClick={() => handleCellClick(x, y)}
                    onMouseEnter={() => handleCellMouseEnter(x, y)}
                    className={`cursor-pointer border border-gray-300 flex items-center justify-center text-xs font-mono transition-all ${
                      item ? ITEM_CONFIG[item.type].color : "bg-white hover:bg-gray-50"
                    } ${isHovered ? "ring-2 ring-blue-400 ring-inset" : ""}`}
                    style={{
                      width: CELL_SIZE * zoom,
                      height: CELL_SIZE * zoom,
                    }}
                    title={`(${x}, ${y})`}
                  >
                    {/* Item existant */}
                    {item && (
                      <span
                        className="text-white font-bold transition-transform"
                        style={{
                          transform: `rotate(${item.rotation}deg) scale(${zoom})`,
                          fontSize: `${20 * zoom}px`,
                        }}
                      >
                        {ITEM_CONFIG[item.type].emoji}
                      </span>
                    )}
                    
                    {/* Preview fantôme */}
                    {showPreview && !item && (
                      <span
                        className="opacity-40 transition-transform"
                        style={{
                          transform: `rotate(${rotation}deg) scale(${zoom})`,
                          fontSize: `${20 * zoom}px`,
                        }}
                      >
                        {ITEM_CONFIG[selectedTool].emoji}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Hints */}
        <div className="bg-white border-t border-gray-200 px-4 py-2 text-xs text-gray-500 flex justify-between items-center flex-shrink-0">
          <span>
            💡 <strong>1-4</strong> Outils | <strong>E</strong> Gomme | <strong>R</strong> Rotation | <strong>Ctrl+S</strong> Sauvegarder
          </span>
          <span className="text-gray-400">Maintenez le clic et glissez pour placer rapidement</span>
        </div>
      </div>
    </div>
  );
}
