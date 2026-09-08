import type { Geometry } from './geometry'
import type { SemanticAssignment } from './semantic'

export interface ElementStyle {
  fill: string
  stroke: string
  strokeWidth: number
  opacity: number
}

export interface FloorElement {
  id: string
  geometry: Geometry
  semantic?: SemanticAssignment
  style: ElementStyle
  locked: boolean
  visible: boolean
  zIndex: number
}
