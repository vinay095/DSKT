import { FloorPlan, DeskElement, RoomElement, ZoneElement, UnusableRegion } from '../types/floorplan';

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function remapId(oldId: string, map: Map<string, string>, prefix: string): string {
  const existing = map.get(oldId);
  if (existing) return existing;
  const next = newId(prefix);
  map.set(oldId, next);
  return next;
}

export interface CloneFloorPlanOptions {
  /** New floor plan id (also used as storage key). */
  newFloorId: string;
  name: string;
  officeId: string;
  building?: string;
  /** When true (default), clear seat assignments so the clone is an empty layout. */
  clearAssignments?: boolean;
}

/**
 * Deep-clone a floor plan into an independent copy.
 * Does not mutate the source. Geometry is preserved; IDs are remapped.
 */
export function cloneFloorPlan(source: FloorPlan, opts: CloneFloorPlanOptions): FloorPlan {
  const clearAssignments = opts.clearAssignments !== false;
  const deskMap = new Map<string, string>();
  const roomMap = new Map<string, string>();
  const zoneMap = new Map<string, string>();
  const wallMap = new Map<string, string>();
  const unusableMap = new Map<string, string>();

  const desks: DeskElement[] = source.desks.map((d) => {
    const id = remapId(d.id, deskMap, 'desk');
    const base: DeskElement = {
      ...d,
      id,
      geometry: d.geometry
        ? { ...d.geometry, objectId: id, cells: d.geometry.cells?.map((c) => ({ ...c })) }
        : undefined,
    };
    if (clearAssignments) {
      return {
        ...base,
        status: 'available' as const,
        assignedUserId: undefined,
        assignedUserName: undefined,
        assignedUserAvatar: undefined,
        assignedUserStatus: undefined,
        department: undefined,
        team: undefined,
        isTemporary: undefined,
        startDate: undefined,
        endDate: undefined,
        notes: undefined,
      };
    }
    return base;
  });

  const rooms: RoomElement[] = source.rooms.map((r) => ({
    ...r,
    id: remapId(r.id, roomMap, 'room'),
    geometry: r.geometry ? { ...r.geometry, objectId: remapId(r.id, roomMap, 'room') } : undefined,
  }));

  const zones: ZoneElement[] = source.zones.map((z) => ({
    ...z,
    id: remapId(z.id, zoneMap, 'zone'),
    cells: z.cells?.map((c) => ({ ...c })),
  }));

  const walls = source.walls.map((w) => ({
    ...w,
    id: remapId(w.id, wallMap, 'wall'),
  }));

  const unusableRegions: UnusableRegion[] | undefined = source.unusableRegions?.map((u) => ({
    ...u,
    id: remapId(u.id, unusableMap, 'unusable'),
    cells: u.cells.map((c) => ({ ...c })),
  }));

  return {
    ...source,
    id: opts.newFloorId,
    name: opts.name,
    officeId: opts.officeId,
    building: opts.building ?? source.building,
    clonedFromId: source.id,
    desks,
    rooms,
    walls,
    zones,
    unusableRegions,
    floorConfig: source.floorConfig ? { ...source.floorConfig } : undefined,
    lastModified: new Date().toISOString(),
    isPublished: false,
    version: 1,
  };
}

export function makeCloneFloorId(sourceFloorId: string): string {
  return `floor-clone-${sourceFloorId}-${Date.now().toString(36)}`;
}
