import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { ELEMENT_TEMPLATES } from '../../../domain/floorplan/templates'
import { createFloorElement } from '../../../domain/floorplan/factories'
import {
  addElement,
  addMergedEdge,
  setDimensions,
  setUi,
  updateGrid,
} from '../../../store/floorplan/floorPlanSlice'
import { selectElements } from '../../../store/floorplan/selectionSlice'
import { pushHistory } from '../../../store/floorplan/historySlice'
import {
  classifyEdges,
  mergeCandidateGeometry,
} from '../../../domain/floorplan/geometry/edges'
import {
  createMergedEdgeId,
  extractAllEdges,
} from '../../../domain/floorplan/geometry/polygons'

export function EditorSidebar() {
  const dispatch = useAppDispatch()
  const floorPlan = useAppSelector((s) => s.floorPlan.floorPlan)
  const ui = useAppSelector((s) => s.floorPlan.ui)

  const placeTemplate = (
    semanticType: string,
    width: number,
    height: number,
  ) => {
    dispatch(pushHistory(structuredClone(floorPlan)))
    const element = createFloorElement(
      {
        type: 'RECTANGLE',
        x: floorPlan.grid.precision,
        y: floorPlan.grid.precision,
        width,
        height,
        rotation: 0,
      },
      {
        semanticTypeId: semanticType,
        zIndex: floorPlan.elements.length,
      },
    )
    dispatch(addElement(element))
    dispatch(selectElements([element.id]))
  }

  const mergeOverlappingEdges = () => {
    const edges = extractAllEdges(floorPlan)
    for (let i = 0; i < edges.length; i++) {
      for (let j = i + 1; j < edges.length; j++) {
        const a = edges[i]
        const b = edges[j]
        if (a.elementId === b.elementId) continue
        const relation = classifyEdges(a, b)
        if (relation !== 'OVERLAPPING' && relation !== 'COINCIDENT') continue
        const already = floorPlan.mergedEdges.some(
          (m) =>
            m.sourceEdgeIds.includes(a.id) && m.sourceEdgeIds.includes(b.id),
        )
        if (already) continue
        const geom = mergeCandidateGeometry(a, b)
        if (!geom) continue
        dispatch(pushHistory(structuredClone(floorPlan)))
        dispatch(
          addMergedEdge({
            id: createMergedEdgeId(),
            sourceEdgeIds: [a.id, b.id],
            geometry: { type: 'LINE', start: geom.start, end: geom.end },
            weight: Math.max(a.weight, b.weight),
            semanticOwnerIds: [a.elementId, b.elementId],
          }),
        )
        return
      }
    }
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r border-slate-300 bg-white p-3">
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Floor
        </h2>
        <label className="mb-2 block text-xs text-slate-600">
          Width ({floorPlan.dimensions.unit})
          <input
            type="number"
            min={1}
            step={0.5}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
            value={floorPlan.dimensions.width}
            onChange={(e) =>
              dispatch(
                setDimensions({
                  width: Number(e.target.value),
                  height: floorPlan.dimensions.height,
                }),
              )
            }
          />
        </label>
        <label className="mb-2 block text-xs text-slate-600">
          Height ({floorPlan.dimensions.unit})
          <input
            type="number"
            min={1}
            step={0.5}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
            value={floorPlan.dimensions.height}
            onChange={(e) =>
              dispatch(
                setDimensions({
                  width: floorPlan.dimensions.width,
                  height: Number(e.target.value),
                }),
              )
            }
          />
        </label>
        <label className="mb-2 block text-xs text-slate-600">
          Precision
          <select
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
            value={floorPlan.grid.precision}
            onChange={(e) =>
              dispatch(updateGrid({ precision: Number(e.target.value) }))
            }
          >
            {[1, 0.5, 0.25, 0.1, 0.05].map((p) => (
              <option key={p} value={p}>
                {p}
                {floorPlan.dimensions.unit}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={ui.snapToGrid}
            onChange={(e) => dispatch(setUi({ snapToGrid: e.target.checked }))}
          />
          Snap to grid
        </label>
        <label className="mt-1 flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={ui.showGrid}
            onChange={(e) => dispatch(setUi({ showGrid: e.target.checked }))}
          />
          Show grid
        </label>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Templates
        </h2>
        <div className="grid grid-cols-1 gap-1">
          {ELEMENT_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              className="rounded border border-slate-200 px-2 py-1.5 text-left text-xs hover:bg-slate-50"
              onClick={() =>
                placeTemplate(t.semanticType, t.defaultWidth, t.defaultHeight)
              }
            >
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Edges
        </h2>
        <button
          type="button"
          className="w-full rounded bg-slate-900 px-2 py-1.5 text-xs text-white"
          onClick={mergeOverlappingEdges}
        >
          Merge overlapping edges
        </button>
        <p className="mt-1 text-[11px] text-slate-500">
          Merged: {floorPlan.mergedEdges.length}
        </p>
      </section>
    </aside>
  )
}
