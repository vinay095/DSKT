/**
 * Floor-map image import (v1) — classical CV only (no ML backend).
 *
 * Pipeline:
 *  1. Load PNG/JPG into a canvas
 *  2. Downsample to a detection grid sized to the working floor (a/4 cells)
 *  3. Grayscale + threshold → dark pixels = walls, light = open floor
 *  4. Optional dilate to thicken thin wall lines
 *  5. Convert wall cells → UnusableRegion (via compactFromCells)
 *  6. Flood-fill open interior components → FloorZone room footprints
 *
 * Furniture OCR is intentionally out of scope for v1.
 */

import type {
  FloorConfig,
  FloorZone,
  GridCell,
  UnusableRegion,
} from '../types/geometry';
import {
  compactFromCells,
  splitIntoConnectedComponents,
} from '../geometry/shapeStorage';
import { FINEST_PER_A } from '../geometry/grid';

export type FloorImageImportOptions = {
  /** 0–255 — pixels darker than this become walls (after invert). */
  threshold: number;
  /** Treat light lines on dark background as walls. */
  invert: boolean;
  /** Extra wall thickness in detection cells (0–3). */
  dilate: number;
  /** Floor width in units of `a`. Height follows image aspect. */
  maxCols: number;
  /** Base unit `a` for the resulting floor. */
  a: number;
  /** Also create zones for enclosed open-floor regions. */
  detectRooms: boolean;
};

export type FloorImageImportResult = {
  floor: FloorConfig;
  unusableRegions: UnusableRegion[];
  zones: FloorZone[];
  stats: {
    wallCells: number;
    wallRegions: number;
    roomCount: number;
    detectionCols: number;
    detectionRows: number;
  };
};

const DEFAULT_OPTS: FloorImageImportOptions = {
  threshold: 140,
  invert: false,
  dilate: 1,
  maxCols: 64,
  a: 1,
  detectRooms: true,
};

const ZONE_COLORS = [
  'rgba(59, 130, 246, 0.14)',
  'rgba(34, 197, 94, 0.14)',
  'rgba(168, 85, 247, 0.14)',
  'rgba(245, 158, 11, 0.14)',
  'rgba(239, 68, 68, 0.14)',
  'rgba(20, 184, 166, 0.14)',
];

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Load a File / Blob into an HTMLImageElement. */
export function loadImageFile(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Floor size in units of `a` from image aspect and maxCols.
 * Exported for unit tests (threshold / dilate / grid sizing).
 */
export function detectionFloorSize(
  imgW: number,
  imgH: number,
  maxCols: number,
): { cols: number; rows: number } {
  const cols = clamp(Math.round(maxCols), 8, 256);
  const rows = clamp(Math.round(cols * (imgH / Math.max(1, imgW))), 8, 256);
  return { cols, rows };
}

/** Detection grid (a/4 cells) for a floor sized in units of `a`. */
export function detectionGridSize(cols: number, rows: number): {
  dw: number;
  dh: number;
  finestPerDetect: number;
} {
  const detectPerA = 4;
  return {
    dw: cols * detectPerA,
    dh: rows * detectPerA,
    finestPerDetect: FINEST_PER_A / detectPerA, // 4
  };
}

/** Dilate a binary mask (1 = wall) by Chebyshev radius `r`. */
export function dilateMask(
  mask: Uint8Array,
  w: number,
  h: number,
  r: number,
): Uint8Array {
  if (r <= 0) return mask;
  const out: Uint8Array = new Uint8Array(mask.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let wall = 0;
      for (let dy = -r; dy <= r && !wall; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          if (mask[ny * w + nx]) {
            wall = 1;
            break;
          }
        }
      }
      out[y * w + x] = wall;
    }
  }
  return out;
}

/**
 * Build a wall mask from RGBA ImageData bytes (length = w*h*4).
 * Transparent → open. Darker-than-threshold → wall (unless invert).
 */
export function thresholdRgbaToWallMask(
  data: Uint8ClampedArray | Uint8Array,
  w: number,
  h: number,
  threshold: number,
  invert: boolean,
): Uint8Array {
  const mask = new Uint8Array(w * h);
  const thr = clamp(threshold, 0, 255);
  for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
    const a = data[p + 3] / 255;
    if (a < 0.08) {
      mask[i] = 0;
      continue;
    }
    const g = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
    const dark = g < thr;
    mask[i] = (invert ? !dark : dark) ? 1 : 0;
  }
  return mask;
}

/**
 * Flood-fill from image border through open (non-wall) cells → exterior.
 * Remaining open components are interior rooms.
 */
function findInteriorRooms(
  wall: Uint8Array,
  w: number,
  h: number,
): GridCell[][] {
  const exterior = new Uint8Array(wall.length);
  const queue: number[] = [];
  const push = (x: number, y: number) => {
    const i = y * w + x;
    if (wall[i] || exterior[i]) return;
    exterior[i] = 1;
    queue.push(i);
  };

  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }

  while (queue.length) {
    const i = queue.pop()!;
    const x = i % w;
    const y = (i / w) | 0;
    if (x > 0) push(x - 1, y);
    if (x + 1 < w) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y + 1 < h) push(x, y + 1);
  }

  const open: GridCell[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!wall[i] && !exterior[i]) open.push({ col: x, row: y });
    }
  }
  return splitIntoConnectedComponents(open);
}

/**
 * Trace a geometric floor-plan image into editable DeskIt geometry.
 * Runs entirely in the browser (canvas + classical threshold / flood-fill).
 */
export async function importFloorImageFromBitmap(
  source: CanvasImageSource & { width: number; height: number },
  partial: Partial<FloorImageImportOptions> = {},
): Promise<FloorImageImportResult> {
  const opts: FloorImageImportOptions = { ...DEFAULT_OPTS, ...partial };
  const imgW = source.width;
  const imgH = source.height;
  if (!imgW || !imgH) throw new Error('Image has zero size');

  const { cols, rows } = detectionFloorSize(imgW, imgH, opts.maxCols);
  const floor: FloorConfig = { cols, rows, a: opts.a };

  const { dw, dh, finestPerDetect } = detectionGridSize(cols, rows);

  const canvas = document.createElement('canvas');
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D unavailable');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, dw, dh);
  ctx.drawImage(source as CanvasImageSource, 0, 0, dw, dh);
  const { data } = ctx.getImageData(0, 0, dw, dh);

  let mask = thresholdRgbaToWallMask(data, dw, dh, opts.threshold, opts.invert);
  mask = dilateMask(mask, dw, dh, clamp(opts.dilate, 0, 3));

  // Detection wall cells → finest cells
  const wallFinest: GridCell[] = [];
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      if (!mask[y * dw + x]) continue;
      const baseCol = x * finestPerDetect;
      const baseRow = y * finestPerDetect;
      for (let dy = 0; dy < finestPerDetect; dy++) {
        for (let dx = 0; dx < finestPerDetect; dx++) {
          wallFinest.push({ col: baseCol + dx, row: baseRow + dy });
        }
      }
    }
  }

  const wallComponents = splitIntoConnectedComponents(wallFinest);
  const unusableRegions: UnusableRegion[] = [];
  for (const component of wallComponents) {
    // Skip tiny speckles (< 8 finest cells ≈ half an a/4 cell cluster)
    if (component.length < 8) continue;
    const compact = compactFromCells(component);
    if (!compact) continue;
    unusableRegions.push({
      id: createId('unusable'),
      label: 'wall',
      color: '#64748B',
      ...compact,
    });
  }

  const zones: FloorZone[] = [];
  if (opts.detectRooms) {
    const rooms = findInteriorRooms(mask, dw, dh);
    let roomIdx = 0;
    for (const room of rooms) {
      if (room.length < 16) continue; // ignore tiny pockets
      // Scale detection cells → finest
      const finest: GridCell[] = [];
      for (const c of room) {
        const baseCol = c.col * finestPerDetect;
        const baseRow = c.row * finestPerDetect;
        for (let dy = 0; dy < finestPerDetect; dy++) {
          for (let dx = 0; dx < finestPerDetect; dx++) {
            finest.push({ col: baseCol + dx, row: baseRow + dy });
          }
        }
      }
      const compact = compactFromCells(finest);
      if (!compact) continue;
      roomIdx += 1;
      zones.push({
        id: createId('zone'),
        label: `Room ${roomIdx}`,
        color: ZONE_COLORS[(roomIdx - 1) % ZONE_COLORS.length],
        ...compact,
      });
    }
  }

  return {
    floor,
    unusableRegions,
    zones,
    stats: {
      wallCells: wallFinest.length,
      wallRegions: unusableRegions.length,
      roomCount: zones.length,
      detectionCols: dw,
      detectionRows: dh,
    },
  };
}

export async function importFloorImageFile(
  file: Blob,
  partial: Partial<FloorImageImportOptions> = {},
): Promise<FloorImageImportResult> {
  const img = await loadImageFile(file);
  return importFloorImageFromBitmap(img, partial);
}

/**
 * Preview uses the SAME pipeline as Apply (threshold, dilate, maxCols, rooms),
 * then paints wall regions (+ optional room tints) onto a preview canvas.
 */
export async function previewFloorImageMask(
  source: CanvasImageSource & { width: number; height: number },
  partial: Partial<FloorImageImportOptions> = {},
  previewSize = 320,
): Promise<string> {
  const opts: FloorImageImportOptions = { ...DEFAULT_OPTS, ...partial };
  const result = await importFloorImageFromBitmap(source, opts);

  const scale = previewSize / Math.max(result.floor.cols, result.floor.rows);
  const w = Math.max(8, Math.round(result.floor.cols * scale));
  const h = Math.max(8, Math.round(result.floor.rows * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Open floor background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, w, h);

  const sx = w / (result.floor.cols * FINEST_PER_A);
  const sy = h / (result.floor.rows * FINEST_PER_A);

  const paintRegion = (
    origin: { col: number; row: number },
    widthCells: number,
    heightCells: number,
    outline: { col: number; row: number }[] | undefined,
    fill: string,
  ) => {
    ctx.fillStyle = fill;
    if (outline && outline.length >= 3) {
      ctx.beginPath();
      outline.forEach((v, i) => {
        const x = (origin.col + v.col) * sx;
        const y = (origin.row + v.row) * sy;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      return;
    }
    ctx.fillRect(
      origin.col * sx,
      origin.row * sy,
      widthCells * sx,
      heightCells * sy,
    );
  };

  if (opts.detectRooms) {
    for (const z of result.zones) {
      paintRegion(z.origin, z.widthCells, z.heightCells, z.outline, z.color);
    }
  }

  for (const r of result.unusableRegions) {
    paintRegion(
      r.origin,
      r.widthCells,
      r.heightCells,
      r.outline,
      '#334155',
    );
  }

  return canvas.toDataURL('image/png');
}
