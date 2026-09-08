import { configureStore } from '@reduxjs/toolkit'
import floorPlanReducer from '../store/floorplan/floorPlanSlice'
import selectionReducer from '../store/floorplan/selectionSlice'
import viewportReducer from '../store/floorplan/viewportSlice'
import historyReducer from '../store/floorplan/historySlice'

export const store = configureStore({
  reducer: {
    floorPlan: floorPlanReducer,
    selection: selectionReducer,
    viewport: viewportReducer,
    history: historyReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
