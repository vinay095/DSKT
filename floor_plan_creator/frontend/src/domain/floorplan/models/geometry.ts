export interface Point {
  x: number
  y: number
}

export interface RectangleGeometry {
  type: 'RECTANGLE'
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

export interface PolygonGeometry {
  type: 'POLYGON'
  points: Point[]
  rotation: number
}

export interface LineGeometry {
  type: 'LINE'
  start: Point
  end: Point
}

export interface CircleGeometry {
  type: 'CIRCLE'
  x: number
  y: number
  radius: number
  rotation: number
}

export type Geometry =
  | RectangleGeometry
  | PolygonGeometry
  | LineGeometry
  | CircleGeometry
