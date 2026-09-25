/**
 * Element visual system (PART 6–7):
 * category/type → style config → fill/stroke/opacity → SVG / rendered element.
 * Source catalog SVG files are never modified on disk.
 */

export type ElementCategory =
  | 'workstation'
  | 'plant'
  | 'meeting_room'
  | 'cafeteria'
  | 'seating'
  | 'text'
  | 'custom'
  | 'pillar'
  | 'unusable'
  | 'restroom'
  | 'phone_booth'
  | 'cabin'
  | 'circulation'
  | 'structure'
  | 'game_relaxation'
  | string;

/** Interaction / occupancy state applied on top of category colors. */
export type ElementRenderState =
  | 'default'
  | 'selected'
  | 'hover'
  | 'available'
  | 'occupied'
  | 'reserved'
  | 'maintenance';

export interface CategoryVisualStyle {
  fill: string;
  stroke: string;
  fillOpacity: number;
  strokeWidth: number;
  label: string;
  labelFill?: string;
}

const FALLBACK: CategoryVisualStyle = {
  fill: '#94A3B8',
  stroke: '#64748B',
  fillOpacity: 0.38,
  strokeWidth: 1.6,
  label: 'Element',
  labelFill: '#0F172A',
};

/**
 * PART 6 — professional category palette (not random brand accents).
 * Chairs → neutrals; desks → wood/grey/white; plants → greens; etc.
 */
export const CATEGORY_STYLES: Record<string, CategoryVisualStyle> = {
  // Desks / workstations — wood, grey, white tones
  workstation: {
    fill: '#A8A29E',
    stroke: '#57534E',
    fillOpacity: 0.55,
    strokeWidth: 1.5,
    label: 'Desk',
  },
  // Chairs / seating — black / dark grey
  seating: {
    fill: '#374151',
    stroke: '#111827',
    fillOpacity: 0.72,
    strokeWidth: 1.4,
    label: 'Seating',
  },
  meeting_room: {
    fill: '#64748B',
    stroke: '#334155',
    fillOpacity: 0.35,
    strokeWidth: 1.5,
    label: 'Meeting',
  },
  cabin: {
    fill: '#78716C',
    stroke: '#44403C',
    fillOpacity: 0.4,
    strokeWidth: 1.5,
    label: 'Cabin',
  },
  cafeteria: {
    fill: '#D6D3D1',
    stroke: '#A8A29E',
    fillOpacity: 0.55,
    strokeWidth: 1.4,
    label: 'Cafeteria',
  },
  plant: {
    fill: '#22C55E',
    stroke: '#166534',
    fillOpacity: 0.45,
    strokeWidth: 1.3,
    label: 'Plant',
  },
  restroom: {
    fill: '#7DD3FC',
    stroke: '#0369A1',
    fillOpacity: 0.4,
    strokeWidth: 1.4,
    label: 'Restroom',
  },
  game_relaxation: {
    fill: '#F472B6',
    stroke: '#BE185D',
    fillOpacity: 0.35,
    strokeWidth: 1.5,
    label: 'Game / Relax',
  },
  phone_booth: {
    fill: '#C4B5FD',
    stroke: '#6D28D9',
    fillOpacity: 0.4,
    strokeWidth: 1.4,
    label: 'Phone booth',
  },
  circulation: {
    fill: '#CBD5E1',
    stroke: '#475569',
    fillOpacity: 0.45,
    strokeWidth: 1.3,
    label: 'Circulation',
  },
  structure: {
    fill: '#94A3B8',
    stroke: '#475569',
    fillOpacity: 0.5,
    strokeWidth: 1.5,
    label: 'Structure',
  },
  pillar: {
    fill: '#94A3B8',
    stroke: '#475569',
    fillOpacity: 0.55,
    strokeWidth: 1.6,
    label: 'Pillar',
  },
  unusable: {
    fill: '#64748B',
    stroke: '#334155',
    fillOpacity: 0.45,
    strokeWidth: 1.4,
    label: 'Unusable',
  },
  custom: {
    fill: '#94A3B8',
    stroke: '#475569',
    fillOpacity: 0.4,
    strokeWidth: 1.5,
    label: 'Custom',
  },
  text: {
    fill: '#0F172A',
    stroke: '#0F172A',
    fillOpacity: 1,
    strokeWidth: 0,
    label: 'Text',
    labelFill: '#0F172A',
  },
};

/** Catalog categories available when saving a custom element. */
export const CUSTOM_ELEMENT_CATEGORIES: { id: string; label: string }[] = [
  { id: 'custom', label: 'Custom' },
  { id: 'workstation', label: 'Workstation / Desk' },
  { id: 'seating', label: 'Seating / Chair' },
  { id: 'meeting_room', label: 'Meeting room' },
  { id: 'cabin', label: 'Cabin' },
  { id: 'cafeteria', label: 'Cafeteria' },
  { id: 'plant', label: 'Plant' },
  { id: 'restroom', label: 'Restroom' },
  { id: 'game_relaxation', label: 'Game / Relaxation' },
  { id: 'phone_booth', label: 'Phone booth' },
  { id: 'circulation', label: 'Circulation' },
  { id: 'structure', label: 'Structure' },
];

const ELEMENT_TYPE_STYLES: Record<string, CategoryVisualStyle> = {
  // Desks — wood / grey / white family
  computer: {
    fill: '#78716C',
    stroke: '#44403C',
    fillOpacity: 0.58,
    strokeWidth: 1.5,
    label: 'Desk',
  },
  'corner-desk': {
    fill: '#A16207',
    stroke: '#713F12',
    fillOpacity: 0.5,
    strokeWidth: 1.5,
    label: 'Corner desk',
  },
  'computer-monitor': {
    fill: '#57534E',
    stroke: '#292524',
    fillOpacity: 0.65,
    strokeWidth: 1.3,
    label: 'Monitor',
  },
  drawer: {
    fill: '#D6D3D1',
    stroke: '#78716C',
    fillOpacity: 0.55,
    strokeWidth: 1.3,
    label: 'Drawer',
  },
  drawerr: {
    fill: '#A8A29E',
    stroke: '#57534E',
    fillOpacity: 0.55,
    strokeWidth: 1.3,
    label: 'Wide drawer',
  },
  noptiera: {
    fill: '#E7E5E4',
    stroke: '#A8A29E',
    fillOpacity: 0.6,
    strokeWidth: 1.3,
    label: 'Cabinet',
  },
  // Chairs — black / charcoal / grey
  chair: {
    fill: '#1F2937',
    stroke: '#0F172A',
    fillOpacity: 0.8,
    strokeWidth: 1.2,
    label: 'Chair',
  },
  'chair-1': {
    fill: '#111827',
    stroke: '#030712',
    fillOpacity: 0.82,
    strokeWidth: 1.2,
    label: 'Task chair',
  },
  'chair-2': {
    fill: '#374151',
    stroke: '#111827',
    fillOpacity: 0.75,
    strokeWidth: 1.2,
    label: 'Guest chair',
  },
  'chair-3': {
    fill: '#4B5563',
    stroke: '#1F2937',
    fillOpacity: 0.72,
    strokeWidth: 1.2,
    label: 'Meeting chair',
  },
  armchair: {
    fill: '#292524',
    stroke: '#0C0A09',
    fillOpacity: 0.78,
    strokeWidth: 1.3,
    label: 'Armchair',
  },
  'lounge-chair': {
    fill: '#44403C',
    stroke: '#1C1917',
    fillOpacity: 0.75,
    strokeWidth: 1.3,
    label: 'Lounge chair',
  },
  'bar-stool': {
    fill: '#57534E',
    stroke: '#292524',
    fillOpacity: 0.7,
    strokeWidth: 1.2,
    label: 'Bar stool',
  },
  couch: {
    fill: '#334155',
    stroke: '#0F172A',
    fillOpacity: 0.65,
    strokeWidth: 1.4,
    label: 'Couch',
  },
  loveseat: {
    fill: '#475569',
    stroke: '#1E293B',
    fillOpacity: 0.65,
    strokeWidth: 1.4,
    label: 'Loveseat',
  },
  'sectional-couch-seat': CATEGORY_STYLES.seating,
  'sectional-couch-corner-seat': CATEGORY_STYLES.seating,
  // Meeting / tables — brown, oak, grey, white, blue (distinct per type)
  table: {
    fill: '#A16207',
    stroke: '#713F12',
    fillOpacity: 0.55,
    strokeWidth: 1.5,
    label: 'Table',
  },
  table2: {
    fill: '#57534E',
    stroke: '#292524',
    fillOpacity: 0.55,
    strokeWidth: 1.5,
    label: 'Conference table',
  },
  'round-table': {
    fill: '#78716C',
    stroke: '#44403C',
    fillOpacity: 0.5,
    strokeWidth: 1.5,
    label: 'Round table',
  },
  'dining-table-square': {
    fill: '#D6D3D1',
    stroke: '#78716C',
    fillOpacity: 0.6,
    strokeWidth: 1.4,
    label: 'Square table',
  },
  'dining-table-6': {
    fill: '#92400E',
    stroke: '#78350F',
    fillOpacity: 0.52,
    strokeWidth: 1.5,
    label: 'Dining table',
  },
  televizor: {
    fill: '#1E293B',
    stroke: '#020617',
    fillOpacity: 0.7,
    strokeWidth: 1.3,
    label: 'Display',
  },
  'wardrobe-large': CATEGORY_STYLES.cabin,
  // Cafeteria
  'bar-counter': {
    fill: '#A8A29E',
    stroke: '#57534E',
    fillOpacity: 0.55,
    strokeWidth: 1.4,
    label: 'Bar counter',
  },
  kitchenFridge: {
    fill: '#E2E8F0',
    stroke: '#64748B',
    fillOpacity: 0.7,
    strokeWidth: 1.3,
    label: 'Fridge',
  },
  kitchenSink: {
    fill: '#BAE6FD',
    stroke: '#0284C7',
    fillOpacity: 0.55,
    strokeWidth: 1.3,
    label: 'Sink',
  },
  'kitchen-sink-corner': {
    fill: '#7DD3FC',
    stroke: '#0369A1',
    fillOpacity: 0.5,
    strokeWidth: 1.3,
    label: 'Corner sink',
  },
  'countertop-corner': {
    fill: '#D6D3D1',
    stroke: '#78716C',
    fillOpacity: 0.55,
    strokeWidth: 1.4,
    label: 'Counter',
  },
  'fume-hood-md': {
    fill: '#94A3B8',
    stroke: '#475569',
    fillOpacity: 0.55,
    strokeWidth: 1.4,
    label: 'Fume hood',
  },
  // Restroom
  toilet: CATEGORY_STYLES.restroom,
  bidet: CATEGORY_STYLES.restroom,
  shower: CATEGORY_STYLES.restroom,
  bathroomSink: CATEGORY_STYLES.restroom,
  'round-sink': CATEGORY_STYLES.restroom,
  'double-sink': CATEGORY_STYLES.restroom,
  'corner-sink': CATEGORY_STYLES.restroom,
  // Circulation
  door: CATEGORY_STYLES.circulation,
  window: {
    fill: '#E0F2FE',
    stroke: '#0284C7',
    fillOpacity: 0.55,
    strokeWidth: 1.2,
    label: 'Window',
  },
  'stairs-md-sq': CATEGORY_STYLES.circulation,
  'stairs-lg-sq': CATEGORY_STYLES.circulation,
  'stairs-small-sq': CATEGORY_STYLES.circulation,
  'stairs-corner': CATEGORY_STYLES.circulation,
  'stairs-round': CATEGORY_STYLES.circulation,
  'stairs-u-shaped': CATEGORY_STYLES.circulation,
  'stair-cover': CATEGORY_STYLES.circulation,
  // Plants
  plant: CATEGORY_STYLES.plant,
  'large-plant': {
    fill: '#16A34A',
    stroke: '#14532D',
    fillOpacity: 0.5,
    strokeWidth: 1.3,
    label: 'Large plant',
  },
  'potted-plant-1': CATEGORY_STYLES.plant,
  'potted-plant-2': {
    fill: '#4ADE80',
    stroke: '#15803D',
    fillOpacity: 0.48,
    strokeWidth: 1.2,
    label: 'Tall plant',
  },
  'generic-object': CATEGORY_STYLES.structure,
};

function applyRenderState(
  base: CategoryVisualStyle,
  state: ElementRenderState = 'default',
): CategoryVisualStyle {
  switch (state) {
    case 'selected':
      return {
        ...base,
        stroke: '#16A34A',
        strokeWidth: base.strokeWidth + 0.8,
        fillOpacity: Math.min(base.fillOpacity + 0.15, 0.92),
      };
    case 'hover':
      return {
        ...base,
        fillOpacity: Math.min(base.fillOpacity + 0.1, 0.9),
        strokeWidth: base.strokeWidth + 0.3,
      };
    case 'available':
      return {
        ...base,
        stroke: '#10B981',
        fillOpacity: Math.max(base.fillOpacity - 0.08, 0.2),
      };
    case 'occupied':
      return {
        ...base,
        stroke: '#2563EB',
        fillOpacity: Math.min(base.fillOpacity + 0.12, 0.85),
      };
    case 'reserved':
      return {
        ...base,
        stroke: '#F59E0B',
        fillOpacity: Math.min(base.fillOpacity + 0.08, 0.8),
      };
    case 'maintenance':
      return {
        ...base,
        stroke: '#94A3B8',
        fillOpacity: Math.max(base.fillOpacity - 0.15, 0.15),
      };
    default:
      return base;
  }
}

function darkenHex(hex: string, amount: number): string {
  const raw = hex.replace('#', '');
  if (raw.length !== 6 && raw.length !== 3) return hex;
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  const n = parseInt(full, 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 255) * (1 - amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** Distinct fills for unknown catalog types within a category (stable hash by type name). */
const CATEGORY_TYPE_PALETTES: Record<string, string[]> = {
  workstation: ['#A8A29E', '#78716C', '#E7E5E4', '#57534E', '#D6D3D1'],
  seating: ['#1F2937', '#374151', '#4B5563', '#292524', '#0F172A'],
  meeting_room: ['#A16207', '#57534E', '#64748B', '#1E40AF', '#D6D3D1'],
  cafeteria: ['#D6D3D1', '#A8A29E', '#92400E', '#BAE6FD', '#78716C'],
  cabin: ['#78716C', '#57534E', '#A8A29E', '#44403C'],
  plant: ['#22C55E', '#16A34A', '#4ADE80', '#15803D'],
  restroom: ['#7DD3FC', '#38BDF8', '#BAE6FD', '#0284C7'],
  game_relaxation: ['#FB7185', '#F472B6', '#F9A8D4', '#BE185D'],
  phone_booth: ['#94A3B8', '#64748B', '#CBD5E1', '#475569'],
  circulation: ['#CBD5E1', '#94A3B8', '#E0F2FE', '#64748B'],
  structure: ['#94A3B8', '#64748B', '#78716C', '#475569'],
  custom: ['#94A3B8', '#78716C', '#64748B', '#A8A29E', '#57534E'],
};

function styleForUnknownType(category: string, elementType: string): CategoryVisualStyle {
  const colors = CATEGORY_TYPE_PALETTES[category] || CATEGORY_TYPE_PALETTES.structure;
  let h = 0;
  for (let i = 0; i < elementType.length; i++) {
    h = (h * 31 + elementType.charCodeAt(i)) >>> 0;
  }
  const fill = colors[h % colors.length];
  return {
    fill,
    stroke: darkenHex(fill, 0.28),
    fillOpacity: 0.55,
    strokeWidth: 1.4,
    label: elementType.replace(/-/g, ' '),
  };
}

export function getCategoryStyle(
  category?: string,
  elementType?: string,
  entityColor?: string,
  state: ElementRenderState = 'default',
): CategoryVisualStyle {
  let base: CategoryVisualStyle = FALLBACK;

  if (elementType && ELEMENT_TYPE_STYLES[elementType]) {
    base = ELEMENT_TYPE_STYLES[elementType];
  } else if (elementType && category) {
    base = styleForUnknownType(category, elementType);
  } else if (category && CATEGORY_STYLES[category]) {
    base = CATEGORY_STYLES[category];
  } else if (entityColor) {
    base = {
      fill: entityColor,
      stroke: darkenHex(entityColor, 0.25),
      fillOpacity: 0.45,
      strokeWidth: 1.5,
      label: elementType || category || 'Element',
    };
  }

  // Only honor per-entity color for custom shapes — catalog types keep distinct palettes
  if (entityColor && category === 'custom' && !ELEMENT_TYPE_STYLES[elementType || '']) {
    base = {
      ...base,
      fill: entityColor,
      stroke: darkenHex(entityColor, 0.25),
    };
  }

  return applyRenderState(base, state);
}

/** Alias used by render pipeline docs. */
export const resolveElementStyle = getCategoryStyle;

/**
 * Rewrite catalog SVG markup for floor-plan display.
 * Geometry preserved; fills/strokes remapped via style config.
 */
export function stylizeCatalogSvgMarkup(
  svgText: string,
  style: CategoryVisualStyle,
): string {
  let out = svgText;

  out = out.replace(/<defs>[\s\S]*?<\/defs>/gi, '');
  out = out.replace(/<use[^>]*href=["']#img[^"']*["'][^>]*\/?>/gi, '');
  out = out.replace(/<image[^>]*>/gi, '');

  out = out.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, () => {
    return `<style>
      .s0, .s1, .s2, path, rect, circle, ellipse, polygon, polyline {
        fill: ${style.fill};
        fill-opacity: ${Math.min(style.fillOpacity + 0.35, 0.95)};
        stroke: ${style.stroke};
        stroke-width: ${style.strokeWidth};
        stroke-linejoin: round;
        stroke-linecap: round;
      }
    </style>`;
  });

  // Remap common solid fills (including brand purples left in catalog assets)
  out = out.replace(
    /fill\s*=\s*["'](?!none|transparent)(#[0-9A-Fa-f]{3,8}|rgb\([^)]+\)|rgba\([^)]+\))["']/gi,
    `fill="${style.fill}"`,
  );
  out = out.replace(
    /stroke\s*=\s*["'](?!none|transparent)(#[0-9A-Fa-f]{3,8}|rgb\([^)]+\)|rgba\([^)]+\))["']/gi,
    `stroke="${style.stroke}"`,
  );
  out = out.replace(
    /fill\s*:\s*(?!none|transparent)(#[0-9A-Fa-f]{3,8}|rgb\([^)]+\)|rgba\([^)]+\))/gi,
    `fill: ${style.fill}`,
  );

  if (!/preserveAspectRatio=/i.test(out)) {
    out = out.replace(/<svg\b/i, '<svg preserveAspectRatio="xMidYMid meet"');
  }

  return out;
}

/**
 * PART 8 — generate a standalone SVG document from polygon geometry.
 * Same styling pipeline as catalog assets.
 */
export function generateCustomElementSvg(
  pathD: string,
  widthCells: number,
  heightCells: number,
  style: CategoryVisualStyle,
): string {
  const w = Math.max(widthCells, 1);
  const h = Math.max(heightCells, 1);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet">
  <style>
    path {
      fill: ${style.fill};
      fill-opacity: ${Math.min(style.fillOpacity + 0.35, 0.92)};
      stroke: ${style.stroke};
      stroke-width: ${Math.max(0.08, style.strokeWidth * 0.06)};
      stroke-linejoin: round;
      stroke-linecap: round;
    }
  </style>
  <path d="${pathD}" />
</svg>`;
}

/** Encode generated SVG as a data URL usable by &lt;image href&gt;. */
export function svgMarkupToDataUrl(markup: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

export function isSvgDataUrl(value?: string): boolean {
  return Boolean(value?.startsWith('data:image/svg+xml'));
}

export function deskStatusToRenderState(
  status?: string,
): ElementRenderState {
  switch (status) {
    case 'available':
      return 'available';
    case 'occupied':
      return 'occupied';
    case 'reserved':
      return 'reserved';
    case 'maintenance':
      return 'maintenance';
    default:
      return 'default';
  }
}
