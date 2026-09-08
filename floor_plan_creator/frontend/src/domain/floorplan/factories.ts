import type { ElementStyle, FloorElement } from './models/element'
import type { FloorPlan } from './models/floorPlan'
import type { Geometry } from './models/geometry'
import type { GridConfig } from './models/grid'
import type { SemanticAssignment } from './models/semantic'
import { getSemanticType } from './models/semanticRegistry'
import { createId } from '../../utils/ids'

export const DEFAULT_STYLE: ElementStyle = {
  fill: 'rgba(148, 163, 184, 0.25)',
  stroke: '#334155',
  strokeWidth: 2,
  opacity: 1,
}

export function createDefaultGrid(overrides: Partial<GridConfig> = {}): GridConfig {
  return {
    rows: 20,
    columns: 20,
    cellSize: 40,
    worldUnit: 'm',
    precision: 0.5,
    snapToGrid: true,
    showCoordinates: true,
    ...overrides,
  }
}

export function createEmptyFloorPlan(
  name = 'Untitled Floor Plan',
  width = 20,
  height = 20,
): FloorPlan {
  const now = new Date().toISOString()
  const precision = 0.5
  return {
    id: createId('fp'),
    name,
    dimensions: { width, height, unit: 'm' },
    grid: createDefaultGrid({
      rows: Math.ceil(height / precision),
      columns: Math.ceil(width / precision),
      precision,
    }),
    elements: [],
    doors: [],
    mergedEdges: [],
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: 1,
      dirty: false,
    },
  }
}

export function createSemanticAssignment(
  typeId: string,
  label?: string,
): SemanticAssignment {
  const type = getSemanticType(typeId)
  return {
    typeId: type.id,
    code: type.code,
    label,
  }
}

export function createFloorElement(
  geometry: Geometry,
  options: {
    semanticTypeId?: string
    label?: string
    style?: Partial<ElementStyle>
    zIndex?: number
  } = {},
): FloorElement {
  const semantic = options.semanticTypeId
    ? createSemanticAssignment(options.semanticTypeId, options.label)
    : undefined
  const type = options.semanticTypeId
    ? getSemanticType(options.semanticTypeId)
    : undefined

  return {
    id: createId('el'),
    geometry,
    semantic,
    style: {
      ...DEFAULT_STYLE,
      fill: type?.fill ?? DEFAULT_STYLE.fill,
      stroke: type?.stroke ?? DEFAULT_STYLE.stroke,
      ...options.style,
    },
    locked: false,
    visible: true,
    zIndex: options.zIndex ?? 0,
  }
}
