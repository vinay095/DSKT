import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Stage, Layer, Line, Rect, Circle } from 'react-konva'
import type Konva from 'konva'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { GridLayer } from './GridLayer'
import { FloorBoundary } from './FloorBoundary'
import { ElementsLayer } from './ElementsLayer'
import { DoorLayer } from './DoorLayer'
import { setScale, setViewport } from '../../../store/floorplan/viewportSlice'
import {
  addDoor,
  addElement,
  setTool,
} from '../../../store/floorplan/floorPlanSlice'
import {
  clearSelection,
  selectElements,
} from '../../../store/floorplan/selectionSlice'
import {
  pixelsPerWorldUnit,
  screenToWorld,
} from '../../../domain/floorplan/geometry/coordinates'
import { snapWorldPoint } from '../../../domain/floorplan/grid/snapping'
import { normalizeRectangle } from '../../../domain/floorplan/geometry/transforms'
import { createFloorElement } from '../../../domain/floorplan/factories'
import { pushHistory } from '../../../store/floorplan/historySlice'
import type { Point } from '../../../domain/floorplan/models/geometry'
import { extractEdges } from '../../../domain/floorplan/geometry/polygons'
import { getSemanticType } from '../../../domain/floorplan/models/semanticRegistry'
import { createId } from '../../../utils/ids'
import { pointToSegmentDistance } from '../../../domain/floorplan/geometry/intersections'

const FLOOR_PADDING = 48
const MIN_SCALE = 0.15
const MAX_SCALE = 8

export function FloorPlanStage() {
  const dispatch = useAppDispatch()
  const scrollRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const floorPlan = useAppSelector((s) => s.floorPlan.floorPlan)
  const tool = useAppSelector((s) => s.floorPlan.tool)
  const scale = useAppSelector((s) => s.viewport.scale)
  const snapEnabled = useAppSelector((s) => s.floorPlan.ui.snapToGrid)
  const [spacePan, setSpacePan] = useState(false)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const isPanning = useRef(false)
  const lastPointer = useRef<Point | null>(null)
  const pendingScroll = useRef<{ left: number; top: number } | null>(null)
  const shouldCenterScroll = useRef(true)
  const skipNextScaleCenter = useRef(false)

  const [rectDraft, setRectDraft] = useState<{
    start: Point
    current: Point
  } | null>(null)
  const [polyPoints, setPolyPoints] = useState<Point[]>([])
  const [lineDraft, setLineDraft] = useState<{
    start: Point
    current: Point
  } | null>(null)
  const [doorHover, setDoorHover] = useState<{
    hostId: string
    edgeIndex: number
    position: number
    point: Point
  } | null>(null)

  const ppu = pixelsPerWorldUnit(
    floorPlan.grid.cellSize,
    floorPlan.grid.precision,
  )

  const contentWidth = floorPlan.dimensions.width * ppu
  const contentHeight = floorPlan.dimensions.height * ppu
  const scaledWidth = contentWidth * scale
  const scaledHeight = contentHeight * scale

  const hostSize = useMemo(() => {
    return {
      width: Math.max(containerSize.width, scaledWidth + FLOOR_PADDING * 2),
      height: Math.max(containerSize.height, scaledHeight + FLOOR_PADDING * 2),
    }
  }, [containerSize.height, containerSize.width, scaledHeight, scaledWidth])

  const toWorld = useCallback(
    (stageX: number, stageY: number): Point => {
      const world = screenToWorld(
        stageX,
        stageY,
        { scale, offsetX: 0, offsetY: 0 },
        ppu,
      )
      return snapWorldPoint(world, floorPlan.grid.precision, snapEnabled)
    },
    [scale, ppu, floorPlan.grid.precision, snapEnabled],
  )

  const centerScroll = useCallback(() => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return
    scrollEl.scrollLeft = Math.max(
      0,
      (scrollEl.scrollWidth - scrollEl.clientWidth) / 2,
    )
    scrollEl.scrollTop = Math.max(
      0,
      (scrollEl.scrollHeight - scrollEl.clientHeight) / 2,
    )
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const measure = () => {
      setContainerSize({
        width: el.clientWidth,
        height: el.clientHeight,
      })
      dispatch(
        setViewport({
          stageWidth: el.clientWidth,
          stageHeight: el.clientHeight,
        }),
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [dispatch])

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return

    if (pendingScroll.current) {
      scrollEl.scrollLeft = pendingScroll.current.left
      scrollEl.scrollTop = pendingScroll.current.top
      pendingScroll.current = null
      return
    }

    if (shouldCenterScroll.current) {
      centerScroll()
      shouldCenterScroll.current = false
    }
  }, [centerScroll, hostSize.height, hostSize.width, scale])

  // Keep the floor centered when zooming via toolbar / keyboard (+/-).
  const prevScaleRef = useRef(scale)
  useLayoutEffect(() => {
    if (prevScaleRef.current === scale) return
    prevScaleRef.current = scale
    if (skipNextScaleCenter.current) {
      skipNextScaleCenter.current = false
      return
    }
    if (shouldCenterScroll.current) return
    centerScroll()
  }, [centerScroll, scale])

  useEffect(() => {
    shouldCenterScroll.current = true
  }, [floorPlan.dimensions.width, floorPlan.dimensions.height, floorPlan.grid.precision, floorPlan.grid.cellSize])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpacePan(true)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpacePan(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  const findDoorPlacement = (
    world: Point,
  ): {
    hostId: string
    edgeIndex: number
    position: number
    point: Point
    dist: number
  } | null => {
    let best: {
      hostId: string
      edgeIndex: number
      position: number
      point: Point
      dist: number
    } | null = null
    for (const element of floorPlan.elements) {
      const typeId = element.semantic?.typeId
      if (!typeId || !getSemanticType(typeId).allowsDoor) continue
      const edges = extractEdges(element)
      edges.forEach((edge, edgeIndex) => {
        const dist = pointToSegmentDistance(world, edge.start, edge.end)
        if (dist > floorPlan.grid.precision) return
        const dx = edge.end.x - edge.start.x
        const dy = edge.end.y - edge.start.y
        const len2 = dx * dx + dy * dy || 1
        let t =
          ((world.x - edge.start.x) * dx + (world.y - edge.start.y) * dy) / len2
        t = Math.max(0.05, Math.min(0.95, t))
        const point = {
          x: edge.start.x + dx * t,
          y: edge.start.y + dy * t,
        }
        if (!best || dist < best.dist) {
          best = {
            hostId: element.id,
            edgeIndex,
            position: t,
            point,
            dist,
          }
        }
      })
    }
    return best
  }

  const applyZoom = (nextScale: number, anchorClientX?: number, anchorClientY?: number) => {
    const scrollEl = scrollRef.current
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale))
    if (!scrollEl || clamped === scale) {
      dispatch(setScale(clamped))
      return
    }

    const rect = scrollEl.getBoundingClientRect()
    const mouseX =
      anchorClientX !== undefined
        ? anchorClientX - rect.left
        : scrollEl.clientWidth / 2
    const mouseY =
      anchorClientY !== undefined
        ? anchorClientY - rect.top
        : scrollEl.clientHeight / 2

    const oldStageLeft = (hostSize.width - scaledWidth) / 2
    const oldStageTop = (hostSize.height - scaledHeight) / 2
    const contentX =
      (scrollEl.scrollLeft + mouseX - oldStageLeft) / scale
    const contentY =
      (scrollEl.scrollTop + mouseY - oldStageTop) / scale

    const newScaledWidth = contentWidth * clamped
    const newScaledHeight = contentHeight * clamped
    const newHostWidth = Math.max(
      scrollEl.clientWidth,
      newScaledWidth + FLOOR_PADDING * 2,
    )
    const newHostHeight = Math.max(
      scrollEl.clientHeight,
      newScaledHeight + FLOOR_PADDING * 2,
    )
    const newStageLeft = (newHostWidth - newScaledWidth) / 2
    const newStageTop = (newHostHeight - newScaledHeight) / 2

    pendingScroll.current = {
      left: contentX * clamped + newStageLeft - mouseX,
      top: contentY * clamped + newStageTop - mouseY,
    }
    skipNextScaleCenter.current = true
    dispatch(setScale(clamped))
  }

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return

    if (!(e.evt.ctrlKey || e.evt.metaKey)) {
      // Forward wheel to scrollbars while pointer is over the canvas.
      scrollEl.scrollLeft += e.evt.deltaX
      scrollEl.scrollTop += e.evt.deltaY
      return
    }

    e.evt.preventDefault()
    const direction = e.evt.deltaY > 0 ? -1 : 1
    const factor = 1.08
    const next = direction > 0 ? scale * factor : scale / factor
    applyZoom(next, e.evt.clientX, e.evt.clientY)
  }

  const handlePointerDown = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    const stage = stageRef.current
    if (!stage) return
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const mouseEvent = e.evt as MouseEvent
    if (tool === 'PAN' || spacePan || mouseEvent.button === 1) {
      isPanning.current = true
      lastPointer.current = {
        x: 'clientX' in e.evt ? e.evt.clientX : pointer.x,
        y: 'clientY' in e.evt ? e.evt.clientY : pointer.y,
      }
      return
    }

    if (e.target === stage) {
      dispatch(clearSelection())
    }

    const world = toWorld(pointer.x, pointer.y)

    if (tool === 'RECTANGLE') {
      setRectDraft({ start: world, current: world })
      return
    }
    if (tool === 'LINE') {
      setLineDraft({ start: world, current: world })
      return
    }
    if (tool === 'POLYGON') {
      setPolyPoints((pts) => [...pts, world])
      return
    }
    if (tool === 'DOOR') {
      const placement = findDoorPlacement(world)
      if (!placement) return
      const host = floorPlan.elements.find((el) => el.id === placement.hostId)
      if (!host) return
      const edge = extractEdges(host)[placement.edgeIndex]
      const orientation =
        Math.abs(edge.end.x - edge.start.x) >=
        Math.abs(edge.end.y - edge.start.y)
          ? 'HORIZONTAL'
          : 'VERTICAL'
      dispatch(pushHistory(structuredClone(floorPlan)))
      dispatch(
        addDoor({
          id: createId('door'),
          hostElementId: placement.hostId,
          position: placement.position,
          width: 0.9,
          orientation,
          swing: 'LEFT',
          edgeIndex: placement.edgeIndex,
        }),
      )
      dispatch(setTool('SELECT'))
    }
  }

  const handlePointerMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = stageRef.current
    if (!stage) return
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    if (isPanning.current && lastPointer.current && scrollRef.current) {
      const clientX = 'clientX' in e.evt ? e.evt.clientX : pointer.x
      const clientY = 'clientY' in e.evt ? e.evt.clientY : pointer.y
      scrollRef.current.scrollLeft -= clientX - lastPointer.current.x
      scrollRef.current.scrollTop -= clientY - lastPointer.current.y
      lastPointer.current = { x: clientX, y: clientY }
      return
    }

    const world = toWorld(pointer.x, pointer.y)
    if (rectDraft) setRectDraft({ ...rectDraft, current: world })
    if (lineDraft) setLineDraft({ ...lineDraft, current: world })
    if (tool === 'DOOR') {
      setDoorHover(findDoorPlacement(world))
    } else if (doorHover) {
      setDoorHover(null)
    }
  }

  const handlePointerUp = () => {
    if (isPanning.current) {
      isPanning.current = false
      lastPointer.current = null
      return
    }

    if (rectDraft) {
      const geom = normalizeRectangle(
        rectDraft.start.x,
        rectDraft.start.y,
        rectDraft.current.x,
        rectDraft.current.y,
      )
      if (geom.width > 0 && geom.height > 0) {
        dispatch(pushHistory(structuredClone(floorPlan)))
        const element = createFloorElement(geom, {
          zIndex: floorPlan.elements.length,
        })
        dispatch(addElement(element))
        dispatch(selectElements([element.id]))
        dispatch(setTool('SELECT'))
      }
      setRectDraft(null)
    }

    if (lineDraft) {
      const { start, current: end } = lineDraft
      if (start.x !== end.x || start.y !== end.y) {
        dispatch(pushHistory(structuredClone(floorPlan)))
        const element = createFloorElement(
          { type: 'LINE', start, end },
          { zIndex: floorPlan.elements.length },
        )
        dispatch(addElement(element))
        dispatch(selectElements([element.id]))
        dispatch(setTool('SELECT'))
      }
      setLineDraft(null)
    }
  }

  const handleDblClick = () => {
    if (tool !== 'POLYGON' || polyPoints.length < 3) return
    dispatch(pushHistory(structuredClone(floorPlan)))
    const element = createFloorElement(
      { type: 'POLYGON', points: polyPoints, rotation: 0 },
      { zIndex: floorPlan.elements.length },
    )
    dispatch(addElement(element))
    dispatch(selectElements([element.id]))
    setPolyPoints([])
    dispatch(setTool('SELECT'))
  }

  const draftRect = rectDraft
    ? normalizeRectangle(
        rectDraft.start.x,
        rectDraft.start.y,
        rectDraft.current.x,
        rectDraft.current.y,
      )
    : null

  // Expose zoom helpers for toolbar via custom events when reset happens
  useEffect(() => {
    const onReset = () => {
      shouldCenterScroll.current = true
      centerScroll()
    }
    window.addEventListener('floorplan:center-viewport', onReset)
    return () => window.removeEventListener('floorplan:center-viewport', onReset)
  }, [centerScroll])

  return (
    <div
      ref={scrollRef}
      className="h-full w-full overflow-auto bg-slate-100"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        ref={hostRef}
        className="flex items-center justify-center"
        style={{
          width: hostSize.width,
          height: hostSize.height,
          minWidth: '100%',
          minHeight: '100%',
        }}
      >
        <Stage
          ref={stageRef}
          width={scaledWidth}
          height={scaledHeight}
          scaleX={scale}
          scaleY={scale}
          onWheel={handleWheel}
          onMouseDown={handlePointerDown}
          onMousemove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          onDblClick={handleDblClick}
          style={{
            cursor:
              tool === 'PAN' || spacePan
                ? 'grab'
                : tool === 'SELECT'
                  ? 'default'
                  : 'crosshair',
            boxShadow: '0 0 0 1px #cbd5e1',
            background: '#f8fafc',
          }}
        >
          <GridLayer />
          <FloorBoundary />
          <ElementsLayer />
          <DoorLayer />
          <Layer listening={false}>
            {draftRect ? (
              <Rect
                x={draftRect.x * ppu}
                y={draftRect.y * ppu}
                width={draftRect.width * ppu}
                height={draftRect.height * ppu}
                stroke="#2563eb"
                dash={[6, 4]}
                strokeWidth={1.5 / scale}
                fill="rgba(37, 99, 235, 0.12)"
              />
            ) : null}
            {lineDraft ? (
              <Line
                points={[
                  lineDraft.start.x * ppu,
                  lineDraft.start.y * ppu,
                  lineDraft.current.x * ppu,
                  lineDraft.current.y * ppu,
                ]}
                stroke="#2563eb"
                dash={[6, 4]}
                strokeWidth={1.5 / scale}
              />
            ) : null}
            {polyPoints.length > 0 ? (
              <Line
                points={polyPoints.flatMap((p) => [p.x * ppu, p.y * ppu])}
                stroke="#2563eb"
                dash={[6, 4]}
                strokeWidth={1.5 / scale}
              />
            ) : null}
            {doorHover ? (
              <Circle
                x={doorHover.point.x * ppu}
                y={doorHover.point.y * ppu}
                radius={6 / scale}
                fill="#f59e0b"
              />
            ) : null}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
