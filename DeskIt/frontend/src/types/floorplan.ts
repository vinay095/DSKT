import { CellCoord, FloorConfig, RotationDegree } from './geometry';
import { EmployeeStatusColor } from './database';

export type DeskStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export type CanvasElementType = 'desk' | 'room' | 'wall' | 'zone' | 'unusable' | 'pillar';

/**
 * Floor Mapper Geometry model for entities placed on the floor.
 */
export interface FloorEntityGeometry {
  objectId: string;
  category: 'desk' | 'table' | 'chair' | 'cabin' | 'meeting' | 'unusable' | 'pillar' | 'zone' | 'custom';
  elementType: string;
  originFinest: CellCoord;    // Origin in a/16 finest cell units
  widthFinestCells: number;  // Width in a/16 finest cell units
  heightFinestCells: number; // Height in a/16 finest cell units
  rotation: RotationDegree;  // 0, 90, 180, 270 counter-clockwise
  color?: string;
  label?: string;
  cells?: CellCoord[];        // Explicit occupied finest cells
  svgPath?: string;          // SVG path string for custom polygons
}

/**
 * Irregular unusable space / structural region (e.g. pillars, stairs, blocked zones).
 */
export interface UnusableRegion {
  id: string;
  name?: string;
  category?: 'pillar' | 'stairs' | 'structural' | 'custom';
  cells: CellCoord[];         // finest a/16 cells
  pathSvg: string;           // Outer perimeter SVG path (M...Z)
}

/**
 * DeskIT Desk Element combining business data and geometry position.
 */
export interface DeskElement {
  id: string;
  code: string; // e.g., 'A-101'
  x: number;   // Grid / world position
  y: number;   // Grid / world position
  rotation: RotationDegree; // 0, 90, 180, 270
  status: DeskStatus;
  assignedUserId?: string;
  assignedUserName?: string;
  assignedUserAvatar?: string;
  assignedUserStatus?: EmployeeStatusColor;
  department?: string;
  hasMonitor?: boolean;
  isStandingDesk?: boolean;
  zoneId?: string;
  geometry?: FloorEntityGeometry; // Logical mapper geometry foundation
  isTemporary?: boolean;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface RoomElement {
  id: string;
  name: string; // e.g. "Conference Room Titan"
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'meeting' | 'breakout' | 'executive' | 'restroom' | 'cafeteria';
  capacity?: number;
  geometry?: FloorEntityGeometry;
}

export interface WallElement {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ZoneElement {
  id: string;
  name: string; // e.g., "Engineering Squad Alpha"
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  department: string;
  cells?: CellCoord[];
  pathSvg?: string;
}

/**
 * Floor Document schema bridging DeskIT business requirements and Floor Mapper geometry.
 */
export interface FloorPlan {
  id: string;
  name: string; // e.g., "Floor 4 - Tech & Engineering"
  building: string;
  desks: DeskElement[];
  rooms: RoomElement[];
  walls: WallElement[];
  zones: ZoneElement[];
  unusableRegions?: UnusableRegion[];
  gridWidth: number;
  gridHeight: number;
  floorConfig?: FloorConfig;
  lastModified: string;
  isPublished: boolean;
  version?: number;
}

export interface FloorPlanDraft {
  id: string;
  floorPlanId: string;
  name: string;
  updatedAt: string;
  data: FloorPlan;
}
