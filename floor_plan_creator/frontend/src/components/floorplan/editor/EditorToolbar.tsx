import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import {
  setTool,
  type EditorTool,
} from '../../../store/floorplan/floorPlanSlice'
import { resetViewport, zoomBy } from '../../../store/floorplan/viewportSlice'

const TOOLS: Array<{ id: EditorTool; label: string; shortcut: string }> = [
  { id: 'SELECT', label: 'Select', shortcut: 'V' },
  { id: 'PAN', label: 'Pan', shortcut: 'H' },
  { id: 'RECTANGLE', label: 'Rectangle', shortcut: 'R' },
  { id: 'POLYGON', label: 'Polygon', shortcut: 'P' },
  { id: 'LINE', label: 'Line', shortcut: 'L' },
  { id: 'DOOR', label: 'Door', shortcut: 'D' },
]

interface Props {
  onSave: () => void
  onLoad: () => void
  onCompile: () => void
  onUndo: () => void
  onRedo: () => void
}

function centerViewport() {
  window.dispatchEvent(new Event('floorplan:center-viewport'))
}

export function EditorToolbar({
  onSave,
  onLoad,
  onCompile,
  onUndo,
  onRedo,
}: Props) {
  const dispatch = useAppDispatch()
  const tool = useAppSelector((s) => s.floorPlan.tool)
  const name = useAppSelector((s) => s.floorPlan.floorPlan.name)
  const dirty = useAppSelector((s) => s.floorPlan.floorPlan.metadata.dirty)
  const scale = useAppSelector((s) => s.viewport.scale)

  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-slate-300 bg-white px-3 py-2">
      <div className="mr-2 min-w-40">
        <div className="text-sm font-semibold text-slate-900">
          Floor Plan Creator
        </div>
        <div className="truncate text-xs text-slate-500">
          {name}
          {dirty ? ' • unsaved' : ''}
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            title={`${t.label} (${t.shortcut})`}
            className={`rounded px-2.5 py-1.5 text-xs font-medium ${
              tool === t.id
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => dispatch(setTool(t.id))}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-1">
        <button
          type="button"
          className="rounded bg-slate-100 px-2 py-1.5 text-xs"
          onClick={onUndo}
        >
          Undo
        </button>
        <button
          type="button"
          className="rounded bg-slate-100 px-2 py-1.5 text-xs"
          onClick={onRedo}
        >
          Redo
        </button>
        <button
          type="button"
          className="rounded bg-slate-100 px-2 py-1.5 text-xs"
          onClick={() => dispatch(zoomBy(1.15))}
        >
          +
        </button>
        <button
          type="button"
          className="rounded bg-slate-100 px-2 py-1.5 text-xs"
          onClick={() => dispatch(zoomBy(1 / 1.15))}
        >
          −
        </button>
        <button
          type="button"
          className="rounded bg-slate-100 px-2 py-1.5 text-xs"
          onClick={() => {
            dispatch(resetViewport())
            centerViewport()
          }}
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          type="button"
          className="rounded bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white"
          onClick={onCompile}
        >
          Compile
        </button>
        <button
          type="button"
          className="rounded bg-slate-100 px-2.5 py-1.5 text-xs"
          onClick={onLoad}
        >
          Load
        </button>
        <button
          type="button"
          className="rounded bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white"
          onClick={onSave}
        >
          Save
        </button>
      </div>
    </header>
  )
}
