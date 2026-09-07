import type { Entity, Point } from '../types/geometry';
import { entityBounds, pointInPolygon } from './entities';

export type FloorMatrix = {
  minCol: number;
  minRow: number;
  cols: number;
  rows: number;
  cellSize: number;
  data: number[][];
};

/**
 * Build an occupancy matrix over the AABB of all entities.
 * Empty cells are 0; covered cells get the entity `code` (later entities overwrite).
 */
export function generateFloorMatrix(entities: Entity[], a: number): FloorMatrix {
  if (entities.length === 0 || a <= 0) {
    return { minCol: 0, minRow: 0, cols: 0, rows: 0, cellSize: a, data: [] };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const ent of entities) {
    const b = entityBounds(ent);
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }

  const minCol = Math.floor(minX / a);
  const minRow = Math.floor(minY / a);
  const maxCol = Math.ceil(maxX / a);
  const maxRow = Math.ceil(maxY / a);
  const cols = Math.max(0, maxCol - minCol);
  const rows = Math.max(0, maxRow - minRow);
  const data = Array.from({ length: rows }, () => Array(cols).fill(0) as number[]);

  for (const ent of entities) {
    if (ent.kind === 'polygon' && ent.points && ent.points.length >= 3) {
      stampPolygon(data, ent.points, ent.code, a, minCol, minRow, cols, rows);
    } else {
      stampRect(data, ent, a, minCol, minRow, cols, rows);
    }
  }

  return { minCol, minRow, cols, rows, cellSize: a, data };
}

function stampRect(
  data: number[][],
  ent: Entity,
  a: number,
  minCol: number,
  minRow: number,
  cols: number,
  rows: number,
): void {
  const startC = Math.floor(ent.x / a) - minCol;
  const startR = Math.floor(ent.y / a) - minRow;
  const endC = Math.ceil((ent.x + ent.width) / a) - minCol;
  const endR = Math.ceil((ent.y + ent.height) / a) - minRow;
  for (let r = startR; r < endR; r++) {
    if (r < 0 || r >= rows) continue;
    for (let c = startC; c < endC; c++) {
      if (c < 0 || c >= cols) continue;
      data[r][c] = ent.code;
    }
  }
}

function stampPolygon(
  data: number[][],
  points: Point[],
  code: number,
  a: number,
  minCol: number,
  minRow: number,
  cols: number,
  rows: number,
): void {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = (minCol + c + 0.5) * a;
      const cy = (minRow + r + 0.5) * a;
      if (pointInPolygon({ x: cx, y: cy }, points)) {
        data[r][c] = code;
      }
    }
  }
}
