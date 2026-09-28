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
  /** Semantic catalog elementType — drives subtype silhouette */
  elementType?: string;
  category?: string;
}

export type FloorObjectKind =
  | 'desk'
  | 'corner_desk'
  | 'monitor'
  | 'chair'
  | 'task_chair'
  | 'guest_chair'
  | 'meeting_chair'
  | 'armchair'
  | 'lounge_chair'
  | 'bar_stool'
  | 'couch'
  | 'loveseat'
  | 'sectional'
  | 'meeting_table'
  | 'conference_table'
  | 'round_table'
  | 'square_table'
  | 'display'
  | 'storage'
  | 'plant'
  | 'restroom'
  | 'phone_booth'
  | 'pillar'
  | 'cabin'
  | 'generic';

function norm(s?: string): string {
  return (s || '').toLowerCase().replace(/_/g, '-');
}

/**
 * Map semantic category + elementType → visual kind.
 * More specific elementType checks run before broad category matches.
 */
export function resolveObjectKind(
  category?: string,
  elementType?: string,
): FloorObjectKind {
  const cat = norm(category);
  const type = norm(elementType);

  // --- Storage (before workstation blanket) ---
  if (
    type.includes('drawer') ||
    type.includes('cabinet') ||
    type.includes('wardrobe') ||
    type.includes('noptiera') ||
    type.includes('locker') ||
    type.includes('pedestal') ||
    type === 'storage'
  ) {
    return 'storage';
  }

  // --- Display / TV ---
  if (
    type.includes('televizor') ||
    type.includes('display') ||
    type === 'tv' ||
    type.includes('television')
  ) {
    return 'display';
  }

  // --- Monitor accessory (not a full desk) ---
  if (type.includes('monitor') && !type.includes('desk')) {
    return 'monitor';
  }

  // --- Desks ---
  if (type.includes('corner-desk') || type.includes('corner_desk') || type === 'corner-desk') {
    return 'corner_desk';
  }
  if (
    cat === 'workstation' ||
    cat === 'desk' ||
    type.includes('desk') ||
    type === 'computer' ||
    type.includes('workstation')
  ) {
    return 'desk';
  }

  // --- Seating subtypes ---
  if (type.includes('sectional')) return 'sectional';
  if (type.includes('loveseat')) return 'loveseat';
  if (type.includes('couch') || type.includes('sofa')) return 'couch';
  if (type.includes('bar-stool') || type.includes('barstool') || type.includes('stool')) {
    return 'bar_stool';
  }
  if (type.includes('lounge')) return 'lounge_chair';
  if (type.includes('armchair')) return 'armchair';
  if (type === 'chair-3' || type.includes('meeting-chair') || type.includes('meeting_chair')) {
    return 'meeting_chair';
  }
  if (type === 'chair-2' || type.includes('guest')) return 'guest_chair';
  if (type === 'chair-1' || type.includes('task')) return 'task_chair';
  if (cat === 'seating' || type.includes('chair')) return 'chair';

  // --- Tables (not cafeteria fixtures) ---
  if (type.includes('round-table') || type.includes('round_table')) return 'round_table';
  if (type.includes('dining-table-square') || (type.includes('square') && type.includes('table'))) {
    return 'square_table';
  }
  if (type === 'table2' || (type.includes('conference') && type.includes('table'))) {
    return 'conference_table';
  }
  if (type.includes('table') || type.includes('dining-table')) {
    return 'meeting_table';
  }
  if (cat === 'meeting_room' && type.includes('meeting') && !type.includes('chair')) {
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

  return 'generic';
}

export function pickDetailLevel(width: number, height: number): 'simple' | 'detailed' {
  return Math.min(width, height) < 28 ? 'simple' : 'detailed';
}
