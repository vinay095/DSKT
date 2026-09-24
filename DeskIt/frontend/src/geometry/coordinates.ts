import { WorldPoint, ScreenPoint, Viewport } from '../types/geometry';

/**
 * Converts a point from World Coordinates to Screen (SVG element) Coordinates.
 *
 * World space: First quadrant, (0,0) at bottom-left, +Y upward.
 * Screen space: (0,0) at top-left, +Y downward.
 *
 * Formula:
 * screen.x = world.x * zoom + panX
 * screen.y = -world.y * zoom + panY
 */
export function worldToScreen(worldPoint: WorldPoint, viewport: Viewport): ScreenPoint {
  return {
    screenX: worldPoint.worldX * viewport.zoom + viewport.panX,
    screenY: -worldPoint.worldY * viewport.zoom + viewport.panY,
  };
}

/**
 * Converts a point from Screen (SVG element) Coordinates to World Coordinates.
 *
 * Formula:
 * world.x = (screen.x - panX) / zoom
 * world.y = (panY - screen.y) / zoom
 */
export function screenToWorld(screenPoint: ScreenPoint, viewport: Viewport): WorldPoint {
  return {
    worldX: (screenPoint.screenX - viewport.panX) / viewport.zoom,
    worldY: (viewport.panY - screenPoint.screenY) / viewport.zoom,
  };
}

/**
 * Returns the SVG transform attribute string corresponding to the viewport matrix.
 * Usage in SVG: <g transform={getSvgTransformMatrix(viewport)}> ... </g>
 * Note: scale(zoom, -zoom) flips the Y-axis so world +Y moves upward visually.
 */
export function getSvgTransformMatrix(viewport: Viewport): string {
  return `translate(${viewport.panX}, ${viewport.panY}) scale(${viewport.zoom}, ${-viewport.zoom})`;
}

/**
 * Calculates a new Viewport after zooming centered around a specific screen anchor point
 * (such as the mouse cursor position).
 *
 * Ensures that the world position directly under the cursor remains under the cursor.
 */
export function calculateZoomAroundPoint(
  cursorScreen: ScreenPoint,
  currentViewport: Viewport,
  newZoom: number
): Viewport {
  // 1. Get the world point under the cursor before zoom
  const worldPoint = screenToWorld(cursorScreen, currentViewport);

  // 2. Recalculate panX and panY so that worldPoint maps to cursorScreen with newZoom
  const newPanX = cursorScreen.screenX - worldPoint.worldX * newZoom;
  const newPanY = cursorScreen.screenY + worldPoint.worldY * newZoom;

  return {
    panX: newPanX,
    panY: newPanY,
    zoom: newZoom,
  };
}
