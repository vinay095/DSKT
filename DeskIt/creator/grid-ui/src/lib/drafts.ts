import type {
  CustomLibraryEntry,
  Entity,
  FloorConfig,
  FloorZone,
  GridCell,
  ScaleLevel,
  UnusableRegion,
} from '../types/geometry';
import type { Viewport } from '../types/viewport';
import {
  compactEntityForSave,
  compactLibraryItemForSave,
  normalizeUnusable,
  normalizeZone,
  resolvePolygonEntity,
} from '../geometry/shapeStorage';
import { coerceScaleLevel } from '../geometry/grid';

export type FloorDocument = {
  version: 2;
  name?: string;
  savedAt?: string;
  a: number;
  floor: FloorConfig;
  entities: Entity[];
  zones: FloorZone[];
  customLibrary: CustomLibraryEntry[];
  unusableRegions?: UnusableRegion[];
  /** Locked place size level; set on first place / polygon save. */
  layoutPlaceLevel?: ScaleLevel;
  /** @deprecated migrated to unusableRegions on load */
  unusableCells?: GridCell[];
  /** @deprecated ignored */
  subdivision?: 2 | 4;
  viewport?: Viewport;
  theme?: 'dark' | 'light';
};

const STORAGE_KEY = 'floor-planner-drafts-v2';

export function normalizeUnusableRegions(doc: FloorDocument): UnusableRegion[] {
  if (doc.unusableRegions && doc.unusableRegions.length > 0) {
    return doc.unusableRegions.map(normalizeUnusable);
  }
  if (doc.unusableCells && doc.unusableCells.length > 0) {
    return [
      normalizeUnusable({
        id: `unusable-${Math.random().toString(36).slice(2, 10)}`,
        label: '',
        cells: doc.unusableCells,
        origin: { col: 0, row: 0 },
        widthCells: 1,
        heightCells: 1,
      }),
    ];
  }
  return [];
}

function migrateEntityPlaceLevel(entity: Entity): Entity {
  const placeLevel = coerceScaleLevel(entity.placeLevel);
  return placeLevel !== undefined ? { ...entity, placeLevel } : entity;
}

function migrateLibraryPlaceLevel(item: CustomLibraryEntry): CustomLibraryEntry {
  const placeLevel = coerceScaleLevel(item.placeLevel);
  return placeLevel !== undefined ? { ...item, placeLevel } : item;
}

/** Infer layoutPlaceLevel from first entity if missing. */
export function inferLayoutPlaceLevel(doc: FloorDocument): ScaleLevel | undefined {
  const existing = coerceScaleLevel(doc.layoutPlaceLevel);
  if (existing) return existing;
  for (const e of doc.entities) {
    const pl = coerceScaleLevel(e.placeLevel);
    if (pl) return pl;
  }
  for (const item of doc.customLibrary) {
    const pl = coerceScaleLevel(item.placeLevel);
    if (pl) return pl;
  }
  return undefined;
}

export function normalizeDocument(doc: FloorDocument): FloorDocument {
  const customLibrary = doc.customLibrary.map((item) => {
    const migrated = migrateLibraryPlaceLevel(item);
    if (!migrated.cells?.length && !migrated.outline?.length) return migrated;
    const hydrated = resolvePolygonEntity(
      {
        objectId: migrated.id,
        category: migrated.category,
        elementType: migrated.elementType,
        origin: { col: 0, row: 0 },
        widthCells: migrated.widthCells,
        heightCells: migrated.heightCells,
        cells: migrated.cells,
        outline: migrated.outline,
        svgPath: migrated.svgPath,
        placeLevel: migrated.placeLevel,
      },
      [migrated],
    );
    return {
      ...migrated,
      cells: undefined,
      outline: hydrated.outline,
      svgPath: hydrated.svgPath,
    };
  });

  return {
    ...doc,
    layoutPlaceLevel: inferLayoutPlaceLevel(doc),
    entities: doc.entities
      .map(migrateEntityPlaceLevel)
      .map((e) => resolvePolygonEntity(e, customLibrary)),
    zones: doc.zones.map(normalizeZone),
    customLibrary,
    unusableRegions: normalizeUnusableRegions(doc),
  };
}

/** Strip deprecated fields and bulk cells[] when saving. */
export function sanitizeDocument(doc: FloorDocument): FloorDocument {
  const {
    subdivision: _sub,
    unusableCells: _cells,
    ...rest
  } = doc;
  const normalized = normalizeDocument({
    ...rest,
    unusableRegions: normalizeUnusableRegions(doc),
  });
  const library = normalized.customLibrary;
  return {
    ...normalized,
    layoutPlaceLevel: inferLayoutPlaceLevel(normalized),
    entities: normalized.entities.map((e) => compactEntityForSave(e, library)),
    zones: normalized.zones.map(normalizeZone),
    customLibrary: library.map(compactLibraryItemForSave),
    unusableRegions: (normalized.unusableRegions ?? []).map(normalizeUnusable),
  };
}

export function listDrafts(): FloorDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FloorDocument[];
    return Array.isArray(parsed) ? parsed.filter((d) => d.version === 2) : [];
  } catch {
    return [];
  }
}

function writeAll(drafts: FloorDocument[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function saveDraft(draft: FloorDocument): void {
  const name = draft.name ?? 'Untitled';
  const drafts = listDrafts().filter((d) => d.name !== name);
  drafts.unshift({
    ...sanitizeDocument(draft),
    name,
    savedAt: new Date().toISOString(),
  });
  writeAll(drafts.slice(0, 40));
}

export function loadDraft(name: string): FloorDocument | null {
  const found = listDrafts().find((d) => d.name === name) ?? null;
  return found ? normalizeDocument(found) : null;
}

export function deleteDraft(name: string): void {
  writeAll(listDrafts().filter((d) => d.name !== name));
}

export function downloadFloorJson(doc: FloorDocument, filename?: string): void {
  const clean = sanitizeDocument(doc);
  const blob = new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `floor-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function floorDocumentToJson(doc: FloorDocument): string {
  return JSON.stringify(sanitizeDocument(doc), null, 2);
}
