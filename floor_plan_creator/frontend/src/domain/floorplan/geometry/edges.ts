import type { Edge, EdgeRelation } from '../models/edge'
import type { Point } from '../models/geometry'
import { distance, midpoint, nearlyEqual, pointsEqual } from './transforms'

const EPS = 1e-6

function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

function onSegment(p: Point, q: Point, r: Point, epsilon = EPS): boolean {
  return (
    q.x <= Math.max(p.x, r.x) + epsilon &&
    q.x >= Math.min(p.x, r.x) - epsilon &&
    q.y <= Math.max(p.y, r.y) + epsilon &&
    q.y >= Math.min(p.y, r.y) - epsilon
  )
}

function areParallel(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
  const ax = a2.x - a1.x
  const ay = a2.y - a1.y
  const bx = b2.x - b1.x
  const by = b2.y - b1.y
  return nearlyEqual(ax * by - ay * bx, 0, EPS)
}

function areCollinear(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
  return (
    areParallel(a1, a2, b1, b2) &&
    Math.abs(cross(a1, a2, b1)) <= EPS &&
    Math.abs(cross(a1, a2, b2)) <= EPS
  )
}

function projectParam(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 < EPS * EPS) return 0
  return ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2
}

function overlapInterval(
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point,
): { start: number; end: number } | null {
  const t1 = projectParam(b1, a1, a2)
  const t2 = projectParam(b2, a1, a2)
  const start = Math.min(t1, t2)
  const end = Math.max(t1, t2)
  const overlapStart = Math.max(0, start)
  const overlapEnd = Math.min(1, end)
  if (overlapEnd - overlapStart <= EPS) return null
  return { start: overlapStart, end: overlapEnd }
}

function properIntersection(
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point,
): boolean {
  const d1 = cross(a1, a2, b1)
  const d2 = cross(a1, a2, b2)
  const d3 = cross(b1, b2, a1)
  const d4 = cross(b1, b2, a2)

  return (
    ((d1 > EPS && d2 < -EPS) || (d1 < -EPS && d2 > EPS)) &&
    ((d3 > EPS && d4 < -EPS) || (d3 < -EPS && d4 > EPS))
  )
}

export function classifyEdgeRelation(
  e1Start: Point,
  e1End: Point,
  e2Start: Point,
  e2End: Point,
): EdgeRelation {
  if (
    (pointsEqual(e1Start, e2Start) && pointsEqual(e1End, e2End)) ||
    (pointsEqual(e1Start, e2End) && pointsEqual(e1End, e2Start))
  ) {
    return 'COINCIDENT'
  }

  if (areCollinear(e1Start, e1End, e2Start, e2End)) {
    const overlap = overlapInterval(e1Start, e1End, e2Start, e2End)
    if (overlap) {
      if (nearlyEqual(overlap.start, 0) && nearlyEqual(overlap.end, 1)) {
        return 'COINCIDENT'
      }
      return 'OVERLAPPING'
    }
    const touch =
      pointsEqual(e1Start, e2Start) ||
      pointsEqual(e1Start, e2End) ||
      pointsEqual(e1End, e2Start) ||
      pointsEqual(e1End, e2End) ||
      onSegment(e1Start, e2Start, e1End) ||
      onSegment(e1Start, e2End, e1End) ||
      onSegment(e2Start, e1Start, e2End) ||
      onSegment(e2Start, e1End, e2End)
    return touch ? 'TOUCHING' : 'NONE'
  }

  if (properIntersection(e1Start, e1End, e2Start, e2End)) {
    return 'CROSSING'
  }

  const endpointTouch =
    pointsEqual(e1Start, e2Start) ||
    pointsEqual(e1Start, e2End) ||
    pointsEqual(e1End, e2Start) ||
    pointsEqual(e1End, e2End)

  if (endpointTouch) return 'TOUCHING'

  return 'NONE'
}

export function classifyEdges(a: Edge, b: Edge): EdgeRelation {
  return classifyEdgeRelation(a.start, a.end, b.start, b.end)
}

export function mergeCandidateGeometry(
  a: Edge,
  b: Edge,
): { start: Point; end: Point } | null {
  const relation = classifyEdges(a, b)
  if (relation !== 'OVERLAPPING' && relation !== 'COINCIDENT') return null
  const points = [a.start, a.end, b.start, b.end]
  let maxDist = -1
  let start = a.start
  let end = a.end
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const d = distance(points[i], points[j])
      if (d > maxDist) {
        maxDist = d
        start = points[i]
        end = points[j]
      }
    }
  }
  return { start, end }
}

export function edgeMidpoint(edge: Edge): Point {
  return midpoint(edge.start, edge.end)
}
