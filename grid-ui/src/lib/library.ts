import type { LibraryItem } from '../types/geometry';

/** Stub library — replace icons/labels later; codes feed the occupancy matrix. */
export const ENTITY_LIBRARY: LibraryItem[] = [
  {
    kind: 'workstation',
    label: 'Workstation',
    code: 1,
    defaultWidth: 1.2,
    defaultHeight: 0.8,
    color: '#3b82f6',
  },
  {
    kind: 'plant',
    label: 'Plant',
    code: 2,
    defaultWidth: 0.5,
    defaultHeight: 0.5,
    color: '#22c55e',
  },
  {
    kind: 'meeting_room',
    label: 'Meeting room',
    code: 3,
    defaultWidth: 4,
    defaultHeight: 3,
    color: '#a855f7',
  },
  {
    kind: 'cafeteria',
    label: 'Cafeteria',
    code: 4,
    defaultWidth: 6,
    defaultHeight: 4,
    color: '#f59e0b',
  },
  {
    kind: 'custom',
    label: 'Custom block',
    code: 9,
    defaultWidth: 1,
    defaultHeight: 1,
    color: '#94a3b8',
  },
];

export const KIND_COLORS: Record<string, string> = Object.fromEntries(
  ENTITY_LIBRARY.map((i) => [i.kind, i.color]),
);
KIND_COLORS.polygon = '#ef4444';
