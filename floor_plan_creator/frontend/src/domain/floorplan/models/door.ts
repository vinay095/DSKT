export type DoorOrientation = 'HORIZONTAL' | 'VERTICAL'
export type DoorSwing = 'LEFT' | 'RIGHT' | 'NONE'

export interface Door {
  id: string
  hostElementId: string
  /** Normalized position along host edge [0, 1]. */
  position: number
  width: number
  orientation: DoorOrientation
  swing?: DoorSwing
  edgeIndex: number
}
