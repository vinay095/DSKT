import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface SelectionState {
  selectedIds: string[]
  selectedDoorIds: string[]
}

const initialState: SelectionState = {
  selectedIds: [],
  selectedDoorIds: [],
}

const selectionSlice = createSlice({
  name: 'selection',
  initialState,
  reducers: {
    selectElements(state, action: PayloadAction<string[]>) {
      state.selectedIds = action.payload
      state.selectedDoorIds = []
    },
    toggleElement(state, action: PayloadAction<string>) {
      const id = action.payload
      if (state.selectedIds.includes(id)) {
        state.selectedIds = state.selectedIds.filter((x) => x !== id)
      } else {
        state.selectedIds.push(id)
      }
      state.selectedDoorIds = []
    },
    clearSelection(state) {
      state.selectedIds = []
      state.selectedDoorIds = []
    },
    selectDoors(state, action: PayloadAction<string[]>) {
      state.selectedDoorIds = action.payload
      state.selectedIds = []
    },
  },
})

export const { selectElements, toggleElement, clearSelection, selectDoors } =
  selectionSlice.actions

export default selectionSlice.reducer
