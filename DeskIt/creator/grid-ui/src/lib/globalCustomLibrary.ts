/**
 * Global custom library — reusable polygon / custom shapes across drafts.
 * Document-local customLibrary still stores shapes used on that floor;
 * this key keeps a workspace-wide catalog for future drafts.
 */

import type { CustomLibraryEntry } from '../types/geometry';

const STORAGE_KEY = 'deskit_global_custom_library_v1';

function safeParse(raw: string | null): CustomLibraryEntry[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (item): item is CustomLibraryEntry =>
        Boolean(item && typeof item === 'object' && 'id' in item && 'elementType' in item),
    );
  } catch {
    return [];
  }
}

export function loadGlobalCustomLibrary(): CustomLibraryEntry[] {
  if (typeof localStorage === 'undefined') return [];
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function saveGlobalCustomLibrary(entries: CustomLibraryEntry[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* quota / private mode */
  }
}

/** Upsert by id (or elementType+label fallback). */
export function upsertGlobalCustomEntry(
  entry: CustomLibraryEntry,
  existing = loadGlobalCustomLibrary(),
): CustomLibraryEntry[] {
  const idx = existing.findIndex(
    (e) => e.id === entry.id || (e.elementType === entry.elementType && e.label === entry.label),
  );
  const next =
    idx >= 0
      ? existing.map((e, i) => (i === idx ? { ...e, ...entry } : e))
      : [...existing, entry];
  saveGlobalCustomLibrary(next);
  return next;
}

export function removeGlobalCustomEntry(id: string): CustomLibraryEntry[] {
  const next = loadGlobalCustomLibrary().filter((e) => e.id !== id);
  saveGlobalCustomLibrary(next);
  return next;
}

/** Merge global + document customs; document entries win on same id. */
export function mergeCustomLibraries(
  globalEntries: CustomLibraryEntry[],
  documentEntries: CustomLibraryEntry[],
): CustomLibraryEntry[] {
  const byId = new Map<string, CustomLibraryEntry>();
  for (const e of globalEntries) byId.set(e.id, e);
  for (const e of documentEntries) byId.set(e.id, e);
  return Array.from(byId.values());
}
