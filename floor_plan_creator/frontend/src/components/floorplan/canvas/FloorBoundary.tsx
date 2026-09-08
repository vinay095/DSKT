import { Layer, Rect } from 'react-konva'
import { useAppSelector } from '../../../app/hooks'
import { pixelsPerWorldUnit } from '../../../domain/floorplan/geometry/coordinates'

export function FloorBoundary() {
  const { dimensions, grid } = useAppSelector((s) => s.floorPlan.floorPlan)
  const ppu = pixelsPerWorldUnit(grid.cellSize, grid.precision)
  const scale = useAppSelector((s) => s.viewport.scale)

  return (
    <Layer listening={false}>
      <Rect
        x={0}
        y={0}
        width={dimensions.width * ppu}
        height={dimensions.height * ppu}
        stroke="#0f172a"
        strokeWidth={2 / scale}
        fill="rgba(248, 250, 252, 0.65)"
      />
    </Layer>
  )
}
