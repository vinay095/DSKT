import type { ElementStyle } from './models/element'
import { getSemanticType } from './models/semanticRegistry'

export interface ElementTemplate {
  id: string
  semanticType: string
  name: string
  defaultWidth: number
  defaultHeight: number
  defaultStyle: ElementStyle
}

function templateFromSemantic(typeId: string): ElementTemplate {
  const type = getSemanticType(typeId)
  return {
    id: typeId.toLowerCase(),
    semanticType: typeId,
    name: type.name,
    defaultWidth: type.defaultWidth ?? 2,
    defaultHeight: type.defaultHeight ?? 2,
    defaultStyle: {
      fill: type.fill ?? 'rgba(148, 163, 184, 0.25)',
      stroke: type.stroke ?? '#334155',
      strokeWidth: 2,
      opacity: 1,
    },
  }
}

export const ELEMENT_TEMPLATES: ElementTemplate[] = [
  'MEETING_ROOM',
  'CABIN',
  'CONFERENCE_ROOM',
  'OPEN_WORKSPACE',
  'KITCHEN',
  'RECEPTION',
  'STORAGE',
  'RESTROOM',
  'DESK',
  'CHAIR',
  'TABLE',
  'SOFA',
  'PLANT',
  'WALL',
  'STAIRS',
  'PILLAR',
  'UNUSABLE_SPACE',
].map(templateFromSemantic)

export function getTemplate(id: string): ElementTemplate | undefined {
  return ELEMENT_TEMPLATES.find((t) => t.id === id || t.semanticType === id)
}
