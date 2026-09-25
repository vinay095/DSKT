export type Point = {
  x: number;
  y: number;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Working floor in units of `a` (level 0).
 * World size = cols*a × rows*a. Finest cell = a/16.
 */
export type FloorConfig = {
  cols: number;
  rows: number;
  a: number;
};

export type GridCell = {
  col: number;
  row: number;
};

/**
 * Layout / place size ladder (6 rungs). Zoom grid stays on 4 named levels;
 * place size uses this scale when layoutPlaceLevel is locked.
 * Legacy JSON may still use -1|0|1|2 — coerce via coerceScaleLevel.
 */
export type ScaleLevel = 'a/16' | 'a/8' | 'a/4' | 'a/2' | 'a' | '2a';

/** @deprecated prefer ScaleLevel; kept as alias for call sites. */
export type PlaceLevel = ScaleLevel;

/** Outline vertex in finest-cell coordinates (boundary ring). */
export type OutlineVertex = {
  col: number;
  row: number;
};

export type CatalogType = {
  elementType: string;
  label: string;
  svg?: string;
  /** Size in catalog cells; interpreted at current place level. */
  widthCells: number;
  heightCells: number;
  color: string;
};

export type CatalogCategory = {
  category: string;
  label: string;
  types: CatalogType[];
};

export type LibraryItem = {
  id: string;
  category: string;
  elementType: string;
  label: string;
  /** Catalog size in cells at place time (converted to finest on place). */
  widthCells: number;
  heightCells: number;
  color: string;
  svg?: string;
  /** Relative finest (a/16) cells for custom polygons (runtime / legacy). */
  cells?: GridCell[];
  /** Boundary vertices in relative finest coords (preferred over cells for JSON). */
  outline?: OutlineVertex[];
  svgPath?: string;
  fromSelection?: boolean;
  defaultFontSize?: number;
  /** Level the custom item was authored at. */
  placeLevel?: PlaceLevel;
};

export type CustomLibraryEntry = LibraryItem & {
  category: string;
};

export type Entity = {
  objectId: string;
  category: string;
  elementType: string;
  /** Origin in finest (a/16) cells. */
  origin: GridCell;
  /** Size in finest (a/16) cells. */
  widthCells: number;
  heightCells: number;
  /** Anticlockwise only: 0 | 90 | 180 | 270. */
  rotation?: 0 | 90 | 180 | 270;
  color?: string;
  label?: string;
  svg?: string;
  /** Relative finest cells for custom polygons (runtime / legacy). */
  cells?: GridCell[];
  /** Boundary vertices in relative finest coords (persisted). */
  outline?: OutlineVertex[];
  /** Boundary path in finest-cell coords (preview). */
  svgPath?: string;
  fontSize?: number;
  /** Grid level used when this entity was placed; footprint stays locked after zoom. */
  placeLevel?: PlaceLevel;
  /** When true, entity cannot be moved, rotated, resized, or deleted until unlocked. */
  locked?: boolean;
};

export type FloorZone = {
  id: string;
  label: string;
  color: string;
  /** AABB origin in finest cells. */
  origin: GridCell;
  widthCells: number;
  heightCells: number;
  /** Present for irregular zones; omitted for solid rectangles. */
  outline?: OutlineVertex[];
  /** @deprecated absolute finest cells; migrated to origin/outline on load */
  cells?: GridCell[];
  /** When true, zone cannot be deleted or recolored until unlocked. */
  locked?: boolean;
};

export type UnusableRegion = {
  id: string;
  label: string;
  color?: string;
  origin: GridCell;
  widthCells: number;
  heightCells: number;
  outline?: OutlineVertex[];
  /** @deprecated absolute finest cells; migrated on load */
  cells?: GridCell[];
};

export type CellRef = {
  /** Named grid level: -1 | 0 | 1 | 2 */
  level: number;
  col: number;
  row: number;
};

export type EditorTool = 'select' | 'pan' | 'place';

export function floorWorldWidth(floor: FloorConfig): number {
  return floor.cols * floor.a;
}

export function floorWorldHeight(floor: FloorConfig): number {
  return floor.rows * floor.a;
}
