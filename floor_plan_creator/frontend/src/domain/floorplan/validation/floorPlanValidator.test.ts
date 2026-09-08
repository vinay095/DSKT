import { describe, expect, it } from 'vitest'
import { getSemanticType, SEMANTIC_TYPES } from '../models/semanticRegistry'
import { createEmptyFloorPlan, createFloorElement } from '../factories'
import { validateFloorPlan } from './floorPlanValidator'
import { parseFloorPlan } from './schemas'

describe('domain validation', () => {
  it('keeps semantic type and label separate', () => {
    const element = createFloorElement(
      { type: 'RECTANGLE', x: 0, y: 0, width: 2, height: 2, rotation: 0 },
      { semanticTypeId: 'MEETING_ROOM', label: 'Conference Room A' },
    )
    expect(element.semantic?.typeId).toBe('MEETING_ROOM')
    expect(element.semantic?.code).toBe(SEMANTIC_TYPES.MEETING_ROOM.code)
    expect(element.semantic?.label).toBe('Conference Room A')
  })

  it('warns when a room has no door', () => {
    const plan = createEmptyFloorPlan()
    plan.elements.push(
      createFloorElement(
        { type: 'RECTANGLE', x: 1, y: 1, width: 4, height: 3, rotation: 0 },
        { semanticTypeId: 'MEETING_ROOM', label: 'Meeting Room A' },
      ),
    )
    const issues = validateFloorPlan(plan)
    expect(issues.some((i) => i.code === 'ROOM_NO_DOOR')).toBe(true)
  })

  it('parses persisted floor plans with zod', () => {
    const plan = createEmptyFloorPlan('Persisted', 10, 10)
    const parsed = parseFloorPlan(JSON.parse(JSON.stringify(plan)))
    expect(parsed.name).toBe('Persisted')
    expect(getSemanticType('DESK').code).toBe(2)
  })
})
