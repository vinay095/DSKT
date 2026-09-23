import React, { useState } from 'react';
import { FloorPlan, DeskElement } from '../../types/floorplan';
import { DeskNode } from './DeskNode';
import { useAuth } from '../../context/AuthContext';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Monitor,
  UserCheck,
  Building,
  CheckCircle2,
  Filter,
  Sparkles
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
  const [zoom, setZoom] = useState(1);
  const [selectedDesk, setSelectedDesk] = useState<DeskElement | null>(null);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');

  const gridSize = 48;
  const svgWidth = floorPlan.gridWidth * gridSize;
  const svgHeight = floorPlan.gridHeight * gridSize;

  const availableCount = floorPlan.desks.filter((d) => d.status === 'available').length;
  const occupiedCount = floorPlan.desks.filter((d) => d.status === 'occupied').length;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Main Floor Plan Viewer Canvas */}
      <div className="flex-1 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl flex flex-col overflow-hidden shadow-sm">
        {/* Top Controls Toolbar */}
        <div className="p-3 bg-slate-50 dark:bg-dark-sidebar border-b border-light-border dark:border-dark-border flex flex-wrap items-center justify-between gap-3">
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
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: dept.color }}
                />
                {dept.name}
              </button>
            ))}
          </div>

          {/* Zoom Controls & Legend */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-1">
              <button
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
                className="p-1 hover:bg-slate-100 dark:hover:bg-dark-sidebar rounded text-light-text dark:text-dark-text"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold px-1 text-light-text dark:text-dark-text">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
                className="p-1 hover:bg-slate-100 dark:hover:bg-dark-sidebar rounded text-light-text dark:text-dark-text"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-dark-sidebar rounded text-light-text dark:text-dark-text"
                title="Reset View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Interactive SVG Canvas Area */}
        <div className="flex-1 overflow-auto p-6 canvas-grid flex items-center justify-center min-h-[450px]">
          <div
            className="transition-transform duration-200 origin-center"
            style={{ transform: `scale(${zoom})` }}
          >
            <svg
              width={svgWidth}
              height={svgHeight}
              className="bg-white/80 dark:bg-dark-card/90 border border-light-border dark:border-dark-border rounded-2xl shadow-xl"
            >
              {/* Render Zones */}
              {floorPlan.zones.map((zone) => (
                <g key={zone.id}>
                  <rect
                    x={zone.x * gridSize}
                    y={zone.y * gridSize}
                    width={zone.width * gridSize}
                    height={zone.height * gridSize}
                    rx={12}
                    fill={zone.color}
                    fillOpacity={0.08}
                    stroke={zone.color}
                    strokeOpacity={0.4}
                    strokeDasharray="4 4"
                  />
                  <text
                    x={zone.x * gridSize + 12}
                    y={zone.y * gridSize + 20}
                    className="text-[11px] font-bold fill-light-text dark:fill-dark-text opacity-75 pointer-events-none uppercase tracking-wider"
                  >
                    {zone.name}
                  </text>
                </g>
              ))}

              {/* Render Rooms */}
              {floorPlan.rooms.map((room) => (
                <g key={room.id}>
                  <rect
                    x={room.x * gridSize}
                    y={room.y * gridSize}
                    width={room.width * gridSize}
                    height={room.height * gridSize}
                    rx={10}
                    className="fill-slate-100 dark:fill-dark-sidebar stroke-slate-300 dark:stroke-dark-border stroke-2"
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

              {/* Render Wall Dividers */}
              {floorPlan.walls.map((wall) => (
                <line
                  key={wall.id}
                  x1={wall.x1 * gridSize}
                  y1={wall.y1 * gridSize}
                  x2={wall.x2 * gridSize}
                  y2={wall.y2 * gridSize}
                  className="stroke-slate-400 dark:stroke-slate-600 stroke-[4] stroke-round"
                />
              ))}

              {/* Render Desks */}
              {floorPlan.desks.map((desk) => {
                const isSelected = selectedDesk?.id === desk.id;
                const isSearched =
                  searchQuery.length > 0 &&
                  (desk.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    Boolean(desk.assignedUserName && desk.assignedUserName.toLowerCase().includes(searchQuery.toLowerCase())));

                const isDeptFiltered = selectedDeptFilter === 'all' || desk.department === selectedDeptFilter;

                if (!isDeptFiltered) return null;

                return (
                  <DeskNode
                    key={desk.id}
                    desk={desk}
                    isSelected={isSelected}
                    isHighlighted={isSearched}
                    onClick={() => setSelectedDesk(desk)}
                    gridSize={gridSize}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Legend Footer */}
        <div className="p-3 bg-slate-50 dark:bg-dark-sidebar border-t border-light-border dark:border-dark-border flex items-center justify-between text-xs text-light-muted dark:text-dark-muted">
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
            {floorPlan.building} • {floorPlan.name}
          </span>
        </div>
      </div>

      {/* Side Inspector Details Panel */}
      <div className="w-full lg:w-80 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        {selectedDesk ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-light-border dark:border-dark-border">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
                  Selected Desk
                </span>
                <h3 className="text-xl font-extrabold text-light-text dark:text-dark-text">
                  Desk {selectedDesk.code}
                </h3>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${
                  selectedDesk.status === 'available'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : selectedDesk.status === 'occupied'
                    ? 'bg-brandBlue-50 text-brandBlue-700 border-brandBlue-300 dark:bg-brandPurple-950/40 dark:text-brandPurple-300'
                    : 'bg-amber-50 text-amber-700 border-amber-300'
                }`}
              >
                {selectedDesk.status}
              </span>
            </div>

            {/* Occupant Information */}
            {selectedDesk.assignedUserName ? (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-dark-sidebar border border-light-border dark:border-dark-border space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
                  Current Occupant
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brandBlue-600 dark:bg-brandPurple-600 text-white flex items-center justify-center font-bold text-sm">
                    {selectedDesk.assignedUserName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-light-text dark:text-dark-text">
                      {selectedDesk.assignedUserName}
                    </h4>
                    <p className="text-xs text-light-muted dark:text-dark-muted">
                      {selectedDesk.department || 'Engineering'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Desk is Unassigned
                </p>
                <p className="mt-1 text-[11px] text-emerald-800 dark:text-emerald-400">
                  Ready for employee or team booking.
                </p>
              </div>
            )}

            {/* Desk Features & Hardware */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
                Desk Specifications
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-dark-sidebar border border-light-border dark:border-dark-border flex items-center gap-2 text-light-text dark:text-dark-text">
                  <Monitor className="w-4 h-4 text-brandBlue-500 dark:text-brandPurple-400" />
                  <span>{selectedDesk.hasMonitor ? 'Dual Monitor' : 'Single Monitor'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-dark-sidebar border border-light-border dark:border-dark-border flex items-center gap-2 text-light-text dark:text-dark-text">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{selectedDesk.isStandingDesk ? 'Standing Desk' : 'Standard Desk'}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons based on Role */}
            <div className="pt-3 border-t border-light-border dark:border-dark-border space-y-2">
              {(user?.role === 'hr' || user?.role === 'admin') && (
                <button
                  onClick={() => onAssignClick && onAssignClick(selectedDesk)}
                  className="w-full py-2.5 px-4 rounded-xl bg-brandBlue-600 dark:bg-brandPurple-600 hover:bg-brandBlue-700 dark:hover:bg-brandPurple-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
                >
                  <UserCheck className="w-4 h-4" />
                  {selectedDesk.assignedUserName ? 'Reassign Employee' : 'Assign Employee'}
                </button>
              )}

              <button
                onClick={() => setSelectedDesk(null)}
                className="w-full py-2 px-4 rounded-xl border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-dark-sidebar font-semibold text-xs transition"
              >
                Close Details
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-light-muted dark:text-dark-muted space-y-3">
            <Building className="w-10 h-10 mx-auto opacity-40 text-brandBlue-500 dark:text-brandPurple-400" />
            <h4 className="font-bold text-sm text-light-text dark:text-dark-text">
              Interactive Floor Map
            </h4>
            <p className="text-xs max-w-xs mx-auto">
              Click on any desk node in the map to inspect occupant details, hardware specs, or allocate seating.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
