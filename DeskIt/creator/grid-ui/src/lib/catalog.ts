import type { CatalogCategory, Entity, LibraryItem } from '../types/geometry';

export type LibraryCatalog = {
  categories: CatalogCategory[];
};

let cached: LibraryCatalog | null = null;

export async function loadCatalog(): Promise<LibraryCatalog> {
  if (cached) return cached;
  const res = await fetch('/library-catalog.json');
  if (!res.ok) throw new Error(`Failed to load catalog: ${res.status}`);
  const data = (await res.json()) as LibraryCatalog;
  cached = data;
  return data;
}

export function getCachedCatalog(): LibraryCatalog | null {
  return cached;
}

export function catalogToLibraryItems(catalog: LibraryCatalog): LibraryItem[] {
  const items: LibraryItem[] = [];
  for (const cat of catalog.categories) {
    for (const t of cat.types) {
      items.push({
        id: `${cat.category}:${t.elementType}`,
        category: cat.category,
        elementType: t.elementType,
        label: t.label,
        widthCells: t.widthCells,
        heightCells: t.heightCells,
        color: t.color,
        svg: t.svg,
        defaultFontSize: cat.category === 'text' ? 0.6 : undefined,
      });
    }
  }
  return items;
}

/** True when svg is a catalog asset filename (not a data URL or inline markup). */
export function isCatalogAssetSvg(svg?: string): boolean {
  if (!svg) return false;
  const trimmed = svg.trimStart();
  if (svg.startsWith('data:') || trimmed.startsWith('<svg') || trimmed.startsWith('<?xml')) {
    return false;
  }
  return true;
}

export function findCatalogSvg(
  categories: CatalogCategory[],
  category: string,
  elementType: string,
): string | undefined {
  const cat = categories.find((c) => c.category === category);
  const type = cat?.types.find((t) => t.elementType === elementType);
  return type?.svg;
}

/** Restore missing catalog svg filenames on entities (older drafts / downloads). */
export function rehydrateCatalogSvgs(
  entities: Entity[],
  categories: CatalogCategory[],
): Entity[] {
  if (!categories.length) return entities;
  return entities.map((e) => {
    if (e.svg) return e;
    if (e.cells?.length || (e.outline && e.outline.length >= 3)) return e;
    const svg = findCatalogSvg(categories, e.category, e.elementType);
    return svg ? { ...e, svg } : e;
  });
}

export function assetUrl(svg?: string): string | undefined {
  if (!svg) return undefined;
  // Custom shapes store generated SVG as a data URL — do not prefix /assets/.
  if (
    svg.startsWith('data:') ||
    svg.trimStart().startsWith('<svg') ||
    svg.trimStart().startsWith('<?xml')
  ) {
    return svg.startsWith('data:') ? svg : undefined;
  }
  return `/assets/${svg}`;
}
