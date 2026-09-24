import { CellCoord, EntityFootprint, FloorConfig, RotationDegree } from '../types/geometry';
import { DEFAULT_FLOOR_CONFIG } from './grid';

/**
 * Returns effective dimensions (width, height) after applying rotation.
 * Swaps width and height for 90° and 270° counter-clockwise rotation angles.
 */
export function getRotatedDimensions(
  widthFinest: number,
  heightFinest: number,
  rotation: RotationDegree
): { width: number; height: number } {
  if (rotation === 90 || rotation === 270) {
    return { width: heightFinest, height: widthFinest };
  }
  return { width: widthFinest, height: heightFinest };
}

/**
 * Calculates all occupied finest (a/16) cell coordinates for an entity given its origin,
 * dimensions, and rotation angle (0°, 90°, 180°, 270° CCW).
 */
export function getEntityFootprint(
  originFinest: CellCoord,
  widthFinestCells: number,
  heightFinestCells: number,
  rotation: RotationDegree = 0
): EntityFootprint {
  const occupiedCells: CellCoord[] = [];
  const { width: effectiveWidth, height: effectiveHeight } = getRotatedDimensions(
    widthFinestCells,
    heightFinestCells,
    rotation
  );

  for (let c = 0; c < effectiveWidth; c++) {
    for (let r = 0; r < effectiveHeight; r++) {
      occupiedCells.push({
        col: originFinest.col + c,
        row: originFinest.row + r,
      });
    }
  }

  return {
    originFinest,
    widthFinestCells,
    heightFinestCells,
    rotation,
    occupiedFinestCells: occupiedCells,
  };
}

/**
 * Checks if two sets of finest cells collide (overlap).
 */
export function checkCellCollision(cellsA: CellCoord[], cellsB: CellCoord[]): boolean {
  const setB = new Set(cellsB.map((c) => `${c.col},${c.row}`));
  return cellsA.some((c) => setB.has(`${c.col},${c.row}`));
}

/**
 * Validates whether an entity's occupied cells are completely inside the valid floor boundary.
 */
export function checkEntityVsFloorBoundary(
  entityCells: CellCoord[],
  config: FloorConfig = DEFAULT_FLOOR_CONFIG
): boolean {
  const maxCol = config.cols * 16;
  const maxRow = config.rows * 16;

  return entityCells.every(
    (cell) => cell.col >= 0 && cell.row >= 0 && cell.col < maxCol && cell.row < maxRow
  );
}

/**
 * Checks if an entity's occupied cells overlap any unusable region cells.
 */
export function checkEntityVsUnusableCollision(
  entityCells: CellCoord[],
  unusableCells: CellCoord[]
): boolean {
  return checkCellCollision(entityCells, unusableCells);
}
