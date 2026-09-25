import type { FloorOption } from '../types/office';
import { SEED_FLOORS } from '../data/offices';

/** Re-export for older imports — prefer getAllFloors() when custom floors matter. */
export type { FloorOption } from '../types/office';
export { DEFAULT_FLOOR_ID } from './offices';

const CUSTOM_FLOORS_KEY = 'deskit_custom_floors_v1';

function loadCustomFloors(): FloorOption[] {
  try {
    const raw = localStorage.getItem(CUSTOM_FLOORS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FloorOption[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustomFloors(floors: FloorOption[]): void {
  try {
    localStorage.setItem(CUSTOM_FLOORS_KEY, JSON.stringify(floors));
  } catch {
    /* ignore */
  }
}

/** Seed + admin-cloned floors. */
export function getAllFloors(): FloorOption[] {
  const custom = typeof localStorage !== 'undefined' ? loadCustomFloors() : [];
  const byId = new Map<string, FloorOption>();
  for (const f of SEED_FLOORS) byId.set(f.id, f);
  for (const f of custom) byId.set(f.id, f);
  return Array.from(byId.values());
}

/** @deprecated Use getAllFloors() — kept for AdminDashboard metrics compatibility. */
export const AVAILABLE_FLOORS: FloorOption[] = SEED_FLOORS;

export function registerCustomFloor(floor: FloorOption): FloorOption[] {
  const custom = loadCustomFloors().filter((f) => f.id !== floor.id);
  custom.push({ ...floor, isCustom: true });
  saveCustomFloors(custom);
  return getAllFloors();
}

export function removeCustomFloor(floorId: string): FloorOption[] {
  saveCustomFloors(loadCustomFloors().filter((f) => f.id !== floorId));
  return getAllFloors();
}
