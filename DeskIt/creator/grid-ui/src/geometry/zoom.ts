/** Shared zoom step helpers for creator viewers. */

export const ZOOM_BUTTON_FACTOR = 1.1;

/** Clamp trackpad/mouse wheel into a gentle per-event factor. */
export function wheelZoomFactor(deltaY: number): number {
  const magnitude = Math.min(1, Math.abs(deltaY) / 120);
  const step = 1 + 0.06 + magnitude * 0.06; // ~1.06 … ~1.12
  return deltaY < 0 ? step : 1 / step;
}

export function clampZoom(zoom: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, zoom));
}
