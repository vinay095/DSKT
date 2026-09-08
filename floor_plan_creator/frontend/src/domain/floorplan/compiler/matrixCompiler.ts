import type { CompiledFloorPlan, FloorPlan } from '../models/floorPlan'
import {
  createEmptyMatrix,
  rasterizeDoorsOnto,
  rasterizeEdgesOnto,
  rasterizeElementOnto,
} from './rasterizer'

function resolveGridSize(plan: FloorPlan): { rows: number; columns: number } {
  const { precision } = plan.grid
  const columns = Math.max(
    plan.grid.columns,
    Math.ceil(plan.dimensions.width / precision),
  )
  const rows = Math.max(
    plan.grid.rows,
    Math.ceil(plan.dimensions.height / precision),
  )
  return { rows, columns }
}

export function compileFloorPlan(plan: FloorPlan): CompiledFloorPlan {
  const { rows, columns } = resolveGridSize(plan)
  const precision = plan.grid.precision

  const semanticMatrix = createEmptyMatrix(rows, columns, 0)
  const priorityMatrix = createEmptyMatrix(rows, columns, -1)
  const edgeMatrix = createEmptyMatrix(rows, columns, 0)
  const doorMatrix = createEmptyMatrix(rows, columns, 0)

  const sorted = [...plan.elements]
    .filter((e) => e.visible)
    .sort((a, b) => a.zIndex - b.zIndex)

  for (const element of sorted) {
    rasterizeElementOnto(element, semanticMatrix, priorityMatrix, precision)
  }

  rasterizeEdgesOnto(plan, edgeMatrix, precision)
  rasterizeDoorsOnto(plan, doorMatrix, semanticMatrix, priorityMatrix, precision)

  const occupancyMatrix = semanticMatrix.map((row) =>
    row.map((value) => (value === 0 ? 0 : 1)),
  )

  const connectivityMatrix = occupancyMatrix.map((row, r) =>
    row.map((occ, c) => {
      if (occ === 0) return 0
      if (doorMatrix[r][c] === 1) return 2
      return 1
    }),
  )

  return {
    semanticMatrix,
    edgeMatrix,
    doorMatrix,
    occupancyMatrix,
    connectivityMatrix,
    rows,
    columns,
    precision,
    unit: plan.dimensions.unit,
  }
}

export function matrixToCsv(matrix: number[][]): string {
  return matrix.map((row) => row.join(',')).join('\n')
}

export function matrixToJson(matrix: number[][]): string {
  return JSON.stringify(matrix)
}
