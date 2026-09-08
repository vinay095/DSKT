import { describe, expect, it } from 'vitest'
import {
  gridToWorld,
  pixelsPerWorldUnit,
  screenToWorld,
  snapToGrid,
  worldToGrid,
  worldToScreen,
} from './coordinates'

describe('coordinates', () => {
  it('converts world to grid and back for cell origins', () => {
    const precision = 0.5
    const { col, row } = worldToGrid(12.37, 4.1, precision)
    expect(col).toBe(24)
    expect(row).toBe(8)
    expect(gridToWorld(col, row, precision)).toEqual({ x: 12, y: 4 })
  })

  it('snaps to precision', () => {
    expect(snapToGrid(12.37, 0.5)).toBe(12.5)
    expect(snapToGrid(12.24, 0.5)).toBe(12)
  })

  it('round-trips world <-> screen with zoom and pan', () => {
    const viewport = { scale: 2, offsetX: 40, offsetY: 20 }
    const ppu = pixelsPerWorldUnit(40, 0.5)
    const screen = worldToScreen(10, 5, viewport, ppu)
    const world = screenToWorld(screen.x, screen.y, viewport, ppu)
    expect(world.x).toBeCloseTo(10)
    expect(world.y).toBeCloseTo(5)
  })

  it('zoom does not alter world geometry meaning', () => {
    const ppu = 80
    const a = worldToScreen(3, 4, { scale: 1, offsetX: 0, offsetY: 0 }, ppu)
    const b = worldToScreen(3, 4, { scale: 2, offsetX: 0, offsetY: 0 }, ppu)
    expect(b.x).toBe(a.x * 2)
    expect(b.y).toBe(a.y * 2)
  })
})
