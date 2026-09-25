import { describe, expect, it } from 'vitest';
import {
  cellsToOutline,
  compactEntityForSave,
  compactFromCells,
  compactLibraryItemForSave,
  expandRegionCells,
  isSolidRect,
  layoutFitsFloor,
  normalizeZone,
  outlineToSvgPath,
  pointInOutline,
  resolvePolygonEntity,
  rotateOutline90CCW,
  scaleLayout,
  scalePolygonTemplate,
} from './shapeStorage';
import {
  catalogToFinestSizeAtLevel,
  coerceScaleLevel,
  finestPerLevelCell,
  finestPerScaleLevel,
  floorCellBounds,
  isCellOnFloor,
  namedGridToScaleLevel,
  stepScaleLevel,
  worldToLevelFinest,
} from './grid';
import { sanitizeDocument, type FloorDocument } from '../lib/drafts';
import type { CustomLibraryEntry, Entity } from '../types/geometry';
import { rotateEntity90CCW } from './entities';

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
    const step = a / 4;
    const xs = [0, 0.25, 0.5, 0.75, 1];
    const labels = xs.map((wx) => Math.round(wx / step));
    expect(labels).toEqual([0, 1, 2, 3, 4]);
    expect(new Set(labels).size).toBe(labels.length);
    const buggy = xs.map((wx) => Math.round(wx / a));
    expect(new Set(buggy).size).toBeLessThan(buggy.length);
  });
});

describe('six-level scale ladder', () => {
  it('maps finest counts for all six rungs', () => {
    expect(finestPerScaleLevel('a/16')).toBe(1);
    expect(finestPerScaleLevel('a/8')).toBe(2);
    expect(finestPerScaleLevel('a/4')).toBe(4);
    expect(finestPerScaleLevel('a/2')).toBe(8);
    expect(finestPerScaleLevel('a')).toBe(16);
    expect(finestPerScaleLevel('2a')).toBe(32);
  });

  it('maps zoom named levels onto the scale ladder', () => {
    expect(namedGridToScaleLevel(-1)).toBe('2a');
    expect(namedGridToScaleLevel(0)).toBe('a');
    expect(namedGridToScaleLevel(1)).toBe('a/4');
    expect(namedGridToScaleLevel(2)).toBe('a/16');
  });

  it('coerces legacy numeric placeLevel', () => {
    expect(coerceScaleLevel(-1)).toBe('2a');
    expect(coerceScaleLevel(0)).toBe('a');
    expect(coerceScaleLevel(1)).toBe('a/4');
    expect(coerceScaleLevel(2)).toBe('a/16');
    expect(coerceScaleLevel('a/8')).toBe('a/8');
  });

  it('steps up/down and stops at ends', () => {
    expect(stepScaleLevel('a', 'up')).toBe('2a');
    expect(stepScaleLevel('2a', 'up')).toBeNull();
    expect(stepScaleLevel('a/16', 'down')).toBeNull();
    expect(stepScaleLevel('a/4', 'down')).toBe('a/8');
  });
});

describe('placement at current grid level', () => {
  const a = 1;

  it('scales catalog size by level cell → finest', () => {
    expect(finestPerLevelCell(-1)).toBe(32);
    expect(finestPerLevelCell(0)).toBe(16);
    expect(finestPerLevelCell(1)).toBe(4);
    expect(finestPerLevelCell(2)).toBe(1);

    const at0 = catalogToFinestSizeAtLevel(2, 3, 'a');
    const at1 = catalogToFinestSizeAtLevel(2, 3, 'a/4');
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
      placeLevel: 'a' as const,
    };
    expect(entity.placeLevel).toBe('a');
    expect(entity.widthCells).toBe(catalogToFinestSizeAtLevel(2, 1, 'a').widthCells);
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

  it('strips cells and svgPath from polygon entities on save', () => {
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
      placeLevel: 'a/4',
    });
    expect(saved.cells).toBeUndefined();
    expect(saved.svgPath).toBeUndefined();
    expect(saved.outline?.length).toBeGreaterThan(0);
    expect(saved.placeLevel).toBe('a/4');
  });
});

describe('polygon library dedupe', () => {
  const outline = [
    { col: 0, row: 0 },
    { col: 8, row: 0 },
    { col: 8, row: 4 },
    { col: 0, row: 4 },
  ];
  const library: CustomLibraryEntry[] = [
    {
      id: 'lib-1',
      category: 'custom',
      elementType: 'poly_box',
      label: 'Box',
      widthCells: 8,
      heightCells: 4,
      color: '#abc',
      outline,
      placeLevel: 'a',
    },
  ];

  it('saves two instances without duplicated outline/svgPath', () => {
    const entities: Entity[] = [
      {
        objectId: 'e1',
        category: 'custom',
        elementType: 'poly_box',
        origin: { col: 0, row: 0 },
        widthCells: 8,
        heightCells: 4,
        outline,
        svgPath: outlineToSvgPath(outline),
        placeLevel: 'a',
      },
      {
        objectId: 'e2',
        category: 'custom',
        elementType: 'poly_box',
        origin: { col: 16, row: 0 },
        widthCells: 8,
        heightCells: 4,
        outline,
        svgPath: outlineToSvgPath(outline),
        placeLevel: 'a',
      },
    ];
    const doc: FloorDocument = {
      version: 2,
      a: 1,
      floor: { cols: 128, rows: 128, a: 1 },
      entities,
      zones: [],
      customLibrary: library,
      layoutPlaceLevel: 'a',
    };
    const saved = sanitizeDocument(doc);
    expect(saved.customLibrary[0].outline?.length).toBeGreaterThan(0);
    expect(saved.customLibrary[0].svgPath).toBeUndefined();
    for (const e of saved.entities) {
      expect(e.outline).toBeUndefined();
      expect(e.svgPath).toBeUndefined();
      expect(e.cells).toBeUndefined();
    }
  });

  it('resolves and rotates with compact corner paths', () => {
    const entity: Entity = {
      objectId: 'e1',
      category: 'custom',
      elementType: 'poly_box',
      origin: { col: 0, row: 0 },
      widthCells: 8,
      heightCells: 4,
      placeLevel: 'a',
      rotation: 0,
    };
    const resolved = resolvePolygonEntity(entity, library);
    expect(resolved.outline?.length).toBe(4);
    expect(resolved.svgPath?.startsWith('M')).toBe(true);
    expect((resolved.svgPath ?? '').length).toBeLessThan(80);

    const rotated = rotateEntity90CCW(resolved);
    expect(rotated.widthCells).toBe(4);
    expect(rotated.heightCells).toBe(8);
    expect(rotated.outline?.length).toBe(4);
    expect((rotated.svgPath ?? '').length).toBeLessThan(80);
  });

  it('library save drops svgPath but keeps outline', () => {
    const saved = compactLibraryItemForSave({
      ...library[0],
      svgPath: outlineToSvgPath(outline),
    });
    expect(saved.outline?.length).toBe(4);
    expect(saved.svgPath).toBeUndefined();
  });

  it('same type shares identical JSON keys; resolve snaps size to library (no stretch)', () => {
    const entities: Entity[] = [
      {
        objectId: 'poly-a',
        category: 'custom',
        elementType: 'poly_box',
        origin: { col: 0, row: 0 },
        widthCells: 184,
        heightCells: 232,
        outline: [
          { col: 0, row: 0 },
          { col: 184, row: 0 },
          { col: 184, row: 232 },
          { col: 0, row: 232 },
        ],
        svg: 'data:image/svg+xml;stale',
        svgPath: 'M0,0 L184,0 Z',
        label: 'Polygon 3',
        color: '#A78BFA',
        placeLevel: 'a/2',
      },
      {
        objectId: 'polygon-b',
        category: 'custom',
        elementType: 'poly_box',
        origin: { col: 200, row: 0 },
        widthCells: 552,
        heightCells: 168,
        rotation: 0,
        outline: [
          { col: 0, row: 0 },
          { col: 552, row: 0 },
          { col: 552, row: 168 },
          { col: 0, row: 168 },
        ],
        label: 'Polygon 3',
        color: '#A78BFA',
        placeLevel: 'a/2',
      },
    ];
    const doc: FloorDocument = {
      version: 2,
      a: 1,
      floor: { cols: 128, rows: 128, a: 1 },
      entities,
      zones: [],
      customLibrary: library,
      layoutPlaceLevel: 'a/2',
    };
    const saved = sanitizeDocument(doc);
    const keysA = Object.keys(saved.entities[0]).sort();
    const keysB = Object.keys(saved.entities[1]).sort();
    expect(keysA).toEqual(keysB);
    for (const e of saved.entities) {
      expect(e.outline).toBeUndefined();
      expect(e.svgPath).toBeUndefined();
      expect(e.svg).toBeUndefined();
      expect(e.cells).toBeUndefined();
      // Stretched instance sizes snap back to library footprint
      expect(e.widthCells).toBe(8);
      expect(e.heightCells).toBe(4);
    }
    expect(saved.customLibrary[0].outline?.length).toBe(4);

    const loaded = saved.entities.map((e) =>
      resolvePolygonEntity(e, saved.customLibrary),
    );
    expect(loaded[0].outline?.[1]).toEqual({ col: 8, row: 0 });
    expect(loaded[0].widthCells).toBe(8);
    expect(loaded[0].heightCells).toBe(4);
    expect(loaded[1].widthCells).toBe(8);
    expect(loaded[1].heightCells).toBe(4);
  });
});

describe('scaleLayout', () => {
  it('scales origins and outlines by finest factor; rejects oversize', () => {
    const outline = [
      { col: 0, row: 0 },
      { col: 16, row: 0 },
      { col: 16, row: 16 },
      { col: 0, row: 16 },
    ];
    const entities: Entity[] = [
      {
        objectId: 'e1',
        category: 'custom',
        elementType: 'p',
        origin: { col: 0, row: 0 },
        widthCells: 16,
        heightCells: 16,
        outline,
        placeLevel: 'a',
      },
      {
        objectId: 'e2',
        category: 'custom',
        elementType: 'p',
        origin: { col: 16, row: 0 },
        widthCells: 16,
        heightCells: 16,
        outline,
        placeLevel: 'a',
      },
    ];
    const ok = scaleLayout(
      {
        entities,
        zones: [],
        unusableRegions: [],
        customLibrary: [],
        layoutPlaceLevel: 'a',
        floor: { cols: 128, rows: 128, a: 1 },
      },
      '2a',
    );
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.doc.entities[0].origin).toEqual({ col: 0, row: 0 });
      expect(ok.doc.entities[1].origin).toEqual({ col: 32, row: 0 });
      expect(ok.doc.entities[0].widthCells).toBe(32);
      expect(ok.doc.entities[0].outline?.[1]).toEqual({ col: 32, row: 0 });
      expect(ok.doc.layoutPlaceLevel).toBe('2a');
    }

    const tooBig = scaleLayout(
      {
        entities,
        zones: [],
        unusableRegions: [],
        customLibrary: [],
        layoutPlaceLevel: 'a',
        floor: { cols: 2, rows: 2, a: 1 }, // 32×32 finest; scaled AABBs exceed
      },
      '2a',
    );
    expect(tooBig.ok).toBe(false);
    if (!tooBig.ok) expect(tooBig.reason).toBe('too-large');
  });

  it('layoutFitsFloor checks AABB against finest bounds', () => {
    const floor = { cols: 2, rows: 2, a: 1 }; // 32×32 finest
    expect(
      layoutFitsFloor([{ origin: { col: 0, row: 0 }, widthCells: 32, heightCells: 32 }], floor),
    ).toBe(true);
    expect(
      layoutFitsFloor([{ origin: { col: 1, row: 0 }, widthCells: 32, heightCells: 1 }], floor),
    ).toBe(false);
  });

  it('rotateOutline90CCW swaps AABB', () => {
    const r = rotateOutline90CCW(
      [
        { col: 0, row: 0 },
        { col: 8, row: 0 },
        { col: 8, row: 4 },
        { col: 0, row: 4 },
      ],
      8,
      4,
    );
    expect(r.widthCells).toBe(4);
    expect(r.heightCells).toBe(8);
  });
});
