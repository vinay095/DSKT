import { Layer, Line } from 'react-konva'
import { useAppSelector } from '../../../app/hooks'
import { pixelsPerWorldUnit } from '../../../domain/floorplan/geometry/coordinates'
import { extractEdges } from '../../../domain/floorplan/geometry/polygons'

export function DoorLayer() {
  const floorPlan = useAppSelector((s) => s.floorPlan.floorPlan)
  const scale = useAppSelector((s) => s.viewport.scale)
  const ppu = pixelsPerWorldUnit(
    floorPlan.grid.cellSize,
    floorPlan.grid.precision,
  )

  return (
    <Layer listening={false}>
      {floorPlan.doors.map((door) => {
        const host = floorPlan.elements.find((e) => e.id === door.hostElementId)
        if (!host) return null
        const edge = extractEdges(host)[door.edgeIndex]
        if (!edge) return null
        const dx = edge.end.x - edge.start.x
        const dy = edge.end.y - edge.start.y
        const len = Math.hypot(dx, dy) || 1
        const ux = dx / len
        const uy = dy / len
        const midX = edge.start.x + dx * door.position
        const midY = edge.start.y + dy * door.position
        const half = door.width / 2
        const start = { x: midX - ux * half, y: midY - uy * half }
        const end = { x: midX + ux * half, y: midY + uy * half }
        return (
          <Line
            key={door.id}
            points={[start.x * ppu, start.y * ppu, end.x * ppu, end.y * ppu]}
            stroke="#f59e0b"
            strokeWidth={4 / scale}
            lineCap="round"
          />
        )
      })}
    </Layer>
  )
}
