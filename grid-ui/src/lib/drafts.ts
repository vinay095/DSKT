import type {
  CustomLibraryEntry,
  Entity,
  FloorConfig,
  FloorZone,
  GridCell,
  UnusableRegion,
} from '../types/geometry';
import type { Viewport } from '../types/viewport';
import {
  compactEntityForSave,
  compactLibraryItemForSave,
  hydratePolygonEntity,
  normalizeUnusable,
  normalizeZone,
} from '../geometry/shapeStorage';

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

export function normalizeDocument(doc: FloorDocument): FloorDocument {
  return {
    ...doc,
    entities: doc.entities.map(hydratePolygonEntity),
    zones: doc.zones.map(normalizeZone),
    customLibrary: doc.customLibrary.map((item) => {
      if (!item.cells?.length && !item.outline?.length) return item;
      const hydrated = hydratePolygonEntity({
        objectId: item.id,
        category: item.category,
        elementType: item.elementType,
        origin: { col: 0, row: 0 },
        widthCells: item.widthCells,
        heightCells: item.heightCells,
        cells: item.cells,
        outline: item.outline,
        svgPath: item.svgPath,
        placeLevel: item.placeLevel,
      });
      return {
        ...item,
        cells: undefined,
        outline: hydrated.outline,
        svgPath: hydrated.svgPath,
      };
    }),
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
  return {
    ...normalized,
    entities: normalized.entities.map(compactEntityForSave),
    zones: normalized.zones.map(normalizeZone),
    customLibrary: normalized.customLibrary.map(compactLibraryItemForSave),
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
