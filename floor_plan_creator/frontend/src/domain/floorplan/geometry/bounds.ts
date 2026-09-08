import type { Geometry, Point, PolygonGeometry, RectangleGeometry } from '../models/geometry'
import { rotatePoint } from './transforms'

export interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export function boundsFromPoints(points: Point[]): Bounds {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }
  let minX = points[0].x
  let minY = points[0].y
  let maxX = points[0].x
  let maxY = points[0].y
  for (let i = 1; i < points.length; i++) {
    const p = points[i]
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  return { minX, minY, maxX, maxY }
}

export function rectangleCorners(rect: RectangleGeometry): Point[] {
  const corners: Point[] = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ]
  if (!rect.rotation) return corners
  const origin = {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  }
  return corners.map((c) => rotatePoint(c, origin, rect.rotation))
}

export function geometryBounds(geometry: Geometry): Bounds {
  switch (geometry.type) {
    case 'RECTANGLE':
      return boundsFromPoints(rectangleCorners(geometry))
    case 'POLYGON':
      return boundsFromPoints(geometry.points)
    case 'LINE':
      return boundsFromPoints([geometry.start, geometry.end])
    case 'CIRCLE':
      return {
        minX: geometry.x - geometry.radius,
        minY: geometry.y - geometry.radius,
        maxX: geometry.x + geometry.radius,
        maxY: geometry.y + geometry.radius,
      }
  }
}

export function boundsIntersect(a: Bounds, b: Bounds): boolean {
  return !(a.maxX < b.minX || b.maxX < a.minX || a.maxY < b.minY || b.maxY < a.minY)
}

export function pointInBounds(point: Point, bounds: Bounds): boolean {
  return (
    point.x >= bounds.minX &&
    point.x <= bounds.maxX &&
    point.y >= bounds.minY &&
    point.y <= bounds.maxY
  )
}

export function polygonArea(points: Point[]): number {
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    area += points[i].x * points[j].y
    area -= points[j].x * points[i].y
  }
  return Math.abs(area) / 2
}

export function isValidPolygon(polygon: PolygonGeometry): boolean {
  return polygon.points.length >= 3 && polygonArea(polygon.points) > 1e-9
}
