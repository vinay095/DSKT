import type { CellRef, FloorConfig, Point, Rect } from '../types/geometry';
import { floorWorldHeight, floorWorldWidth } from '../types/geometry';
import type { Viewport } from '../types/viewport';
import { screenToWorld } from './coordinates';

/** Named levels: -1=2a, 0=a, 1=a/4, 2=a/16. */
export type NamedGridLevel = -1 | 0 | 1 | 2;

export const NAMED_LEVELS: NamedGridLevel[] = [-1, 0, 1, 2];

/** Finest cells per unit `a` (level 2 = a/16). */
export const FINEST_PER_A = 16;

/** Placement cells (a/4) per unit `a`. */
export const PLACE_PER_A = 4;

/** Finest cells per placement cell. */
export const FINEST_PER_PLACE = FINEST_PER_A / PLACE_PER_A; // 4

const MIN_CELL_PX = 24;

export function levelCellSize(level: NamedGridLevel, a: number): number {
  switch (level) {
    case -1:
      return 2 * a;
    case 0:
      return a;
    case 1:
      return a / 4;
    case 2:
      return a / 16;
  }
}

export function getFinestCellSize(floor: FloorConfig): number {
  return floor.a / FINEST_PER_A;
}

/** Floor extent in finest-cell counts. */
export function floorFinestCols(floor: FloorConfig): number {
  return floor.cols * FINEST_PER_A;
}

export function floorFinestRows(floor: FloorConfig): number {
  return floor.rows * FINEST_PER_A;
}

/** Inclusive cell count (cols × rows) of the floor at a named grid level. */
export function floorCellBounds(
  floor: FloorConfig,
  level: NamedGridLevel,
): { cols: number; rows: number } {
  const cellSize = levelCellSize(level, floor.a);
  return {
    cols: Math.max(1, Math.round(floorWorldWidth(floor) / cellSize)),
    rows: Math.max(1, Math.round(floorWorldHeight(floor) / cellSize)),
  };
}

export function isCellOnFloor(
  cell: CellRef,
  floor: FloorConfig,
): boolean {
  if (cell.col < 0 || cell.row < 0) return false;
  const level = Math.max(-1, Math.min(2, cell.level)) as NamedGridLevel;
  const bounds = floorCellBounds(floor, level);
  return cell.col < bounds.cols && cell.row < bounds.rows;
}

/** Coarsest cell size (level -1). */
export function getBaseUnit(a: number): number {
  return levelCellSize(-1, a);
}

export function getFloorBaseUnit(floor: FloorConfig): number {
  return getBaseUnit(floor.a);
}

/**
 * Pick named grid level from zoom so the next-finer cell is at least MIN_CELL_PX.
 * Defaults toward level 0 when zoomed out.
 */
export function getGridLevel(zoom: number, a: number): NamedGridLevel {
  let level: NamedGridLevel = -1;
  for (let i = 0; i < NAMED_LEVELS.length - 1; i++) {
    const next = NAMED_LEVELS[i + 1];
    if (levelCellSize(next, a) * zoom < MIN_CELL_PX) break;
    level = next;
  }
  return level;
}

export function getLevelCellSize(level: number, a: number): number {
  const named = (Math.max(-1, Math.min(2, level)) as NamedGridLevel);
  return levelCellSize(named, a);
}

export function getVisibleLinePositions(
  worldMin: number,
  worldMax: number,
  cellSize: number,
): number[] {
  const start = Math.max(0, Math.floor(worldMin / cellSize) * cellSize);
  const end = Math.ceil(worldMax / cellSize) * cellSize;
  const positions: number[] = [];
  const maxLines = 220;
  const count = Math.floor((end - start) / cellSize) + 1;
  if (count > maxLines) {
    const step = Math.ceil(count / maxLines) * cellSize;
    for (let pos = start; pos <= end + step / 2; pos += step) {
      if (pos >= 0) positions.push(pos);
    }
    return positions;
  }
  for (let pos = start; pos <= end + cellSize / 2; pos += cellSize) {
    if (pos >= 0) positions.push(pos);
  }
  return positions;
}

export function getVisibleWorldBounds(
  viewport: Viewport,
  svgWidth: number,
  svgHeight: number,
): { minX: number; maxX: number; minY: number; maxY: number } {
  const topLeft = screenToWorld({ x: 0, y: 0 }, viewport);
  const bottomRight = screenToWorld({ x: svgWidth, y: svgHeight }, viewport);
  return {
    minX: topLeft.x,
    maxX: bottomRight.x,
    minY: bottomRight.y,
    maxY: topLeft.y,
  };
}

export function worldToCell(point: Point, level: NamedGridLevel, a: number): CellRef {
  const cellSize = levelCellSize(level, a);
  return {
    level,
    col: Math.floor(point.x / cellSize),
    row: Math.floor(point.y / cellSize),
  };
}

export function cellToWorldRect(cell: CellRef, a: number): Rect {
  const cellSize = getLevelCellSize(cell.level, a);
  return {
    x: cell.col * cellSize,
    y: cell.row * cellSize,
    width: cellSize,
    height: cellSize,
  };
}

/** Finest-grid cell from world point (`finest = a/16`). */
export function worldToFinestCell(point: Point, a: number): { col: number; row: number } {
  const f = a / FINEST_PER_A;
  return {
    col: Math.floor(point.x / f),
    row: Math.floor(point.y / f),
  };
}

/** Snap world point to placement grid (a/4), return finest origin. */
export function worldToPlacementFinest(point: Point, a: number): { col: number; row: number } {
  return worldToLevelFinest(point, 1, a);
}

/** Snap world point to a named grid level; return finest-cell origin. */
export function worldToLevelFinest(
  point: Point,
  level: NamedGridLevel,
  a: number,
): { col: number; row: number } {
  const cellSize = levelCellSize(level, a);
  const finest = a / FINEST_PER_A;
  const perCell = Math.max(1, Math.round(cellSize / finest));
  const pCol = Math.floor(point.x / cellSize);
  const pRow = Math.floor(point.y / cellSize);
  return {
    col: pCol * perCell,
    row: pRow * perCell,
  };
}

/** Finest cells per one cell at the given named level. */
export function finestPerLevelCell(level: NamedGridLevel): number {
  return Math.max(1, Math.round(levelCellSize(level, 1) * FINEST_PER_A));
}

export function finestCellToWorldRect(col: number, row: number, a: number): Rect {
  const f = a / FINEST_PER_A;
  return { x: col * f, y: row * f, width: f, height: f };
}

/** Convert catalog W×H (in level-1 / a/4 cells) to finest. */
export function catalogToFinestSize(widthCells: number, heightCells: number): {
  widthCells: number;
  heightCells: number;
} {
  return catalogToFinestSizeAtLevel(widthCells, heightCells, 1);
}

/**
 * Convert catalog W×H cell counts at the current place level into finest cells.
 * Catalog types stay authored as cell counts; interpretation follows `level`.
 */
export function catalogToFinestSizeAtLevel(
  widthCells: number,
  heightCells: number,
  level: NamedGridLevel,
): {
  widthCells: number;
  heightCells: number;
} {
  const scale = finestPerLevelCell(level);
  return {
    widthCells: widthCells * scale,
    heightCells: heightCells * scale,
  };
}

export function cellKey(cell: CellRef): string {
  return `${cell.level}:${cell.col}:${cell.row}`;
}

export function isSameCell(a: CellRef | null, b: CellRef | null): boolean {
  if (!a || !b) return a === b;
  return a.level === b.level && a.col === b.col && a.row === b.row;
}

export function cellsInWorldRect(
  rect: Rect,
  level: NamedGridLevel,
  a: number,
  floor?: FloorConfig,
): CellRef[] {
  const cellSize = levelCellSize(level, a);
  const bounds = floor ? floorCellBounds(floor, level) : null;
  const minCol = Math.max(0, Math.floor(rect.x / cellSize));
  const maxColRaw = Math.floor((rect.x + rect.width - 1e-9) / cellSize);
  const minRow = Math.max(0, Math.floor(rect.y / cellSize));
  const maxRowRaw = Math.floor((rect.y + rect.height - 1e-9) / cellSize);
  const maxCol = bounds ? Math.min(maxColRaw, bounds.cols - 1) : maxColRaw;
  const maxRow = bounds ? Math.min(maxRowRaw, bounds.rows - 1) : maxRowRaw;
  const cells: CellRef[] = [];
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      cells.push({ level, col, row });
    }
  }
  return cells;
}

export function worldRectFromPoints(a: Point, b: Point): Rect {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function floorWorldRect(floor: FloorConfig): Rect {
  return {
    x: 0,
    y: 0,
    width: floorWorldWidth(floor),
    height: floorWorldHeight(floor),
  };
}
