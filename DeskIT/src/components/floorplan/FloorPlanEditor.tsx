import React, { useState } from 'react';
import { FloorPlan, DeskElement, RoomElement, ZoneElement } from '../../types/floorplan';
import { DeskNode } from './DeskNode';
import {
  Plus,
  Trash2,
  RotateCw,
  Save,
  Send,
  Square,
  Check,
  Layers,
  Eraser
} from 'lucide-react';

interface FloorPlanEditorProps {
  initialFloorPlan: FloorPlan;
  onSaveDraft: (floorPlan: FloorPlan) => void;
  onPublish: (floorPlan: FloorPlan) => void;
}

type EditorTool = 'select' | 'add-desk' | 'add-room' | 'add-wall' | 'add-zone' | 'delete';

export const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({
  initialFloorPlan,
  onSaveDraft,
  onPublish,
}) => {
  const [floorPlan, setFloorPlan] = useState<FloorPlan>(initialFloorPlan);
  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [nextDeskIndex, setNextDeskIndex] = useState(floorPlan.desks.length + 101);

  const gridSize = 48;
  const svgWidth = floorPlan.gridWidth * gridSize;
  const svgHeight = floorPlan.gridHeight * gridSize;

  // Handle Canvas Grid Click to add items
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const gridX = Math.floor(clickX / gridSize);
    const gridY = Math.floor(clickY / gridSize);

    if (activeTool === 'add-desk') {
      const newDesk: DeskElement = {
        id: `desk-${Date.now()}`,
        code: `D-${nextDeskIndex}`,
        x: gridX,
        y: gridY,
        rotation: 0,
        status: 'available',
        department: 'Engineering',
        hasMonitor: true,
        isStandingDesk: Math.random() > 0.5,
      };

      setFloorPlan((prev) => ({
        ...prev,
        desks: [...prev.desks, newDesk],
        lastModified: new Date().toISOString(),
      }));
      setNextDeskIndex((idx) => idx + 1);
      setSelectedId(newDesk.id);
      setIsSaved(false);
    } else if (activeTool === 'add-room') {
      const newRoom: RoomElement = {
        id: `room-${Date.now()}`,
        name: `Meeting Pod ${floorPlan.rooms.length + 1}`,
        x: gridX,
        y: gridY,
        width: 3,
        height: 3,
        type: 'meeting',
        capacity: 6,
      };

      setFloorPlan((prev) => ({
        ...prev,
        rooms: [...prev.rooms, newRoom],
        lastModified: new Date().toISOString(),
      }));
      setSelectedId(newRoom.id);
      setIsSaved(false);
    } else if (activeTool === 'add-zone') {
      const newZone: ZoneElement = {
        id: `zone-${Date.now()}`,
        name: `Zone ${floorPlan.zones.length + 1}`,
        x: gridX,
        y: gridY,
        width: 5,
        height: 4,
        color: '#8B5CF6',
        department: 'Engineering',
      };

      setFloorPlan((prev) => ({
        ...prev,
        zones: [...prev.zones, newZone],
        lastModified: new Date().toISOString(),
      }));
      setSelectedId(newZone.id);
      setIsSaved(false);
    }
  };

  // Rotate selected desk
  const handleRotateSelected = () => {
    if (!selectedId) return;
    setFloorPlan((prev) => ({
      ...prev,
      desks: prev.desks.map((d) =>
        d.id === selectedId ? { ...d, rotation: (d.rotation + 90) % 360 } : d
      ),
    }));
    setIsSaved(false);
  };

  // Delete selected item
  const handleDeleteSelected = () => {
    if (!selectedId) return;
    setFloorPlan((prev) => ({
      ...prev,
      desks: prev.desks.filter((d) => d.id !== selectedId),
      rooms: prev.rooms.filter((r) => r.id !== selectedId),
      zones: prev.zones.filter((z) => z.id !== selectedId),
    }));
    setSelectedId(null);
    setIsSaved(false);
  };

  // Clear Canvas from Scratch
  const handleClearCanvas = () => {
    if (window.confirm('Start from scratch? This will clear all desks, rooms, and walls on the canvas.')) {
      setFloorPlan((prev) => ({
        ...prev,
        desks: [],
        rooms: [],
        walls: [],
        zones: [],
      }));
      setSelectedId(null);
      setIsSaved(false);
    }
  };

  // Save Draft action
  const handleSaveDraftAction = () => {
    onSaveDraft(floorPlan);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Publish action
  const handlePublishAction = () => {
    onPublish(floorPlan);
    alert('Floor Plan layout published successfully! It is now live for HR and Employee views.');
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Admin Top Action Header */}
      <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-lg text-light-text dark:text-dark-text">
              Floor Plan Architect Studio
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brandPurple-100 text-brandPurple-700 dark:bg-brandPurple-950 dark:text-brandPurple-300 border border-brandPurple-300">
              Admin Canvas
            </span>
          </div>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
            Click tools below to add desks, rooms, or zones directly onto the grid layout.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearCanvas}
            className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 font-semibold text-xs flex items-center gap-1.5 hover:bg-rose-100 transition"
          >
            <Eraser className="w-3.5 h-3.5" /> Start Scratch
          </button>
          <button
            onClick={handleSaveDraftAction}
            className="px-3.5 py-1.5 rounded-xl border border-light-border dark:border-dark-border bg-slate-100 dark:bg-dark-sidebar hover:bg-slate-200 dark:hover:bg-dark-border text-light-text dark:text-dark-text font-bold text-xs flex items-center gap-1.5 transition"
          >
            {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Save className="w-3.5 h-3.5" />}
            {isSaved ? 'Draft Saved!' : 'Save Draft'}
          </button>
          <button
            onClick={handlePublishAction}
            className="px-4 py-1.5 rounded-xl bg-brandPurple-600 hover:bg-brandPurple-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-brandPurple-600/20"
          >
            <Send className="w-3.5 h-3.5" /> Publish Live Layout
          </button>
        </div>
      </div>

      {/* Main Studio Editor Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-[500px]">
        {/* Tool Palette Panel */}
        <div className="w-full lg:w-64 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
              Design Elements Palette
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => setActiveTool('add-desk')}
                className={`w-full p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-3 transition ${
                  activeTool === 'add-desk'
                    ? 'border-brandPurple-600 bg-brandPurple-50 dark:bg-brandPurple-900/30 text-brandPurple-700 dark:text-brandPurple-300 ring-1 ring-brandPurple-600'
                    : 'border-light-border dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-sidebar'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-brandBlue-100 dark:bg-brandPurple-900/50 text-brandBlue-600 dark:text-brandPurple-300">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-bold">Add Desk Node</p>
                  <p className="text-[10px] text-light-muted dark:text-dark-muted">Click grid to place desk</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTool('add-room')}
                className={`w-full p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-3 transition ${
                  activeTool === 'add-room'
                    ? 'border-brandPurple-600 bg-brandPurple-50 dark:bg-brandPurple-900/30 text-brandPurple-700 dark:text-brandPurple-300 ring-1 ring-brandPurple-600'
                    : 'border-light-border dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-sidebar'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300">
                  <Square className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-bold">Add Meeting Room</p>
                  <p className="text-[10px] text-light-muted dark:text-dark-muted">Place conference pod</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTool('add-zone')}
                className={`w-full p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-3 transition ${
                  activeTool === 'add-zone'
                    ? 'border-brandPurple-600 bg-brandPurple-50 dark:bg-brandPurple-900/30 text-brandPurple-700 dark:text-brandPurple-300 ring-1 ring-brandPurple-600'
                    : 'border-light-border dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-sidebar'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-300">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-bold">Add Team Zone</p>
                  <p className="text-[10px] text-light-muted dark:text-dark-muted">Department boundary</p>
                </div>
              </button>
            </div>

            {/* Selected Element Actions */}
            {selectedId && (
              <div className="pt-4 border-t border-light-border dark:border-dark-border space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
                  Element Actions
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleRotateSelected}
                    className="flex-1 py-2 px-3 rounded-xl border border-light-border dark:border-dark-border bg-slate-100 dark:bg-dark-sidebar hover:bg-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Rotate 90°
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-light-border dark:border-dark-border text-[11px] text-light-muted dark:text-dark-muted">
            <span className="font-bold">Desks Count:</span> {floorPlan.desks.length} |{' '}
            <span className="font-bold">Rooms:</span> {floorPlan.rooms.length}
          </div>
        </div>

        {/* SVG Grid Canvas */}
        <div className="flex-1 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-6 canvas-grid flex items-center justify-center overflow-auto shadow-inner">
          <svg
            width={svgWidth}
            height={svgHeight}
            onClick={handleCanvasClick}
            className="bg-white/80 dark:bg-dark-card/90 border border-light-border dark:border-dark-border rounded-2xl shadow-xl cursor-crosshair"
          >
            {/* Grid Helper Dots */}
            {floorPlan.zones.map((zone) => (
              <g key={zone.id} onClick={() => setSelectedId(zone.id)}>
                <rect
                  x={zone.x * gridSize}
                  y={zone.y * gridSize}
                  width={zone.width * gridSize}
                  height={zone.height * gridSize}
                  rx={12}
                  fill={zone.color}
                  fillOpacity={0.1}
                  stroke={selectedId === zone.id ? '#9333EA' : zone.color}
                  strokeWidth={selectedId === zone.id ? 3 : 1.5}
                  strokeDasharray="4 4"
                />
                <text
                  x={zone.x * gridSize + 12}
                  y={zone.y * gridSize + 20}
                  className="text-[11px] font-bold fill-light-text dark:fill-dark-text opacity-75 uppercase"
                >
                  {zone.name}
                </text>
              </g>
            ))}

            {/* Rooms */}
            {floorPlan.rooms.map((room) => (
              <g key={room.id} onClick={() => setSelectedId(room.id)}>
                <rect
                  x={room.x * gridSize}
                  y={room.y * gridSize}
                  width={room.width * gridSize}
                  height={room.height * gridSize}
                  rx={10}
                  className={`stroke-2 ${
                    selectedId === room.id
                      ? 'fill-brandPurple-100 dark:fill-brandPurple-950/60 stroke-brandPurple-600'
                      : 'fill-slate-100 dark:fill-dark-sidebar stroke-slate-300 dark:stroke-dark-border'
                  }`}
                />
                <text
                  x={room.x * gridSize + (room.width * gridSize) / 2}
                  y={room.y * gridSize + (room.height * gridSize) / 2}
                  textAnchor="middle"
                  className="text-xs font-bold fill-light-text dark:fill-dark-text pointer-events-none"
                >
                  {room.name}
                </text>
              </g>
            ))}

            {/* Desks */}
            {floorPlan.desks.map((desk) => (
              <DeskNode
                key={desk.id}
                desk={desk}
                isSelected={selectedId === desk.id}
                onClick={() => setSelectedId(desk.id)}
                gridSize={gridSize}
              />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
};
