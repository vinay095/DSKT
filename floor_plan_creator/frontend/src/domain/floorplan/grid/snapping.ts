import { snapPointToGrid, snapToGrid } from '../geometry/coordinates'
import type { Point } from '../models/geometry'

export function snapWorldValue(
  value: number,
  precision: number,
  enabled: boolean,
): number {
  return enabled ? snapToGrid(value, precision) : value
}

export function snapWorldPoint(
  point: Point,
  precision: number,
  enabled: boolean,
): Point {
  return enabled ? snapPointToGrid(point, precision) : { ...point }
}
