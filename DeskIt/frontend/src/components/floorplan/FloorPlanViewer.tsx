import React, { useRef, useEffect } from 'react';
import { FloorPlan, DeskElement } from '../../types/floorplan';
import { useAuth } from '../../context/AuthContext';
import { useViewport } from '../../hooks/useViewport';
import { getSvgTransformMatrix } from '../../geometry/coordinates';
import { DEFAULT_FLOOR_CONFIG, getFloorWorldDimensions } from '../../geometry/grid';
import { Grid } from './Grid';
import { FloorBoundary } from './FloorBoundary';
import { ZonesLayer } from './ZonesLayer';
import { UnusableLayer } from './UnusableLayer';
import { PropertiesPanel } from './PropertiesPanel';
import { DeskNode } from './DeskNode';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Filter
} from 'lucide-react';
import { DEPARTMENTS } from '../../data/mockData';

interface FloorPlanViewerProps {
  floorPlan: FloorPlan;
  searchQuery?: string;
  onAssignClick?: (desk: DeskElement) => void;
}

export const FloorPlanViewer: React.FC<FloorPlanViewerProps> = ({
  floorPlan,
  searchQuery = '',
  onAssignClick,
}) => {
  const { user } = useAuth();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const floorConfig = floorPlan.floorConfig || DEFAULT_FLOOR_CONFIG;
  const { width: worldW, height: worldH } = getFloorWorldDimensions(floorConfig);

  const {
    viewport,
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

  const [selectedDesk, setSelectedDesk] = React.useState<DeskElement | null>(null);
  const [selectedDeptFilter, setSelectedDeptFilter] = React.useState<string>('all');

  // Auto fit to container on mount
  useEffect(() => {
    if (containerRef.current) {
      fitToFloor(containerRef.current.clientWidth, containerRef.current.clientHeight || 500);
    }
  }, [fitToFloor]);

  const availableCount = floorPlan.desks.filter((d) => d.status === 'available').length;
  const occupiedCount = floorPlan.desks.filter((d) => d.status === 'occupied').length;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Main Read-Only Viewport Canvas */}
      <div
        ref={containerRef}
        className="flex-1 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl flex flex-col overflow-hidden shadow-sm min-h-[500px]"
      >
        {/* Top Controls Toolbar */}
        <div className="p-3 bg-slate-50 dark:bg-dark-sidebar border-b border-light-border dark:border-dark-border flex flex-wrap items-center justify-between gap-3 z-10">
          {/* Department Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-xs font-bold text-light-muted dark:text-dark-muted flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            <button
              onClick={() => setSelectedDeptFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                selectedDeptFilter === 'all'
                  ? 'bg-brandBlue-600 dark:bg-brandPurple-600 text-white'
                  : 'bg-white dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border hover:bg-slate-100'
              }`}
            >
              All Desks ({floorPlan.desks.length})
            </button>
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setSelectedDeptFilter(dept.name)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  selectedDeptFilter === dept.name
                    ? 'bg-brandBlue-600 dark:bg-brandPurple-600 text-white'
                    : 'bg-white dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border hover:bg-slate-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dept.color }} />
                {dept.name}
              </button>
            ))}
          </div>

          {/* Viewport Zoom & Pan Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-1">
              <button onClick={zoomOut} className="p-1 hover:bg-slate-100 dark:hover:bg-dark-sidebar rounded text-light-text dark:text-dark-text" title="Zoom Out">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold px-1.5 text-light-text dark:text-dark-text min-w-[44px] text-center">
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
          </div>
        </div>

        {/* Read-Only Coordinate Engine Viewport SVG */}
        <div className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing">
          <svg
            ref={svgRef}
            className="w-full h-full select-none"
            onWheel={(e) => handleWheelZoom(e, svgRef.current)}
            onMouseDown={(e) => startPan(e, svgRef.current)}
            onMouseMove={(e) => updatePan(e, svgRef.current)}
            onMouseUp={endPan}
            onMouseLeave={endPan}
          >
            {/* World Coordinate Transformation Container */}
            <g transform={getSvgTransformMatrix(viewport)}>
              {/* Floor Boundary & Outside Workspace Muting */}
              <FloorBoundary floorConfig={floorConfig} />

              {/* Adaptive Grid Engine */}
              <Grid floorConfig={floorConfig} zoom={viewport.zoom} showGrid={true} />

              {/* Zones Layer */}
              <ZonesLayer zones={floorPlan.zones} floorConfig={floorConfig} />

              {/* Unusable Regions Layer */}
              <UnusableLayer unusableRegions={floorPlan.unusableRegions || []} floorConfig={floorConfig} />

              {/* Render Meeting Rooms & Amenities */}
              {floorPlan.rooms.map((room) => {
                const rX = room.x * (floorConfig.a / 4);
                const rY = room.y * (floorConfig.a / 4);
                const rW = room.width * (floorConfig.a / 4);
                const rH = room.height * (floorConfig.a / 4);
                return (
                  <g key={room.id}>
                    <rect
                      x={rX}
                      y={rY}
                      width={rW}
                      height={rH}
                      rx={10}
                      className="fill-slate-100 dark:fill-dark-sidebar stroke-slate-300 dark:stroke-dark-border stroke-2"
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

              {/* Render Wall Dividers */}
              {floorPlan.walls.map((wall) => (
                <line
                  key={wall.id}
                  x1={wall.x1 * (floorConfig.a / 4)}
                  y1={wall.y1 * (floorConfig.a / 4)}
                  x2={wall.x2 * (floorConfig.a / 4)}
                  y2={wall.y2 * (floorConfig.a / 4)}
                  className="stroke-slate-400 dark:stroke-slate-600 stroke-[4] stroke-round"
                />
              ))}

              {/* Render Desks */}
              {floorPlan.desks.map((desk) => {
                const isSelected = selectedDesk?.id === desk.id;
                const isSearched =
                  Boolean(searchQuery) &&
                  (desk.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    Boolean(desk.assignedUserName && desk.assignedUserName.toLowerCase().includes(searchQuery.toLowerCase())));

                const isDeptFiltered = selectedDeptFilter === 'all' || desk.department === selectedDeptFilter;
                if (!isDeptFiltered) return null;

                const dX = desk.x * (floorConfig.a / 4);
                const dY = desk.y * (floorConfig.a / 4);

                return (
                  <g key={desk.id} transform={`translate(${dX}, ${dY})`}>
                    <DeskNode
                      desk={{ ...desk, x: 0, y: 0 }}
                      isSelected={isSelected}
                      isHighlighted={isSearched}
                      onClick={() => setSelectedDesk(desk)}
                      gridSize={floorConfig.a / 4}
                    />
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Legend Footer */}
        <div className="p-3 bg-slate-50 dark:bg-dark-sidebar border-t border-light-border dark:border-dark-border flex items-center justify-between text-xs text-light-muted dark:text-dark-muted z-10">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500" />
              Available ({availableCount})
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded bg-brandBlue-500/20 dark:bg-brandPurple-500/20 border border-brandBlue-600 dark:border-brandPurple-500" />
              Occupied ({occupiedCount})
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500" />
              Reserved
            </span>
          </div>
          <span className="font-mono font-semibold">
            {floorPlan.building} • {floorPlan.name} ({worldW}x{worldH} World Units)
          </span>
        </div>
      </div>

      {/* Side Properties Inspector Panel */}
      <PropertiesPanel
        selectedDesk={selectedDesk}
        role={user?.role}
        onClose={() => setSelectedDesk(null)}
        onAssignClick={onAssignClick}
      />
    </div>
  );
};
