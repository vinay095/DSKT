import { describe, expect, it } from 'vitest';
import {
  cellsToOutline,
  compactEntityForSave,
  compactFromCells,
  expandRegionCells,
  isSolidRect,
  normalizeZone,
  outlineToSvgPath,
  pointInOutline,
  scalePolygonTemplate,
} from './shapeStorage';
import {
  catalogToFinestSizeAtLevel,
  finestPerLevelCell,
  floorCellBounds,
  isCellOnFloor,
  worldToLevelFinest,
} from './grid';

describe('floor cell bounds', () => {
  it('rejects cells outside the designated floor', () => {
    const floor = { cols: 8, rows: 8, a: 1 };
    expect(floorCellBounds(floor, 0)).toEqual({ cols: 8, rows: 8 });
    expect(floorCellBounds(floor, 1)).toEqual({ cols: 32, rows: 32 });
    expect(isCellOnFloor({ level: 0, col: 7, row: 7 }, floor)).toBe(true);
    expect(isCellOnFloor({ level: 0, col: 8, row: 0 }, floor)).toBe(false);
    expect(isCellOnFloor({ level: 1, col: 31, row: 0 }, floor)).toBe(true);
    expect(isCellOnFloor({ level: 1, col: 32, row: 0 }, floor)).toBe(false);
  });
});

describe('axis label uniqueness (label step)', () => {
  it('produces unique indices when step is finer than a', () => {
    const a = 1;
    const step = a / 4; // label every a/4
    const xs = [0, 0.25, 0.5, 0.75, 1];
    const labels = xs.map((wx) => Math.round(wx / step));
    expect(labels).toEqual([0, 1, 2, 3, 4]);
    expect(new Set(labels).size).toBe(labels.length);
    // Old bug: wx/a would collide
    const buggy = xs.map((wx) => Math.round(wx / a));
    expect(new Set(buggy).size).toBeLessThan(buggy.length);
  });
});

describe('placement at current grid level', () => {
  const a = 1;

  it('scales catalog size by level cell → finest', () => {
    expect(finestPerLevelCell(-1)).toBe(32);
    expect(finestPerLevelCell(0)).toBe(16);
    expect(finestPerLevelCell(1)).toBe(4);
    expect(finestPerLevelCell(2)).toBe(1);

    const at0 = catalogToFinestSizeAtLevel(2, 3, 0);
    const at1 = catalogToFinestSizeAtLevel(2, 3, 1);
    expect(at0).toEqual({ widthCells: 32, heightCells: 48 });
    expect(at1).toEqual({ widthCells: 8, heightCells: 12 });
    expect(at0.widthCells).not.toBe(at1.widthCells);
  });

  it('snaps origin to the place level’s cell', () => {
    const p = { x: 0.3, y: 0.9 };
    expect(worldToLevelFinest(p, 1, a)).toEqual({ col: 4, row: 12 });
    expect(worldToLevelFinest(p, 0, a)).toEqual({ col: 0, row: 0 });
    expect(worldToLevelFinest(p, 2, a)).toEqual({ col: 4, row: 14 });
  });

  it('preserves placeLevel on a placed entity shape', () => {
    const entity = {
      objectId: 'e1',
      category: 'desk',
      elementType: 'desk',
      origin: { col: 0, row: 0 },
      widthCells: 32,
      heightCells: 16,
      placeLevel: 0 as const,
    };
    expect(entity.placeLevel).toBe(0);
    // zoom change does not alter stored size / placeLevel
    expect(entity.widthCells).toBe(catalogToFinestSizeAtLevel(2, 1, 0).widthCells);
  });
});

describe('compact shape storage', () => {
  it('compresses a solid rect to AABB without outline', () => {
    const cells = [
      { col: 2, row: 3 },
      { col: 3, row: 3 },
      { col: 2, row: 4 },
      { col: 3, row: 4 },
    ];
    expect(isSolidRect(cells)).toBe(true);
    const compact = compactFromCells(cells);
    expect(compact).toEqual({
      origin: { col: 2, row: 3 },
      widthCells: 2,
      heightCells: 2,
    });
    expect(compact?.outline).toBeUndefined();
    expect(expandRegionCells(compact!).length).toBe(4);
  });

  it('round-trips L-shape cells → corner outline → svgPath', () => {
    const cells = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 0, row: 1 },
      { col: 1, row: 1 },
      { col: 0, row: 2 },
      { col: 0, row: 3 },
    ];
    const outline = cellsToOutline(cells);
    // Corner vertices only (collinear midpoints dropped) — L has 6 corners
    expect(outline.length).toBe(6);
    const path = outlineToSvgPath(outline);
    expect(path.startsWith('M')).toBe(true);
    expect(path.endsWith('Z')).toBe(true);
    expect(pointInOutline({ x: 0.5, y: 2.5 }, outline)).toBe(true);
    expect(pointInOutline({ x: 1.5, y: 2.5 }, outline)).toBe(false);
  });

  it('scales polygon templates between place levels', () => {
    const outline = [
      { col: 0, row: 0 },
      { col: 8, row: 0 },
      { col: 8, row: 4 },
      { col: 0, row: 4 },
    ];
    const scaled = scalePolygonTemplate(
      { widthCells: 8, heightCells: 4, outline },
      1,
      0,
      (lvl) => finestPerLevelCell(lvl as -1 | 0 | 1 | 2),
    );
    // level 1→0 multiplies by 16/4 = 4
    expect(scaled.widthCells).toBe(32);
    expect(scaled.heightCells).toBe(16);
    expect(scaled.outline?.[1]).toEqual({ col: 32, row: 0 });
  });

  it('migrates legacy zone cells and drops them on normalize', () => {
    const zone = normalizeZone({
      id: 'z1',
      label: 'team-1',
      color: 'rgba(0,0,0,0.1)',
      cells: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 0, row: 1 },
        { col: 1, row: 1 },
      ],
      origin: { col: 0, row: 0 },
      widthCells: 1,
      heightCells: 1,
    });
    expect(zone.origin).toEqual({ col: 0, row: 0 });
    expect(zone.widthCells).toBe(2);
    expect(zone.heightCells).toBe(2);
    expect(zone.cells).toBeUndefined();
    expect(zone.outline).toBeUndefined();
  });

  it('strips cells from polygon entities on save', () => {
    const cells = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 0, row: 1 },
    ];
    const saved = compactEntityForSave({
      objectId: 'p1',
      category: 'custom',
      elementType: 'polygon_1',
      origin: { col: 4, row: 8 },
      widthCells: 2,
      heightCells: 2,
      cells,
      placeLevel: 1,
    });
    expect(saved.cells).toBeUndefined();
    expect(saved.outline?.length).toBeGreaterThan(0);
    expect(saved.svgPath?.startsWith('M')).toBe(true);
    expect(saved.placeLevel).toBe(1);
  });
});
