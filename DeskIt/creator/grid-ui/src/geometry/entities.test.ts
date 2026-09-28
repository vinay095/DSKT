import { describe, expect, it } from 'vitest';
import { clampTranslateDelta } from './entities';
import type { Entity } from '../types/geometry';

function ent(col: number, row: number, w: number, h: number): Entity {
  return {
    objectId: `e-${col}-${row}`,
    category: 'desk',
    elementType: 'desk',
    origin: { col, row },
    widthCells: w,
    heightCells: h,
  };
}

describe('clampTranslateDelta', () => {
  it('blocks moving past origin and past floor AABB', () => {
    const group = [ent(2, 4, 8, 4), ent(10, 4, 4, 4)];
    // max 32×32 finest
    expect(clampTranslateDelta(group, -10, -10, 32, 32)).toEqual({ dCol: -2, dRow: -4 });
    expect(clampTranslateDelta(group, 100, 100, 32, 32)).toEqual({ dCol: 18, dRow: 24 });
  });

  it('allows free movement inside the floor', () => {
    const group = [ent(8, 8, 4, 4)];
    expect(clampTranslateDelta(group, 2, -3, 32, 32)).toEqual({ dCol: 2, dRow: -3 });
  });
});
