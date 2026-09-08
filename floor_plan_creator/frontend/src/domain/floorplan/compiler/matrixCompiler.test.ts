import { describe, expect, it } from 'vitest'
import { compileFloorPlan } from './matrixCompiler'
import { createEmptyFloorPlan, createFloorElement } from '../factories'
import { getSemanticCode } from '../models/semanticRegistry'

describe('matrix compiler', () => {
  it('compiles an empty floor to zero matrices', () => {
    const plan = createEmptyFloorPlan('Test', 4, 4)
    plan.grid.precision = 1
    plan.grid.rows = 4
    plan.grid.columns = 4
    const compiled = compileFloorPlan(plan)
    expect(compiled.rows).toBe(4)
    expect(compiled.columns).toBe(4)
    expect(compiled.semanticMatrix.flat().every((v) => v === 0)).toBe(true)
  })

  it('rasterizes a meeting room with semantic code from registry', () => {
    const plan = createEmptyFloorPlan('Test', 6, 6)
    plan.grid.precision = 1
    plan.grid.rows = 6
    plan.grid.columns = 6
    plan.elements.push(
      createFloorElement(
        { type: 'RECTANGLE', x: 1, y: 1, width: 3, height: 2, rotation: 0 },
        { semanticTypeId: 'MEETING_ROOM', label: 'Conference A' },
      ),
    )
    const compiled = compileFloorPlan(plan)
    const code = getSemanticCode('MEETING_ROOM')
    expect(compiled.semanticMatrix[1][1]).toBe(code)
    expect(compiled.semanticMatrix[2][3]).toBe(code)
    expect(compiled.occupancyMatrix[1][1]).toBe(1)
    expect(compiled.edgeMatrix.some((row) => row.some((v) => v > 0))).toBe(true)
  })

  it('applies door priority over room cells', () => {
    const plan = createEmptyFloorPlan('Test', 5, 5)
    plan.grid.precision = 1
    plan.grid.rows = 5
    plan.grid.columns = 5
    const room = createFloorElement(
      { type: 'RECTANGLE', x: 1, y: 1, width: 3, height: 3, rotation: 0 },
      { semanticTypeId: 'MEETING_ROOM' },
    )
    plan.elements.push(room)
    plan.doors.push({
      id: 'door1',
      hostElementId: room.id,
      position: 0.5,
      width: 1,
      orientation: 'HORIZONTAL',
      edgeIndex: 0,
      swing: 'LEFT',
    })
    const compiled = compileFloorPlan(plan)
    expect(compiled.doorMatrix.flat().some((v) => v === 1)).toBe(true)
    expect(compiled.semanticMatrix.flat().includes(getSemanticCode('DOOR'))).toBe(
      true,
    )
  })
})
