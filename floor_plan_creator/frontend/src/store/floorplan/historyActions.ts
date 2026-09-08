import type { AppDispatch, RootState } from '../../app/store'
import type { FloorPlan } from '../../domain/floorplan/models/floorPlan'
import { replaceFloorPlanState } from './floorPlanSlice'
import {
  clearApply,
  pushHistory,
  redo as redoAction,
  undo as undoAction,
  type HistoryStateWithApply,
} from './historySlice'
import { clearSelection } from './selectionSlice'

export function commitMutation(
  dispatch: AppDispatch,
  getState: () => RootState,
  mutate: () => void,
): void {
  const before = structuredClone(getState().floorPlan.floorPlan) as FloorPlan
  dispatch(pushHistory(before))
  mutate()
}

export function undoLast(dispatch: AppDispatch, getState: () => RootState): void {
  const current = getState().floorPlan.floorPlan
  dispatch(undoAction({ current }))
  const apply = (getState().history as HistoryStateWithApply)._apply
  if (apply) {
    dispatch(replaceFloorPlanState(apply))
    dispatch(clearSelection())
    dispatch(clearApply())
  }
}

export function redoLast(dispatch: AppDispatch, getState: () => RootState): void {
  const current = getState().floorPlan.floorPlan
  dispatch(redoAction({ current }))
  const apply = (getState().history as HistoryStateWithApply)._apply
  if (apply) {
    dispatch(replaceFloorPlanState(apply))
    dispatch(clearSelection())
    dispatch(clearApply())
  }
}
