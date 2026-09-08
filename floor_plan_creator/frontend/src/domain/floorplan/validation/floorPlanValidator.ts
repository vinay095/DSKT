import type { FloorElement } from '../models/element'
import type { FloorPlan } from '../models/floorPlan'
import type { Geometry, PolygonGeometry } from '../models/geometry'
import { geometryBounds, isValidPolygon } from '../geometry/bounds'
import { getSemanticType } from '../models/semanticRegistry'
import { extractEdges } from '../geometry/polygons'

export interface ValidationIssue {
  level: 'error' | 'warning'
  code: string
  message: string
  elementId?: string
}

export function validateGeometry(geometry: Geometry): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  switch (geometry.type) {
    case 'RECTANGLE':
      if (geometry.width <= 0 || geometry.height <= 0) {
        issues.push({
          level: 'error',
          code: 'INVALID_RECTANGLE',
          message: 'Rectangle width and height must be greater than 0.',
        })
      }
      break
    case 'POLYGON':
      if (!isValidPolygon(geometry)) {
        issues.push({
          level: 'error',
          code: 'INVALID_POLYGON',
          message: 'Polygon must have at least 3 points and non-zero area.',
        })
      }
      break
    case 'LINE':
      if (
        geometry.start.x === geometry.end.x &&
        geometry.start.y === geometry.end.y
      ) {
        issues.push({
          level: 'error',
          code: 'INVALID_LINE',
          message: 'Line start and end must differ.',
        })
      }
      break
    case 'CIRCLE':
      if (geometry.radius <= 0) {
        issues.push({
          level: 'error',
          code: 'INVALID_CIRCLE',
          message: 'Circle radius must be greater than 0.',
        })
      }
      break
  }
  return issues
}

export function validateElement(element: FloorElement): ValidationIssue[] {
  const issues = validateGeometry(element.geometry).map((issue) => ({
    ...issue,
    elementId: element.id,
  }))
  if (element.semantic) {
    try {
      const type = getSemanticType(element.semantic.typeId)
      if (type.code !== element.semantic.code) {
        issues.push({
          level: 'warning',
          code: 'SEMANTIC_CODE_MISMATCH',
          message: `Element ${element.id} semantic code does not match registry.`,
          elementId: element.id,
        })
      }
    } catch {
      issues.push({
        level: 'error',
        code: 'UNKNOWN_SEMANTIC',
        message: `Unknown semantic type ${element.semantic.typeId}.`,
        elementId: element.id,
      })
    }
  }
  return issues
}

export function validateFloorPlan(plan: FloorPlan): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (plan.dimensions.width <= 0 || plan.dimensions.height <= 0) {
    issues.push({
      level: 'error',
      code: 'INVALID_DIMENSIONS',
      message: 'Floor dimensions must be greater than 0.',
    })
  }
  if (plan.grid.precision <= 0) {
    issues.push({
      level: 'error',
      code: 'INVALID_PRECISION',
      message: 'Grid precision must be greater than 0.',
    })
  }

  for (const element of plan.elements) {
    issues.push(...validateElement(element))
    const bounds = geometryBounds(element.geometry)
    if (
      bounds.minX < 0 ||
      bounds.minY < 0 ||
      bounds.maxX > plan.dimensions.width ||
      bounds.maxY > plan.dimensions.height
    ) {
      issues.push({
        level: 'warning',
        code: 'OUTSIDE_BOUNDARY',
        message: `Element ${element.semantic?.label ?? element.id} is outside the floor boundary.`,
        elementId: element.id,
      })
    }
  }

  for (const door of plan.doors) {
    const host = plan.elements.find((e) => e.id === door.hostElementId)
    if (!host) {
      issues.push({
        level: 'error',
        code: 'DOOR_HOST_MISSING',
        message: `Door ${door.id} references missing host.`,
      })
      continue
    }
    const typeId = host.semantic?.typeId
    if (!typeId || !getSemanticType(typeId).allowsDoor) {
      issues.push({
        level: 'error',
        code: 'DOOR_HOST_INCOMPATIBLE',
        message: `Door host does not allow doors.`,
        elementId: host.id,
      })
    }
    const edges = extractEdges(host)
    if (!edges[door.edgeIndex]) {
      issues.push({
        level: 'error',
        code: 'DOOR_EDGE_INVALID',
        message: `Door ${door.id} edge index is invalid.`,
      })
    }
    if (door.width <= 0) {
      issues.push({
        level: 'error',
        code: 'DOOR_WIDTH_INVALID',
        message: `Door ${door.id} width must be greater than 0.`,
      })
    }
  }

  for (const room of plan.elements) {
    if (room.semantic && getSemanticType(room.semantic.typeId).allowsDoor) {
      const hasDoor = plan.doors.some((d) => d.hostElementId === room.id)
      if (!hasDoor) {
        issues.push({
          level: 'warning',
          code: 'ROOM_NO_DOOR',
          message: `${room.semantic.label ?? room.semantic.typeId} has no door.`,
          elementId: room.id,
        })
      }
    }
  }

  for (const merged of plan.mergedEdges) {
    if (merged.sourceEdgeIds.length < 2) {
      issues.push({
        level: 'error',
        code: 'MERGED_EDGE_INVALID',
        message: `Merged edge ${merged.id} must reference at least two source edges.`,
      })
    }
  }

  return issues
}

export function assertPolygon(points: PolygonGeometry['points']): boolean {
  return isValidPolygon({ type: 'POLYGON', points, rotation: 0 })
}
