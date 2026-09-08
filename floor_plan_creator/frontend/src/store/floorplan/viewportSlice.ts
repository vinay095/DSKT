import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface ViewportState {
  scale: number
  /** Visible scrollport size (not the scaled floor size). */
  stageWidth: number
  stageHeight: number
}

const MIN_SCALE = 0.15
const MAX_SCALE = 8

const initialState: ViewportState = {
  scale: 1,
  stageWidth: 800,
  stageHeight: 600,
}

function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

const viewportSlice = createSlice({
  name: 'viewport',
  initialState,
  reducers: {
    setViewport(state, action: PayloadAction<Partial<ViewportState>>) {
      if (action.payload.scale !== undefined) {
        state.scale = clampScale(action.payload.scale)
      }
      if (action.payload.stageWidth !== undefined) {
        state.stageWidth = action.payload.stageWidth
      }
      if (action.payload.stageHeight !== undefined) {
        state.stageHeight = action.payload.stageHeight
      }
    },
    setScale(state, action: PayloadAction<number>) {
      state.scale = clampScale(action.payload)
    },
    zoomBy(state, action: PayloadAction<number>) {
      state.scale = clampScale(state.scale * action.payload)
    },
    resetViewport(state) {
      state.scale = 1
    },
  },
})

export const { setViewport, setScale, zoomBy, resetViewport } =
  viewportSlice.actions
export default viewportSlice.reducer
