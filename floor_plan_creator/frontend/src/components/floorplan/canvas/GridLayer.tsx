import type { ReactElement } from 'react'
import { Line, Layer } from 'react-konva'
import { useAppSelector } from '../../../app/hooks'
import { pixelsPerWorldUnit } from '../../../domain/floorplan/geometry/coordinates'

export function GridLayer() {
  const floorPlan = useAppSelector((s) => s.floorPlan.floorPlan)
  const showGrid = useAppSelector((s) => s.floorPlan.ui.showGrid)
  const scale = useAppSelector((s) => s.viewport.scale)

  if (!showGrid) return null

  const { grid, dimensions } = floorPlan
  const ppu = pixelsPerWorldUnit(grid.cellSize, grid.precision)
  const widthPx = dimensions.width * ppu
  const heightPx = dimensions.height * ppu
  const step = grid.precision * ppu
  const majorEvery = Math.max(1, Math.round(1 / grid.precision))

  const lines: ReactElement[] = []
  let index = 0
  for (let x = 0; x <= widthPx + 0.001; x += step) {
    const isMajor = index % majorEvery === 0
    lines.push(
      <Line
        key={`v-${index}`}
        points={[x, 0, x, heightPx]}
        stroke={isMajor ? '#94a3b8' : '#e2e8f0'}
        strokeWidth={(isMajor ? 1.25 : 0.75) / scale}
        listening={false}
      />,
    )
    index++
  }
  index = 0
  for (let y = 0; y <= heightPx + 0.001; y += step) {
    const isMajor = index % majorEvery === 0
    lines.push(
      <Line
        key={`h-${index}`}
        points={[0, y, widthPx, y]}
        stroke={isMajor ? '#94a3b8' : '#e2e8f0'}
        strokeWidth={(isMajor ? 1.25 : 0.75) / scale}
        listening={false}
      />,
    )
    index++
  }

  return <Layer listening={false}>{lines}</Layer>
}
