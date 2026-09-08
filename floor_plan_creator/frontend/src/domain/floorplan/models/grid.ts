export type WorldUnit = 'm' | 'ft'

export interface GridConfig {
  rows: number
  columns: number
  /** Visual cell size in screen pixels at 100% zoom. */
  cellSize: number
  worldUnit: WorldUnit
  /** Physical size of one grid cell in world units. */
  precision: number
  snapToGrid: boolean
  showCoordinates: boolean
}
