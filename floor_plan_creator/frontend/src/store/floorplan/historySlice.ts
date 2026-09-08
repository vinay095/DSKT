import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { FloorPlan } from '../../domain/floorplan/models/floorPlan'

const MAX_HISTORY = 50

interface HistoryState {
  past: FloorPlan[]
  future: FloorPlan[]
}

export type HistoryStateWithApply = HistoryState & { _apply?: FloorPlan }

const initialState: HistoryState = {
  past: [],
  future: [],
}

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    pushHistory(state, action: PayloadAction<FloorPlan>) {
      state.past.push(structuredClone(action.payload))
      if (state.past.length > MAX_HISTORY) {
        state.past.shift()
      }
      state.future = []
    },
    undo(state, action: PayloadAction<{ current: FloorPlan }>) {
      const previous = state.past.pop()
      if (!previous) return
      state.future.unshift(structuredClone(action.payload.current))
      ;(state as HistoryStateWithApply)._apply = previous
    },
    redo(state, action: PayloadAction<{ current: FloorPlan }>) {
      const next = state.future.shift()
      if (!next) return
      state.past.push(structuredClone(action.payload.current))
      ;(state as HistoryStateWithApply)._apply = next
    },
    clearHistory(state) {
      state.past = []
      state.future = []
    },
    clearApply(state) {
      delete (state as HistoryStateWithApply)._apply
    },
  },
})

export const { pushHistory, undo, redo, clearHistory, clearApply } =
  historySlice.actions

export default historySlice.reducer
