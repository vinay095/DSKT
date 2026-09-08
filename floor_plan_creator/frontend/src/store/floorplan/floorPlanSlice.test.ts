import { describe, expect, it } from 'vitest'
import floorPlanReducer, {
  addElement,
  setElementSemantic,
  setTool,
} from '../../store/floorplan/floorPlanSlice'
import selectionReducer, {
  clearSelection,
  selectElements,
} from '../../store/floorplan/selectionSlice'
import { createFloorElement } from '../../domain/floorplan/factories'

describe('redux slices', () => {
  it('adds elements and updates selection', () => {
    let state = floorPlanReducer(undefined, { type: 'init' })
    const element = createFloorElement({
      type: 'RECTANGLE',
      x: 0,
      y: 0,
      width: 2,
      height: 2,
      rotation: 0,
    })
    state = floorPlanReducer(state, addElement(element))
    expect(state.floorPlan.elements).toHaveLength(1)
    expect(state.floorPlan.metadata.dirty).toBe(true)

    let selection = selectionReducer(undefined, selectElements([element.id]))
    expect(selection.selectedIds).toEqual([element.id])
    selection = selectionReducer(selection, clearSelection())
    expect(selection.selectedIds).toEqual([])
  })

  it('updates semantic code from registry when type changes', () => {
    let state = floorPlanReducer(undefined, { type: 'init' })
    const element = createFloorElement({
      type: 'RECTANGLE',
      x: 0,
      y: 0,
      width: 2,
      height: 2,
      rotation: 0,
    })
    state = floorPlanReducer(state, addElement(element))
    state = floorPlanReducer(
      state,
      setElementSemantic({ id: element.id, typeId: 'DESK', label: 'Desk 1' }),
    )
    expect(state.floorPlan.elements[0].semantic).toEqual({
      typeId: 'DESK',
      code: 2,
      label: 'Desk 1',
    })
    state = floorPlanReducer(state, setTool('RECTANGLE'))
    expect(state.tool).toBe('RECTANGLE')
  })
})
