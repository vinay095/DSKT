import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { listSemanticTypes } from '../../../domain/floorplan/models/semanticRegistry'
import {
  setElementLabel,
  setElementSemantic,
  updateElementGeometry,
} from '../../../store/floorplan/floorPlanSlice'
import { pushHistory } from '../../../store/floorplan/historySlice'
import { getEdgeWeight } from '../../../domain/floorplan/models/semanticRegistry'

export function PropertiesPanel() {
  const dispatch = useAppDispatch()
  const floorPlan = useAppSelector((s) => s.floorPlan.floorPlan)
  const selectedIds = useAppSelector((s) => s.selection.selectedIds)
  const selected = floorPlan.elements.find((e) => e.id === selectedIds[0])

  if (!selected) {
    return (
      <aside className="w-72 shrink-0 overflow-y-auto border-l border-slate-300 bg-white p-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Properties
        </h2>
        <p className="mt-3 text-sm text-slate-500">Select an element to edit.</p>
      </aside>
    )
  }

  const geometry = selected.geometry
  const types = listSemanticTypes().filter((t) => t.id !== 'EMPTY')

  const commit = () => {
    dispatch(pushHistory(structuredClone(floorPlan)))
  }

  return (
    <aside className="w-72 shrink-0 overflow-y-auto border-l border-slate-300 bg-white p-3">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Properties
      </h2>

      <label className="mb-2 block text-xs text-slate-600">
        Type
        <select
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
          value={selected.semantic?.typeId ?? ''}
          onChange={(e) => {
            commit()
            dispatch(
              setElementSemantic({
                id: selected.id,
                typeId: e.target.value,
                label: selected.semantic?.label,
              }),
            )
          }}
        >
          <option value="">Unassigned</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      <label className="mb-2 block text-xs text-slate-600">
        Label
        <input
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
          value={selected.semantic?.label ?? ''}
          disabled={!selected.semantic}
          onChange={(e) => {
            commit()
            dispatch(
              setElementLabel({ id: selected.id, label: e.target.value }),
            )
          }}
        />
      </label>

      <div className="mb-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
        <div>
          Code
          <div className="mt-1 rounded bg-slate-100 px-2 py-1 font-mono text-sm text-slate-800">
            {selected.semantic?.code ?? '—'}
          </div>
        </div>
        <div>
          Edge Weight
          <div className="mt-1 rounded bg-slate-100 px-2 py-1 font-mono text-sm text-slate-800">
            {selected.semantic
              ? getEdgeWeight(selected.semantic.typeId)
              : '—'}
          </div>
        </div>
      </div>

      {geometry.type === 'RECTANGLE' ? (
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ['X', 'x'],
              ['Y', 'y'],
              ['Width', 'width'],
              ['Height', 'height'],
              ['Rotation', 'rotation'],
            ] as const
          ).map(([label, key]) => (
            <label key={key} className="block text-xs text-slate-600">
              {label}
              <input
                type="number"
                step={0.1}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                value={geometry[key]}
                onChange={(e) => {
                  commit()
                  dispatch(
                    updateElementGeometry({
                      id: selected.id,
                      geometry: {
                        ...geometry,
                        [key]: Number(e.target.value),
                      },
                    }),
                  )
                }}
              />
            </label>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Geometry type: {geometry.type}
        </p>
      )}
    </aside>
  )
}
