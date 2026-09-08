import type { Edge } from '../models/edge'
import type { FloorElement } from '../models/element'
import type { FloorPlan } from '../models/floorPlan'
import type { Point } from '../models/geometry'
import { getEdgeWeight } from '../models/semanticRegistry'
import { rectangleCorners } from './bounds'
import { createId } from '../../../utils/ids'

function edgeFromPoints(
  element: FloorElement,
  start: Point,
  end: Point,
  index: number,
): Edge {
  const typeId = element.semantic?.typeId ?? 'EMPTY'
  return {
    id: `${element.id}_edge_${index}`,
    elementId: element.id,
    start: { ...start },
    end: { ...end },
    weight: getEdgeWeight(typeId),
    semanticType: typeId,
  }
}

export function extractEdges(element: FloorElement): Edge[] {
  const geometry = element.geometry
  switch (geometry.type) {
    case 'RECTANGLE': {
      const corners = rectangleCorners(geometry)
      return corners.map((start, i) =>
        edgeFromPoints(element, start, corners[(i + 1) % corners.length], i),
      )
    }
    case 'POLYGON': {
      const pts = geometry.points
      if (pts.length < 2) return []
      return pts.map((start, i) =>
        edgeFromPoints(element, start, pts[(i + 1) % pts.length], i),
      )
    }
    case 'LINE':
      return [edgeFromPoints(element, geometry.start, geometry.end, 0)]
    case 'CIRCLE':
      return []
  }
}

export function extractAllEdges(plan: FloorPlan): Edge[] {
  return plan.elements.flatMap(extractEdges)
}

export function createMergedEdgeId(): string {
  return createId('merged')
}
