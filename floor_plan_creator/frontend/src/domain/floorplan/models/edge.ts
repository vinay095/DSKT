import type { Point } from './geometry'

export interface Edge {
  id: string
  elementId: string
  start: Point
  end: Point
  weight: number
  semanticType: string
}

export interface MergedEdge {
  id: string
  sourceEdgeIds: string[]
  geometry: {
    type: 'LINE'
    start: Point
    end: Point
  }
  weight: number
  semanticOwnerIds: string[]
}

export type EdgeRelation =
  | 'NONE'
  | 'TOUCHING'
  | 'CROSSING'
  | 'OVERLAPPING'
  | 'COINCIDENT'
