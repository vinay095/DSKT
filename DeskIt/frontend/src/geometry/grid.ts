import { CellCoord, FloorConfig, GridLevelName, WorldPoint } from '../types/geometry';

/**
 * Default floor configuration for DeskIT maps.
 * cols = 20 base units, rows = 14 base units, base unit 'a' = 64 world units.
 */
export const DEFAULT_FLOOR_CONFIG: FloorConfig = {
  cols: 20,
  rows: 14,
  a: 64,
};

/**
 * Returns the logical world dimensions of the floor.
 */
export function getFloorWorldDimensions(config: FloorConfig = DEFAULT_FLOOR_CONFIG): { width: number; height: number } {
  return {
    width: config.cols * config.a,
    height: config.rows * config.a,
  };
}

/**
 * Returns grid cell size in world units for a specific GridLevel.
 */
export function getGridStep(level: GridLevelName, config: FloorConfig = DEFAULT_FLOOR_CONFIG): number {
  switch (level) {
    case '2a':
      return config.a * 2;
    case 'a':
      return config.a;
    case 'a/4':
      return config.a / 4;
    case 'a/16':
      return config.a / 16;
  }
}

/**
 * Converts a WorldPoint to the corresponding finest (a/16) cell index.
 */
export function worldToFinestCell(worldPoint: WorldPoint, config: FloorConfig = DEFAULT_FLOOR_CONFIG): CellCoord {
  const finestStep = config.a / 16;
  return {
    col: Math.floor(worldPoint.worldX / finestStep),
    row: Math.floor(worldPoint.worldY / finestStep),
  };
}

/**
 * Converts a finest (a/16) cell index to the origin WorldPoint (bottom-left corner of the cell).
 */
export function finestCellToWorld(cell: CellCoord, config: FloorConfig = DEFAULT_FLOOR_CONFIG): WorldPoint {
  const finestStep = config.a / 16;
  return {
    worldX: cell.col * finestStep,
    worldY: cell.row * finestStep,
  };
}

/**
 * Converts a WorldPoint to the corresponding placement (a/4) cell index.
 */
export function worldToPlacementCell(worldPoint: WorldPoint, config: FloorConfig = DEFAULT_FLOOR_CONFIG): CellCoord {
  const placementStep = config.a / 4;
  return {
    col: Math.floor(worldPoint.worldX / placementStep),
    row: Math.floor(worldPoint.worldY / placementStep),
  };
}

/**
 * Converts a placement (a/4) cell index to the origin WorldPoint.
 */
export function placementCellToWorld(cell: CellCoord, config: FloorConfig = DEFAULT_FLOOR_CONFIG): WorldPoint {
  const placementStep = config.a / 4;
  return {
    worldX: cell.col * placementStep,
    worldY: cell.row * placementStep,
  };
}

/**
 * Converts a placement (a/4) cell coordinate to its equivalent finest (a/16) origin cell coordinate.
 * (Since 1 placement cell = 4 finest cells in each dimension).
 */
export function placementCellToFinestCell(cell: CellCoord): CellCoord {
  return {
    col: cell.col * 4,
    row: cell.row * 4,
  };
}

/**
 * Converts a finest (a/16) cell coordinate to its containing placement (a/4) cell coordinate.
 */
export function finestCellToPlacementCell(cell: CellCoord): CellCoord {
  return {
    col: Math.floor(cell.col / 4),
    row: Math.floor(cell.row / 4),
  };
}
