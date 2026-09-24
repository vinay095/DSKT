import { describe, expect, it } from 'vitest';
import {
  FINEST_PER_A,
  axisLabelMarks,
  cellKey,
  cellToWorldRect,
  getBaseUnit,
  getGridLevel,
  getVisibleLinePositions,
  isSameCell,
  levelCellSize,
  worldToCell,
  worldToLevelFinest,
  worldToPlacementFinest,
} from './grid';

describe('levelCellSize fixed ladder', () => {
  const a = 0.25;

  it('maps named levels to 2a, a, a/4, a/16', () => {
    expect(levelCellSize(-1, a)).toBe(2 * a);
    expect(levelCellSize(0, a)).toBe(a);
    expect(levelCellSize(1, a)).toBe(a / 4);
    expect(levelCellSize(2, a)).toBe(a / 16);
  });

  it('coarsest base unit is 2a', () => {
    expect(getBaseUnit(a)).toBe(2 * a);
  });
});

describe('getGridLevel', () => {
  const a = 0.25;

  it('stays coarse when zoomed out', () => {
    expect(getGridLevel(5, a)).toBeLessThanOrEqual(0);
  });

  it('reaches finer levels as zoom increases', () => {
    // a/4 * zoom >= 24 → zoom >= 96/a; a/16 * zoom >= 24 → zoom >= 384/a
    expect(getGridLevel(500, a)).toBeGreaterThanOrEqual(1);
    expect(getGridLevel(2000, a)).toBe(2);
  });

  it('never exceeds level 2', () => {
    expect(getGridLevel(1_000_000, a)).toBe(2);
  });
});

describe('worldToCell / cellToWorldRect', () => {
  const a = 4;

  it('round-trips at level 0', () => {
    const cell = worldToCell({ x: 9.4, y: 8.1 }, 0, a);
    expect(cell).toEqual({ level: 0, col: 2, row: 2 });
    expect(cellToWorldRect(cell, a)).toEqual({ x: 8, y: 8, width: 4, height: 4 });
  });

  it('resolves a/4 cells at level 1', () => {
    const cell = worldToCell({ x: 1.1, y: 0.3 }, 1, a);
    expect(cell.level).toBe(1);
    expect(cell.col).toBe(1);
    expect(cell.row).toBe(0);
  });
});

describe('worldToPlacementFinest', () => {
  it('snaps to a/4 and returns finest origin', () => {
    const a = 0.25;
    const cell = worldToPlacementFinest({ x: a * 0.6, y: a * 0.1 }, a);
    // place size a/4=0.0625; x=0.15 → place col 2 → finest 8
    expect(cell.col % 4).toBe(0);
    expect(cell.row % 4).toBe(0);
    expect(cell.col).toBe(8);
    expect(cell.row).toBe(0);
  });

  it('maps catalog placement cell to finest multiples of 4', () => {
    const a = 1;
    const cell = worldToPlacementFinest({ x: 0.3, y: 0.9 }, a);
    // place size 0.25; col=1,row=3 → finest 4,12
    expect(cell).toEqual({ col: 4, row: 12 });
    expect(FINEST_PER_A).toBe(16);
  });
});

describe('worldToLevelFinest', () => {
  it('snaps at level 0 to multiples of 16 finest', () => {
    const a = 1;
    const cell = worldToLevelFinest({ x: 1.2, y: 0.1 }, 0, a);
    expect(cell).toEqual({ col: 16, row: 0 });
  });
});

describe('cellKey / isSameCell', () => {
  it('compares cells', () => {
    const a = { level: 1, col: 3, row: 5 };
    const b = { level: 1, col: 3, row: 5 };
    const c = { level: 1, col: 3, row: 6 };
    expect(cellKey(a)).toBe(cellKey(b));
    expect(isSameCell(a, b)).toBe(true);
    expect(isSameCell(a, c)).toBe(false);
  });
});

describe('getVisibleLinePositions', () => {
  it('covers the given range from first quadrant', () => {
    expect(getVisibleLinePositions(0, 10, 4)).toEqual([0, 4, 8, 12]);
  });
});

describe('axisLabelMarks', () => {
  it('labels current-level cell indices with stride labelEvery', () => {
    const cellSize = 0.25; // a/4 when a=1
    const floorExtent = 32; // 128 cells of size 0.25
    const marks = axisLabelMarks(0, 8, cellSize, 4, floorExtent);
    expect(marks.map((m) => m.index)).toEqual([0, 4, 8, 12, 16, 20, 24, 28, 32].filter((i) => i * cellSize <= 8));
    expect(marks.every((m) => Math.abs(m.world - m.index * cellSize) < 1e-9)).toBe(true);
    // Indices are cell counts, not world/step of a coarser unit
    expect(marks.map((m) => m.index)).toEqual([0, 4, 8, 12, 16, 20, 24, 28, 32].slice(0, marks.length));
  });

  it('keeps indices aligned when thinning (no wrong unit)', () => {
    const cellSize = 1;
    const marks = axisLabelMarks(0, 128, cellSize, 8, 128);
    expect(marks[0]).toEqual({ world: 0, index: 0 });
    expect(marks.map((m) => m.index)).toEqual([
      0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128,
    ]);
    expect(marks.at(-1)?.index).toBe(128);
  });
});
