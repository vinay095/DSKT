import type { FloorPlan } from '../../domain/floorplan/models/floorPlan'
import { parseFloorPlan } from '../../domain/floorplan/validation/schemas'
import { compileFloorPlan } from '../../domain/floorplan/compiler/matrixCompiler'

const STORAGE_KEY = 'floor-plan-creator:draft'

export async function saveFloorPlanLocal(plan: FloorPlan): Promise<void> {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan))
}

export async function loadFloorPlanLocal(): Promise<FloorPlan | null> {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return parseFloorPlan(JSON.parse(raw)) as FloorPlan
  } catch {
    return null
  }
}

export async function exportFloorPlanJson(plan: FloorPlan): Promise<string> {
  return JSON.stringify(plan, null, 2)
}

export async function compileFloorPlanRemote(plan: FloorPlan) {
  // Backend-agnostic local compile; swap for POST /api/floor-plans/{id}/compile later.
  return compileFloorPlan(plan)
}

export const floorPlanApi = {
  async create(plan: FloorPlan): Promise<FloorPlan> {
    await saveFloorPlanLocal(plan)
    return plan
  },
  async get(id: string): Promise<FloorPlan | null> {
    const plan = await loadFloorPlanLocal()
    if (plan && plan.id === id) return plan
    return plan
  },
  async update(plan: FloorPlan): Promise<FloorPlan> {
    await saveFloorPlanLocal(plan)
    return plan
  },
  async compile(plan: FloorPlan) {
    return compileFloorPlanRemote(plan)
  },
}
