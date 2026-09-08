import type { Point } from '../models/geometry'
import { nearlyEqual } from './transforms'

function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

function onSegment(p: Point, q: Point, r: Point, epsilon = 1e-6): boolean {
  return (
    q.x <= Math.max(p.x, r.x) + epsilon &&
    q.x >= Math.min(p.x, r.x) - epsilon &&
    q.y <= Math.max(p.y, r.y) + epsilon &&
    q.y >= Math.min(p.y, r.y) - epsilon
  )
}

export function segmentsIntersect(
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point,
  epsilon = 1e-6,
): boolean {
  const d1 = cross(a1, a2, b1)
  const d2 = cross(a1, a2, b2)
  const d3 = cross(b1, b2, a1)
  const d4 = cross(b1, b2, a2)

  if (
    ((d1 > epsilon && d2 < -epsilon) || (d1 < -epsilon && d2 > epsilon)) &&
    ((d3 > epsilon && d4 < -epsilon) || (d3 < -epsilon && d4 > epsilon))
  ) {
    return true
  }

  if (Math.abs(d1) <= epsilon && onSegment(a1, b1, a2, epsilon)) return true
  if (Math.abs(d2) <= epsilon && onSegment(a1, b2, a2, epsilon)) return true
  if (Math.abs(d3) <= epsilon && onSegment(b1, a1, b2, epsilon)) return true
  if (Math.abs(d4) <= epsilon && onSegment(b1, a2, b2, epsilon)) return true
  return false
}

export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + Number.EPSILON) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function pointToSegmentDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  if (nearlyEqual(dx, 0) && nearlyEqual(dy, 0)) {
    return Math.hypot(p.x - a.x, p.y - a.y)
  }
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)))
  const proj = { x: a.x + t * dx, y: a.y + t * dy }
  return Math.hypot(p.x - proj.x, p.y - proj.y)
}

export function rectIntersectsCell(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  cellMinX: number,
  cellMinY: number,
  cellMaxX: number,
  cellMaxY: number,
): boolean {
  return !(maxX < cellMinX || minX > cellMaxX || maxY < cellMinY || minY > cellMaxY)
}
