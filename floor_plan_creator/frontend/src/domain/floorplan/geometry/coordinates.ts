import type { Point } from '../models/geometry'

export interface Viewport {
  scale: number
  offsetX: number
  offsetY: number
}

/** Convert world meters/feet to grid cell indices. */
export function worldToGrid(
  worldX: number,
  worldY: number,
  precision: number,
): { col: number; row: number } {
  return {
    col: Math.floor(worldX / precision),
    row: Math.floor(worldY / precision),
  }
}

/** Convert grid cell indices to world coordinates (cell origin). */
export function gridToWorld(
  col: number,
  row: number,
  precision: number,
): Point {
  return {
    x: col * precision,
    y: row * precision,
  }
}

/** Convert world coordinates to screen pixels. */
export function worldToScreen(
  worldX: number,
  worldY: number,
  viewport: Viewport,
  pixelsPerUnit: number,
): Point {
  return {
    x: worldX * pixelsPerUnit * viewport.scale + viewport.offsetX,
    y: worldY * pixelsPerUnit * viewport.scale + viewport.offsetY,
  }
}

/** Convert screen pixels to world coordinates. */
export function screenToWorld(
  screenX: number,
  screenY: number,
  viewport: Viewport,
  pixelsPerUnit: number,
): Point {
  return {
    x: (screenX - viewport.offsetX) / (pixelsPerUnit * viewport.scale),
    y: (screenY - viewport.offsetY) / (pixelsPerUnit * viewport.scale),
  }
}

export function screenToGrid(
  screenX: number,
  screenY: number,
  viewport: Viewport,
  pixelsPerUnit: number,
  precision: number,
): { col: number; row: number } {
  const world = screenToWorld(screenX, screenY, viewport, pixelsPerUnit)
  return worldToGrid(world.x, world.y, precision)
}

export function gridToScreen(
  col: number,
  row: number,
  viewport: Viewport,
  pixelsPerUnit: number,
  precision: number,
): Point {
  const world = gridToWorld(col, row, precision)
  return worldToScreen(world.x, world.y, viewport, pixelsPerUnit)
}

export function snapToGrid(value: number, precision: number): number {
  if (precision <= 0) return value
  return Math.round(value / precision) * precision
}

export function snapPointToGrid(point: Point, precision: number): Point {
  return {
    x: snapToGrid(point.x, precision),
    y: snapToGrid(point.y, precision),
  }
}

/** Pixels per world unit at 100% zoom for a given cellSize and precision. */
export function pixelsPerWorldUnit(cellSize: number, precision: number): number {
  return cellSize / precision
}
