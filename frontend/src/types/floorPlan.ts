/** Logical floor-plan model — source of truth for UI and future optimization. */

export type ElementCategory =
  | 'furniture'
  | 'spaces'
  | 'infrastructure'
  | 'special';

export type ElementType =
  | 'desk'
  | 'workstation'
  | 'chair'
  | 'table'
  | 'meeting-table'
  | 'sofa'
  | 'storage'
  | 'cabinet'
  | 'cabin'
  | 'meeting-room'
  | 'conference-room'
  | 'restroom'
  | 'cafeteria'
  | 'kitchen'
  | 'rest-area'
  | 'lounge'
  | 'phone-booth'
  | 'pillar'
  | 'wall'
  | 'door'
  | 'window'
  | 'staircase'
  | 'elevator'
  | 'unusable-space'
  | 'restricted-area'
  | 'waiting-area'
  | 'collaboration-area'
  | 'open-workspace';

export type Mobility = 'movable' | 'fixed' | 'restricted';

export type EditorTool = 'select' | 'pan' | 'draw';

export interface Team {
  id: string;
  name: string;
  color: string;
  pattern: 'solid' | 'hatch' | 'dots';
}

export interface FloorObjectProperties {
  label?: string;
  employee?: string | null;
  teamId?: string | null;
  capacity?: number;
  reason?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface FloorObject {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  layer: 'infrastructure' | 'furniture' | 'spaces' | 'seating' | 'annotation';
  mobility: Mobility;
  properties: FloorObjectProperties;
}

export interface FloorBounds {
  width: number;
  height: number;
  name: string;
  gridSize: number;
}

export interface FloorPlanDocument {
  version: 1;
  floor: FloorBounds;
  objects: FloorObject[];
  teams: Team[];
  meta?: {
    name?: string;
    updatedAt?: string;
  };
}

export interface ViewportState {
  /** Zoom factor (1 = 100%). Does not affect logical coordinates. */
  zoom: number;
  /** Stage pan in screen pixels. */
  panX: number;
  panY: number;
}

export interface ElementDefinition {
  type: ElementType;
  label: string;
  category: ElementCategory;
  defaultWidth: number;
  defaultHeight: number;
  mobility: Mobility;
  layer: FloorObject['layer'];
  icon: string;
  defaultProperties?: FloorObjectProperties;
}

export interface CollisionInfo {
  objectId: string;
  collidingWith: string[];
}
