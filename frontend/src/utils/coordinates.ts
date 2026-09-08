import type { ViewportState } from '@/types/floorPlan';

/** Screen pixels per world unit at 100% zoom. */
export const PIXELS_PER_UNIT = 16;

export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 4;
export const ZOOM_STEP = 0.1;

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Convert screen (stage-container) pixels to logical floor coordinates.
 * Zoom/pan affect only the visual transform — not stored object coords.
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  viewport: ViewportState,
  pixelsPerUnit: number = PIXELS_PER_UNIT,
): Point {
  const scale = viewport.zoom * pixelsPerUnit;
  return {
    x: (screenX - viewport.panX) / scale,
    y: (screenY - viewport.panY) / scale,
  };
}

/** Convert logical floor coordinates to screen pixels. */
export function worldToScreen(
  worldX: number,
  worldY: number,
  viewport: ViewportState,
  pixelsPerUnit: number = PIXELS_PER_UNIT,
): Point {
  const scale = viewport.zoom * pixelsPerUnit;
  return {
    x: worldX * scale + viewport.panX,
    y: worldY * scale + viewport.panY,
  };
}

/** Snap a world-space value to the grid. */
export function snapToGrid(value: number, gridSize: number, enabled = true): number {
  if (!enabled || gridSize <= 0) return value;
  return Math.round(value / gridSize) * gridSize;
}

export function snapPointToGrid(
  point: Point,
  gridSize: number,
  enabled = true,
): Point {
  return {
    x: snapToGrid(point.x, gridSize, enabled),
    y: snapToGrid(point.y, gridSize, enabled),
  };
}

export function clampZoom(zoom: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
}

/** Adaptive major/minor grid step based on zoom (CAD-style). */
export function getAdaptiveGridSteps(
  baseGrid: number,
  zoom: number,
): { minor: number; major: number } {
  const targetPx = 12;
  const worldPerMinor = targetPx / (zoom * PIXELS_PER_UNIT);
  const candidates = [
    baseGrid / 4,
    baseGrid / 2,
    baseGrid,
    baseGrid * 2,
    baseGrid * 5,
    baseGrid * 10,
    baseGrid * 20,
  ];
  let minor = baseGrid;
  for (const c of candidates) {
    if (c >= worldPerMinor) {
      minor = c;
      break;
    }
    minor = c;
  }
  return { minor, major: minor * 5 };
}

export function rotatePoint(
  px: number,
  py: number,
  cx: number,
  cy: number,
  degrees: number,
): Point {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = px - cx;
  const dy = py - cy;
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  };
}

/** Axis-aligned bounding box of a rotated rect (world space). */
export function getRotatedAABB(rect: Rect, rotation: number): Rect {
  if (!rotation) return { ...rect };
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const corners = [
    rotatePoint(rect.x, rect.y, cx, cy, rotation),
    rotatePoint(rect.x + rect.width, rect.y, cx, cy, rotation),
    rotatePoint(rect.x + rect.width, rect.y + rect.height, cx, cy, rotation),
    rotatePoint(rect.x, rect.y + rect.height, cx, cy, rotation),
  ];
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function rectsOverlap(a: Rect, b: Rect, padding = 0): boolean {
  return !(
    a.x + a.width + padding <= b.x ||
    b.x + b.width + padding <= a.x ||
    a.y + a.height + padding <= b.y ||
    b.y + b.height + padding <= a.y
  );
}

export function formatCoord(n: number, digits = 1): string {
  return n.toFixed(digits);
}
