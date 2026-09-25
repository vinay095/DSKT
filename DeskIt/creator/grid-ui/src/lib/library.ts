import type { CustomLibraryEntry, Entity, LibraryItem } from '../types/geometry';
import { getCategoryStyle } from './categoryStyles';

export function nextCustomColor(index: number): string {
  const palette = [
    '#A78BFA',
    '#78716C',
    '#374151',
    '#22C55E',
    '#7DD3FC',
    '#F472B6',
    '#A8A29E',
    '#A16207',
  ];
  return palette[index % palette.length];
}

export function colorForEntity(entity: Entity, library: LibraryItem[]): string {
  if (entity.color) return entity.color;
  const hit = library.find(
    (i) => i.category === entity.category && i.elementType === entity.elementType,
  );
  if (hit?.color) return hit.color;
  return getCategoryStyle(entity.category, entity.elementType).fill;
}

export function deleteCustomLibraryEntry(
  entries: CustomLibraryEntry[],
  id: string,
): CustomLibraryEntry[] {
  return entries.filter((e) => e.id !== id);
}

export function upsertCustomCategory(
  entries: CustomLibraryEntry[],
  entry: CustomLibraryEntry,
): CustomLibraryEntry[] {
  return [...entries.filter((e) => e.id !== entry.id), entry];
}

export function groupCustomByCategory(
  entries: CustomLibraryEntry[],
): Map<string, CustomLibraryEntry[]> {
  const map = new Map<string, CustomLibraryEntry[]>();
  for (const e of entries) {
    const list = map.get(e.category) ?? [];
    list.push(e);
    map.set(e.category, list);
  }
  return map;
}
