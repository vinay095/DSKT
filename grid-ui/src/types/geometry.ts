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

/** Working floor config. `a` is the finest cell size in meters. */
export type FloorConfig = {
  width: number;
  height: number;
  /** Finest grid cell size (meters). Coarser levels = a × 4^n. */
  a: number;
};

/** @deprecated Prefer Entity — kept for test-object compatibility during migration. */
export type FloorObjectType = 'RECTANGLE';

export type FloorObject = {
  id: string;
  type: FloorObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type EntityKind =
  | 'workstation'
  | 'plant'
  | 'meeting_room'
  | 'cafeteria'
  | 'custom'
  | 'polygon';

export type Entity = {
  id: string;
  kind: EntityKind;
  /** Integer code stamped into the occupancy matrix. */
  code: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  /** Closed polygon vertices in world meters (kind === 'polygon'). */
  points?: Point[];
  label?: string;
};

/** Address of a single cell within the bounded hierarchical grid. */
export type CellRef = {
  level: number;
  col: number;
  row: number;
};

export type EditorTool = 'select' | 'pan' | 'polygon' | 'place';

export type LibraryItem = {
  kind: Exclude<EntityKind, 'polygon'>;
  label: string;
  code: number;
  defaultWidth: number;
  defaultHeight: number;
  color: string;
};
