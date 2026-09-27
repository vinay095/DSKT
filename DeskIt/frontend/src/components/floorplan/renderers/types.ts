import type { ElementRenderState } from '../../../lib/categoryStyles';

/** Visual-only props — never includes coordinate/math engine fields. */
export interface FloorObjectVisualProps {
  width: number;
  height: number;
  fill: string;
  stroke: string;
  fillOpacity: number;
  strokeWidth: number;
  renderState?: ElementRenderState;
  /** Simplify when zoomed out / small on screen */
  detail?: 'simple' | 'detailed';
}

export type FloorObjectKind =
  | 'desk'
  | 'chair'
  | 'meeting_table'
  | 'plant'
  | 'restroom'
  | 'phone_booth'
  | 'pillar'
  | 'cabin'
  | 'storage'
  | 'generic';

export function resolveObjectKind(
  category?: string,
  elementType?: string,
): FloorObjectKind {
  const cat = (category || '').toLowerCase();
  const type = (elementType || '').toLowerCase();

  if (
    cat === 'workstation' ||
    cat === 'desk' ||
    type.includes('desk') ||
    type === 'computer' ||
    type.includes('workstation') ||
    type.includes('monitor')
  ) {
    return 'desk';
  }
  if (
    cat === 'seating' ||
    type.includes('chair') ||
    type.includes('stool') ||
    type.includes('sofa') ||
    type.includes('armchair') ||
    type.includes('loveseat')
  ) {
    return 'chair';
  }
  if (
    cat === 'meeting_room' ||
    type.includes('table') ||
    type.includes('meeting') ||
    type.includes('conference')
  ) {
    return 'meeting_table';
  }
  if (cat === 'plant' || type.includes('plant')) return 'plant';
  if (
    cat === 'restroom' ||
    type.includes('toilet') ||
    type.includes('sink') ||
    type.includes('bathroom') ||
    type.includes('shower') ||
    type.includes('bidet')
  ) {
    return 'restroom';
  }
  if (cat === 'phone_booth' || type.includes('phone') || type.includes('booth')) {
    return 'phone_booth';
  }
  if (
    cat === 'pillar' ||
    cat === 'structure' ||
    type.includes('pillar') ||
    type.includes('column')
  ) {
    return 'pillar';
  }
  if (cat === 'cabin' || type.includes('cabin')) return 'cabin';
  if (
    type.includes('drawer') ||
    type.includes('cabinet') ||
    type.includes('wardrobe') ||
    type.includes('storage')
  ) {
    return 'storage';
  }
  return 'generic';
}

export function pickDetailLevel(width: number, height: number): 'simple' | 'detailed' {
  return Math.min(width, height) < 28 ? 'simple' : 'detailed';
}
