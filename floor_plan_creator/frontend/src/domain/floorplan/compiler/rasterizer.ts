import type { FloorElement } from '../models/element'
import type { FloorPlan } from '../models/floorPlan'
import type { Geometry, Point } from '../models/geometry'
import { geometryBounds, rectangleCorners } from '../geometry/bounds'
import { pointInPolygon, pointToSegmentDistance } from '../geometry/intersections'
import { getPriority, getSemanticCode } from '../models/semanticRegistry'
import { extractEdges } from '../geometry/polygons'
import type { Door } from '../models/door'

export function createEmptyMatrix(rows: number, columns: number, fill = 0): number[][] {
  return Array.from({ length: rows }, () => Array.from({ length: columns }, () => fill))
}

function cellCenter(col: number, row: number, precision: number): Point {
  return {
    x: col * precision + precision / 2,
    y: row * precision + precision / 2,
  }
}

function geometryOccupiesCell(
  geometry: Geometry,
  col: number,
  row: number,
  precision: number,
): boolean {
  const minX = col * precision
  const minY = row * precision
  const maxX = minX + precision
  const maxY = minY + precision
  const center = cellCenter(col, row, precision)
  const bounds = geometryBounds(geometry)

  // Broad phase
  if (
    bounds.maxX < minX ||
    bounds.minX > maxX ||
    bounds.maxY < minY ||
    bounds.minY > maxY
  ) {
    return false
  }

  switch (geometry.type) {
    case 'RECTANGLE': {
      const corners = rectangleCorners(geometry)
      if (pointInPolygon(center, corners)) return true
      // Check edge proximity for thin rectangles / boundaries
      for (let i = 0; i < corners.length; i++) {
        const a = corners[i]
        const b = corners[(i + 1) % corners.length]
        if (pointToSegmentDistance(center, a, b) <= precision / 2) return true
      }
      // Cell overlaps AABB of unrotated rect approximately via bounds
      return !(
        bounds.maxX < minX ||
        bounds.minX > maxX ||
        bounds.maxY < minY ||
        bounds.minY > maxY
      ) && (geometry.rotation === 0
        ? center.x >= geometry.x &&
          center.x <= geometry.x + geometry.width &&
          center.y >= geometry.y &&
          center.y <= geometry.y + geometry.height
        : pointInPolygon(center, corners))
    }
    case 'POLYGON':
      return pointInPolygon(center, geometry.points)
    case 'LINE':
      return pointToSegmentDistance(center, geometry.start, geometry.end) <= precision / 2
    case 'CIRCLE': {
      const dx = center.x - geometry.x
      const dy = center.y - geometry.y
      return Math.hypot(dx, dy) <= geometry.radius
    }
  }
}

export interface CellCandidate {
  code: number
  priority: number
  sourceId: string
}

export function rasterizeElement(
  element: FloorElement,
  rows: number,
  columns: number,
  precision: number,
): CellCandidate[] {
  const candidates: CellCandidate[] = []
  const typeId = element.semantic?.typeId ?? 'EMPTY'
  const code = element.semantic?.code ?? getSemanticCode(typeId)
  const priority = getPriority(typeId)
  const bounds = geometryBounds(element.geometry)

  const minCol = Math.max(0, Math.floor(bounds.minX / precision))
  const maxCol = Math.min(columns - 1, Math.floor(bounds.maxX / precision))
  const minRow = Math.max(0, Math.floor(bounds.minY / precision))
  const maxRow = Math.min(rows - 1, Math.floor(bounds.maxY / precision))

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (geometryOccupiesCell(element.geometry, col, row, precision)) {
        candidates.push({
          code,
          priority,
          sourceId: `${element.id}:${row}:${col}`,
        })
      }
    }
  }
  return candidates
}

export function applyCandidatesToMatrix(
  matrix: number[][],
  priorities: number[][],
  candidates: Array<{ row: number; col: number; code: number; priority: number }>,
): void {
  for (const c of candidates) {
    if (c.row < 0 || c.col < 0 || c.row >= matrix.length || c.col >= matrix[0].length) {
      continue
    }
    if (c.priority >= priorities[c.row][c.col]) {
      priorities[c.row][c.col] = c.priority
      matrix[c.row][c.col] = c.code
    }
  }
}

export function rasterizeElementOnto(
  element: FloorElement,
  semanticMatrix: number[][],
  priorityMatrix: number[][],
  precision: number,
): void {
  const rows = semanticMatrix.length
  const columns = semanticMatrix[0]?.length ?? 0
  const typeId = element.semantic?.typeId ?? 'EMPTY'
  const code = element.semantic?.code ?? getSemanticCode(typeId)
  const priority = getPriority(typeId)
  const bounds = geometryBounds(element.geometry)

  const minCol = Math.max(0, Math.floor(bounds.minX / precision))
  const maxCol = Math.min(columns - 1, Math.floor(bounds.maxX / precision))
  const minRow = Math.max(0, Math.floor(bounds.minY / precision))
  const maxRow = Math.min(rows - 1, Math.floor(bounds.maxY / precision))

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (geometryOccupiesCell(element.geometry, col, row, precision)) {
        if (priority >= priorityMatrix[row][col]) {
          priorityMatrix[row][col] = priority
          semanticMatrix[row][col] = code
        }
      }
    }
  }
}

export function rasterizeEdgesOnto(
  plan: FloorPlan,
  edgeMatrix: number[][],
  precision: number,
): void {
  const rows = edgeMatrix.length
  const columns = edgeMatrix[0]?.length ?? 0
  const edges = extractEdges
  for (const element of plan.elements) {
    for (const edge of edges(element)) {
      const minX = Math.min(edge.start.x, edge.end.x)
      const maxX = Math.max(edge.start.x, edge.end.x)
      const minY = Math.min(edge.start.y, edge.end.y)
      const maxY = Math.max(edge.start.y, edge.end.y)
      const minCol = Math.max(0, Math.floor(minX / precision) - 1)
      const maxCol = Math.min(columns - 1, Math.floor(maxX / precision) + 1)
      const minRow = Math.max(0, Math.floor(minY / precision) - 1)
      const maxRow = Math.min(rows - 1, Math.floor(maxY / precision) + 1)

      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const center = cellCenter(col, row, precision)
          if (pointToSegmentDistance(center, edge.start, edge.end) <= precision / 2) {
            edgeMatrix[row][col] = Math.max(edgeMatrix[row][col], edge.weight)
          }
        }
      }
    }
  }

  for (const merged of plan.mergedEdges) {
    const { start, end } = merged.geometry
    const minX = Math.min(start.x, end.x)
    const maxX = Math.max(start.x, end.x)
    const minY = Math.min(start.y, end.y)
    const maxY = Math.max(start.y, end.y)
    const minCol = Math.max(0, Math.floor(minX / precision) - 1)
    const maxCol = Math.min(columns - 1, Math.floor(maxX / precision) + 1)
    const minRow = Math.max(0, Math.floor(minY / precision) - 1)
    const maxRow = Math.min(rows - 1, Math.floor(maxY / precision) + 1)

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const center = cellCenter(col, row, precision)
        if (pointToSegmentDistance(center, start, end) <= precision / 2) {
          edgeMatrix[row][col] = Math.max(edgeMatrix[row][col], merged.weight)
        }
      }
    }
  }
}

function doorWorldSegment(plan: FloorPlan, door: Door): { start: Point; end: Point } | null {
  const host = plan.elements.find((e) => e.id === door.hostElementId)
  if (!host) return null
  const edges = extractEdges(host)
  const edge = edges[door.edgeIndex]
  if (!edge) return null

  const dx = edge.end.x - edge.start.x
  const dy = edge.end.y - edge.start.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const midX = edge.start.x + dx * door.position
  const midY = edge.start.y + dy * door.position
  const half = door.width / 2
  return {
    start: { x: midX - ux * half, y: midY - uy * half },
    end: { x: midX + ux * half, y: midY + uy * half },
  }
}

export function rasterizeDoorsOnto(
  plan: FloorPlan,
  doorMatrix: number[][],
  semanticMatrix: number[][],
  priorityMatrix: number[][],
  precision: number,
): void {
  const doorCode = getSemanticCode('DOOR')
  const doorPriority = getPriority('DOOR')
  const rows = doorMatrix.length
  const columns = doorMatrix[0]?.length ?? 0

  for (const door of plan.doors) {
    const segment = doorWorldSegment(plan, door)
    if (!segment) continue
    const minX = Math.min(segment.start.x, segment.end.x)
    const maxX = Math.max(segment.start.x, segment.end.x)
    const minY = Math.min(segment.start.y, segment.end.y)
    const maxY = Math.max(segment.start.y, segment.end.y)
    const minCol = Math.max(0, Math.floor(minX / precision) - 1)
    const maxCol = Math.min(columns - 1, Math.floor(maxX / precision) + 1)
    const minRow = Math.max(0, Math.floor(minY / precision) - 1)
    const maxRow = Math.min(rows - 1, Math.floor(maxY / precision) + 1)

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const center = cellCenter(col, row, precision)
        if (pointToSegmentDistance(center, segment.start, segment.end) <= precision / 2) {
          doorMatrix[row][col] = 1
          if (doorPriority >= priorityMatrix[row][col]) {
            priorityMatrix[row][col] = doorPriority
            semanticMatrix[row][col] = doorCode
          }
        }
      }
    }
  }
}
