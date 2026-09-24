import { FloorConfig, WorldPoint } from '../types/geometry';
import { DEFAULT_FLOOR_CONFIG } from './grid';

/**
 * Snaps a WorldPoint to the nearest placement grid interval (a/4).
 * Must operate strictly in logical world coordinates.
 */
export function snapWorldToPlacementGrid(
  worldPoint: WorldPoint,
  config: FloorConfig = DEFAULT_FLOOR_CONFIG
): WorldPoint {
  const placementStep = config.a / 4;
  return {
    worldX: Math.round(worldPoint.worldX / placementStep) * placementStep,
    worldY: Math.round(worldPoint.worldY / placementStep) * placementStep,
  };
}

/**
 * Snaps a WorldPoint to the nearest finest storage grid interval (a/16).
 */
export function snapWorldToFinestGrid(
  worldPoint: WorldPoint,
  config: FloorConfig = DEFAULT_FLOOR_CONFIG
): WorldPoint {
  const finestStep = config.a / 16;
  return {
    worldX: Math.round(worldPoint.worldX / finestStep) * finestStep,
    worldY: Math.round(worldPoint.worldY / finestStep) * finestStep,
  };
}
