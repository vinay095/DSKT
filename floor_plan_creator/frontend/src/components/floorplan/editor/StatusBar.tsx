import { useAppSelector } from '../../../app/hooks'
import { validateFloorPlan } from '../../../domain/floorplan/validation/floorPlanValidator'

export function StatusBar() {
  const floorPlan = useAppSelector((s) => s.floorPlan.floorPlan)
  const tool = useAppSelector((s) => s.floorPlan.tool)
  const selectedIds = useAppSelector((s) => s.selection.selectedIds)
  const scale = useAppSelector((s) => s.viewport.scale)
  const issues = validateFloorPlan(floorPlan)
  const errors = issues.filter((i) => i.level === 'error').length
  const warnings = issues.filter((i) => i.level === 'warning').length

  return (
    <footer className="flex flex-wrap items-center gap-3 border-t border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
      <span>Tool: {tool}</span>
      <span>
        Grid: {floorPlan.grid.columns}×{floorPlan.grid.rows} @{' '}
        {floorPlan.grid.precision}
        {floorPlan.dimensions.unit}
      </span>
      <span>
        Floor: {floorPlan.dimensions.width}×{floorPlan.dimensions.height}
        {floorPlan.dimensions.unit}
      </span>
      <span>Elements: {floorPlan.elements.length}</span>
      <span>Selected: {selectedIds.length}</span>
      <span>Zoom: {Math.round(scale * 100)}%</span>
      <span className={errors ? 'text-red-600' : warnings ? 'text-amber-600' : ''}>
        Validation: {errors} errors, {warnings} warnings
      </span>
    </footer>
  )
}
