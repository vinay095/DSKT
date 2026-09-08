import type { ElementType, FloorObject, Team } from '@/types/floorPlan';

export interface ObjectVisual {
  fill: string;
  stroke: string;
  strokeWidth: number;
  dash?: number[];
  opacity: number;
  labelColor: string;
  hatch?: boolean;
  cornerRadius?: number;
}

const SPACE_FILLS: Partial<Record<ElementType, string>> = {
  'open-workspace': '#e8eef7',
  'collaboration-area': '#e8f5f2',
  'waiting-area': '#f5f0e8',
  cafeteria: '#fef3c7',
  kitchen: '#ffedd5',
  lounge: '#fce7f3',
  'rest-area': '#f3e8ff',
  restroom: '#e0f2fe',
  cabin: '#f1f5f9',
  'meeting-room': '#ecfdf5',
  'conference-room': '#eef2ff',
  'phone-booth': '#fafafa',
};

export function getObjectVisual(obj: FloorObject, team?: Team | null): ObjectVisual {
  switch (obj.type) {
    case 'desk':
    case 'workstation':
      return {
        fill: team ? `${team.color}22` : '#dbeafe',
        stroke: team?.color ?? '#2563eb',
        strokeWidth: 1.5,
        opacity: 1,
        labelColor: '#0f172a',
        cornerRadius: 2,
      };
    case 'chair':
      return {
        fill: '#94a3b8',
        stroke: '#64748b',
        strokeWidth: 1,
        opacity: 1,
        labelColor: '#334155',
        cornerRadius: 8,
      };
    case 'table':
    case 'meeting-table':
      return {
        fill: '#fde68a',
        stroke: '#b45309',
        strokeWidth: 1.25,
        opacity: 1,
        labelColor: '#78350f',
        cornerRadius: 3,
      };
    case 'sofa':
      return {
        fill: '#fda4af',
        stroke: '#be123c',
        strokeWidth: 1.25,
        opacity: 1,
        labelColor: '#881337',
        cornerRadius: 4,
      };
    case 'storage':
    case 'cabinet':
      return {
        fill: '#cbd5e1',
        stroke: '#475569',
        strokeWidth: 1.25,
        opacity: 1,
        labelColor: '#1e293b',
        cornerRadius: 1,
      };
    case 'pillar':
      return {
        fill: '#64748b',
        stroke: '#334155',
        strokeWidth: 1.5,
        opacity: 1,
        labelColor: '#fff',
        cornerRadius: 2,
      };
    case 'wall':
      return {
        fill: '#1e293b',
        stroke: '#0f172a',
        strokeWidth: 1,
        opacity: 1,
        labelColor: '#fff',
      };
    case 'door':
      return {
        fill: '#a78bfa',
        stroke: '#5b21b6',
        strokeWidth: 1,
        opacity: 0.9,
        labelColor: '#4c1d95',
      };
    case 'window':
      return {
        fill: '#7dd3fc',
        stroke: '#0369a1',
        strokeWidth: 1,
        opacity: 0.85,
        labelColor: '#0c4a6e',
      };
    case 'staircase':
    case 'elevator':
      return {
        fill: '#e2e8f0',
        stroke: '#334155',
        strokeWidth: 1.5,
        opacity: 1,
        labelColor: '#0f172a',
        hatch: true,
      };
    case 'unusable-space':
    case 'restricted-area':
      return {
        fill: '#fecaca',
        stroke: '#b91c1c',
        strokeWidth: 1.5,
        dash: [6, 4],
        opacity: 0.85,
        labelColor: '#7f1d1d',
        hatch: true,
      };
    default: {
      const fill = SPACE_FILLS[obj.type] ?? '#f8fafc';
      const teamTint = team ? `${team.color}18` : fill;
      return {
        fill: obj.properties.teamId ? teamTint : fill,
        stroke: team?.color ?? '#64748b',
        strokeWidth: 1.25,
        opacity: 0.95,
        labelColor: '#1e293b',
        cornerRadius: 2,
      };
    }
  }
}

export function shortLabel(obj: FloorObject): string {
  if (obj.properties.label) return String(obj.properties.label);
  if (obj.properties.employee) return String(obj.properties.employee);
  if (obj.type === 'desk') return 'Desk';
  if (obj.type === 'chair') return '';
  if (obj.type === 'pillar') return '';
  return obj.type
    .split('-')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
