/**
 * Pure geometry and domain types for the DeskIT Floor-Mapper Engine.
 * All spatial coordinates use clear type signatures to distinguish between
 * World space, Screen space, and Grid Cell spaces.
 */

/**
 * World coordinate point (in logical units, first quadrant).
 * origin (0,0) is at bottom-left of the floor.
 * +worldX extends RIGHT.
 * +worldY extends UPWARD.
 */
export interface WorldPoint {
  worldX: number;
  worldY: number;
}

/**
 * Screen coordinate point (in browser / SVG element pixels).
 * origin (0,0) is at top-left of the SVG container.
 * +screenX extends RIGHT.
 * +screenY extends DOWNWARD.
 */
export interface ScreenPoint {
  screenX: number;
  screenY: number;
}

/**
 * Discrete grid cell coordinate (column and row index).
 * Can represent placement cells (a/4) or finest storage cells (a/16).
 */
export interface CellCoord {
  col: number;
  row: number;
}

/**
 * Viewport matrix state for panning and zoom scaling.
 */
export interface Viewport {
  panX: number; // Screen X offset in pixels
  panY: number; // Screen Y offset in pixels
  zoom: number; // Scale factor (e.g. 1.0 = 100%)
}

/**
 * Logical Grid level resolution names.
 * Level -1: 2a (Coarse)
 * Level 0:  a  (Base Unit)
 * Level 1:  a/4 (Placement Cell Resolution)
 * Level 2:  a/16 (Finest Storage Cell Resolution)
 */
export type GridLevelName = '2a' | 'a' | 'a/4' | 'a/16';

/**
 * Floor boundary configuration defining grid dimensions and base unit size.
 */
export interface FloorConfig {
  cols: number; // Total columns in base units 'a'
  rows: number; // Total rows in base units 'a'
  a: number;    // Base unit size in logical world units (default: 64)
}

/**
 * Counter-clockwise rotation angles supported by the engine.
 */
export type RotationDegree = 0 | 90 | 180 | 270;

/**
 * Geometry footprint of an entity on the finest (a/16) grid.
 */
export interface EntityFootprint {
  originFinest: CellCoord;
  widthFinestCells: number;
  heightFinestCells: number;
  rotation: RotationDegree;
  occupiedFinestCells: CellCoord[];
}

/**
 * Polygon region represented by finest grid cells and its SVG boundary path.
 */
export interface PolygonShape {
  id: string;
  name?: string;
  cells: CellCoord[];
  pathSvg: string; // SVG path string e.g. "M 0 0 L 10 0 L 10 10 ... Z"
}
