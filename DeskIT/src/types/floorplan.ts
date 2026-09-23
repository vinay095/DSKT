export type DeskStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export type CanvasElementType = 'desk' | 'room' | 'wall' | 'zone';

export interface DeskElement {
  id: string;
  code: string; // e.g., 'A-101'
  x: number;
  y: number;
  rotation: number; // 0, 90, 180, 270
  status: DeskStatus;
  assignedUserId?: string;
  assignedUserName?: string;
  assignedUserAvatar?: string;
  department?: string;
  hasMonitor?: boolean;
  isStandingDesk?: boolean;
  zoneId?: string;
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
}

export interface FloorPlan {
  id: string;
  name: string; // e.g., "Floor 4 - Tech & Engineering"
  building: string;
  desks: DeskElement[];
  rooms: RoomElement[];
  walls: WallElement[];
  zones: ZoneElement[];
  gridWidth: number;
  gridHeight: number;
  lastModified: string;
  isPublished: boolean;
}

export interface FloorPlanDraft {
  id: string;
  floorPlanId: string;
  name: string;
  updatedAt: string;
  data: FloorPlan;
}
