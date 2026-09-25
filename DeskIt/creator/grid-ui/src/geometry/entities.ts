import type { Entity, GridCell, Point, Rect } from '../types/geometry';
import { pointInRelativeCells } from './footprint';
import { FINEST_PER_A } from './grid';
import {
  cellsToOutline,
  outlineToCells,
  outlineToSvgPath,
  pointInOutline,
  rotateOutline90CCW,
} from './shapeStorage';

/** World rect for an entity; `a` is the named unit (finest = a/16). */
export function entityWorldRect(entity: Entity, a: number): Rect {
  const f = a / FINEST_PER_A;
  return {
    x: entity.origin.col * f,
    y: entity.origin.row * f,
    width: entity.widthCells * f,
    height: entity.heightCells * f,
  };
}

export function entityBounds(entity: Entity, a: number): Rect {
  return entityWorldRect(entity, a);
}

export function pointInRect(p: Point, r: Rect): boolean {
  return p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

export function isPolygonEntity(entity: Entity): boolean {
  return Boolean(
    (entity.cells && entity.cells.length > 0) ||
      (entity.outline && entity.outline.length >= 3),
  );
}

export function hitTestEntity(entities: Entity[], world: Point, a: number): Entity | null {
  for (let i = entities.length - 1; i >= 0; i--) {
    const e = entities[i];
    if (isPolygonEntity(e)) {
      if (e.cells && e.cells.length > 0) {
        if (pointInRelativeCells(world, e.origin, e.cells, a)) return e;
      } else if (e.outline && e.outline.length >= 3) {
        const f = a / FINEST_PER_A;
        const local = {
          x: world.x / f - e.origin.col,
          y: world.y / f - e.origin.row,
        };
        if (pointInOutline(local, e.outline)) return e;
      }
      continue;
    }
    if (pointInRect(world, entityBounds(e, a))) return e;
  }
  return null;
}

export function entitiesIntersectingRect(
  entities: Entity[],
  rect: Rect,
  a: number,
): Entity[] {
  const f = a / FINEST_PER_A;
  return entities.filter((e) => {
    if (isPolygonEntity(e) && e.cells && e.cells.length > 0) {
      return e.cells.some((c) =>
        rectsIntersect(rect, {
          x: (e.origin.col + c.col) * f,
          y: (e.origin.row + c.row) * f,
          width: f,
          height: f,
        }),
      );
    }
    if (isPolygonEntity(e) && e.outline && e.outline.length >= 3) {
      return rectsIntersect(entityBounds(e, a), rect);
    }
    return rectsIntersect(entityBounds(e, a), rect);
  });
}

export function translateEntity(entity: Entity, dCol: number, dRow: number): Entity {
  return {
    ...entity,
    origin: {
      col: entity.origin.col + dCol,
      row: entity.origin.row + dRow,
    },
  };
}

export type EntityRotation = 0 | 90 | 180 | 270;

/** Rotate entity 90° anticlockwise around its center; swaps AABB for rects. */
export function rotateEntity90CCW(entity: Entity): Entity {
  const nextRot = (((entity.rotation ?? 0) + 90) % 360) as EntityRotation;

  if (isPolygonEntity(entity)) {
    let outline = entity.outline;
    if ((!outline || outline.length < 3) && entity.cells && entity.cells.length > 0) {
      outline = cellsToOutline(entity.cells);
    }
    if (outline && outline.length >= 3) {
      const w = entity.widthCells;
      const h = entity.heightCells;
      const cx = entity.origin.col + w / 2;
      const cy = entity.origin.row + h / 2;
      const rotated = rotateOutline90CCW(outline, w, h);
      const { cells: _drop, ...rest } = entity;
      return {
        ...rest,
        origin: {
          col: Math.round(cx - rotated.widthCells / 2),
          row: Math.round(cy - rotated.heightCells / 2),
        },
        widthCells: rotated.widthCells,
        heightCells: rotated.heightCells,
        outline: rotated.outline,
        svgPath: outlineToSvgPath(rotated.outline),
        rotation: nextRot,
      };
    }
  }

  const w = entity.widthCells;
  const h = entity.heightCells;
  const cx = entity.origin.col + w / 2;
  const cy = entity.origin.row + h / 2;
  const nw = h;
  const nh = w;
  return {
    ...entity,
    origin: {
      col: Math.round(cx - nw / 2),
      row: Math.round(cy - nh / 2),
    },
    widthCells: nw,
    heightCells: nh,
    rotation: nextRot,
  };
}

export function cloneEntity(entity: Entity, objectId: string): Entity {
  return {
    ...entity,
    objectId,
    origin: { ...entity.origin },
    cells: entity.cells?.map((c) => ({ ...c })),
    outline: entity.outline?.map((v) => ({ ...v })),
  };
}

export function createId(prefix = 'e'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function entitiesInCells(
  entities: Entity[],
  cells: GridCell[],
  a: number,
): Entity[] {
  if (cells.length === 0) return [];
  const f = a / FINEST_PER_A;
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
  const rect: Rect = {
    x: minCol * f,
    y: minRow * f,
    width: (maxCol - minCol + 1) * f,
    height: (maxRow - minRow + 1) * f,
  };
  return entitiesIntersectingRect(entities, rect, a);
}

/** Absolute finest cells occupied by an entity. */
export function entityOccupiedCells(entity: Entity): GridCell[] {
  if (isPolygonEntity(entity) && entity.cells && entity.cells.length > 0) {
    return entity.cells.map((c) => ({
      col: entity.origin.col + c.col,
      row: entity.origin.row + c.row,
    }));
  }
  if (isPolygonEntity(entity) && entity.outline && entity.outline.length >= 3) {
    return outlineToCells(entity.outline, entity.widthCells, entity.heightCells).map(
      (c) => ({
        col: entity.origin.col + c.col,
        row: entity.origin.row + c.row,
      }),
    );
  }
  const cells: GridCell[] = [];
  for (let r = 0; r < entity.heightCells; r++) {
    for (let c = 0; c < entity.widthCells; c++) {
      cells.push({
        col: entity.origin.col + c,
        row: entity.origin.row + r,
      });
    }
  }
  return cells;
}
