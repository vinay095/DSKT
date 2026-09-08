import { Circle, Group, Line, Rect, Text } from 'react-konva'
import type { FloorElement } from '../../../domain/floorplan/models/element'
import { pixelsPerWorldUnit } from '../../../domain/floorplan/geometry/coordinates'
import type { GridConfig } from '../../../domain/floorplan/models/grid'

interface Props {
  element: FloorElement
  grid: GridConfig
  selected: boolean
  scale: number
  draggable: boolean
  onSelect: (id: string, additive: boolean) => void
  onDragEnd: (id: string, x: number, y: number) => void
  onTransformEnd: (
    id: string,
    attrs: {
      x: number
      y: number
      width: number
      height: number
      rotation: number
      scaleX: number
      scaleY: number
    },
  ) => void
}

export function ElementRenderer({
  element,
  grid,
  selected,
  scale,
  draggable,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: Props) {
  const ppu = pixelsPerWorldUnit(grid.cellSize, grid.precision)
  const { geometry, style } = element
  if (!element.visible) return null

  const common = {
    id: element.id,
    stroke: selected ? '#f59e0b' : style.stroke,
    strokeWidth: (selected ? style.strokeWidth + 1 : style.strokeWidth) / scale,
    fill: style.fill,
    opacity: style.opacity,
    draggable: draggable && !element.locked,
    onClick: (e: { cancelBubble: boolean; evt: MouseEvent }) => {
      e.cancelBubble = true
      onSelect(element.id, e.evt.shiftKey)
    },
    onTap: (e: { cancelBubble: boolean }) => {
      e.cancelBubble = true
      onSelect(element.id, false)
    },
  }

  if (geometry.type === 'RECTANGLE') {
    return (
      <Group>
        <Rect
          {...common}
          name="floor-element"
          x={geometry.x * ppu}
          y={geometry.y * ppu}
          width={geometry.width * ppu}
          height={geometry.height * ppu}
          rotation={geometry.rotation}
          offsetX={0}
          offsetY={0}
          onDragEnd={(e) => {
            onDragEnd(element.id, e.target.x() / ppu, e.target.y() / ppu)
          }}
          onTransformEnd={(e) => {
            const node = e.target
            onTransformEnd(element.id, {
              x: node.x() / ppu,
              y: node.y() / ppu,
              width: (node.width() * node.scaleX()) / ppu,
              height: (node.height() * node.scaleY()) / ppu,
              rotation: node.rotation(),
              scaleX: node.scaleX(),
              scaleY: node.scaleY(),
            })
            node.scaleX(1)
            node.scaleY(1)
          }}
        />
        {element.semantic?.label ? (
          <Text
            x={geometry.x * ppu + 4}
            y={geometry.y * ppu + 4}
            text={element.semantic.label}
            fontSize={12 / scale}
            fill="#0f172a"
            listening={false}
          />
        ) : null}
      </Group>
    )
  }

  if (geometry.type === 'POLYGON') {
    const flat = geometry.points.flatMap((p) => [p.x * ppu, p.y * ppu])
    return (
      <Line
        {...common}
        name="floor-element"
        points={flat}
        closed
        onDragEnd={(e) => {
          onDragEnd(element.id, e.target.x() / ppu, e.target.y() / ppu)
        }}
      />
    )
  }

  if (geometry.type === 'LINE') {
    return (
      <Line
        {...common}
        name="floor-element"
        points={[
          geometry.start.x * ppu,
          geometry.start.y * ppu,
          geometry.end.x * ppu,
          geometry.end.y * ppu,
        ]}
        fill={undefined}
      />
    )
  }

  return (
    <Circle
      {...common}
      name="floor-element"
      x={geometry.x * ppu}
      y={geometry.y * ppu}
      radius={geometry.radius * ppu}
    />
  )
}
