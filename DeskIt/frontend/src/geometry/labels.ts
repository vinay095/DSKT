/**
 * Adaptive floor-map labels — size to element box; stay readable under Y-up flip + rotation.
 */

export function adaptiveLabelFontSize(
  boxW: number,
  boxH: number,
  opts?: { min?: number; max?: number; ratio?: number },
): number {
  const ratio = opts?.ratio ?? 0.22;
  const min = opts?.min ?? 6;
  const max = opts?.max ?? 16;
  return Math.max(min, Math.min(max, Math.min(boxW, boxH) * ratio));
}

export function truncateLabel(text: string, maxChars: number): string {
  const t = text.trim();
  if (maxChars < 2 || t.length <= maxChars) return t;
  return `${t.slice(0, maxChars - 1)}…`;
}

/** Chars that roughly fit in box at given font size (heuristic). */
export function maxLabelChars(boxW: number, fontSize: number): number {
  if (fontSize <= 0) return 4;
  return Math.max(3, Math.floor((boxW * 0.9) / (fontSize * 0.55)));
}

/**
 * Screen-readable label under Y-up world (`scale(zoom,-zoom)` or floor flip)
 * and optional element rotation (degrees CCW).
 */
export function readableLabelTransform(
  cx: number,
  cy: number,
  rotationDeg = 0,
): string {
  const rot = ((rotationDeg % 360) + 360) % 360;
  if (!rot) return `translate(${cx}, ${cy}) scale(1, -1)`;
  return `translate(${cx}, ${cy}) scale(1, -1) rotate(${-rot})`;
}
