import { FloorDocumentV2, FloorDocEntity } from '../types/floorDocument';
import { DeskElement, FloorPlan } from '../types/floorplan';
import { FloorConfig } from '../types/geometry';
import { DESKIT_PUBLISHED_FLOOR_DOC_KEY, DESKIT_PUBLISH_EVENT } from './floorCreator';
import { DEFAULT_FLOOR_CONFIG } from '../geometry/grid';

const FINEST_PER_A = 16;

function isAssignable(e: FloorDocEntity): boolean {
  const type = (e.elementType || '').toLowerCase();
  const cat = (e.category || '').toLowerCase();
  return (
    cat === 'workstation' ||
    cat === 'desk' ||
    type === 'computer' ||
    type === 'corner-desk' ||
    type.includes('desk') ||
    type.includes('workstation') ||
    type === 'computer-monitor'
  );
}

export { isAssignable };

/** Build / refresh a DeskElement from a published assignable entity. */
export function deskFromEntity(e: FloorDocEntity, existing?: DeskElement): DeskElement {
  const prev = existing;
  const placementCol = e.origin.col / (FINEST_PER_A / 4);
  const placementRow = e.origin.row / (FINEST_PER_A / 4);
  return {
    id: e.objectId,
    code: e.label || prev?.code || `A-${e.objectId.slice(-4).toUpperCase()}`,
    x: placementCol,
    y: placementRow,
    rotation: (e.rotation === 90 || e.rotation === 180 || e.rotation === 270
      ? e.rotation
      : 0) as DeskElement['rotation'],
    status: prev?.status || 'available',
    assignedUserId: prev?.assignedUserId,
    assignedUserName: prev?.assignedUserName,
    assignedUserStatus: prev?.assignedUserStatus,
    department: prev?.department,
    team: prev?.team,
    hasMonitor: prev?.hasMonitor ?? true,
    isStandingDesk: prev?.isStandingDesk ?? false,
    isTemporary: prev?.isTemporary,
    startDate: prev?.startDate,
    endDate: prev?.endDate,
    notes: prev?.notes,
    geometry: {
      objectId: e.objectId,
      category: 'desk',
      elementType: e.elementType,
      originFinest: { col: e.origin.col, row: e.origin.row },
      widthFinestCells: e.widthCells,
      heightFinestCells: e.heightCells,
      rotation: (e.rotation === 90 || e.rotation === 180 || e.rotation === 270
        ? e.rotation
        : 0) as DeskElement['rotation'],
      color: e.color,
      label: e.label,
    },
  };
}

/** Per-floor Creator document key (independent maps per office/floor). */
export function publishedFloorDocKey(floorId: string): string {
  return `${DESKIT_PUBLISHED_FLOOR_DOC_KEY}__${floorId}`;
}

/** Convert creator entities (finest cells) into DeskIt assignable desks. */
export function floorDocumentToDesks(doc: FloorDocumentV2, existing?: DeskElement[]): DeskElement[] {
  const prevById = new Map((existing || []).map((d) => [d.id, d]));
  let n = 0;
  return doc.entities.filter(isAssignable).map((e) => {
    n += 1;
    const prev = prevById.get(e.objectId);
    const desk = deskFromEntity(e, prev);
    if (!e.label && !prev?.code) {
      desk.code = `A-${String(n).padStart(3, '0')}`;
    }
    return desk;
  });
}

export function floorDocumentToFloorPlan(
  doc: FloorDocumentV2,
  previous?: FloorPlan,
  floorMeta?: { floorId: string; officeId?: string; building?: string },
): FloorPlan {
  const a = doc.a || doc.floor.a || DEFAULT_FLOOR_CONFIG.a;
  const floorConfig: FloorConfig = {
    ...DEFAULT_FLOOR_CONFIG,
    a,
    cols: doc.floor.cols,
    rows: doc.floor.rows,
  };

  return {
    id: floorMeta?.floorId || previous?.id || 'floor-published',
    name: doc.name || previous?.name || 'Published Floor',
    building: floorMeta?.building || previous?.building || 'HQ',
    officeId: floorMeta?.officeId || previous?.officeId,
    clonedFromId: previous?.clonedFromId,
    version: (previous?.version || 0) + 1,
    gridWidth: Math.ceil(doc.floor.cols / 4),
    gridHeight: Math.ceil(doc.floor.rows / 4),
    floorConfig,
    lastModified: doc.savedAt || new Date().toISOString(),
    isPublished: true,
    zones: doc.zones.map((z) => ({
      id: z.id,
      name: z.label || 'Zone',
      x: z.origin.col / 4,
      y: z.origin.row / 4,
      width: z.widthCells / 4,
      height: z.heightCells / 4,
      color: z.color,
      department: z.label || 'General',
    })),
    rooms: previous?.rooms || [],
    walls: previous?.walls || [],
    desks: floorDocumentToDesks(doc, previous?.desks),
    unusableRegions: (doc.unusableRegions || []).map((r) => ({
      id: r.id,
      name: r.label,
      cells: r.outline || [],
      pathSvg: '',
    })),
  };
}

function parseDoc(raw: string | null): FloorDocumentV2 | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as FloorDocumentV2;
    if (parsed?.version !== 2) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Load Creator FloorDocument for a specific floor.
 * Falls back to legacy global key (migrates into per-floor slot on first hit).
 */
export function loadPublishedFloorDocument(floorId?: string): FloorDocumentV2 | null {
  try {
    if (floorId) {
      const keyed = parseDoc(localStorage.getItem(publishedFloorDocKey(floorId)));
      if (keyed) return keyed;
    }
    const global = parseDoc(localStorage.getItem(DESKIT_PUBLISHED_FLOOR_DOC_KEY));
    if (global && floorId) {
      // One-time migrate: associate legacy global publish with this floor
      localStorage.setItem(publishedFloorDocKey(floorId), JSON.stringify(global));
    }
    return global;
  } catch {
    return null;
  }
}

/** Persist Creator document for a floor (and mirror to global latest key for Creator). */
export function savePublishedFloorDocument(doc: FloorDocumentV2, floorId: string): void {
  const payload = JSON.stringify(doc);
  localStorage.setItem(publishedFloorDocKey(floorId), payload);
  localStorage.setItem(DESKIT_PUBLISHED_FLOOR_DOC_KEY, payload);
}

export { DESKIT_PUBLISH_EVENT };
