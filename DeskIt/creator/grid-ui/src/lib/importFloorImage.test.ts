import { describe, expect, it } from 'vitest';
import {
  clamp,
  detectionFloorSize,
  detectionGridSize,
  dilateMask,
  thresholdRgbaToWallMask,
} from './importFloorImage';

describe('clamp / detectionFloorSize / detectionGridSize', () => {
  it('clamps threshold-like values', () => {
    expect(clamp(140, 0, 255)).toBe(140);
    expect(clamp(-5, 0, 255)).toBe(0);
    expect(clamp(300, 0, 255)).toBe(255);
  });

  it('sizes floor from image aspect and maxCols', () => {
    const square = detectionFloorSize(100, 100, 64);
    expect(square).toEqual({ cols: 64, rows: 64 });

    const wide = detectionFloorSize(200, 100, 64);
    expect(wide.cols).toBe(64);
    expect(wide.rows).toBe(32);

    const tall = detectionFloorSize(100, 200, 40);
    expect(tall.cols).toBe(40);
    expect(tall.rows).toBe(80);
  });

  it('clamps floor cols/rows into 8..256', () => {
    expect(detectionFloorSize(10, 10, 2).cols).toBe(8);
    expect(detectionFloorSize(10, 10, 999).cols).toBe(256);
  });

  it('builds a/4 detection grid with finestPerDetect=4', () => {
    const g = detectionGridSize(16, 12);
    expect(g.dw).toBe(64);
    expect(g.dh).toBe(48);
    expect(g.finestPerDetect).toBe(4);
  });
});

describe('thresholdRgbaToWallMask', () => {
  it('marks dark opaque pixels as walls below threshold', () => {
    // 2x1: dark gray + white
    const data = new Uint8ClampedArray([
      20, 20, 20, 255,
      250, 250, 250, 255,
    ]);
    const mask = thresholdRgbaToWallMask(data, 2, 1, 140, false);
    expect(Array.from(mask)).toEqual([1, 0]);
  });

  it('treats near-transparent pixels as open floor', () => {
    const data = new Uint8ClampedArray([0, 0, 0, 5, 0, 0, 0, 255]);
    const mask = thresholdRgbaToWallMask(data, 2, 1, 140, false);
    expect(mask[0]).toBe(0);
    expect(mask[1]).toBe(1);
  });

  it('invert flips light lines into walls', () => {
    const data = new Uint8ClampedArray([
      20, 20, 20, 255,
      250, 250, 250, 255,
    ]);
    const mask = thresholdRgbaToWallMask(data, 2, 1, 140, true);
    expect(Array.from(mask)).toEqual([0, 1]);
  });
});

describe('dilateMask', () => {
  it('thickens a single wall cell by Chebyshev radius 1', () => {
    // 3x3 with center wall
    const mask = new Uint8Array(9);
    mask[4] = 1;
    const out = dilateMask(mask, 3, 3, 1);
    // All 9 cells become wall
    expect(Array.from(out)).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1]);
  });

  it('r=0 returns the same mask reference', () => {
    const mask = new Uint8Array([1, 0, 0, 0]);
    expect(dilateMask(mask, 2, 2, 0)).toBe(mask);
  });
});
