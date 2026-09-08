import type { Door } from './door'
import type { MergedEdge } from './edge'
import type { FloorElement } from './element'
import type { GridConfig, WorldUnit } from './grid'

export interface FloorPlanDimensions {
  width: number
  height: number
  unit: WorldUnit
}

export interface FloorPlanMetadata {
  createdAt: string
  updatedAt: string
  version: number
  dirty: boolean
}

export interface FloorPlan {
  id: string
  name: string
  dimensions: FloorPlanDimensions
  grid: GridConfig
  elements: FloorElement[]
  doors: Door[]
  mergedEdges: MergedEdge[]
  metadata: FloorPlanMetadata
}

export interface CompiledFloorPlan {
  semanticMatrix: number[][]
  edgeMatrix: number[][]
  doorMatrix: number[][]
  occupancyMatrix: number[][]
  connectivityMatrix: number[][]
  rows: number
  columns: number
  precision: number
  unit: WorldUnit
}
