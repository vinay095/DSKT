/** Minimal FloorDocument shape mirrored from creator (v2). */

export interface FloorDocCell {
  col: number;
  row: number;
}

export interface FloorDocEntity {
  objectId: string;
  category: string;
  elementType: string;
  origin: FloorDocCell;
  widthCells: number;
  heightCells: number;
  rotation?: number;
  color?: string;
  label?: string;
  svg?: string;
  outline?: FloorDocCell[];
  svgPath?: string;
  fontSize?: number;
}

export interface FloorDocZone {
  id: string;
  color: string;
  origin: FloorDocCell;
  widthCells: number;
  heightCells: number;
  outline?: FloorDocCell[];
  label?: string;
}

export interface FloorDocUnusable {
  id: string;
  origin: FloorDocCell;
  widthCells: number;
  heightCells: number;
  outline?: FloorDocCell[];
  label?: string;
}

export interface FloorDocumentV2 {
  version: 2;
  name?: string;
  savedAt?: string;
  a: number;
  floor: { cols: number; rows: number; a?: number };
  entities: FloorDocEntity[];
  zones: FloorDocZone[];
  customLibrary?: unknown[];
  unusableRegions?: FloorDocUnusable[];
}
