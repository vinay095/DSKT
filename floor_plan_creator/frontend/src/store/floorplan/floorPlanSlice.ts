import {
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit'
import type { Door } from '../../domain/floorplan/models/door'
import type { MergedEdge } from '../../domain/floorplan/models/edge'
import type { FloorElement } from '../../domain/floorplan/models/element'
import type { FloorPlan } from '../../domain/floorplan/models/floorPlan'
import type { Geometry } from '../../domain/floorplan/models/geometry'
import type { GridConfig } from '../../domain/floorplan/models/grid'
import { createEmptyFloorPlan } from '../../domain/floorplan/factories'
import { createSemanticAssignment } from '../../domain/floorplan/factories'
import { getSemanticType } from '../../domain/floorplan/models/semanticRegistry'

export type EditorTool =
  | 'SELECT'
  | 'PAN'
  | 'RECTANGLE'
  | 'POLYGON'
  | 'LINE'
  | 'DOOR'

interface FloorPlanState {
  floorPlan: FloorPlan
  tool: EditorTool
  ui: {
    showGrid: boolean
    showCoordinates: boolean
    showMatrixPreview: boolean
    snapToGrid: boolean
  }
}

const initialState: FloorPlanState = {
  floorPlan: createEmptyFloorPlan(),
  tool: 'SELECT',
  ui: {
    showGrid: true,
    showCoordinates: true,
    showMatrixPreview: false,
    snapToGrid: true,
  },
}

function touch(plan: FloorPlan): FloorPlan {
  return {
    ...plan,
    metadata: {
      ...plan.metadata,
      updatedAt: new Date().toISOString(),
      dirty: true,
      version: plan.metadata.version + 1,
    },
  }
}

const floorPlanSlice = createSlice({
  name: 'floorPlan',
  initialState,
  reducers: {
    setFloorPlan(state, action: PayloadAction<FloorPlan>) {
      state.floorPlan = action.payload
    },
    setTool(state, action: PayloadAction<EditorTool>) {
      state.tool = action.payload
    },
    setName(state, action: PayloadAction<string>) {
      state.floorPlan = touch({ ...state.floorPlan, name: action.payload })
    },
    setDimensions(
      state,
      action: PayloadAction<{ width: number; height: number }>,
    ) {
      const { width, height } = action.payload
      const precision = state.floorPlan.grid.precision
      state.floorPlan = touch({
        ...state.floorPlan,
        dimensions: { ...state.floorPlan.dimensions, width, height },
        grid: {
          ...state.floorPlan.grid,
          rows: Math.ceil(height / precision),
          columns: Math.ceil(width / precision),
        },
      })
    },
    updateGrid(state, action: PayloadAction<Partial<GridConfig>>) {
      const grid = { ...state.floorPlan.grid, ...action.payload }
      if (action.payload.precision || action.payload.snapToGrid !== undefined) {
        state.ui.snapToGrid = grid.snapToGrid
      }
      if (action.payload.showCoordinates !== undefined) {
        state.ui.showCoordinates = grid.showCoordinates
      }
      state.floorPlan = touch({
        ...state.floorPlan,
        grid,
        dimensions: {
          ...state.floorPlan.dimensions,
          unit: grid.worldUnit,
        },
      })
    },
    addElement(state, action: PayloadAction<FloorElement>) {
      const elements = [...state.floorPlan.elements, action.payload]
      state.floorPlan = touch({ ...state.floorPlan, elements })
    },
    removeElements(state, action: PayloadAction<string[]>) {
      const ids = new Set(action.payload)
      state.floorPlan = touch({
        ...state.floorPlan,
        elements: state.floorPlan.elements.filter((e) => !ids.has(e.id)),
        doors: state.floorPlan.doors.filter((d) => !ids.has(d.hostElementId)),
      })
    },
    updateElementGeometry(
      state,
      action: PayloadAction<{ id: string; geometry: Geometry }>,
    ) {
      state.floorPlan = touch({
        ...state.floorPlan,
        elements: state.floorPlan.elements.map((e) =>
          e.id === action.payload.id
            ? { ...e, geometry: action.payload.geometry }
            : e,
        ),
      })
    },
    updateElement(
      state,
      action: PayloadAction<{ id: string; changes: Partial<FloorElement> }>,
    ) {
      state.floorPlan = touch({
        ...state.floorPlan,
        elements: state.floorPlan.elements.map((e) =>
          e.id === action.payload.id ? { ...e, ...action.payload.changes } : e,
        ),
      })
    },
    setElementSemantic(
      state,
      action: PayloadAction<{ id: string; typeId: string; label?: string }>,
    ) {
      const type = getSemanticType(action.payload.typeId)
      state.floorPlan = touch({
        ...state.floorPlan,
        elements: state.floorPlan.elements.map((e) => {
          if (e.id !== action.payload.id) return e
          return {
            ...e,
            semantic: createSemanticAssignment(
              action.payload.typeId,
              action.payload.label ?? e.semantic?.label,
            ),
            style: {
              ...e.style,
              fill: type.fill ?? e.style.fill,
              stroke: type.stroke ?? e.style.stroke,
            },
          }
        }),
      })
    },
    setElementLabel(
      state,
      action: PayloadAction<{ id: string; label: string }>,
    ) {
      state.floorPlan = touch({
        ...state.floorPlan,
        elements: state.floorPlan.elements.map((e) => {
          if (e.id !== action.payload.id || !e.semantic) return e
          return {
            ...e,
            semantic: { ...e.semantic, label: action.payload.label },
          }
        }),
      })
    },
    addDoor(state, action: PayloadAction<Door>) {
      state.floorPlan = touch({
        ...state.floorPlan,
        doors: [...state.floorPlan.doors, action.payload],
      })
    },
    updateDoor(state, action: PayloadAction<Door>) {
      state.floorPlan = touch({
        ...state.floorPlan,
        doors: state.floorPlan.doors.map((d) =>
          d.id === action.payload.id ? action.payload : d,
        ),
      })
    },
    removeDoors(state, action: PayloadAction<string[]>) {
      const ids = new Set(action.payload)
      state.floorPlan = touch({
        ...state.floorPlan,
        doors: state.floorPlan.doors.filter((d) => !ids.has(d.id)),
      })
    },
    addMergedEdge(state, action: PayloadAction<MergedEdge>) {
      state.floorPlan = touch({
        ...state.floorPlan,
        mergedEdges: [...state.floorPlan.mergedEdges, action.payload],
      })
    },
    removeMergedEdge(state, action: PayloadAction<string>) {
      state.floorPlan = touch({
        ...state.floorPlan,
        mergedEdges: state.floorPlan.mergedEdges.filter(
          (e) => e.id !== action.payload,
        ),
      })
    },
    setUi(
      state,
      action: PayloadAction<Partial<FloorPlanState['ui']>>,
    ) {
      state.ui = { ...state.ui, ...action.payload }
      if (action.payload.snapToGrid !== undefined) {
        state.floorPlan.grid.snapToGrid = action.payload.snapToGrid
      }
      if (action.payload.showCoordinates !== undefined) {
        state.floorPlan.grid.showCoordinates = action.payload.showCoordinates
      }
    },
    markClean(state) {
      state.floorPlan.metadata.dirty = false
    },
    replaceFloorPlanState(state, action: PayloadAction<FloorPlan>) {
      state.floorPlan = action.payload
    },
  },
})

export const {
  setFloorPlan,
  setTool,
  setName,
  setDimensions,
  updateGrid,
  addElement,
  removeElements,
  updateElementGeometry,
  updateElement,
  setElementSemantic,
  setElementLabel,
  addDoor,
  updateDoor,
  removeDoors,
  addMergedEdge,
  removeMergedEdge,
  setUi,
  markClean,
  replaceFloorPlanState,
} = floorPlanSlice.actions

export default floorPlanSlice.reducer
