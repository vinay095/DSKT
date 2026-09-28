import { FloorDocumentV2, FloorDocEntity } from '../types/floorDocument';
import { DeskElement, FloorPlan } from '../types/floorplan';
import { FloorConfig } from '../types/geometry';
import { DESKIT_PUBLISHED_FLOOR_DOC_KEY, DESKIT_PUBLISH_EVENT } from './floorCreator';
import { DEFAULT_FLOOR_CONFIG } from '../geometry/grid';

const FINEST_PER_A = 16;

/** Absolute finest cells covered by a compact region (outline or solid AABB). */
function regionToAbsoluteCells(r: {
  origin: { col: number; row: number };
  widthCells: number;
  heightCells: number;
  outline?: { col: number; row: number }[];
}): { col: number; row: number }[] {
  const cells: { col: number; row: number }[] = [];
  const outline = r.outline;
  if (outline && outline.length >= 3) {
    // Ray-cast relative cell centers against relative outline
    for (let row = 0; row < r.heightCells; row++) {
      for (let col = 0; col < r.widthCells; col++) {
        const px = col + 0.5;
        const py = row + 0.5;
        let inside = false;
        for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
          const xi = outline[i].col;
          const yi = outline[i].row;
          const xj = outline[j].col;
          const yj = outline[j].row;
          if (yi > py === yj > py) continue;
          const xInt = ((xj - xi) * (py - yi)) / (yj - yi) + xi;
          if (px < xInt) inside = !inside;
        }
        if (inside) {
          cells.push({ col: r.origin.col + col, row: r.origin.row + row });
        }
      }
    }
    return cells;
  }
  for (let row = 0; row < r.heightCells; row++) {
    for (let col = 0; col < r.widthCells; col++) {
      cells.push({ col: r.origin.col + col, row: r.origin.row + row });
    }
  }
  return cells;
}

/**
 * SVG path in world units for UnusableLayer / ZonesLayer consumers.
 * Outline vertices are relative finest cells; scale by a/16.
 */
function regionToPathSvg(
  r: {
    origin: { col: number; row: number };
    widthCells: number;
    heightCells: number;
    outline?: { col: number; row: number }[];
  },
  a: number,
): string {
  const f = a / FINEST_PER_A;
  const outline = r.outline;
  if (outline && outline.length >= 2) {
    const [first, ...rest] = outline;
    let d = `M ${(r.origin.col + first.col) * f} ${(r.origin.row + first.row) * f}`;
    for (const v of rest) {
      d += ` L ${(r.origin.col + v.col) * f} ${(r.origin.row + v.row) * f}`;
    }
    d += ' Z';
    return d;
  }
  const x = r.origin.col * f;
  const y = r.origin.row * f;
  const w = r.widthCells * f;
  const h = r.heightCells * f;
  return `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
}

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
      cells: regionToAbsoluteCells(z),
      pathSvg: regionToPathSvg(z, a),
    })),
    rooms: previous?.rooms || [],
    walls: previous?.walls || [],
    desks: floorDocumentToDesks(doc, previous?.desks),
    unusableRegions: (doc.unusableRegions || []).map((r) => ({
      id: r.id,
      name: r.label,
      cells: regionToAbsoluteCells(r),
      pathSvg: regionToPathSvg(r, a),
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

/** Floor ids that have a per-floor Creator SVG document published. */
export function listPublishedFloorDocumentIds(): string[] {
  const prefix = `${DESKIT_PUBLISHED_FLOOR_DOC_KEY}__`;
  const ids: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        ids.push(key.slice(prefix.length));
      }
    }
  } catch {
    /* ignore */
  }
  return ids;
}

const DRAFT_FLOOR_DOC_PREFIX = 'deskit_draft_floor_document_v2__';

export function draftFloorDocKey(floorId: string): string {
  return `${DRAFT_FLOOR_DOC_PREFIX}${floorId}`;
}

export function loadDraftFloorDocument(floorId: string): FloorDocumentV2 | null {
  try {
    return parseDoc(localStorage.getItem(draftFloorDocKey(floorId)));
  } catch {
    return null;
  }
}

export function saveDraftFloorDocument(doc: FloorDocumentV2, floorId: string): void {
  const next: FloorDocumentV2 = {
    ...doc,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(draftFloorDocKey(floorId), JSON.stringify(next));
}

export function clearDraftFloorDocument(floorId: string): void {
  try {
    localStorage.removeItem(draftFloorDocKey(floorId));
  } catch {
    /* ignore */
  }
}

/** Promote a draft SVG map to the live published slot for viewers. */
export function promoteDraftFloorDocument(floorId: string): FloorDocumentV2 | null {
  const draft = loadDraftFloorDocument(floorId);
  if (!draft) return null;
  savePublishedFloorDocument(draft, floorId);
  clearDraftFloorDocument(floorId);
  return draft;
}

export function listDraftFloorDocumentIds(): string[] {
  const ids: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(DRAFT_FLOOR_DOC_PREFIX)) {
        ids.push(key.slice(DRAFT_FLOOR_DOC_PREFIX.length));
      }
    }
  } catch {
    /* ignore */
  }
  return ids;
}

function remapDocId(oldId: string, map: Map<string, string>, prefix: string): string {
  const existing = map.get(oldId);
  if (existing) return existing;
  const next = `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  map.set(oldId, next);
  return next;
}

/**
 * Independent SVG floor-document clone (new entity/zone IDs).
 * Does not mutate the source document.
 */
export function cloneFloorDocument(
  source: FloorDocumentV2,
  opts: { name: string },
): FloorDocumentV2 {
  const entityMap = new Map<string, string>();
  const zoneMap = new Map<string, string>();
  const unusableMap = new Map<string, string>();

  return {
    ...source,
    name: opts.name,
    savedAt: new Date().toISOString(),
    floor: { ...source.floor },
    entities: source.entities.map((e) => ({
      ...e,
      objectId: remapDocId(e.objectId, entityMap, 'ent'),
      origin: { ...e.origin },
      outline: e.outline?.map((c) => ({ ...c })),
    })),
    zones: source.zones.map((z) => ({
      ...z,
      id: remapDocId(z.id, zoneMap, 'zone'),
      origin: { ...z.origin },
      outline: z.outline?.map((c) => ({ ...c })),
    })),
    unusableRegions: (source.unusableRegions || []).map((u) => ({
      ...u,
      id: remapDocId(u.id, unusableMap, 'unusable'),
      origin: { ...u.origin },
      outline: u.outline?.map((c) => ({ ...c })),
    })),
  };
}

export { DESKIT_PUBLISH_EVENT };
