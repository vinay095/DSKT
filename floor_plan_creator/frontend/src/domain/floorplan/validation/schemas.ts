import { z } from 'zod'

const pointSchema = z.object({
  x: z.number(),
  y: z.number(),
})

const geometrySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('RECTANGLE'),
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
    rotation: z.number(),
  }),
  z.object({
    type: z.literal('POLYGON'),
    points: z.array(pointSchema).min(3),
    rotation: z.number(),
  }),
  z.object({
    type: z.literal('LINE'),
    start: pointSchema,
    end: pointSchema,
  }),
  z.object({
    type: z.literal('CIRCLE'),
    x: z.number(),
    y: z.number(),
    radius: z.number().positive(),
    rotation: z.number(),
  }),
])

const elementSchema = z.object({
  id: z.string(),
  geometry: geometrySchema,
  semantic: z
    .object({
      typeId: z.string(),
      code: z.number(),
      label: z.string().optional(),
    })
    .optional(),
  style: z.object({
    fill: z.string(),
    stroke: z.string(),
    strokeWidth: z.number(),
    opacity: z.number(),
  }),
  locked: z.boolean(),
  visible: z.boolean(),
  zIndex: z.number(),
})

export const floorPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.enum(['m', 'ft']),
  }),
  grid: z.object({
    rows: z.number().int().positive(),
    columns: z.number().int().positive(),
    cellSize: z.number().positive(),
    worldUnit: z.enum(['m', 'ft']),
    precision: z.number().positive(),
    snapToGrid: z.boolean(),
    showCoordinates: z.boolean(),
  }),
  elements: z.array(elementSchema),
  doors: z.array(
    z.object({
      id: z.string(),
      hostElementId: z.string(),
      position: z.number().min(0).max(1),
      width: z.number().positive(),
      orientation: z.enum(['HORIZONTAL', 'VERTICAL']),
      swing: z.enum(['LEFT', 'RIGHT', 'NONE']).optional(),
      edgeIndex: z.number().int().nonnegative(),
    }),
  ),
  mergedEdges: z.array(
    z.object({
      id: z.string(),
      sourceEdgeIds: z.array(z.string()),
      geometry: z.object({
        type: z.literal('LINE'),
        start: pointSchema,
        end: pointSchema,
      }),
      weight: z.number(),
      semanticOwnerIds: z.array(z.string()),
    }),
  ),
  metadata: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
    version: z.number(),
    dirty: z.boolean(),
  }),
})

export type ParsedFloorPlan = z.infer<typeof floorPlanSchema>

export function parseFloorPlan(data: unknown): ParsedFloorPlan {
  return floorPlanSchema.parse(data)
}
