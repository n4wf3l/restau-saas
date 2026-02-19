import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { FloorPlan, FloorPlanItem, PublicTable } from '../../lib/types';
import { api, getPublicTables } from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';
import {
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface FloorPlanEditorProps {
  floorPlan: FloorPlan;
  onUpdate: () => void;
}

type ToolType = 'table' | 'chair' | 'wall' | 'empty' | 'eraser';

const CELL_SIZE = 40;

const ITEM_CONFIG: Record<ToolType, { color: string; emoji: string; label: string; key: string }> = {
  table: { color: 'bg-amber-700/85 dark:bg-amber-600/75', emoji: '🍽️', label: 'Table', key: '1' },
  chair: { color: 'bg-slate-400/85 dark:bg-slate-400/65', emoji: '🪑', label: 'Chaise', key: '2' },
  wall: { color: 'bg-stone-700 dark:bg-stone-500', emoji: '🧱', label: 'Mur', key: '3' },
  empty: { color: 'bg-white dark:bg-gray-800', emoji: '', label: 'Vide', key: '4' },
  eraser: { color: 'bg-rose-400/80 dark:bg-rose-500/60', emoji: '❌', label: 'Gomme', key: 'E' },
};

export function FloorPlanEditor({ floorPlan, onUpdate }: FloorPlanEditorProps) {
  const { theme } = useTheme();
  const [items, setItems] = useState<FloorPlanItem[]>(floorPlan.items || []);
  const [selectedTool, setSelectedTool] = useState<ToolType>('table');
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [floorRegistry, setFloorRegistry] = useState<Map<number, string>>(new Map());
  const [showFloorNameModal, setShowFloorNameModal] = useState(false);
  const [newFloorName, setNewFloorName] = useState('');
  const [showTableNameModal, setShowTableNameModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [selectedTablePosition, setSelectedTablePosition] = useState<{ x: number; y: number } | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; tableName: string; seats: number; available: boolean } | null>(null);
  const [publicTables, setPublicTables] = useState<PublicTable[]>([]);
  const [showResizeModal, setShowResizeModal] = useState(false);
  const [newWidth, setNewWidth] = useState(floorPlan.width);
  const [newHeight, setNewHeight] = useState(floorPlan.height);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize items and floor registry from props
  useEffect(() => {
    const normalizedItems = (floorPlan.items || []).map(item => ({
      ...item,
      rotation: typeof item.rotation === 'number' ? item.rotation : 0
    }));
    setItems(normalizedItems);
    setNewWidth(floorPlan.width);
    setNewHeight(floorPlan.height);

    // Build floor registry from existing items
    const registry = new Map<number, string>();
    for (const item of normalizedItems) {
      const level = item.floor_level || 1;
      if (item.floor_name && !registry.has(level)) {
        registry.set(level, item.floor_name);
      }
    }
    if (!registry.has(1)) registry.set(1, 'Étage 1');
    setFloorRegistry(registry);

    loadPublicTables();
  }, [floorPlan]);

  const loadPublicTables = async () => {
    try {
      const tables = await getPublicTables();
      setPublicTables(tables);
    } catch (error) {
      console.error('Failed to load table availability:', error);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') setSelectedTool('table');
      if (e.key === '2') setSelectedTool('chair');
      if (e.key === '3') setSelectedTool('wall');
      if (e.key === '4') setSelectedTool('empty');
      if (e.key === 'e' || e.key === 'E') setSelectedTool('eraser');
      if (e.key === 'r' || e.key === 'R') {
        setRotation((prev) => ((prev + 90) % 360) as 0 | 90 | 180 | 270);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mouse wheel zoom (Ctrl+Scroll)
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => {
        const next = Math.round((prev + delta) * 10) / 10;
        return Math.min(2, Math.max(0.3, next));
      });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Floor helpers — use registry (not items) as source of truth for floor list
  const getFloorLevels = (): number[] => {
    const itemLevels = items.map((item) => item.floor_level || 1);
    const allLevels = [...new Set([...itemLevels, ...floorRegistry.keys()])];
    return allLevels.sort((a, b) => a - b);
  };

  const getFloorName = (level: number): string => {
    return floorRegistry.get(level) || `Étage ${level}`;
  };

  const currentFloorItems = items.filter((item) => (item.floor_level || 1) === currentFloor);

  const getItemAt = (x: number, y: number): FloorPlanItem | undefined => {
    return currentFloorItems.find((item) => item.x === x && item.y === y);
  };

  const getAdjacentChairs = (tableX: number, tableY: number): number => {
    let count = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const item = getItemAt(tableX + dx, tableY + dy);
        if (item && item.type === 'chair') count++;
      }
    }
    return count;
  };

  const handleCellClick = (x: number, y: number, isRightClick = false) => {
    const existingItem = getItemAt(x, y);

    if (isRightClick && existingItem) {
      let tablePosition = { x, y };
      let tableName = existingItem.table_name || '';

      if (existingItem.type === 'chair') {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const adjacentItem = getItemAt(x + dx, y + dy);
            if (adjacentItem && adjacentItem.type === 'table') {
              tablePosition = { x: x + dx, y: y + dy };
              tableName = adjacentItem.table_name || '';
              break;
            }
          }
        }
      }

      if (existingItem.type === 'table' || tableName !== '' || getItemAt(tablePosition.x, tablePosition.y)?.type === 'table') {
        setSelectedTablePosition(tablePosition);
        setNewTableName(tableName);
        setShowTableNameModal(true);
        return;
      }
    }

    if (selectedTool === 'eraser') {
      setItems((prev) => prev.filter((item) => !(item.x === x && item.y === y && (item.floor_level || 1) === currentFloor)));
    } else {
      if (existingItem) {
        if (existingItem.type === selectedTool) {
          setItems((prev) =>
            prev.map((item) =>
              item.x === x && item.y === y && (item.floor_level || 1) === currentFloor
                ? { ...item, rotation }
                : item
            )
          );
        } else {
          setItems((prev) =>
            prev.map((item) =>
              item.x === x && item.y === y && (item.floor_level || 1) === currentFloor
                ? { ...item, type: selectedTool, rotation }
                : item
            )
          );
        }
      } else {
        const newItem: FloorPlanItem = {
          id: Date.now(),
          floor_plan_id: floorPlan.id,
          type: selectedTool,
          x,
          y,
          rotation,
          meta: null,
          floor_level: currentFloor,
          floor_name: getFloorName(currentFloor),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setItems((prev) => [...prev, newItem]);
      }
    }
    setLastSaved(null);
  };

  const handleCellMouseEnter = (x: number, y: number, mouseEvent: React.MouseEvent) => {
    setHoveredCell({ x, y });
    const item = getItemAt(x, y);
    if (item && item.type === 'table') {
      const tableData = publicTables.find(t => t.x === x && t.y === y);
      const seats = tableData ? tableData.total_seats : getAdjacentChairs(x, y);
      const tableName = item.table_name || `Table (${x},${y})`;
      const isAvailable = tableData ? tableData.is_available : true;
      setTooltip({ x: mouseEvent.clientX, y: mouseEvent.clientY, tableName, seats, available: isAvailable });
    } else {
      setTooltip(null);
    }
    if (isDragging) handleCellClick(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tooltip) setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredCell(null);
    setTooltip(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const cleanedItems = items.map((item) => {
        const cleaned: any = {
          type: item.type,
          x: item.x,
          y: item.y,
          rotation: item.rotation,
          floor_level: item.floor_level || 1,
        };
        if (item.meta && Object.keys(item.meta).length > 0) cleaned.meta = item.meta;
        if (item.floor_name) cleaned.floor_name = item.floor_name;
        if (item.table_name) cleaned.table_name = item.table_name;
        return cleaned;
      });
      await api.put('/api/floor-plans/current/items', { items: cleanedItems });
      toast.success('Sauvegardé !');
      setLastSaved(new Date());
      await loadPublicTables();
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setShowDeleteConfirm(true);
  };

  const confirmClear = () => {
    setItems((prev) => prev.filter((item) => (item.floor_level || 1) !== currentFloor));
    setLastSaved(null);
    setShowDeleteConfirm(false);
    toast.success('Etage effacé !');
  };

  const handleResize = async () => {
    if (newWidth < 5 || newWidth > 100 || newHeight < 5 || newHeight > 100) {
      toast.error('Les dimensions doivent être entre 5 et 100');
      return;
    }
    try {
      await api.put('/api/floor-plans/current', { width: newWidth, height: newHeight });
      setShowResizeModal(false);
      toast.success('Dimensions modifiées !');
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const countByType = (type: ToolType) => currentFloorItems.filter((i) => i.type === type).length;

  const getTableGroup = (tableX: number, tableY: number): Array<{ x: number; y: number }> => {
    const group: Array<{ x: number; y: number }> = [{ x: tableX, y: tableY }];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const item = getItemAt(tableX + dx, tableY + dy);
        if (item) group.push({ x: tableX + dx, y: tableY + dy });
      }
    }
    return group;
  };

  // Floor management — register floor FIRST, then open naming modal
  const addNewFloor = () => {
    const levels = getFloorLevels();
    const newLevel = levels.length > 0 ? Math.max(...levels) + 1 : 1;
    const defaultName = `Étage ${newLevel}`;
    setFloorRegistry(prev => new Map(prev).set(newLevel, defaultName));
    setNewFloorName(defaultName);
    setCurrentFloor(newLevel);
    setShowFloorNameModal(true);
    setLastSaved(null);
  };

  const renameFloor = () => {
    if (!newFloorName.trim()) return;
    // Update registry
    setFloorRegistry(prev => new Map(prev).set(currentFloor, newFloorName));
    // Update existing items on this floor (if any)
    setItems((prev) =>
      prev.map((item) =>
        (item.floor_level || 1) === currentFloor ? { ...item, floor_name: newFloorName } : item
      )
    );
    setShowFloorNameModal(false);
    setNewFloorName('');
    setLastSaved(null);
    toast.success("Nom de l'étage enregistré !");
  };

  const renameTable = () => {
    if (!newTableName.trim() || !selectedTablePosition) return;
    const tableGroup = getTableGroup(selectedTablePosition.x, selectedTablePosition.y);
    const tableGroupCoords = new Set(tableGroup.map(p => `${p.x},${p.y}`));
    setItems((prev) =>
      prev.map((item) => {
        const coord = `${item.x},${item.y}`;
        if (tableGroupCoords.has(coord) && (item.floor_level || 1) === currentFloor) {
          return { ...item, table_name: newTableName };
        }
        return item;
      })
    );
    setShowTableNameModal(false);
    setNewTableName('');
    setSelectedTablePosition(null);
    setLastSaved(null);
    toast.success('Nom de la table modifié !');
  };

  const renderItemContent = (item: FloorPlanItem | null, isPreview = false) => {
    if (!item) return null;
    const config = ITEM_CONFIG[item.type];
    const actualRotation = typeof item.rotation === 'number' ? item.rotation : 0;
    return (
      <div
        className={`absolute inset-0.5 flex flex-col items-center justify-center transition-all ${isPreview ? 'opacity-40' : ''}`}
        style={{ transform: `rotate(${actualRotation}deg)` }}
      >
        <div className="text-lg leading-none">{config.emoji}</div>
        {item.table_name && item.type === 'table' && !isPreview && (
          <div className="text-[7px] font-semibold text-white bg-black/60 px-1 rounded mt-0.5 truncate max-w-full">
            {item.table_name}
          </div>
        )}
      </div>
    );
  };

  const getItemColor = (item: FloorPlanItem): string => {
    if (item.type === 'table') {
      const tableData = publicTables.find(t => t.x === item.x && t.y === item.y);
      if (tableData) {
        return tableData.is_available
          ? 'bg-amber-700/85 dark:bg-amber-600/75'
          : 'bg-stone-400/70 dark:bg-stone-500/60';
      }
      return 'bg-amber-700/85 dark:bg-amber-600/75';
    }
    return ITEM_CONFIG[item.type].color;
  };

  const floorLevels = getFloorLevels();

  const isDark = theme === 'dark';
  const gridLineColor = isDark ? 'rgba(75, 85, 99, 0.4)' : 'rgba(209, 213, 219, 0.6)';
  const gridGapColor = isDark ? '#374151' : '#e5e7eb';

  return (
    <div className="flex flex-1 overflow-hidden flex-col bg-gray-50 dark:bg-gray-900">
      {/* Topbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BuildingOfficeIcon className="w-6 h-6 text-coffee-600 dark:text-coffee-400" />
          <h1 className="text-lg font-semibold text-gray-800 dark:text-cream-100">Plan de salle</h1>
        </div>
        <div className="flex items-center gap-4">
          {lastSaved ? (
            <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
              <CheckCircleIcon className="w-4 h-4" />
              Sauvegardé
            </span>
          ) : items.length > 0 ? (
            <span className="text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
              <ExclamationTriangleIcon className="w-4 h-4" />
              Non sauvegardé
            </span>
          ) : null}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-coffee-600 text-cream-50 rounded-lg hover:bg-coffee-500 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            <ArrowPathIcon className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Toolbar sidebar */}
        <aside className="w-20 bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-4 gap-2 flex-shrink-0">
          <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-1">
            Outils
          </div>
          {(['table', 'chair', 'wall', 'empty', 'eraser'] as ToolType[]).map((tool) => {
            const config = ITEM_CONFIG[tool];
            const isSelected = selectedTool === tool;
            return (
              <button
                key={tool}
                onClick={() => setSelectedTool(tool)}
                className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-coffee-600 text-cream-50 shadow-md ring-2 ring-coffee-400/50 scale-105'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
                title={`${config.label} (${config.key})`}
              >
                <span className="text-xl leading-none">{config.emoji}</span>
                <span className={`text-[9px] font-medium mt-0.5 ${isSelected ? 'text-cream-200' : 'text-gray-400 dark:text-gray-500'}`}>
                  {config.key}
                </span>
              </button>
            );
          })}
          <div className="flex-1" />
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Secondary toolbar */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-5 py-2.5 flex items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={currentFloor}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'add_new') {
                      addNewFloor();
                    } else {
                      setCurrentFloor(Number(value));
                    }
                  }}
                  className="pl-3 pr-8 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-coffee-500/50 focus:border-coffee-500 font-medium appearance-none cursor-pointer"
                >
                  {floorLevels.map((level) => (
                    <option key={level} value={level}>{getFloorName(level)}</option>
                  ))}
                  <option value="add_new">+ Ajouter un étage</option>
                </select>
                <ChevronDownIcon className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button
                onClick={() => { setNewFloorName(getFloorName(currentFloor)); setShowFloorNameModal(true); }}
                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-coffee-600 dark:hover:text-coffee-400 hover:bg-coffee-50 dark:hover:bg-coffee-900/20 rounded-lg transition-colors"
                title="Renommer l'étage"
              >
                <PencilSquareIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom indicator (controlled by Ctrl+Scroll) */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowResizeModal(true)}
                className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium border border-gray-200 dark:border-gray-600 transition-colors"
              >
                Redimensionner
              </button>
              <button
                onClick={handleClear}
                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Effacer l'étage"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Canvas — scrollable grid area, Ctrl+Scroll to zoom */}
          <div
            ref={canvasRef}
            className="flex-1 overflow-auto p-6 bg-gray-100 dark:bg-gray-900 relative"
            style={{
              backgroundImage: `linear-gradient(to right, ${gridLineColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridLineColor} 1px, transparent 1px)`,
              backgroundSize: `${CELL_SIZE * zoom}px ${CELL_SIZE * zoom}px`,
            }}
          >
            <div
              style={{
                width: floorPlan.width * CELL_SIZE * zoom,
                height: floorPlan.height * CELL_SIZE * zoom,
                display: 'grid',
                gridTemplateColumns: `repeat(${floorPlan.width}, ${CELL_SIZE * zoom}px)`,
                gridTemplateRows: `repeat(${floorPlan.height}, ${CELL_SIZE * zoom}px)`,
                gap: '1px',
                backgroundColor: gridGapColor,
                margin: 'auto',
                boxShadow: isDark ? '0 4px 30px rgba(0,0,0,0.4)' : '0 4px 30px rgba(0,0,0,0.08)',
                borderRadius: '4px',
              }}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {Array.from({ length: floorPlan.height }).map((_, y) =>
                Array.from({ length: floorPlan.width }).map((_, x) => {
                  const item = getItemAt(x, y);
                  const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
                  const showPreview = isHovered && selectedTool !== 'eraser' && !item;
                  return (
                    <div
                      key={`${x}-${y}`}
                      onClick={() => handleCellClick(x, y, false)}
                      onContextMenu={(e) => { e.preventDefault(); handleCellClick(x, y, true); }}
                      onMouseEnter={(e) => handleCellMouseEnter(x, y, e)}
                      className={`relative cursor-pointer flex items-center justify-center transition-colors ${
                        item
                          ? getItemColor(item)
                          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
                      } ${isHovered ? 'ring-2 ring-coffee-400/60 ring-inset' : ''}`}
                      style={{ width: CELL_SIZE * zoom, height: CELL_SIZE * zoom }}
                    >
                      {item && renderItemContent(item)}
                      {showPreview && renderItemContent({
                        id: 0, floor_plan_id: floorPlan.id, type: selectedTool, x, y, rotation,
                        meta: null, floor_level: currentFloor, floor_name: getFloorName(currentFloor),
                        created_at: '', updated_at: '',
                      } as FloorPlanItem, true)}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Status bar */}
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-5 py-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-5">
              <span>
                Dimensions: <span className="font-mono font-semibold text-gray-700 dark:text-gray-200">{floorPlan.width} x {floorPlan.height}m</span>
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-amber-700/85 dark:bg-amber-600/75 rounded-sm" />
                  Tables: <span className="font-semibold text-gray-700 dark:text-gray-200">{countByType('table')}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-slate-400/85 dark:bg-slate-400/65 rounded-sm" />
                  Chaises: <span className="font-semibold text-gray-700 dark:text-gray-200">{countByType('chair')}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-stone-700 dark:bg-stone-500 rounded-sm" />
                  Murs: <span className="font-semibold text-gray-700 dark:text-gray-200">{countByType('wall')}</span>
                </span>
              </div>
            </div>
            <div className="text-gray-400 dark:text-gray-500 hidden md:block">
              <strong>1-4</strong> Outils &middot; <strong>E</strong> Gomme &middot; <strong>R</strong> Tourner &middot; <strong>Ctrl+Scroll</strong> Zoom &middot; <strong>Ctrl+S</strong> Sauvegarder
            </div>
          </div>
        </div>

        {/* Tooltip */}
        {tooltip && createPortal(
          <div className="fixed z-[9999] pointer-events-none" style={{ left: tooltip.x + 15, top: tooltip.y + 15 }}>
            <div className="bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-xl text-sm border border-gray-700 dark:border-gray-600">
              <div className="font-semibold">{tooltip.tableName}</div>
              <div className="text-gray-300 dark:text-gray-400 text-xs mt-1">{tooltip.seats} place{tooltip.seats > 1 ? 's' : ''}</div>
              <div className={`text-xs mt-1 ${tooltip.available ? 'text-emerald-400' : 'text-rose-400'}`}>
                {tooltip.available ? '✓ Disponible' : '✗ Réservée'}
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Floor Name Modal */}
        {showFloorNameModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-96 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-cream-100 flex items-center gap-2 mb-1">
                <BuildingOfficeIcon className="w-5 h-5 text-coffee-500" />
                Nommer l'étage
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Donnez un nom descriptif à cet étage</p>
              <input
                type="text"
                value={newFloorName}
                onChange={(e) => setNewFloorName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-coffee-500/50 focus:border-coffee-500 text-sm placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Ex: Rez-de-chaussée, Terrasse..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') renameFloor();
                  if (e.key === 'Escape') setShowFloorNameModal(false);
                }}
              />
              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => { setShowFloorNameModal(false); setNewFloorName(''); }}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={renameFloor}
                  className="px-4 py-2 text-sm bg-coffee-600 text-cream-50 rounded-lg hover:bg-coffee-500 font-medium flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table Name Modal */}
        {showTableNameModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-96 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-cream-100 mb-4">Nommer la table</h3>
              <input
                type="text"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-coffee-500/50 focus:border-coffee-500 text-sm placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Ex: Table 1, Terrasse A..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') renameTable();
                  if (e.key === 'Escape') setShowTableNameModal(false);
                }}
              />
              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => setShowTableNameModal(false)}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={renameTable}
                  className="px-4 py-2 text-sm bg-coffee-600 text-cream-50 rounded-lg hover:bg-coffee-500 font-medium transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resize Modal */}
        {showResizeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-96 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-cream-100 mb-1">Redimensionner le plan</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Dimensions entre 5 et 100m</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">Largeur (m)</label>
                  <input type="number" value={newWidth} onChange={(e) => setNewWidth(Number(e.target.value))} min="5" max="100"
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-coffee-500/50 focus:border-coffee-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">Hauteur (m)</label>
                  <input type="number" value={newHeight} onChange={(e) => setNewHeight(Number(e.target.value))} min="5" max="100"
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-coffee-500/50 focus:border-coffee-500 text-sm" />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-lg">
                  Les éléments en dehors des nouvelles dimensions seront conservés mais masqués.
                </p>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button onClick={() => { setShowResizeModal(false); setNewWidth(floorPlan.width); setNewHeight(floorPlan.height); }}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors">
                  Annuler
                </button>
                <button onClick={handleResize}
                  className="px-4 py-2 text-sm bg-coffee-600 text-cream-50 rounded-lg hover:bg-coffee-500 font-medium flex items-center gap-1.5 transition-colors">
                  <CheckCircleIcon className="w-4 h-4" />
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-96 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-cream-100 flex items-center gap-2 mb-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                Confirmer la suppression
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                Êtes-vous sûr de vouloir effacer tous les éléments de <strong className="text-gray-800 dark:text-gray-200">{getFloorName(currentFloor)}</strong> ? Cette action est irréversible.
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors">
                  Annuler
                </button>
                <button onClick={confirmClear}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-1.5 transition-colors">
                  <TrashIcon className="w-4 h-4" />
                  Effacer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
