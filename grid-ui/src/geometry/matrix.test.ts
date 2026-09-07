import { describe, expect, it } from 'vitest';
import { generateFloorMatrix } from './matrix';
import type { Entity } from '../types/geometry';

describe('generateFloorMatrix', () => {
  it('returns empty matrix for no entities', () => {
    const m = generateFloorMatrix([], 0.25);
    expect(m.rows).toBe(0);
    expect(m.cols).toBe(0);
  });

  it('stamps entity codes into the AABB grid', () => {
    const entities: Entity[] = [
      {
        id: 'w1',
        kind: 'workstation',
        code: 1,
        x: 0,
        y: 0,
        width: 0.5,
        height: 0.5,
      },
      {
        id: 'p1',
        kind: 'plant',
        code: 2,
        x: 1,
        y: 0,
        width: 0.25,
        height: 0.25,
      },
    ];
    const m = generateFloorMatrix(entities, 0.25);
    expect(m.cellSize).toBe(0.25);
    expect(m.cols).toBeGreaterThan(0);
    expect(m.rows).toBeGreaterThan(0);
    // First entity covers 2×2 cells at origin
    expect(m.data[0][0]).toBe(1);
    expect(m.data[0][1]).toBe(1);
    // Plant at x=1 → col offset 4 from minCol 0
    expect(m.data[0][4]).toBe(2);
  });

  it('rasterizes polygons by cell centers', () => {
    const entities: Entity[] = [
      {
        id: 'poly',
        kind: 'polygon',
        code: 8,
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ],
      },
    ];
    const m = generateFloorMatrix(entities, 0.5);
    expect(m.rows).toBe(2);
    expect(m.cols).toBe(2);
    expect(m.data.flat().every((v) => v === 8)).toBe(true);
  });
});
