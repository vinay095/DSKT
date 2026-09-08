import type { ElementDefinition, ElementType } from '@/types/floorPlan';

export const ELEMENT_LIBRARY: ElementDefinition[] = [
  // Furniture
  { type: 'desk', label: 'Desk', category: 'furniture', defaultWidth: 1.6, defaultHeight: 0.8, mobility: 'movable', layer: 'furniture', icon: 'desk', defaultProperties: { employee: null, teamId: null } },
  { type: 'workstation', label: 'Workstation', category: 'furniture', defaultWidth: 1.8, defaultHeight: 1.6, mobility: 'movable', layer: 'furniture', icon: 'workstation', defaultProperties: { employee: null, teamId: null } },
  { type: 'chair', label: 'Chair', category: 'furniture', defaultWidth: 0.6, defaultHeight: 0.6, mobility: 'movable', layer: 'furniture', icon: 'chair' },
  { type: 'table', label: 'Table', category: 'furniture', defaultWidth: 2, defaultHeight: 1, mobility: 'movable', layer: 'furniture', icon: 'table' },
  { type: 'meeting-table', label: 'Meeting table', category: 'furniture', defaultWidth: 3.2, defaultHeight: 1.6, mobility: 'movable', layer: 'furniture', icon: 'meeting-table' },
  { type: 'sofa', label: 'Sofa', category: 'furniture', defaultWidth: 2.2, defaultHeight: 0.9, mobility: 'movable', layer: 'furniture', icon: 'sofa' },
  { type: 'storage', label: 'Storage', category: 'furniture', defaultWidth: 1.2, defaultHeight: 0.5, mobility: 'movable', layer: 'furniture', icon: 'storage' },
  { type: 'cabinet', label: 'Cabinet', category: 'furniture', defaultWidth: 1, defaultHeight: 0.5, mobility: 'movable', layer: 'furniture', icon: 'cabinet' },

  // Rooms / Spaces
  { type: 'cabin', label: 'Cabin', category: 'spaces', defaultWidth: 4, defaultHeight: 3.5, mobility: 'fixed', layer: 'spaces', icon: 'cabin', defaultProperties: { capacity: 1 } },
  { type: 'meeting-room', label: 'Meeting room', category: 'spaces', defaultWidth: 6, defaultHeight: 4.5, mobility: 'fixed', layer: 'spaces', icon: 'meeting-room', defaultProperties: { capacity: 8 } },
  { type: 'conference-room', label: 'Conference room', category: 'spaces', defaultWidth: 10, defaultHeight: 6, mobility: 'fixed', layer: 'spaces', icon: 'conference-room', defaultProperties: { capacity: 16 } },
  { type: 'restroom', label: 'Restroom', category: 'spaces', defaultWidth: 4, defaultHeight: 3, mobility: 'fixed', layer: 'spaces', icon: 'restroom' },
  { type: 'cafeteria', label: 'Cafeteria', category: 'spaces', defaultWidth: 12, defaultHeight: 8, mobility: 'fixed', layer: 'spaces', icon: 'cafeteria', defaultProperties: { capacity: 40 } },
  { type: 'kitchen', label: 'Kitchen', category: 'spaces', defaultWidth: 5, defaultHeight: 4, mobility: 'fixed', layer: 'spaces', icon: 'kitchen' },
  { type: 'rest-area', label: 'Rest area', category: 'spaces', defaultWidth: 6, defaultHeight: 4, mobility: 'fixed', layer: 'spaces', icon: 'rest-area' },
  { type: 'lounge', label: 'Lounge', category: 'spaces', defaultWidth: 7, defaultHeight: 5, mobility: 'fixed', layer: 'spaces', icon: 'lounge' },
  { type: 'phone-booth', label: 'Phone booth', category: 'spaces', defaultWidth: 1.2, defaultHeight: 1.2, mobility: 'fixed', layer: 'spaces', icon: 'phone-booth' },

  // Infrastructure
  { type: 'pillar', label: 'Pillar', category: 'infrastructure', defaultWidth: 1, defaultHeight: 1, mobility: 'fixed', layer: 'infrastructure', icon: 'pillar' },
  { type: 'wall', label: 'Wall', category: 'infrastructure', defaultWidth: 6, defaultHeight: 0.3, mobility: 'fixed', layer: 'infrastructure', icon: 'wall' },
  { type: 'door', label: 'Door', category: 'infrastructure', defaultWidth: 1, defaultHeight: 0.3, mobility: 'fixed', layer: 'infrastructure', icon: 'door' },
  { type: 'window', label: 'Window', category: 'infrastructure', defaultWidth: 2, defaultHeight: 0.25, mobility: 'fixed', layer: 'infrastructure', icon: 'window' },
  { type: 'staircase', label: 'Staircase', category: 'infrastructure', defaultWidth: 3, defaultHeight: 4, mobility: 'fixed', layer: 'infrastructure', icon: 'staircase' },
  { type: 'elevator', label: 'Elevator', category: 'infrastructure', defaultWidth: 2.5, defaultHeight: 2.5, mobility: 'fixed', layer: 'infrastructure', icon: 'elevator' },

  // Special
  { type: 'unusable-space', label: 'Unusable space', category: 'special', defaultWidth: 3, defaultHeight: 3, mobility: 'restricted', layer: 'infrastructure', icon: 'unusable', defaultProperties: { reason: 'structural' } },
  { type: 'restricted-area', label: 'Restricted area', category: 'special', defaultWidth: 4, defaultHeight: 3, mobility: 'restricted', layer: 'infrastructure', icon: 'restricted', defaultProperties: { reason: 'restricted' } },
  { type: 'waiting-area', label: 'Waiting area', category: 'special', defaultWidth: 5, defaultHeight: 4, mobility: 'fixed', layer: 'spaces', icon: 'waiting' },
  { type: 'collaboration-area', label: 'Collaboration area', category: 'special', defaultWidth: 8, defaultHeight: 6, mobility: 'fixed', layer: 'spaces', icon: 'collaboration' },
  { type: 'open-workspace', label: 'Open workspace', category: 'special', defaultWidth: 12, defaultHeight: 8, mobility: 'fixed', layer: 'spaces', icon: 'open-workspace' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  furniture: 'Furniture',
  spaces: 'Rooms / Spaces',
  infrastructure: 'Infrastructure',
  special: 'Special Areas',
};

const byType = new Map(ELEMENT_LIBRARY.map((e) => [e.type, e]));

export function getElementDefinition(type: ElementType): ElementDefinition {
  return byType.get(type) ?? ELEMENT_LIBRARY[0];
}

export function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
