import { describe, expect, it } from 'vitest'
import { classifyEdgeRelation } from './edges'
import { normalizeRectangle } from './transforms'
import { extractEdges } from './polygons'
import { createFloorElement } from '../factories'

describe('geometry edges', () => {
  it('normalizes rectangles drawn in any direction', () => {
    expect(normalizeRectangle(5, 5, 1, 2)).toEqual({
      type: 'RECTANGLE',
      x: 1,
      y: 2,
      width: 4,
      height: 3,
      rotation: 0,
    })
  })

  it('extracts 4 edges from a rectangle', () => {
    const element = createFloorElement(
      { type: 'RECTANGLE', x: 0, y: 0, width: 4, height: 2, rotation: 0 },
      { semanticTypeId: 'MEETING_ROOM' },
    )
    const edges = extractEdges(element)
    expect(edges).toHaveLength(4)
    expect(edges.every((e) => e.weight === 10)).toBe(true)
  })

  it('classifies overlapping segments', () => {
    expect(
      classifyEdgeRelation(
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: 0 },
        { x: 15, y: 0 },
      ),
    ).toBe('OVERLAPPING')
  })

  it('classifies crossing segments', () => {
    expect(
      classifyEdgeRelation(
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: -5 },
        { x: 5, y: 5 },
      ),
    ).toBe('CROSSING')
  })

  it('classifies coincident segments', () => {
    expect(
      classifyEdgeRelation(
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ),
    ).toBe('COINCIDENT')
  })
})
