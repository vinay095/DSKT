import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FloorDocumentV2 } from '../../types/floorDocument';
import { DeskElement } from '../../types/floorplan';
import {
  deskStatusToRenderState,
  getCategoryStyle,
  isSvgDataUrl,
  stylizeCatalogSvgMarkup,
  type ElementRenderState,
} from '../../lib/categoryStyles';
import { cn } from '../../lib/cn';
import { Grid3x3, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { clampZoom, wheelZoomFactor, ZOOM_BUTTON_FACTOR, ZOOM_MAX, FIT_PADDING } from '../../geometry/zoom';
import {
  adaptiveLabelFontSize,
  maxLabelChars,
  readableLabelTransform,
  truncateLabel,
} from '../../geometry/labels';
import { getTeamColor } from '../../data/teams';
import { ColorHierarchyLegend } from '../common/ColorHierarchyLegend';
import { deskFromEntity, isAssignable } from '../../lib/publishedFloor';
import type { FloorDocEntity } from '../../types/floorDocument';
import { MapHoverTooltip } from './MapHoverTooltip';
import { FloorObjectRenderer } from './renderers';

const FINEST_PER_A = 16;
const urlCache = new Map<string, string>();

/** Axis-aligned rect intersection in entity (flipped) world space. */
function rectsIntersect(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function normalizeRect(x1: number, y1: number, x2: number, y2: number) {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    w: Math.abs(x2 - x1),
    h: Math.abs(y2 - y1),
  };
}

/** Lightweight selection payload for non-desk floor elements (shown in inspector). */
export interface MapElementSelection {
  objectId: string;
  category: string;
  elementType: string;
  label?: string;
  color?: string;
  widthCells: number;
  heightCells: number;
}

/**
 * Catalog SVGs ship with DeskIt at /public/assets (mirrored from Creator).
 * Same-origin load avoids cross-origin fetch failures that forced procedural shapes.
 */
function catalogAssetUrl(svgFile?: string): string | null {
  if (!svgFile) return null;
  const name = svgFile.replace(/^\/+/, '').replace(/^assets\//, '');
  if (!name) return null;
  return `/assets/${name}`;
}

async function styledHref(
  svgFile: string,
  category?: string,
  elementType?: string,
  color?: string,
  state: ElementRenderState = 'default',
): Promise<string | null> {
  const style = getCategoryStyle(category, elementType, color, state);
  const key = `${svgFile.slice(0, 64)}|${style.fill}|${style.stroke}|${state}`;
  if (urlCache.has(key)) return urlCache.get(key)!;
  try {
    let raw: string;
    if (isSvgDataUrl(svgFile)) {
      raw = decodeURIComponent(svgFile.replace(/^data:image\/svg\+xml;charset=utf-8,/, ''));
    } else if (svgFile.trim().startsWith('<svg') || svgFile.trim().startsWith('<?xml')) {
      raw = svgFile;
    } else {
      const url = catalogAssetUrl(svgFile);
      if (!url) return null;
      const res = await fetch(url);
      if (!res.ok) return null;
      raw = await res.text();
    }
    const styled = stylizeCatalogSvgMarkup(raw, style);
    const objectUrl = URL.createObjectURL(new Blob([styled], { type: 'image/svg+xml;charset=utf-8' }));
    urlCache.set(key, objectUrl);
    return objectUrl;
  } catch {
    return null;
  }
}

const EntityImage: React.FC<{
  svg?: string;
  category: string;
  elementType: string;
  color?: string;
  w: number;
  h: number;
  renderState?: ElementRenderState;
}> = ({ svg, category, elementType, color, w, h, renderState = 'default' }) => {
  const [href, setHref] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    // Prefer catalog SVG when present; procedural silhouettes are fallback only.
    if (!svg) {
      setHref(null);
      return;
    }
    void styledHref(svg, category, elementType, color, renderState).then((u) => {
      if (!cancelled) setHref(u);
    });
    return () => {
      cancelled = true;
    };
  }, [svg, category, elementType, color, renderState]);

  if (href) {
    return <image href={href} x={0} y={0} width={w} height={h} preserveAspectRatio="xMidYMid meet" />;
  }
  return (
    <FloorObjectRenderer
      width={w}
      height={h}
      category={category}
      elementType={elementType}
      color={color}
      renderState={renderState}
    />
  );
};

interface PublishedFloorMapProps {
  document: FloorDocumentV2;
  desks?: DeskElement[];
  showGrid?: boolean;
  onToggleGrid?: () => void;
  onDeskClick?: (desk: DeskElement) => void;
  searchQuery?: string;
  className?: string;
  /** PART 15 — team stripe/outline without replacing element colors */
  showTeamMarkers?: boolean;
  /** Highlight the currently inspected seat (details live in PropertiesPanel). */
  selectedDeskId?: string | null;
  /** Clear selection when clicking empty canvas (optional). */
  onBackgroundClick?: () => void;
  /** Slim chrome — avoid repeating office/floor / “Published floor” when parent already titles the page. */
  compactChrome?: boolean;
  /** Hide footer legend when the parent page already shows ColorHierarchyLegend. */
  hideFooterLegend?: boolean;
  /**
   * When false (default), permanent map labels (text entities, seat codes, names) are hidden.
   * Details appear in the inspector after click.
   */
  showMapLabels?: boolean;
  /** Selected non-desk entity id (for highlight). */
  selectedEntityId?: string | null;
  /** Fired when a non-desk floor element is clicked. */
  onEntityClick?: (entity: MapElementSelection) => void;
  /** Lightweight hover tip on seats (default on when desks are interactive). */
  showHoverTooltip?: boolean;
  /**
   * HR area-select mode: drag a rectangle to select desks; click toggles seats.
   * Pan is disabled while selecting (use zoom / fit controls).
   */
  selectionMode?: boolean;
  /** Multi-select desk ids (area / click-toggle). */
  selectedDeskIds?: readonly string[];
  /** Called when the multi-selection set changes. */
  onSelectedDeskIdsChange?: (ids: string[]) => void;
}

/**
 * HR / published viewer — same FloorDocument + styled SVG pipeline as Creator Preview.
 */
export const PublishedFloorMap: React.FC<PublishedFloorMapProps> = ({
  document: doc,
  desks = [],
  showGrid = true,
  onToggleGrid,
  onDeskClick,
  searchQuery = '',
  className,
  showTeamMarkers = false,
  selectedDeskId = null,
  onBackgroundClick,
  compactChrome = false,
  hideFooterLegend = false,
  showMapLabels = false,
  selectedEntityId = null,
  onEntityClick,
  showHoverTooltip,
  selectionMode = false,
  selectedDeskIds,
  onSelectedDeskIdsChange,
}) => {
  const a = doc.a || 1;
  const f = a / FINEST_PER_A;
  const worldW = doc.floor.cols * a;
  const worldH = doc.floor.rows * a;
  const wrapRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ w: 800, h: 560 });
  const [size, setSize] = useState({ w: 800, h: 560 });
  const [cam, setCam] = useState({ zoom: 1, panX: 0, panY: 0 });
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [hoverTip, setHoverTip] = useState<{
    desk: DeskElement;
    x: number;
    y: number;
  } | null>(null);
  const hoverEnabled = (showHoverTooltip ?? Boolean(onDeskClick)) && !selectionMode;
  const selectedIdSet = useMemo(
    () => new Set(selectedDeskIds ?? []),
    [selectedDeskIds],
  );
  const marqueeRef = useRef<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [marqueeBox, setMarqueeBox] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const didMarqueeRef = useRef(false);
  const suppressClickRef = useRef(false);

  const deskById = useMemo(() => {
    const m = new Map<string, DeskElement>();
    for (const d of desks) {
      m.set(d.id, d);
      if (d.geometry?.objectId) m.set(d.geometry.objectId, d);
    }
    return m;
  }, [desks]);

  const resolveDesk = (e: FloorDocEntity): DeskElement | undefined => {
    const existing = deskById.get(e.objectId);
    if (existing) return existing;
    if (!isAssignable(e)) return undefined;
    return deskFromEntity(e);
  };

  const handleEntityActivate = (e: FloorDocEntity, ev: React.MouseEvent) => {
    ev.stopPropagation();
    setHoverTip(null);
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    const desk = resolveDesk(e);
    if (selectionMode && desk && onSelectedDeskIdsChange) {
      // Click-toggle individual seats into the multi-selection.
      const next = new Set(selectedIdSet);
      if (next.has(desk.id)) next.delete(desk.id);
      else next.add(desk.id);
      onSelectedDeskIdsChange([...next]);
      return;
    }
    if (desk && onDeskClick) {
      onDeskClick(desk);
      return;
    }
    onEntityClick?.({
      objectId: e.objectId,
      category: e.category,
      elementType: e.elementType,
      label: e.label,
      color: e.color,
      widthCells: e.widthCells,
      heightCells: e.heightCells,
    });
  };

  const screenToEntity = (sx: number, sy: number) => {
    const camX = (sx - cam.panX) / cam.zoom;
    const camY = (sy - cam.panY) / cam.zoom;
    return { x: camX, y: worldH - camY };
  };

  const desksInScreenRect = (sx1: number, sy1: number, sx2: number, sy2: number) => {
    const a1 = screenToEntity(sx1, sy1);
    const a2 = screenToEntity(sx2, sy2);
    const sel = normalizeRect(a1.x, a1.y, a2.x, a2.y);
    if (sel.w < 2 && sel.h < 2) return [] as DeskElement[];
    const found: DeskElement[] = [];
    const seen = new Set<string>();
    for (const e of doc.entities) {
      const desk = resolveDesk(e);
      if (!desk || seen.has(desk.id)) continue;
      const x = e.origin.col * f;
      const y = e.origin.row * f;
      const w = Math.max(e.widthCells * f, f);
      const h = Math.max(e.heightCells * f, f);
      if (rectsIntersect(sel.x, sel.y, sel.w, sel.h, x, y, w, h)) {
        seen.add(desk.id);
        found.push(desk);
      }
    }
    return found;
  };

  // Esc clears multi-selection while in area-select mode.
  useEffect(() => {
    if (!selectionMode || !onSelectedDeskIdsChange) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        onSelectedDeskIdsChange([]);
        marqueeRef.current = null;
        setMarqueeBox(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectionMode, onSelectedDeskIdsChange]);

  const handleDeskHover = (e: FloorDocEntity, ev: React.MouseEvent) => {
    if (!hoverEnabled || dragRef.current) {
      setHoverTip(null);
      return;
    }
    const desk = resolveDesk(e);
    if (!desk) {
      setHoverTip(null);
      return;
    }
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHoverTip({
      desk,
      x: ev.clientX - rect.left,
      y: ev.clientY - rect.top,
    });
  };

  const clearHover = () => setHoverTip(null);

  const deskHoverHandlers = (e: FloorDocEntity) =>
    hoverEnabled
      ? {
          onMouseEnter: (ev: React.MouseEvent) => handleDeskHover(e, ev),
          onMouseMove: (ev: React.MouseEvent) => handleDeskHover(e, ev),
          onMouseLeave: clearHover,
        }
      : {};

  const fitZoomRef = useRef(1);

  const fitToSize = (w: number, h: number) => {
    if (w < 10 || h < 10 || worldW <= 0 || worldH <= 0) return;
    const pad = FIT_PADDING;
    // Same rule as Creator planner/preview: fit zoom is the minimum (cannot zoom out past floor).
    const raw = Math.min((w - pad * 2) / worldW, (h - pad * 2) / worldH);
    const zoom = clampZoom(raw, 0.01, ZOOM_MAX);
    fitZoomRef.current = zoom;
    setCam({
      zoom,
      panX: (w - worldW * zoom) / 2,
      panY: (h - worldH * zoom) / 2,
    });
  };

  const fit = () => fitToSize(sizeRef.current.w, sizeRef.current.h);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width: w, height: h } = entries[0].contentRect;
      sizeRef.current = { w, h };
      setSize({ w, h });
      fitToSize(w, h);
    });
    ro.observe(el);
    const w = el.clientWidth;
    const h = el.clientHeight || 560;
    sizeRef.current = { w, h };
    setSize({ w, h });
    fitToSize(w, h);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldW, worldH]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = wheelZoomFactor(e.deltaY);
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const minZ = fitZoomRef.current;
      setCam((c) => {
        const worldX = (mx - c.panX) / c.zoom;
        const worldY = (my - c.panY) / c.zoom;
        const zoom = clampZoom(c.zoom * factor, minZ, ZOOM_MAX);
        return { zoom, panX: mx - worldX * zoom, panY: my - worldY * zoom };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const zoomAtCenter = (factor: number) => {
    const mx = size.w / 2;
    const my = size.h / 2;
    const minZ = fitZoomRef.current;
    setCam((c) => {
      const worldX = (mx - c.panX) / c.zoom;
      const worldY = (my - c.panY) / c.zoom;
      const zoom = clampZoom(c.zoom * factor, minZ, ZOOM_MAX);
      return { zoom, panX: mx - worldX * zoom, panY: my - worldY * zoom };
    });
  };

  return (
    <div
      className={cn(
        'flex flex-col bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl overflow-hidden shadow-sm min-h-0 h-full',
        className,
      )}
    >
      <div className="p-3 bg-slate-50 dark:bg-dark-sidebar border-b border-light-border dark:border-dark-border flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-light-text dark:text-dark-text">
            {compactChrome ? 'Floor map' : doc.name || 'Floor map'}
          </h3>
          <p className="text-[10px] text-light-muted dark:text-dark-muted">
            {Math.round(cam.zoom * 100)}% · scroll to zoom
            {selectionMode
              ? ' · drag rectangle to select · click seat to toggle'
              : ' · drag to pan'}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-1">
          {onToggleGrid && (
            <button
              type="button"
              onClick={onToggleGrid}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition',
                showGrid
                  ? 'bg-brandBlue-600 dark:bg-brandPurple-600 text-white'
                  : 'text-light-text dark:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-sidebar',
              )}
            >
              <Grid3x3 className="w-3.5 h-3.5" />
              {showGrid ? 'Grid On' : 'Grid Off'}
            </button>
          )}
          <button
            type="button"
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-dark-sidebar"
            onClick={() => zoomAtCenter(1 / ZOOM_BUTTON_FACTOR)}
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold px-1.5 text-light-text dark:text-dark-text min-w-[44px] text-center">
            {Math.round(cam.zoom * 100)}%
          </span>
          <button
            type="button"
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-dark-sidebar"
            onClick={() => zoomAtCenter(ZOOM_BUTTON_FACTOR)}
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-dark-sidebar"
            onClick={fit}
            title="Fit to view"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        ref={wrapRef}
        className={
          selectionMode
            ? 'flex-1 relative overflow-hidden cursor-crosshair bg-slate-100 dark:bg-dark-bg min-h-0'
            : 'flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing bg-slate-100 dark:bg-dark-bg min-h-0'
        }
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          clearHover();
          const rect = wrapRef.current?.getBoundingClientRect();
          if (!rect) return;
          const sx = e.clientX - rect.left;
          const sy = e.clientY - rect.top;

          if (selectionMode) {
            didMarqueeRef.current = false;
            marqueeRef.current = { startX: sx, startY: sy, currentX: sx, currentY: sy };
            setMarqueeBox({ x: sx, y: sy, w: 0, h: 0 });
            // Background click alone (no drag) clears inspector; selection cleared only on Esc / Clear.
            const t = e.target as Element;
            if (t === e.currentTarget || t.tagName === 'svg' || t.tagName === 'rect') {
              // defer clear of inspector until mouseup if no marquee
            }
            return;
          }

          if (e.target === e.currentTarget || (e.target as Element).tagName === 'svg') {
            onBackgroundClick?.();
          }
          dragRef.current = { x: e.clientX, y: e.clientY, panX: cam.panX, panY: cam.panY };
        }}
        onMouseMove={(e) => {
          if (selectionMode && marqueeRef.current) {
            const rect = wrapRef.current?.getBoundingClientRect();
            if (!rect) return;
            const sx = e.clientX - rect.left;
            const sy = e.clientY - rect.top;
            const m = marqueeRef.current;
            m.currentX = sx;
            m.currentY = sy;
            const box = normalizeRect(m.startX, m.startY, sx, sy);
            if (box.w > 3 || box.h > 3) didMarqueeRef.current = true;
            setMarqueeBox(box);
            return;
          }
          const d = dragRef.current;
          if (!d) return;
          setCam((c) => ({ ...c, panX: d.panX + (e.clientX - d.x), panY: d.panY + (e.clientY - d.y) }));
        }}
        onMouseUp={(e) => {
          if (selectionMode && marqueeRef.current && onSelectedDeskIdsChange) {
            const m = marqueeRef.current;
            const additive = e.shiftKey;
            if (didMarqueeRef.current) {
              suppressClickRef.current = true;
              const hit = desksInScreenRect(m.startX, m.startY, m.currentX, m.currentY);
              const next = additive ? new Set(selectedIdSet) : new Set<string>();
              for (const d of hit) next.add(d.id);
              onSelectedDeskIdsChange([...next]);
            } else {
              // Click on empty canvas in select mode — clear inspector only.
              const t = e.target as Element;
              if (t === e.currentTarget || t.tagName === 'svg') {
                onBackgroundClick?.();
              }
            }
            marqueeRef.current = null;
            setMarqueeBox(null);
            didMarqueeRef.current = false;
            return;
          }
          dragRef.current = null;
        }}
        onMouseLeave={() => {
          if (selectionMode) {
            marqueeRef.current = null;
            setMarqueeBox(null);
            didMarqueeRef.current = false;
          }
          dragRef.current = null;
          clearHover();
        }}
      >
        {hoverTip && <MapHoverTooltip desk={hoverTip.desk} x={hoverTip.x} y={hoverTip.y} />}
        {marqueeBox && marqueeBox.w + marqueeBox.h > 0 && (
          <div
            className="pointer-events-none absolute z-20 border-2 border-dashed border-brandBlue-500 dark:border-brandPurple-400 bg-brandBlue-500/15 dark:bg-brandPurple-500/20 rounded-sm"
            style={{
              left: marqueeBox.x,
              top: marqueeBox.y,
              width: marqueeBox.w,
              height: marqueeBox.h,
            }}
          />
        )}
        <svg width={size.w} height={size.h} className="w-full h-full select-none">
          <defs>
            <filter id="deskit-pop-shadow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0F172A" floodOpacity="0.35" />
            </filter>
          </defs>
          <g transform={`translate(${cam.panX}, ${cam.panY}) scale(${cam.zoom})`}>
            <rect
              x={0}
              y={0}
              width={worldW}
              height={worldH}
              className="fill-white dark:fill-dark-sidebar stroke-brandBlue-600 dark:stroke-brandPurple-500"
              strokeWidth={a * 0.04}
              onClick={() => onBackgroundClick?.()}
            />

            {showGrid &&
              Array.from({ length: Math.floor(doc.floor.cols) + 1 }).map((_, i) => (
                <line
                  key={`gv-${i}`}
                  x1={i * a}
                  y1={0}
                  x2={i * a}
                  y2={worldH}
                  className="stroke-brandBlue-300/50 dark:stroke-brandPurple-700/40"
                  strokeWidth={i % 4 === 0 ? a * 0.03 : a * 0.015}
                />
              ))}
            {showGrid &&
              Array.from({ length: Math.floor(doc.floor.rows) + 1 }).map((_, i) => (
                <line
                  key={`gh-${i}`}
                  x1={0}
                  y1={i * a}
                  x2={worldW}
                  y2={i * a}
                  className="stroke-brandBlue-300/50 dark:stroke-brandPurple-700/40"
                  strokeWidth={i % 4 === 0 ? a * 0.03 : a * 0.015}
                />
              ))}

            <g transform={`translate(0, ${worldH}) scale(1, -1)`}>
              {(doc.unusableRegions || []).map((r) => {
                if (r.outline && r.outline.length >= 3) {
                  const pts = r.outline
                    .map(
                      (v) =>
                        `${(r.origin.col + v.col) * f},${(r.origin.row + v.row) * f}`,
                    )
                    .join(' ');
                  return (
                    <polygon
                      key={r.id}
                      points={pts}
                      fill="rgba(100,116,139,0.28)"
                    />
                  );
                }
                return (
                  <rect
                    key={r.id}
                    x={r.origin.col * f}
                    y={r.origin.row * f}
                    width={r.widthCells * f}
                    height={r.heightCells * f}
                    fill="rgba(100,116,139,0.28)"
                  />
                );
              })}

              {doc.zones.map((z) => {
                if (z.outline && z.outline.length >= 3) {
                  const pts = z.outline
                    .map(
                      (v) =>
                        `${(z.origin.col + v.col) * f},${(z.origin.row + v.row) * f}`,
                    )
                    .join(' ');
                  return (
                    <polygon
                      key={z.id}
                      points={pts}
                      fill={z.color}
                      fillOpacity={0.2}
                    />
                  );
                }
                return (
                  <rect
                    key={z.id}
                    x={z.origin.col * f}
                    y={z.origin.row * f}
                    width={z.widthCells * f}
                    height={z.heightCells * f}
                    fill={z.color}
                    fillOpacity={0.2}
                  />
                );
              })}

              {doc.entities.map((e) => {
                const x = e.origin.col * f;
                const y = e.origin.row * f;
                const w = Math.max(e.widthCells * f, f);
                const h = Math.max(e.heightCells * f, f);
                const rot = e.rotation ?? 0;
                const cx = x + w / 2;
                const cy = y + h / 2;
                const desk = resolveDesk(e);
                const renderState = deskStatusToRenderState(desk?.status);
                const style = getCategoryStyle(e.category, e.elementType, e.color, renderState);
                const highlighted =
                  Boolean(searchQuery) &&
                  ((desk?.code || e.label || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    Boolean(desk?.assignedUserName?.toLowerCase().includes(searchQuery.toLowerCase())));
                const isMultiSelected = Boolean(desk && selectedIdSet.has(desk.id));
                const isSelected =
                  selectedDeskId === desk?.id ||
                  selectedDeskId === e.objectId ||
                  selectedEntityId === e.objectId ||
                  isMultiSelected;
                const popScale = isSelected ? 1.14 : highlighted ? 1.06 : 1;
                const popFilter = isSelected ? 'url(#deskit-pop-shadow)' : undefined;

                if (e.category === 'text') {
                  const hitW = Math.max(w, f * 8);
                  const hitH = Math.max(h, f * 4);
                  return (
                    <g
                      key={e.objectId}
                      transform={`${readableLabelTransform(cx, cy, rot)} scale(${popScale})`}
                      className={onEntityClick || onDeskClick ? 'cursor-pointer' : undefined}
                      onClick={(ev) => handleEntityActivate(e, ev)}
                      style={{ filter: popFilter, transition: 'transform 0.15s ease' }}
                    >
                      <rect
                        x={-hitW / 2}
                        y={-hitH / 2}
                        width={hitW}
                        height={hitH}
                        fill={isSelected ? 'rgba(15,23,42,0.06)' : 'transparent'}
                        stroke="rgba(15,23,42,0.12)"
                        strokeWidth={0.8}
                        strokeDasharray={isSelected ? undefined : '3 2'}
                        rx={2}
                      />
                      {showMapLabels && (
                        <text
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={Math.min(
                            Math.max((e.fontSize ?? 0.35) * a, f * 3),
                            Math.min(hitW, hitH) * 0.45,
                          )}
                          fill={e.color ?? style.fill}
                        >
                          {truncateLabel(
                            e.label || 'Text',
                            maxLabelChars(hitW, Math.min(hitW, hitH) * 0.4),
                          )}
                        </text>
                      )}
                      {!showMapLabels && (
                        <text
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={Math.min(10, f * 5)}
                          fill="#64748B"
                          opacity={0.7}
                        >
                          Aa
                        </text>
                      )}
                    </g>
                  );
                }

                let customPathD = e.svgPath ?? '';
                if (!customPathD && e.outline && e.outline.length >= 2) {
                  const [first, ...rest] = e.outline;
                  customPathD = `M${first.col},${first.row}`;
                  for (const v of rest) customPathD += ` L${v.col},${v.row}`;
                  customPathD += ' Z';
                }
                if (customPathD) {
                  const fontSize = adaptiveLabelFontSize(w, h, { ratio: 0.18, min: f * 4, max: a * 0.35 });
                  const label = showMapLabels
                    ? truncateLabel(
                        desk?.code || (desk ? '' : e.label) || '',
                        maxLabelChars(w, fontSize),
                      )
                    : '';
                  const pathCx = e.widthCells / 2;
                  const pathCy = e.heightCells / 2;
                  return (
                    <g key={e.objectId}>
                      <g
                        transform={`translate(${x}, ${y}) scale(${f})`}
                        className={
                          onDeskClick || onEntityClick ? 'cursor-pointer' : undefined
                        }
                        onClick={(ev) => handleEntityActivate(e, ev)}
                        style={{ filter: popFilter }}
                        {...deskHoverHandlers(e)}
                      >
                        <g
                          transform={`translate(${pathCx}, ${pathCy}) scale(${popScale}) translate(${-pathCx}, ${-pathCy})`}
                        >
                          <path
                            d={customPathD}
                            fill={style.fill}
                            fillOpacity={isSelected ? Math.min(style.fillOpacity + 0.2, 0.95) : style.fillOpacity}
                            stroke={style.stroke}
                            strokeWidth={isSelected ? 0.18 : 0.12}
                          />
                          {showTeamMarkers && desk?.team && (
                            <rect
                              x={0}
                              y={0}
                              width={Math.max(e.widthCells * 0.12, 0.15)}
                              height={e.heightCells}
                              rx={0.05}
                              fill={getTeamColor(desk.team)}
                              pointerEvents="none"
                            />
                          )}
                          {isMultiSelected && (
                            <rect
                              x={-0.08}
                              y={-0.08}
                              width={e.widthCells + 0.16}
                              height={e.heightCells + 0.16}
                              rx={0.08}
                              fill="none"
                              stroke="#2563EB"
                              strokeWidth={0.14}
                              strokeDasharray="0.25 0.15"
                              pointerEvents="none"
                            />
                          )}
                        </g>
                      </g>
                      {label && (
                        <g transform={readableLabelTransform(cx, cy, rot)}>
                          <text
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={fontSize}
                            fill="#0F172A"
                            className="dark:fill-white"
                          >
                            {label}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                }

                const nameFont = adaptiveLabelFontSize(w, h, { ratio: 0.14, min: 7, max: 12 });
                const seatCode =
                  showMapLabels && desk?.code
                    ? truncateLabel(desk.code, maxLabelChars(w, nameFont))
                    : '';

                return (
                  <g key={e.objectId}>
                    <g
                      transform={`translate(${cx}, ${cy}) scale(1, -1) rotate(${rot}) scale(${popScale}) translate(${-w / 2}, ${-h / 2})`}
                      className={
                        onDeskClick || onEntityClick ? 'cursor-pointer' : undefined
                      }
                      onClick={(ev) => handleEntityActivate(e, ev)}
                      style={{ filter: popFilter }}
                      {...deskHoverHandlers(e)}
                    >
                      {e.svg ? (
                        <EntityImage
                          svg={e.svg}
                          category={e.category}
                          elementType={e.elementType}
                          color={e.color}
                          w={w}
                          h={h}
                          renderState={isSelected ? 'selected' : renderState}
                        />
                      ) : (
                        <rect
                          x={0}
                          y={0}
                          width={w}
                          height={h}
                          rx={f * 0.5}
                          fill={style.fill}
                          fillOpacity={
                            isSelected
                              ? Math.min(style.fillOpacity + 0.2, 0.95)
                              : style.fillOpacity
                          }
                          stroke={style.stroke}
                          strokeWidth={isSelected ? f * 0.55 : f * 0.4}
                        />
                      )}
                      {showTeamMarkers && desk?.team && (
                        <rect
                          x={0}
                          y={0}
                          width={Math.max(w * 0.12, f * 0.8)}
                          height={h}
                          rx={2}
                          fill={getTeamColor(desk.team)}
                          pointerEvents="none"
                        />
                      )}
                      {isMultiSelected && (
                        <rect
                          x={-f * 0.35}
                          y={-f * 0.35}
                          width={w + f * 0.7}
                          height={h + f * 0.7}
                          rx={f * 0.6}
                          fill="none"
                          stroke="#2563EB"
                          strokeWidth={f * 0.35}
                          strokeDasharray={`${f * 0.7} ${f * 0.4}`}
                          pointerEvents="none"
                        />
                      )}
                    </g>
                    {seatCode && (
                      <g transform={readableLabelTransform(cx, cy + h * 0.55 + 2, rot)}>
                        <text
                          textAnchor="middle"
                          dominantBaseline="hanging"
                          fontSize={nameFont}
                          fill="#0F172A"
                          className="dark:fill-white"
                          opacity={0.75}
                        >
                          {seatCode}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </g>
        </svg>
      </div>
      {!hideFooterLegend && (showTeamMarkers || onToggleGrid) && (
        <div className="px-3 py-2 border-t border-light-border dark:border-dark-border bg-slate-50 dark:bg-dark-sidebar">
          <ColorHierarchyLegend compact />
        </div>
      )}
    </div>
  );
};
