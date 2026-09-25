import React, { useRef, useEffect, useMemo, useState } from 'react';
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
import { DEPARTMENTS } from '../../data/mockData';
import { TEAMS, getTeamColor, defaultTeamForDepartment } from '../../data/teams';
import { ColorHierarchyLegend } from '../common/ColorHierarchyLegend';
import { cn } from '../../lib/cn';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Filter,
  Grid3x3,
  Palette,
  Users,
} from 'lucide-react';

export type MapperColorMode = 'status' | 'team';

interface FloorPlanViewerProps {
  floorPlan: FloorPlan;
  searchQuery?: string;
  onAssignClick?: (desk: DeskElement) => void;
  /** Enable HR-oriented controls (grid toggle, team colors, click-to-assign). */
  hrMode?: boolean;
}

export const FloorPlanViewer: React.FC<FloorPlanViewerProps> = ({
  floorPlan,
  searchQuery = '',
  onAssignClick,
  hrMode = false,
}) => {
  const { user } = useAuth();
  const isHr = hrMode || user?.role === 'hr';
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  /** SVG drawing pane only — fit/zoom must measure this, not the outer card. */
  const svgPaneRef = useRef<HTMLDivElement | null>(null);

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
    initialViewport: { panX: 40, panY: 40, zoom: 1 },
    floorConfig,
  });

  const [selectedDesk, setSelectedDesk] = useState<DeskElement | null>(null);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [showGrid, setShowGrid] = useState(true);
  const [colorMode, setColorMode] = useState<MapperColorMode>(isHr ? 'team' : 'status');

  const fitSvgPane = () => {
    const el = svgPaneRef.current;
    if (!el) return;
    fitToFloor(el.clientWidth, el.clientHeight || 500);
  };

  useEffect(() => {
    const el = svgPaneRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width < 10 || height < 10) return;
      fitToFloor(width, height);
    });
    ro.observe(el);
    fitSvgPane();
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitToFloor, floorConfig.cols, floorConfig.rows, floorConfig.a]);

  const availableCount = floorPlan.desks.filter((d) => d.status === 'available').length;
  const occupiedCount = floorPlan.desks.filter((d) => d.status === 'occupied').length;

  const teamsOnFloor = useMemo(() => {
    const names = new Set(
      floorPlan.desks.map((d) => d.team).filter((t): t is string => Boolean(t))
    );
    // Always include known teams for filtering even if not yet assigned
    return TEAMS.filter((t) => names.has(t.name) || names.size === 0).slice(
      0,
      names.size === 0 ? 8 : TEAMS.length
    );
  }, [floorPlan.desks]);

  const visibleTeams =
    selectedDeptFilter === 'all'
      ? teamsOnFloor
      : TEAMS.filter((t) => t.departmentName === selectedDeptFilter);

  const resolveDeskTeam = (desk: DeskElement) =>
    desk.team || defaultTeamForDepartment(desk.department)?.name;

  const handleDeskClick = (desk: DeskElement) => {
    setSelectedDesk(desk);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      <div
        ref={containerRef}
        className="flex-1 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl flex flex-col overflow-hidden shadow-sm min-h-[min(60vh,560px)] h-full"
      >
        {/* Toolbar */}
        <div className="p-3 bg-slate-50 dark:bg-dark-sidebar border-b border-light-border dark:border-dark-border flex flex-col gap-2.5 z-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Department / Team filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
              <span className="text-xs font-bold text-light-muted dark:text-dark-muted flex items-center gap-1 mr-1 shrink-0">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedDeptFilter('all');
                  setSelectedTeamFilter('all');
                }}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold transition shrink-0',
                  selectedDeptFilter === 'all' && selectedTeamFilter === 'all'
                    ? 'bg-brandBlue-600 dark:bg-brandPurple-600 text-white'
                    : 'bg-white dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border hover:bg-slate-100'
                )}
              >
                All Desks ({floorPlan.desks.length})
              </button>
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => {
                    setSelectedDeptFilter(dept.name);
                    setSelectedTeamFilter('all');
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0',
                    selectedDeptFilter === dept.name && selectedTeamFilter === 'all'
                      ? 'bg-brandBlue-600 dark:bg-brandPurple-600 text-white'
                      : 'bg-white dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border hover:bg-slate-100'
                  )}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dept.color }} />
                  {dept.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Grid / team view toggles */}
              <div className="flex items-center gap-1 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setShowGrid((v) => !v)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition',
                    showGrid
                      ? 'bg-brandBlue-600 dark:bg-brandPurple-600 text-white'
                      : 'text-light-text dark:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-sidebar'
                  )}
                  title={showGrid ? 'Hide grid layout' : 'Show grid layout'}
                >
                  <Grid3x3 className="w-3.5 h-3.5" />
                  {showGrid ? 'Grid On' : 'Grid Off'}
                </button>
                <button
                  type="button"
                  onClick={() => setColorMode((m) => (m === 'team' ? 'status' : 'team'))}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition',
                    colorMode === 'team'
                      ? 'bg-brandBlue-600 dark:bg-brandPurple-600 text-white'
                      : 'text-light-text dark:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-sidebar'
                  )}
                  title="Color desks by team"
                >
                  <Palette className="w-3.5 h-3.5" />
                  {colorMode === 'team' ? 'Team markers' : 'By Status'}
                </button>
              </div>

              <div className="flex items-center gap-1 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => {
                    const el = svgPaneRef.current;
                    if (!el) return;
                    zoomOut(el.clientWidth / 2, el.clientHeight / 2);
                  }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-dark-sidebar rounded text-light-text dark:text-dark-text"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold px-1.5 text-light-text dark:text-dark-text min-w-[44px] text-center">
                  {Math.round(viewport.zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const el = svgPaneRef.current;
                    if (!el) return;
                    zoomIn(el.clientWidth / 2, el.clientHeight / 2);
                  }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-dark-sidebar rounded text-light-text dark:text-dark-text"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={fitSvgPane}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-dark-sidebar rounded text-light-text dark:text-dark-text"
                  title="Fit to Floor Boundary"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={resetView} className="p-1 hover:bg-slate-100 dark:hover:bg-dark-sidebar rounded text-light-text dark:text-dark-text" title="Reset View">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Team filter row (HR / team color mode) */}
          {(isHr || colorMode === 'team') && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted flex items-center gap-1 shrink-0">
                <Users className="w-3 h-3" /> Teams:
              </span>
              <button
                type="button"
                onClick={() => setSelectedTeamFilter('all')}
                className={cn(
                  'px-2 py-0.5 rounded-md text-[10px] font-semibold transition shrink-0',
                  selectedTeamFilter === 'all'
                    ? 'bg-slate-800 text-white dark:bg-brandPurple-700'
                    : 'bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted'
                )}
              >
                All teams
              </button>
              {visibleTeams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => setSelectedTeamFilter(team.name)}
                  className={cn(
                    'px-2 py-0.5 rounded-md text-[10px] font-semibold transition flex items-center gap-1.5 shrink-0 border',
                    selectedTeamFilter === team.name
                      ? 'text-white border-transparent'
                      : 'bg-white dark:bg-dark-card border-light-border dark:border-dark-border text-light-text dark:text-dark-text'
                  )}
                  style={
                    selectedTeamFilter === team.name
                      ? { backgroundColor: team.color }
                      : undefined
                  }
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
                  {team.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SVG viewport — measure this pane for fit, not the outer card */}
        <div
          ref={svgPaneRef}
          className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing min-h-[min(60vh,560px)]"
        >
          <svg
            ref={svgRef}
            className="w-full h-full select-none"
            onWheel={(e) => handleWheelZoom(e, svgRef.current)}
            onMouseDown={(e) => startPan(e, svgRef.current)}
            onMouseMove={(e) => updatePan(e, svgRef.current)}
            onMouseUp={endPan}
            onMouseLeave={endPan}
          >
            <g transform={getSvgTransformMatrix(viewport)}>
              <FloorBoundary floorConfig={floorConfig} />
              <Grid floorConfig={floorConfig} zoom={viewport.zoom} showGrid={showGrid} />
              <ZonesLayer zones={floorPlan.zones} floorConfig={floorConfig} />
              <UnusableLayer unusableRegions={floorPlan.unusableRegions || []} floorConfig={floorConfig} />

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

              {floorPlan.desks.map((desk) => {
                const isSelected = selectedDesk?.id === desk.id;
                const isSearched =
                  Boolean(searchQuery) &&
                  (desk.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    Boolean(
                      desk.assignedUserName &&
                        desk.assignedUserName.toLowerCase().includes(searchQuery.toLowerCase())
                    ) ||
                    Boolean(desk.team && desk.team.toLowerCase().includes(searchQuery.toLowerCase())));

                const deskTeam = resolveDeskTeam(desk);
                const isDeptFiltered =
                  selectedDeptFilter === 'all' || desk.department === selectedDeptFilter;
                const isTeamFiltered =
                  selectedTeamFilter === 'all' || deskTeam === selectedTeamFilter;
                if (!isDeptFiltered || !isTeamFiltered) return null;

                const dX = desk.x * (floorConfig.a / 4);
                const dY = desk.y * (floorConfig.a / 4);
                const teamColor = getTeamColor(deskTeam);

                return (
                  <g key={desk.id} transform={`translate(${dX}, ${dY})`}>
                    <DeskNode
                      desk={{ ...desk, team: deskTeam, x: 0, y: 0 }}
                      isSelected={isSelected}
                      isHighlighted={isSearched}
                      onClick={() => handleDeskClick(desk)}
                      gridSize={floorConfig.a / 4}
                      showTeamIndicators={colorMode === 'team'}
                      teamColor={teamColor}
                    />
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Legend */}
        <div className="p-3 bg-slate-50 dark:bg-dark-sidebar border-t border-light-border dark:border-dark-border flex flex-col gap-2 text-xs text-light-muted dark:text-dark-muted z-10">
          <ColorHierarchyLegend compact />
          <div className="flex flex-wrap items-center justify-between gap-3">
          {colorMode === 'team' ? (
            <div className="flex items-center gap-3 flex-wrap">
              {visibleTeams.slice(0, 6).map((t) => (
                <span key={t.id} className="flex items-center gap-1.5 font-medium">
                  <span className="w-3 h-3 rounded-full ring-2 ring-offset-1" style={{ backgroundColor: t.color }} />
                  {t.name}
                </span>
              ))}
              {visibleTeams.length > 6 && (
                <span className="font-medium opacity-70">+{visibleTeams.length - 6} more</span>
              )}
            </div>
          ) : (
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
          )}
          <span className="font-mono font-semibold">
            {Math.round(viewport.zoom * 100)}%
            {!showGrid && ' · No grid'}
            {' · '}
            {worldW}×{worldH}
          </span>
          </div>
        </div>
      </div>

      <PropertiesPanel
        selectedDesk={selectedDesk}
        role={user?.role}
        onClose={() => setSelectedDesk(null)}
        onAssignClick={onAssignClick}
        floorContext={{
          building: floorPlan.building,
          floorName: floorPlan.name,
        }}
      />
    </div>
  );
};
