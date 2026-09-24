import { FloorPlan } from '../types/floorplan';
import { DEFAULT_FLOOR_CONFIG } from '../geometry/grid';

export const CURRENT_DOCUMENT_VERSION = 2;

/**
 * Serializes a FloorPlan object into a formatted JSON string.
 */
export function serializeFloorDocument(floorPlan: FloorPlan): string {
  const doc: FloorPlan = {
    ...floorPlan,
    version: CURRENT_DOCUMENT_VERSION,
    lastModified: new Date().toISOString(),
    floorConfig: floorPlan.floorConfig || DEFAULT_FLOOR_CONFIG,
  };
  return JSON.stringify(doc, null, 2);
}

/**
 * Deserializes a JSON string into a validated FloorPlan object with defaults.
 */
export function parseFloorDocument(jsonString: string): FloorPlan | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object' || !parsed.id) {
      return null;
    }

    const floorPlan: FloorPlan = {
      id: parsed.id,
      name: parsed.name || 'Untitled Floor Plan',
      building: parsed.building || 'HQ Building',
      gridWidth: parsed.gridWidth || 20,
      gridHeight: parsed.gridHeight || 14,
      floorConfig: parsed.floorConfig || DEFAULT_FLOOR_CONFIG,
      desks: Array.isArray(parsed.desks) ? parsed.desks : [],
      rooms: Array.isArray(parsed.rooms) ? parsed.rooms : [],
      walls: Array.isArray(parsed.walls) ? parsed.walls : [],
      zones: Array.isArray(parsed.zones) ? parsed.zones : [],
      unusableRegions: Array.isArray(parsed.unusableRegions) ? parsed.unusableRegions : [],
      lastModified: parsed.lastModified || new Date().toISOString(),
      isPublished: Boolean(parsed.isPublished),
      version: parsed.version || CURRENT_DOCUMENT_VERSION,
    };

    return floorPlan;
  } catch (err) {
    console.error('Failed to parse Floor Document JSON:', err);
    return null;
  }
}
