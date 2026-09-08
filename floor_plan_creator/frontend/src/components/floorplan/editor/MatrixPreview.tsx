import { useMemo, useState } from 'react'
import type { CompiledFloorPlan } from '../../../domain/floorplan/models/floorPlan'
import {
  matrixToCsv,
  matrixToJson,
} from '../../../domain/floorplan/compiler/matrixCompiler'

type MatrixKey =
  | 'semanticMatrix'
  | 'edgeMatrix'
  | 'doorMatrix'
  | 'occupancyMatrix'
  | 'connectivityMatrix'

const TABS: Array<{ key: MatrixKey; label: string }> = [
  { key: 'semanticMatrix', label: 'Semantic' },
  { key: 'edgeMatrix', label: 'Edge' },
  { key: 'doorMatrix', label: 'Door' },
  { key: 'occupancyMatrix', label: 'Occupancy' },
  { key: 'connectivityMatrix', label: 'Connectivity' },
]

interface Props {
  compiled: CompiledFloorPlan | null
  onClose: () => void
}

export function MatrixPreview({ compiled, onClose }: Props) {
  const [tab, setTab] = useState<MatrixKey>('semanticMatrix')

  const matrix = compiled?.[tab] ?? null
  const preview = useMemo(() => {
    if (!matrix) return ''
    const max = 24
    return matrix
      .slice(0, max)
      .map((row) => row.slice(0, max).join(' '))
      .join('\n')
  }, [matrix])

  if (!compiled || !matrix) {
    return (
      <div className="border-t border-slate-300 bg-white p-3 text-sm text-slate-500">
        Compile the floor plan to preview matrices.
        <button type="button" className="ml-3 text-blue-600" onClick={onClose}>
          Close
        </button>
      </div>
    )
  }

  const copy = async (format: 'json' | 'csv') => {
    const text =
      format === 'json' ? matrixToJson(matrix) : matrixToCsv(matrix)
    await navigator.clipboard.writeText(text)
  }

  return (
    <div className="max-h-72 overflow-auto border-t border-slate-300 bg-white p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold text-slate-800">Matrix Preview</h2>
        <span className="text-xs text-slate-500">
          {compiled.rows}×{compiled.columns} · precision {compiled.precision}
          {compiled.unit} · {compiled.rows * compiled.columns} cells
        </span>
        <div className="ml-auto flex gap-1">
          <button
            type="button"
            className="rounded bg-slate-100 px-2 py-1 text-xs"
            onClick={() => copy('json')}
          >
            Copy JSON
          </button>
          <button
            type="button"
            className="rounded bg-slate-100 px-2 py-1 text-xs"
            onClick={() => copy('csv')}
          >
            Copy CSV
          </button>
          <button
            type="button"
            className="rounded bg-slate-100 px-2 py-1 text-xs"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
      <div className="mb-2 flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`rounded px-2 py-1 text-xs ${
              tab === t.key
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <pre className="overflow-auto rounded bg-slate-950 p-3 font-mono text-[10px] leading-4 text-emerald-300">
        {preview}
        {matrix.length > 24 || matrix[0].length > 24 ? '\n… truncated' : ''}
      </pre>
    </div>
  )
}
