import { useEffect, useMemo, useRef } from 'react'
import { Layer, Transformer } from 'react-konva'
import type Konva from 'konva'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { ElementRenderer } from '../elements/ElementRenderer'
import { updateElementGeometry } from '../../../store/floorplan/floorPlanSlice'
import {
  selectElements,
  toggleElement,
} from '../../../store/floorplan/selectionSlice'
import { snapWorldPoint } from '../../../domain/floorplan/grid/snapping'
import { pushHistory } from '../../../store/floorplan/historySlice'

export function ElementsLayer() {
  const dispatch = useAppDispatch()
  const floorPlan = useAppSelector((s) => s.floorPlan.floorPlan)
  const tool = useAppSelector((s) => s.floorPlan.tool)
  const selectedIds = useAppSelector((s) => s.selection.selectedIds)
  const snapEnabled = useAppSelector((s) => s.floorPlan.ui.snapToGrid)
  const scale = useAppSelector((s) => s.viewport.scale)
  const trRef = useRef<Konva.Transformer>(null)
  const layerRef = useRef<Konva.Layer>(null)

  const sorted = useMemo(
    () => [...floorPlan.elements].sort((a, b) => a.zIndex - b.zIndex),
    [floorPlan.elements],
  )

  useEffect(() => {
    const tr = trRef.current
    const layer = layerRef.current
    if (!tr || !layer) return
    const nodes = selectedIds
      .map((id) => layer.findOne(`#${id}`))
      .filter(Boolean) as Konva.Node[]
    tr.nodes(nodes)
    tr.getLayer()?.batchDraw()
  }, [selectedIds, sorted])

  const handleSelect = (id: string, additive: boolean) => {
    if (tool !== 'SELECT') return
    if (additive) dispatch(toggleElement(id))
    else dispatch(selectElements([id]))
  }

  const persistBeforeEdit = () => {
    dispatch(pushHistory(structuredClone(floorPlan)))
  }

  const handleDragEnd = (id: string, x: number, y: number) => {
    const element = floorPlan.elements.find((e) => e.id === id)
    if (!element) return
    persistBeforeEdit()
    const snapped = snapWorldPoint(
      { x, y },
      floorPlan.grid.precision,
      snapEnabled,
    )
    const geometry = element.geometry
    if (geometry.type === 'RECTANGLE' || geometry.type === 'CIRCLE') {
      dispatch(
        updateElementGeometry({
          id,
          geometry: { ...geometry, x: snapped.x, y: snapped.y },
        }),
      )
    } else if (geometry.type === 'POLYGON') {
      dispatch(
        updateElementGeometry({
          id,
          geometry: {
            ...geometry,
            points: geometry.points.map((p) => ({
              x: p.x + snapped.x,
              y: p.y + snapped.y,
            })),
          },
        }),
      )
    }
  }

  const handleTransformEnd = (
    id: string,
    attrs: {
      x: number
      y: number
      width: number
      height: number
      rotation: number
    },
  ) => {
    const element = floorPlan.elements.find((e) => e.id === id)
    if (!element || element.geometry.type !== 'RECTANGLE') return
    persistBeforeEdit()
    const snappedPos = snapWorldPoint(
      { x: attrs.x, y: attrs.y },
      floorPlan.grid.precision,
      snapEnabled,
    )
    const snapSize = (v: number) =>
      snapEnabled
        ? Math.max(
            floorPlan.grid.precision,
            Math.round(v / floorPlan.grid.precision) * floorPlan.grid.precision,
          )
        : Math.max(floorPlan.grid.precision, v)

    dispatch(
      updateElementGeometry({
        id,
        geometry: {
          type: 'RECTANGLE',
          x: snappedPos.x,
          y: snappedPos.y,
          width: snapSize(attrs.width),
          height: snapSize(attrs.height),
          rotation: attrs.rotation,
        },
      }),
    )
  }

  return (
    <Layer ref={layerRef}>
      {sorted.map((element) => (
        <ElementRenderer
          key={element.id}
          element={element}
          grid={floorPlan.grid}
          selected={selectedIds.includes(element.id)}
          scale={scale}
          draggable={tool === 'SELECT'}
          onSelect={handleSelect}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
        />
      ))}
      {tool === 'SELECT' && selectedIds.length > 0 ? (
        <Transformer
          ref={trRef}
          rotateEnabled
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox
            return newBox
          }}
        />
      ) : null}
    </Layer>
  )
}
