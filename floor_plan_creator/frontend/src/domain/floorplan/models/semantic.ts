export type SemanticCategory =
  | 'ROOM'
  | 'FURNITURE'
  | 'INFRASTRUCTURE'
  | 'DECORATION'
  | 'EMPTY'

export interface SemanticType {
  id: string
  name: string
  code: number
  category: SemanticCategory
  edgeWeight: number
  priority: number
  allowsDoor: boolean
  defaultWidth?: number
  defaultHeight?: number
  fill?: string
  stroke?: string
}

export interface SemanticAssignment {
  typeId: string
  code: number
  label?: string
}
