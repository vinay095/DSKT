import type {
  CustomLibraryEntry,
  Entity,
  FloorConfig,
  FloorZone,
  GridCell,
  OutlineVertex,
  Point,
  ScaleLevel,
  UnusableRegion,
} from '../types/geometry';
import { cellsToSvgPath, outlineGridCells } from './footprint';
import {
  coerceScaleLevel,
  finestPerScaleLevel,
  floorFinestCols,
  floorFinestRows,
} from './grid';

export type CompactRegion = {
  origin: GridCell;
  widthCells: number;
  heightCells: number;
  outline?: OutlineVertex[];
};

/**
 * Drop collinear mid-edge vertices; keep only corner vertices of a closed ring.
 * Consecutive vertices imply edges — no separate edges[] field.
 */
export function simplifyCollinear(outline: OutlineVertex[]): OutlineVertex[] {
  if (outline.length < 3) return outline.map((v) => ({ ...v }));
  const cross = (a: OutlineVertex, b: OutlineVertex, c: OutlineVertex) =>
    (b.col - a.col) * (c.row - a.row) - (b.row - a.row) * (c.col - a.col);

  const ring = outline.map((v) => ({ ...v }));
  // Ensure we don't treat a duplicate closing vertex as a real point
  if (
    ring.length > 1 &&
    ring[0].col === ring[ring.length - 1].col &&
    ring[0].row === ring[ring.length - 1].row
  ) {
    ring.pop();
  }

  let changed = true;
  while (changed && ring.length > 3) {
    changed = false;
    const next: OutlineVertex[] = [];
    for (let i = 0; i < ring.length; i++) {
      const prev = ring[(i - 1 + ring.length) % ring.length];
      const curr = ring[i];
      const nxt = ring[(i + 1) % ring.length];
      if (Math.abs(cross(prev, curr, nxt)) < 1e-9) {
        changed = true;
        continue;
      }
      next.push(curr);
    }
    if (next.length < 3) break;
    ring.length = 0;
    ring.push(...next);
  }
  return ring;
}

/** Trace outer boundary as corner {col,row} vertices (closed ring, CCW). */
export function cellsToOutline(cells: GridCell[]): OutlineVertex[] {
  return simplifyCollinear(
    outlineGridCells(cells).map((p) => ({ col: p.x, row: p.y })),
  );
}

/** Scale relative cells / outline from authored placeLevel to target placeLevel. */
export function scalePolygonTemplate(
  template: {
    widthCells: number;
    heightCells: number;
    cells?: GridCell[];
    outline?: OutlineVertex[];
    svgPath?: string;
  },
  fromLevel: number,
  toLevel: number,
  finestPerLevel: (level: number) => number,
): {
  widthCells: number;
  heightCells: number;
  cells?: GridCell[];
  outline?: OutlineVertex[];
  svgPath?: string;
} {
  const from = finestPerLevel(fromLevel);
  const to = finestPerLevel(toLevel);
  const scale = to / from;
  if (Math.abs(scale - 1) < 1e-9) {
    const outline =
      template.outline && template.outline.length >= 3
        ? simplifyCollinear(template.outline)
        : template.cells
          ? cellsToOutline(template.cells)
          : undefined;
    return {
      widthCells: template.widthCells,
      heightCells: template.heightCells,
      outline,
      svgPath:
        template.svgPath ||
        (outline ? outlineToSvgPath(outline) : undefined),
    };
  }

  const widthCells = Math.max(1, Math.round(template.widthCells * scale));
  const heightCells = Math.max(1, Math.round(template.heightCells * scale));

  let outline: OutlineVertex[] | undefined;
  if (template.outline && template.outline.length >= 3) {
    outline = simplifyCollinear(
      template.outline.map((v) => ({
        col: Math.round(v.col * scale),
        row: Math.round(v.row * scale),
      })),
    );
  } else if (template.cells && template.cells.length > 0) {
    const scaledCells = template.cells.map((c) => ({
      col: Math.round(c.col * scale),
      row: Math.round(c.row * scale),
    }));
    outline = cellsToOutline(scaledCells);
  }

  return {
    widthCells,
    heightCells,
    outline,
    svgPath: outline ? outlineToSvgPath(outline) : undefined,
  };
}

/** True if finest cell (col,row) lies in a compact unusable/zone region. */
export function finestCellInRegion(
  col: number,
  row: number,
  region: {
    origin: GridCell;
    widthCells: number;
    heightCells: number;
    outline?: OutlineVertex[];
  },
): boolean {
  const lc = col - region.origin.col;
  const lr = row - region.origin.row;
  if (lc < 0 || lr < 0 || lc >= region.widthCells || lr >= region.heightCells) {
    return false;
  }
  if (!region.outline || region.outline.length < 3) return true;
  return pointInOutline({ x: lc + 0.5, y: lr + 0.5 }, region.outline);
}

export function outlineToSvgPath(outline: OutlineVertex[]): string {
  if (outline.length < 2) {
    return '';
  }
  const [first, ...rest] = outline;
  let d = `M${first.col},${first.row}`;
  for (const p of rest) d += ` L${p.col},${p.row}`;
  d += ' Z';
  return d;
}

export function rectFromCells(cells: GridCell[]): CompactRegion | null {
  if (cells.length === 0) return null;
  let minCol = Infinity;
  let minRow = Infinity;
  let maxCol = -Infinity;
  let maxRow = -Infinity;
  for (const c of cells) {
    minCol = Math.min(minCol, c.col);
    minRow = Math.min(minRow, c.row);
    maxCol = Math.max(maxCol, c.col);
    maxRow = Math.max(maxRow, c.row);
  }
  return {
    origin: { col: minCol, row: minRow },
    widthCells: maxCol - minCol + 1,
    heightCells: maxRow - minRow + 1,
  };
}

/** True when cells fill their AABB with no holes. */
export function isSolidRect(cells: GridCell[]): boolean {
  const rect = rectFromCells(cells);
  if (!rect) return false;
  if (cells.length !== rect.widthCells * rect.heightCells) return false;
  const set = new Set(cells.map((c) => `${c.col},${c.row}`));
  for (let row = rect.origin.row; row < rect.origin.row + rect.heightCells; row++) {
    for (let col = rect.origin.col; col < rect.origin.col + rect.widthCells; col++) {
      if (!set.has(`${col},${row}`)) return false;
    }
  }
  return true;
}

/** Ray-cast point-in-polygon; outline + point in the same cell coordinate space. */
export function pointInOutline(point: Point, outline: OutlineVertex[]): boolean {
  if (outline.length < 3) return false;
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const xi = outline[i].col;
    const yi = outline[i].row;
    const xj = outline[j].col;
    const yj = outline[j].row;
    if (yi > point.y === yj > point.y) continue;
    const xInt = ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (point.x < xInt) inside = !inside;
  }
  return inside;
}

/** Relative finest cells whose centers lie inside the outline, within AABB. */
export function outlineToCells(
  outline: OutlineVertex[],
  widthCells: number,
  heightCells: number,
): GridCell[] {
  const cells: GridCell[] = [];
  for (let row = 0; row < heightCells; row++) {
    for (let col = 0; col < widthCells; col++) {
      if (pointInOutline({ x: col + 0.5, y: row + 0.5 }, outline)) {
        cells.push({ col, row });
      }
    }
  }
  return cells;
}

export function absoluteCellsFromRelative(
  origin: GridCell,
  cells: GridCell[],
): GridCell[] {
  return cells.map((c) => ({
    col: origin.col + c.col,
    row: origin.row + c.row,
  }));
}

/** Compress absolute finest cells to AABB (+ outline when irregular). */
export function compactFromCells(cells: GridCell[]): CompactRegion | null {
  const rect = rectFromCells(cells);
  if (!rect) return null;
  if (isSolidRect(cells)) {
    return {
      origin: rect.origin,
      widthCells: rect.widthCells,
      heightCells: rect.heightCells,
    };
  }
  const relative = cells.map((c) => ({
    col: c.col - rect.origin.col,
    row: c.row - rect.origin.row,
  }));
  return {
    origin: rect.origin,
    widthCells: rect.widthCells,
    heightCells: rect.heightCells,
    outline: cellsToOutline(relative),
  };
}

/** Split an array of cells into contiguous connected components (4-neighbor connectivity). */
export function splitIntoConnectedComponents(cells: GridCell[]): GridCell[][] {
  if (cells.length === 0) return [];
  const set = new Set(cells.map((c) => `${c.col},${c.row}`));
  const visited = new Set<string>();
  const components: GridCell[][] = [];

  for (const cell of cells) {
    const key = `${cell.col},${cell.row}`;
    if (visited.has(key)) continue;

    const component: GridCell[] = [];
    const queue: GridCell[] = [cell];
    visited.add(key);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      component.push(curr);

      const neighbors = [
        { col: curr.col + 1, row: curr.row },
        { col: curr.col - 1, row: curr.row },
        { col: curr.col, row: curr.row + 1 },
        { col: curr.col, row: curr.row - 1 },
      ];

      for (const n of neighbors) {
        const nKey = `${n.col},${n.row}`;
        if (set.has(nKey) && !visited.has(nKey)) {
          visited.add(nKey);
          queue.push(n);
        }
      }
    }
    components.push(component);
  }

  return components;
}

/** Expand compact region (or legacy absolute cells) to absolute finest cells. */
export function expandRegionCells(region: {
  origin?: GridCell;
  widthCells?: number;
  heightCells?: number;
  outline?: OutlineVertex[];
  cells?: GridCell[];
}): GridCell[] {
  if (
    region.origin &&
    region.widthCells != null &&
    region.heightCells != null &&
    (region.outline || !region.cells?.length)
  ) {
    if (region.outline && region.outline.length >= 3) {
      return absoluteCellsFromRelative(
        region.origin,
        outlineToCells(region.outline, region.widthCells, region.heightCells),
      );
    }
    const cells: GridCell[] = [];
    for (let r = 0; r < region.heightCells; r++) {
      for (let c = 0; c < region.widthCells; c++) {
        cells.push({
          col: region.origin.col + c,
          row: region.origin.row + r,
        });
      }
    }
    return cells;
  }
  if (region.cells && region.cells.length > 0) {
    return region.cells.map((c) => ({ ...c }));
  }
  return [];
}

export function normalizeZone(
  zone: FloorZone & { cells?: GridCell[] },
): FloorZone {
  if (
    zone.origin &&
    zone.widthCells != null &&
    zone.heightCells != null &&
    (!zone.cells || zone.cells.length === 0 || zone.outline)
  ) {
    const { cells: _drop, ...rest } = zone;
    return rest;
  }
  if (zone.cells && zone.cells.length > 0) {
    const compact = compactFromCells(zone.cells);
    if (compact) {
      return {
        id: zone.id,
        label: zone.label,
        color: zone.color,
        ...compact,
      };
    }
  }
  return {
    id: zone.id,
    label: zone.label,
    color: zone.color,
    origin: zone.origin ?? { col: 0, row: 0 },
    widthCells: zone.widthCells ?? 1,
    heightCells: zone.heightCells ?? 1,
    outline: zone.outline,
  };
}

export function normalizeUnusable(
  region: UnusableRegion & { cells?: GridCell[] },
): UnusableRegion {
  if (
    region.origin &&
    region.widthCells != null &&
    region.heightCells != null &&
    (!region.cells || region.cells.length === 0 || region.outline)
  ) {
    const { cells: _drop, ...rest } = region;
    return rest;
  }
  if (region.cells && region.cells.length > 0) {
    const compact = compactFromCells(region.cells);
    if (compact) {
      return {
        id: region.id,
        label: region.label,
        color: region.color,
        ...compact,
      };
    }
  }
  return {
    id: region.id,
    label: region.label,
    color: region.color,
    origin: region.origin ?? { col: 0, row: 0 },
    widthCells: region.widthCells ?? 1,
    heightCells: region.heightCells ?? 1,
    outline: region.outline,
  };
}

/** Rotate relative outline 90° CCW within AABB; returns new outline + swapped dims. */
export function rotateOutline90CCW(
  outline: OutlineVertex[],
  widthCells: number,
  _heightCells: number,
): { outline: OutlineVertex[]; widthCells: number; heightCells: number } {
  const rotated = outline.map((v) => ({
    col: v.row,
    row: widthCells - v.col,
  }));
  let minCol = Infinity;
  let minRow = Infinity;
  let maxCol = -Infinity;
  let maxRow = -Infinity;
  for (const v of rotated) {
    minCol = Math.min(minCol, v.col);
    minRow = Math.min(minRow, v.row);
    maxCol = Math.max(maxCol, v.col);
    maxRow = Math.max(maxRow, v.row);
  }
  const next = simplifyCollinear(
    rotated.map((v) => ({
      col: Math.round(v.col - minCol),
      row: Math.round(v.row - minRow),
    })),
  );
  return {
    outline: next,
    widthCells: Math.max(1, Math.round(maxCol - minCol)),
    heightCells: Math.max(1, Math.round(maxRow - minRow)),
  };
}

function findLibraryPolygon(
  entity: Entity,
  library: CustomLibraryEntry[] | undefined,
): CustomLibraryEntry | undefined {
  if (!library?.length) return undefined;
  return library.find(
    (item) =>
      item.category === entity.category &&
      item.elementType === entity.elementType &&
      ((item.outline && item.outline.length >= 3) || (item.cells && item.cells.length > 0)),
  );
}

/** Scale library outline to target AABB (non-uniform), then apply rotation. */
export function libraryRotatedDims(
  lib: { widthCells: number; heightCells: number; outline?: OutlineVertex[]; cells?: GridCell[] },
  rotation: 0 | 90 | 180 | 270,
  targetW: number,
  targetH: number,
): { widthCells: number; heightCells: number; outline: OutlineVertex[] } | null {
  let outline =
    lib.outline && lib.outline.length >= 3
      ? simplifyCollinear(lib.outline)
      : lib.cells
        ? cellsToOutline(lib.cells)
        : null;
  if (!outline || outline.length < 3) return null;

  const sx = targetW / Math.max(1, lib.widthCells);
  const sy = targetH / Math.max(1, lib.heightCells);
  outline = simplifyCollinear(
    outline.map((v) => ({
      col: Math.round(v.col * sx),
      row: Math.round(v.row * sy),
    })),
  );
  let w = Math.max(1, Math.round(lib.widthCells * sx));
  let h = Math.max(1, Math.round(lib.heightCells * sy));
  const turns = (((rotation % 360) + 360) % 360) / 90;
  for (let i = 0; i < turns; i++) {
    const r = rotateOutline90CCW(outline, w, h);
    outline = r.outline;
    w = r.widthCells;
    h = r.heightCells;
  }
  return { widthCells: w, heightCells: h, outline };
}

/**
 * Resolve library-backed polygon geometry onto the entity for runtime use.
 * When a library entry exists, always rebuild from it using the library's
 * authored size (uniform; no per-instance stretch).
 */
export function resolvePolygonEntity(
  entity: Entity,
  library?: CustomLibraryEntry[],
): Entity {
  const lib = findLibraryPolygon(entity, library);

  if (lib) {
    const rotation = (entity.rotation ?? 0) as 0 | 90 | 180 | 270;
    const built = libraryRotatedDims(
      lib,
      rotation,
      lib.widthCells,
      lib.heightCells,
    );
    if (!built) return hydratePolygonEntity(entity);

    const { cells: _c, svg: _s, svgPath: _p, outline: _o, ...rest } = entity;
    return {
      ...rest,
      outline: built.outline,
      svgPath: outlineToSvgPath(built.outline),
      widthCells: built.widthCells,
      heightCells: built.heightCells,
    };
  }

  return hydratePolygonEntity(entity);
}

/** Ensure polygon entities have a simplified outline; do not expand cells[] in memory. */
export function hydratePolygonEntity(entity: Entity): Entity {
  if (!entity.cells?.length && !entity.outline?.length) return entity;

  let outline = entity.outline;
  if ((!outline || outline.length < 3) && entity.cells && entity.cells.length > 0) {
    outline = cellsToOutline(entity.cells);
  } else if (outline && outline.length >= 3) {
    outline = simplifyCollinear(outline);
  }

  const svgPath =
    outline && outline.length >= 2
      ? outlineToSvgPath(outline)
      : entity.cells
        ? cellsToSvgPath(entity.cells)
        : entity.svgPath;

  const { cells: _drop, ...rest } = entity;
  return {
    ...rest,
    outline,
    svgPath,
  };
}

/**
 * Drop cells/svgPath/svg; always strip outline when library is canonical
 * so library-backed instances share a fixed JSON column set.
 */
export function compactEntityForSave(
  entity: Entity,
  library?: CustomLibraryEntry[],
): Entity {
  const lib = findLibraryPolygon(entity, library);
  const { cells: _c, svgPath: _p, svg: _s, ...base } = entity;

  if (lib) {
    const { outline: _o, ...rest } = base;
    return {
      ...rest,
      rotation: (entity.rotation ?? 0) as 0 | 90 | 180 | 270,
    };
  }

  if (!entity.cells?.length && !entity.outline?.length) {
    return base;
  }
  const outline = simplifyCollinear(
    entity.outline && entity.outline.length >= 3
      ? entity.outline
      : entity.cells
        ? cellsToOutline(entity.cells)
        : [],
  );
  return {
    ...base,
    outline: outline.length >= 3 ? outline : undefined,
  };
}

export function compactLibraryItemForSave<
  T extends {
    cells?: GridCell[];
    outline?: OutlineVertex[];
    svgPath?: string;
    widthCells: number;
    heightCells: number;
    placeLevel?: ScaleLevel | number;
  },
>(item: T): T {
  const placeLevel = coerceScaleLevel(item.placeLevel) ?? item.placeLevel;
  if (!item.cells?.length && !item.outline?.length) {
    const { cells: _c, svgPath: _p, ...rest } = item;
    return { ...rest, placeLevel } as T;
  }
  const outline = simplifyCollinear(
    item.outline && item.outline.length >= 3
      ? item.outline
      : item.cells
        ? cellsToOutline(item.cells)
        : [],
  );
  const { cells: _drop, svgPath: _path, ...rest } = item;
  return {
    ...rest,
    placeLevel,
    outline: outline.length >= 3 ? outline : undefined,
  } as T;
}

function scaleOutlineVertices(
  outline: OutlineVertex[] | undefined,
  factor: number,
): OutlineVertex[] | undefined {
  if (!outline || outline.length < 3) return outline;
  return simplifyCollinear(
    outline.map((v) => ({
      col: Math.round(v.col * factor),
      row: Math.round(v.row * factor),
    })),
  );
}

function scaleRegionLike<T extends {
  origin: GridCell;
  widthCells: number;
  heightCells: number;
  outline?: OutlineVertex[];
  cells?: GridCell[];
}>(region: T, factor: number): T {
  const outline = scaleOutlineVertices(region.outline, factor);
  const cells = region.cells?.map((c) => ({
    col: Math.round(c.col * factor),
    row: Math.round(c.row * factor),
  }));
  return {
    ...region,
    origin: {
      col: Math.round(region.origin.col * factor),
      row: Math.round(region.origin.row * factor),
    },
    widthCells: Math.max(1, Math.round(region.widthCells * factor)),
    heightCells: Math.max(1, Math.round(region.heightCells * factor)),
    outline,
    cells,
  };
}

/** True if all layout AABBs fit inside the floor finest bounds. */
export function layoutFitsFloor(
  pieces: Array<{
    origin: GridCell;
    widthCells: number;
    heightCells: number;
  }>,
  floor: FloorConfig,
): boolean {
  const maxCol = floorFinestCols(floor);
  const maxRow = floorFinestRows(floor);
  return pieces.every(
    (p) =>
      p.origin.col >= 0 &&
      p.origin.row >= 0 &&
      p.origin.col + p.widthCells <= maxCol &&
      p.origin.row + p.heightCells <= maxRow,
  );
}

export type ScaleLayoutInput = {
  entities: Entity[];
  zones: FloorZone[];
  unusableRegions: UnusableRegion[];
  customLibrary: CustomLibraryEntry[];
  layoutPlaceLevel: ScaleLevel;
  floor: FloorConfig;
};

export type ScaleLayoutResult =
  | { ok: true; doc: Omit<ScaleLayoutInput, 'floor'> }
  | { ok: false; reason: 'at-limit' | 'too-large' };

/** Uniformly scale all layout coords by finest(to)/finest(from). */
export function scaleLayout(
  input: ScaleLayoutInput,
  to: ScaleLevel,
): ScaleLayoutResult {
  const from = input.layoutPlaceLevel;
  if (from === to) return { ok: false, reason: 'at-limit' };
  const factor = finestPerScaleLevel(to) / finestPerScaleLevel(from);
  if (!(factor > 0) || !Number.isFinite(factor)) {
    return { ok: false, reason: 'at-limit' };
  }

  const entities = input.entities.map((e) => {
    const scaled = scaleRegionLike(e, factor);
    return {
      ...scaled,
      placeLevel: to,
      svgPath: scaled.outline ? outlineToSvgPath(scaled.outline) : undefined,
    };
  });
  const zones = input.zones.map((z) => scaleRegionLike(z, factor));
  const unusableRegions = input.unusableRegions.map((r) =>
    scaleRegionLike(r, factor),
  );
  const customLibrary = input.customLibrary.map((item) => {
    const outline = scaleOutlineVertices(item.outline, factor);
    const cells = item.cells?.map((c) => ({
      col: Math.round(c.col * factor),
      row: Math.round(c.row * factor),
    }));
    return {
      ...item,
      widthCells: Math.max(1, Math.round(item.widthCells * factor)),
      heightCells: Math.max(1, Math.round(item.heightCells * factor)),
      outline,
      cells,
      placeLevel: to,
      svgPath: outline ? outlineToSvgPath(outline) : undefined,
    };
  });

  if (factor > 1) {
    const pieces = [
      ...entities,
      ...zones,
      ...unusableRegions,
    ];
    if (!layoutFitsFloor(pieces, input.floor)) {
      return { ok: false, reason: 'too-large' };
    }
  }

  return {
    ok: true,
    doc: {
      entities,
      zones,
      unusableRegions,
      customLibrary,
      layoutPlaceLevel: to,
    },
  };
}

/** Bake library outline onto entities that reference a deleted library entry. */
export function bakeLibraryOntoEntities(
  entities: Entity[],
  entry: CustomLibraryEntry,
): Entity[] {
  return entities.map((e) => {
    if (e.category !== entry.category || e.elementType !== entry.elementType) {
      return e;
    }
    if (e.outline && e.outline.length >= 3) return e;
    return resolvePolygonEntity(e, [entry]);
  });
}
