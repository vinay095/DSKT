import { useCallback, useEffect, useState } from 'react'
import { useStore } from 'react-redux'
import { EditorToolbar } from './EditorToolbar'
import { EditorSidebar } from './EditorSidebar'
import { PropertiesPanel } from './PropertiesPanel'
import { StatusBar } from './StatusBar'
import { MatrixPreview } from './MatrixPreview'
import { FloorPlanStage } from '../canvas/FloorPlanStage'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import type { RootState } from '../../../app/store'
import {
  addElement,
  markClean,
  removeElements,
  setFloorPlan,
  setTool,
  setUi,
  type EditorTool,
} from '../../../store/floorplan/floorPlanSlice'
import {
  clearSelection,
  selectElements,
} from '../../../store/floorplan/selectionSlice'
import { zoomBy } from '../../../store/floorplan/viewportSlice'
import { redoLast, undoLast } from '../../../store/floorplan/historyActions'
import { pushHistory } from '../../../store/floorplan/historySlice'
import { floorPlanApi } from '../../../services/floorplan/floorPlanApi'
import { createFloorElement } from '../../../domain/floorplan/factories'
import type { CompiledFloorPlan } from '../../../domain/floorplan/models/floorPlan'
import { compileFloorPlan } from '../../../domain/floorplan/compiler/matrixCompiler'

export function FloorPlanEditor() {
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()
  const floorPlan = useAppSelector((s) => s.floorPlan.floorPlan)
  const selectedIds = useAppSelector((s) => s.selection.selectedIds)
  const showMatrix = useAppSelector((s) => s.floorPlan.ui.showMatrixPreview)
  const [compiled, setCompiled] = useState<CompiledFloorPlan | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleUndo = useCallback(() => {
    undoLast(dispatch, store.getState)
  }, [dispatch, store])

  const handleRedo = useCallback(() => {
    redoLast(dispatch, store.getState)
  }, [dispatch, store])

  const handleSave = useCallback(async () => {
    await floorPlanApi.update(floorPlan)
    dispatch(markClean())
    setMessage('Saved locally')
  }, [dispatch, floorPlan])

  const handleLoad = useCallback(async () => {
    const loaded = await floorPlanApi.get(floorPlan.id)
    if (!loaded) {
      setMessage('No saved floor plan found')
      return
    }
    dispatch(setFloorPlan(loaded))
    dispatch(clearSelection())
    setMessage('Loaded floor plan')
  }, [dispatch, floorPlan.id])

  const handleCompile = useCallback(() => {
    const result = compileFloorPlan(floorPlan)
    setCompiled(result)
    dispatch(setUi({ showMatrixPreview: true }))
    setMessage(
      `Compiled ${result.rows}×${result.columns} matrices`,
    )
  }, [dispatch, floorPlan])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }

      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()

      if (mod && key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
        return
      }
      if (mod && (key === 'y' || (key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
        return
      }
      if (mod && key === 's') {
        e.preventDefault()
        void handleSave()
        return
      }
      if (mod && key === 'a') {
        e.preventDefault()
        dispatch(selectElements(floorPlan.elements.map((el) => el.id)))
        return
      }
      if (mod && key === 'd') {
        e.preventDefault()
        if (selectedIds.length === 0) return
        dispatch(pushHistory(structuredClone(floorPlan)))
        const clones = selectedIds
          .map((id) => floorPlan.elements.find((el) => el.id === id))
          .filter(Boolean)
          .map((el) => {
            const geometry = el!.geometry
            if (geometry.type === 'RECTANGLE') {
              return createFloorElement(
                {
                  ...geometry,
                  x: geometry.x + floorPlan.grid.precision,
                  y: geometry.y + floorPlan.grid.precision,
                },
                {
                  semanticTypeId: el!.semantic?.typeId,
                  label: el!.semantic?.label,
                  zIndex: floorPlan.elements.length,
                },
              )
            }
            return null
          })
          .filter(Boolean)
        for (const clone of clones) {
          if (clone) dispatch(addElement(clone))
        }
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length === 0) return
        e.preventDefault()
        dispatch(pushHistory(structuredClone(floorPlan)))
        dispatch(removeElements(selectedIds))
        dispatch(clearSelection())
        return
      }

      if (e.key === 'Escape') {
        dispatch(clearSelection())
        dispatch(setTool('SELECT'))
        return
      }

      if (e.key === '+' || e.key === '=') {
        dispatch(zoomBy(1.15))
        return
      }
      if (e.key === '-' || e.key === '_') {
        dispatch(zoomBy(1 / 1.15))
        return
      }

      const toolMap: Record<string, EditorTool> = {
        v: 'SELECT',
        h: 'PAN',
        r: 'RECTANGLE',
        p: 'POLYGON',
        l: 'LINE',
        d: 'DOOR',
      }
      if (!mod && toolMap[key]) {
        dispatch(setTool(toolMap[key]))
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    dispatch,
    floorPlan,
    handleRedo,
    handleSave,
    handleUndo,
    selectedIds,
    store,
  ])

  useEffect(() => {
    if (!message) return
    const t = window.setTimeout(() => setMessage(null), 2500)
    return () => window.clearTimeout(t)
  }, [message])

  return (
    <div className="flex h-svh flex-col bg-slate-200 text-slate-900">
      <EditorToolbar
        onSave={() => void handleSave()}
        onLoad={() => void handleLoad()}
        onCompile={handleCompile}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />
      <div className="relative flex min-h-0 flex-1">
        <EditorSidebar />
        <div className="relative min-w-0 flex-1">
          <FloorPlanStage />
          {message ? (
            <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded bg-slate-900/90 px-3 py-1.5 text-xs text-white">
              {message}
            </div>
          ) : null}
        </div>
        <PropertiesPanel />
      </div>
      {showMatrix ? (
        <MatrixPreview
          compiled={compiled}
          onClose={() => dispatch(setUi({ showMatrixPreview: false }))}
        />
      ) : null}
      <StatusBar />
    </div>
  )
}
