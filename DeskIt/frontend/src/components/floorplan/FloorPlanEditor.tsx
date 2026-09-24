import React, { useState, useRef, useEffect } from 'react';
import { FloorPlan } from '../../types/floorplan';
import { DeskNode } from './DeskNode';
import { useViewport } from '../../hooks/useViewport';
import { useFloorEditor } from '../../hooks/useFloorEditor';
import { useFloorHistory } from '../../hooks/useFloorHistory';
import { getSvgTransformMatrix, screenToWorld } from '../../geometry/coordinates';
import { DEFAULT_FLOOR_CONFIG, finestCellToWorld, worldToFinestCell } from '../../geometry/grid';
import { Grid } from './Grid';
import { FloorBoundary } from './FloorBoundary';
import { ZonesLayer } from './ZonesLayer';
import { UnusableLayer } from './UnusableLayer';
import { EntityLibrary } from './EntityLibrary';
import { PropertiesPanel } from './PropertiesPanel';
import { SelectionMarquee } from './SelectionMarquee';
import { CellCoord } from '../../types/geometry';
import {
  Save,
  Send,
  Check,
  Eraser,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Undo,
  Redo
} from 'lucide-react';

interface FloorPlanEditorProps {
  initialFloorPlan: FloorPlan;
  onSaveDraft: (floorPlan: FloorPlan) => void;
  onPublish: (floorPlan: FloorPlan) => void;
}

export const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({
  initialFloorPlan,
  onSaveDraft,
  onPublish,
}) => {
  const { currentPlan: floorPlan, pushState, undo, redo, canUndo, canRedo } = useFloorHistory(initialFloorPlan);
  const [isSaved, setIsSaved] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState<CellCoord | null>(null);
  const [marqueeCurrent, setMarqueeCurrent] = useState<CellCoord | null>(null);
  const [isMarqueeMode] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const floorConfig = floorPlan.floorConfig || DEFAULT_FLOOR_CONFIG;

  const {
    viewport,
    isPanning,
    startPan,
    updatePan,
    endPan,
    handleWheelZoom,
    fitToFloor,
    resetView,
    zoomIn,
    zoomOut,
  } = useViewport({
    initialViewport: { panX: 50, panY: 650, zoom: 0.75 },
    floorConfig,
  });

  const updateFloorPlan = (updater: (prev: FloorPlan) => FloorPlan) => {
    const updated = updater(floorPlan);
    pushState(updated);
  };

  const {
    activeCatalogItem,
    setActiveCatalogItem,
    selectedEntityId,
    setSelectedEntityId,
    placementGhost,
    updatePlacementGhost,
    commitPlacement,
    rotateSelectedEntity,
    deleteSelectedEntity,
  } = useFloorEditor(floorPlan, updateFloorPlan as React.Dispatch<React.SetStateAction<FloorPlan>>);

  // Auto fit to container on mount
  useEffect(() => {
    if (containerRef.current) {
      fitToFloor(containerRef.current.clientWidth, containerRef.current.clientHeight || 500);
    }
  }, [fitToFloor]);

  const placementStep = floorConfig.a / 4;

  const selectedDesk = floorPlan.desks.find((d) => d.id === selectedEntityId) || null;
  const selectedRoom = floorPlan.rooms.find((r) => r.id === selectedEntityId) || null;
  const selectedZone = floorPlan.zones.find((z) => z.id === selectedEntityId) || null;

  // Track mouse movement across canvas for placement ghost & marquee selection
  const handleMouseMoveCanvas = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      updatePan(e, svgRef.current);
      return;
    }

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const cursorScreen = { screenX: e.clientX - rect.left, screenY: e.clientY - rect.top };
      const worldPoint = screenToWorld(cursorScreen, viewport);

      if (activeCatalogItem) {
        updatePlacementGhost(worldPoint);
      }

      if (isMarqueeMode && marqueeStart) {
        const finestCell = worldToFinestCell(worldPoint, floorConfig);
        setMarqueeCurrent(finestCell);
      }
    }
  };

  const handleMouseDownCanvas = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.ctrlKey || isMarqueeMode) {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const cursorScreen = { screenX: e.clientX - rect.left, screenY: e.clientY - rect.top };
        const worldPoint = screenToWorld(cursorScreen, viewport);
        const cell = worldToFinestCell(worldPoint, floorConfig);
        setMarqueeStart(cell);
        setMarqueeCurrent(cell);
      }
    } else {
      startPan(e, svgRef.current);
    }
  };

  // Handle Canvas Click for placement commit or object selection
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) return;

    if (activeCatalogItem && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const cursorScreen = { screenX: e.clientX - rect.left, screenY: e.clientY - rect.top };
      const worldPoint = screenToWorld(cursorScreen, viewport);
      commitPlacement(worldPoint);
    }
  };

  // Clear Canvas from Scratch
  const handleClearCanvas = () => {
    if (window.confirm('Start from scratch? This will clear all desks, rooms, and walls on the canvas.')) {
      updateFloorPlan((prev) => ({
        ...prev,
        desks: [],
        rooms: [],
        walls: [],
        zones: [],
      }));
      setSelectedEntityId(null);
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
      <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm z-10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-lg text-light-text dark:text-dark-text">
              Floor Plan Architect Studio
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brandPurple-100 text-brandPurple-700 dark:bg-brandPurple-950 dark:text-brandPurple-300 border border-brandPurple-300">
              History & Persistence Studio
            </span>
          </div>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
            Use <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-dark-sidebar font-mono text-[10px]">Ctrl+Z</kbd> to Undo, <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-dark-sidebar font-mono text-[10px]">Ctrl+Y</kbd> to Redo layout edits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo / Redo History Buttons */}
          <div className="flex items-center gap-1 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-1 mr-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-dark-sidebar disabled:opacity-40 rounded text-light-text dark:text-dark-text transition"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-dark-sidebar disabled:opacity-40 rounded text-light-text dark:text-dark-text transition"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom / Viewport controls */}
          <div className="flex items-center gap-1 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-1 mr-2">
            <button onClick={zoomOut} className="p-1 hover:bg-slate-100 dark:hover:bg-dark-sidebar rounded text-light-text dark:text-dark-text" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold px-1.5 text-light-text dark:text-dark-text min-w-[40px] text-center">
              {Math.round(viewport.zoom * 100)}%
            </span>
            <button onClick={zoomIn} className="p-1 hover:bg-slate-100 dark:hover:bg-dark-sidebar rounded text-light-text dark:text-dark-text" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                containerRef.current &&
                fitToFloor(containerRef.current.clientWidth, containerRef.current.clientHeight || 500)
              }
              className="p-1 hover:bg-slate-100 dark:hover:bg-dark-sidebar rounded text-light-text dark:text-dark-text"
              title="Fit to Floor Boundary"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={resetView} className="p-1 hover:bg-slate-100 dark:hover:bg-dark-sidebar rounded text-light-text dark:text-dark-text" title="Reset View">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

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
        {/* DeskIT Design Elements Palette Sidebar */}
        <div className="w-full lg:w-72 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
              Design Elements Catalog
            </h3>

            {/* Reusable Entity Library Component */}
            <EntityLibrary
              activeCatalogItem={activeCatalogItem}
              onSelectCatalogItem={setActiveCatalogItem}
            />
          </div>

          <div className="pt-3 border-t border-light-border dark:border-dark-border text-[11px] text-light-muted dark:text-dark-muted">
            <span className="font-bold">Desks:</span> {floorPlan.desks.length} |{' '}
            <span className="font-bold">Rooms:</span> {floorPlan.rooms.length} |{' '}
            <span className="font-bold">Zones:</span> {floorPlan.zones.length}
          </div>
        </div>

        {/* Viewport Engine Interactive SVG Canvas */}
        <div
          ref={containerRef}
          className="flex-1 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl relative overflow-hidden shadow-inner cursor-grab active:cursor-grabbing min-h-[500px]"
        >
          <svg
            ref={svgRef}
            className="w-full h-full select-none"
            onClick={handleCanvasClick}
            onWheel={(e) => handleWheelZoom(e, svgRef.current)}
            onMouseDown={handleMouseDownCanvas}
            onMouseMove={handleMouseMoveCanvas}
            onMouseUp={() => {
              endPan();
              if (marqueeStart && marqueeCurrent) {
                setMarqueeStart(null);
                setMarqueeCurrent(null);
              }
            }}
            onMouseLeave={endPan}
          >
            {/* World Transformation Matrix */}
            <g transform={getSvgTransformMatrix(viewport)}>
              {/* Floor Boundary & Outside Workspace Muting */}
              <FloorBoundary floorConfig={floorConfig} />

              {/* Adaptive Multi-Level Grid */}
              <Grid floorConfig={floorConfig} zoom={viewport.zoom} showGrid={true} />

              {/* Zones Layer */}
              <ZonesLayer
                zones={floorPlan.zones}
                selectedZoneId={selectedEntityId}
                onSelectZone={(id) => setSelectedEntityId(id)}
                floorConfig={floorConfig}
              />

              {/* Unusable Regions Layer */}
              <UnusableLayer
                unusableRegions={floorPlan.unusableRegions || []}
                selectedRegionId={selectedEntityId}
                onSelectRegion={(id) => setSelectedEntityId(id)}
                floorConfig={floorConfig}
              />

              {/* Rooms Layer */}
              {floorPlan.rooms.map((room) => {
                const rX = room.x * placementStep;
                const rY = room.y * placementStep;
                const rW = room.width * placementStep;
                const rH = room.height * placementStep;
                return (
                  <g key={room.id} onClick={() => setSelectedEntityId(room.id)}>
                    <rect
                      x={rX}
                      y={rY}
                      width={rW}
                      height={rH}
                      rx={10}
                      className={`stroke-2 ${
                        selectedEntityId === room.id
                          ? 'fill-brandPurple-100 dark:fill-brandPurple-950/60 stroke-brandPurple-600'
                          : 'fill-slate-100 dark:fill-dark-sidebar stroke-slate-300 dark:stroke-dark-border'
                      }`}
                    />
                    <g transform={`translate(${rX + rW / 2}, ${rY + rH / 2}) scale(1, -1)`}>
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="text-xs font-bold fill-light-text dark:fill-dark-text pointer-events-none"
                      >
                        {room.name}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Desks Layer */}
              {floorPlan.desks.map((desk) => {
                const dX = desk.x * placementStep;
                const dY = desk.y * placementStep;
                return (
                  <g key={desk.id} transform={`translate(${dX}, ${dY})`}>
                    <DeskNode
                      desk={{ ...desk, x: 0, y: 0 }}
                      isSelected={selectedEntityId === desk.id}
                      onClick={() => setSelectedEntityId(desk.id)}
                      gridSize={placementStep}
                    />
                  </g>
                );
              })}

              {/* Selection Marquee Overlay */}
              <SelectionMarquee
                startCell={marqueeStart}
                currentCell={marqueeCurrent}
                floorConfig={floorConfig}
              />

              {/* Placement Ghost Preview Layer */}
              {placementGhost && (
                <g>
                  {(() => {
                    const originWorld = finestCellToWorld(placementGhost.originFinest, floorConfig);
                    const ghostW = (placementGhost.catalogItem.widthFinestCells / 16) * floorConfig.a;
                    const ghostH = (placementGhost.catalogItem.heightFinestCells / 16) * floorConfig.a;

                    return (
                      <g transform={`translate(${originWorld.worldX}, ${originWorld.worldY})`}>
                        <rect
                          x={0}
                          y={0}
                          width={ghostW}
                          height={ghostH}
                          rx={8}
                          className={`stroke-2 stroke-dasharray-4 transition-colors ${
                            placementGhost.isValid
                              ? 'fill-emerald-500/30 stroke-emerald-500'
                              : 'fill-rose-500/30 stroke-rose-500'
                          }`}
                        />
                        <g transform={`translate(${ghostW / 2}, ${ghostH / 2}) scale(1, -1)`}>
                          <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            className={`text-xs font-extrabold ${
                              placementGhost.isValid ? 'fill-emerald-700 dark:fill-emerald-300' : 'fill-rose-700 dark:fill-rose-300'
                            }`}
                          >
                            {placementGhost.isValid ? `Place ${placementGhost.catalogItem.name}` : 'Invalid Spot'}
                          </text>
                        </g>
                      </g>
                    );
                  })()}
                </g>
              )}
            </g>
          </svg>
        </div>

        {/* Side Properties Inspector Panel */}
        <PropertiesPanel
          selectedDesk={selectedDesk}
          selectedRoom={selectedRoom}
          selectedZone={selectedZone}
          role="admin"
          onClose={() => setSelectedEntityId(null)}
          onRotate={rotateSelectedEntity}
          onDelete={deleteSelectedEntity}
        />
      </div>
    </div>
  );
};
