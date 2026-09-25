/**
 * Shared zoom step helpers — keep wheel/button zoom predictable across viewers.
 */

/** Button +/- step (≈10%). */
export const ZOOM_BUTTON_FACTOR = 1.1;

/** Shared clamp range for HR / Employee / legacy viewers. */
export const ZOOM_MIN = 0.15;
export const ZOOM_MAX = 8;

/** Padding (px) used when fitting the floor into a viewport. */
export const FIT_PADDING = 40;

/** Clamp trackpad/mouse wheel into a gentle per-event factor. */
export function wheelZoomFactor(deltaY: number): number {
  // Normalize common deltas (mouse ~100, trackpad smaller/frequent)
  const magnitude = Math.min(1, Math.abs(deltaY) / 120);
  const step = 1 + 0.06 + magnitude * 0.06; // ~1.06 … ~1.12
  return deltaY < 0 ? step : 1 / step;
}

export function clampZoom(zoom: number, min: number = ZOOM_MIN, max: number = ZOOM_MAX): number {
  return Math.min(max, Math.max(min, zoom));
}
