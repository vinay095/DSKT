import type { FloorObject, FloorPlanDocument, Team } from '@/types/floorPlan';
import { createId } from '@/data/elementLibrary';

export const DEFAULT_TEAMS: Team[] = [
  { id: 'team-eng', name: 'Engineering', color: '#2563eb', pattern: 'hatch' },
  { id: 'team-product', name: 'Product', color: '#0d9488', pattern: 'solid' },
  { id: 'team-finance', name: 'Finance', color: '#b45309', pattern: 'dots' },
  { id: 'team-hr', name: 'HR', color: '#7c3aed', pattern: 'solid' },
  { id: 'team-sales', name: 'Sales', color: '#dc2626', pattern: 'hatch' },
  { id: 'team-marketing', name: 'Marketing', color: '#db2777', pattern: 'dots' },
  { id: 'team-ops', name: 'Operations', color: '#475569', pattern: 'solid' },
];

function desk(
  x: number,
  y: number,
  teamId: string,
  employee: string | null,
  rotation = 0,
): FloorObject {
  return {
    id: createId('desk'),
    type: 'desk',
    x,
    y,
    width: 1.6,
    height: 0.8,
    rotation,
    layer: 'furniture',
    mobility: 'movable',
    properties: { teamId, employee },
  };
}

function chair(x: number, y: number, rotation = 0): FloorObject {
  return {
    id: createId('chair'),
    type: 'chair',
    x,
    y,
    width: 0.55,
    height: 0.55,
    rotation,
    layer: 'furniture',
    mobility: 'movable',
    properties: {},
  };
}

/** Realistic sample office layout for demos. */
export function createSampleFloorPlan(): FloorPlanDocument {
  const objects: FloorObject[] = [];

  // —— Open workspaces / team zones (background spaces) ——
  objects.push({
    id: 'ws-eng',
    type: 'open-workspace',
    x: 4,
    y: 4,
    width: 28,
    height: 18,
    rotation: 0,
    layer: 'spaces',
    mobility: 'fixed',
    properties: { label: 'Engineering', teamId: 'team-eng' },
  });
  objects.push({
    id: 'ws-product',
    type: 'open-workspace',
    x: 34,
    y: 4,
    width: 18,
    height: 18,
    rotation: 0,
    layer: 'spaces',
    mobility: 'fixed',
    properties: { label: 'Product', teamId: 'team-product' },
  });
  objects.push({
    id: 'ws-finance',
    type: 'open-workspace',
    x: 4,
    y: 28,
    width: 16,
    height: 14,
    rotation: 0,
    layer: 'spaces',
    mobility: 'fixed',
    properties: { label: 'Finance', teamId: 'team-finance' },
  });
  objects.push({
    id: 'ws-sales',
    type: 'open-workspace',
    x: 22,
    y: 28,
    width: 16,
    height: 14,
    rotation: 0,
    layer: 'spaces',
    mobility: 'fixed',
    properties: { label: 'Sales', teamId: 'team-sales' },
  });
  objects.push({
    id: 'ws-hr',
    type: 'open-workspace',
    x: 54,
    y: 4,
    width: 14,
    height: 12,
    rotation: 0,
    layer: 'spaces',
    mobility: 'fixed',
    properties: { label: 'HR', teamId: 'team-hr' },
  });
  objects.push({
    id: 'ws-marketing',
    type: 'collaboration-area',
    x: 54,
    y: 18,
    width: 14,
    height: 10,
    rotation: 0,
    layer: 'spaces',
    mobility: 'fixed',
    properties: { label: 'Marketing', teamId: 'team-marketing' },
  });

  // —— Facilities ——
  objects.push({
    id: 'cafeteria-1',
    type: 'cafeteria',
    x: 72,
    y: 4,
    width: 24,
    height: 14,
    rotation: 0,
    layer: 'spaces',
    mobility: 'fixed',
    properties: { label: 'Cafeteria', capacity: 48 },
  });
  objects.push({
    id: 'kitchen-1',
    type: 'kitchen',
    x: 72,
    y: 20,
    width: 8,
    height: 5,
    rotation: 0,
    layer: 'spaces',
    mobility: 'fixed',
    properties: { label: 'Kitchen' },
  });
  objects.push({
    id: 'lounge-1',
    type: 'lounge',
    x: 82,
    y: 20,
    width: 14,
    height: 8,
    rotation: 0,
    layer: 'spaces',
    mobility: 'fixed',
    properties: { label: 'Lounge' },
  });
  objects.push({
    id: 'restroom-m',
    type: 'restroom',
    x: 72,
    y: 32,
    width: 5,
    height: 4,
    rotation: 0,
    layer: 'spaces',
    mobility: 'fixed',
    properties: { label: 'Restroom M' },
  });
  objects.push({
    id: 'restroom-w',
    type: 'restroom',
    x: 78,
    y: 32,
    width: 5,
    height: 4,
    rotation: 0,
    layer: 'spaces',
    mobility: 'fixed',
    properties: { label: 'Restroom W' },
  });
  objects.push({
    id: 'waiting-1',
    type: 'waiting-area',
    x: 86,
    y: 32,
    width: 10,
    height: 6,
    rotation: 0,
    layer: 'spaces',
    mobility: 'fixed',
    properties: { label: 'Reception' },
  });

  // —— Meeting rooms & cabins ——
  objects.push({
    id: 'mr-1',
    type: 'meeting-room',
    x: 40,
    y: 28,
    width: 7,
    height: 5,
    rotation: 0,
    layer: 'spaces',
    mobility: 'fixed',
    properties: { label: 'Meeting A', capacity: 8 },
  });
  objects.push({
    id: 'mr-2',
    type: 'meeting-room',
    x: 48,
    y: 28,
    width: 7,
    height: 5,
    rotation: 0,
    layer: 'spaces',
    mobility: 'fixed',
    properties: { label: 'Meeting B', capacity: 8 },
  });
  objects.push({
    id: 'conf-1',
    type: 'conference-room',
    x: 40,
    y: 36,
    width: 15,
    height: 8,
    rotation: 0,
    layer: 'spaces',
    mobility: 'fixed',
    properties: { label: 'Conference', capacity: 20 },
  });
  objects.push({
    id: 'cabin-1',
    type: 'cabin',
    x: 58,
    y: 30,
    width: 4,
    height: 3.5,
    rotation: 0,
    layer: 'spaces',
    mobility: 'fixed',
    properties: { label: 'Cabin 1', capacity: 1 },
  });
  objects.push({
    id: 'cabin-2',
    type: 'cabin',
    x: 63,
    y: 30,
    width: 4,
    height: 3.5,
    rotation: 0,
    layer: 'spaces',
    mobility: 'fixed',
    properties: { label: 'Cabin 2', capacity: 1 },
  });
  objects.push({
    id: 'cabin-3',
    type: 'cabin',
    x: 58,
    y: 35,
    width: 4,
    height: 3.5,
    rotation: 0,
    layer: 'spaces',
    mobility: 'fixed',
    properties: { label: 'Cabin 3', capacity: 1 },
  });
  objects.push({
    id: 'cabin-4',
    type: 'cabin',
    x: 63,
    y: 35,
    width: 4,
    height: 3.5,
    rotation: 0,
    layer: 'spaces',
    mobility: 'fixed',
    properties: { label: 'Cabin 4', capacity: 1 },
  });

  // Phone booths
  for (let i = 0; i < 4; i++) {
    objects.push({
      id: `pb-${i}`,
      type: 'phone-booth',
      x: 56 + i * 1.5,
      y: 40.5,
      width: 1.2,
      height: 1.2,
      rotation: 0,
      layer: 'spaces',
      mobility: 'fixed',
      properties: { label: `Booth ${i + 1}` },
    });
  }

  // —— Infrastructure ——
  const pillars: [number, number][] = [
    [20, 24],
    [40, 24],
    [60, 24],
    [80, 24],
    [20, 44],
    [40, 44],
    [60, 44],
    [80, 44],
  ];
  pillars.forEach(([x, y], i) => {
    objects.push({
      id: `pillar-${i}`,
      type: 'pillar',
      x,
      y,
      width: 1.2,
      height: 1.2,
      rotation: 0,
      layer: 'infrastructure',
      mobility: 'fixed',
      properties: {},
    });
  });

  objects.push({
    id: 'stair-1',
    type: 'staircase',
    x: 68,
    y: 40,
    width: 3.5,
    height: 5,
    rotation: 0,
    layer: 'infrastructure',
    mobility: 'fixed',
    properties: { label: 'Stairs' },
  });
  objects.push({
    id: 'elev-1',
    type: 'elevator',
    x: 72.5,
    y: 41,
    width: 2.5,
    height: 2.5,
    rotation: 0,
    layer: 'infrastructure',
    mobility: 'fixed',
    properties: { label: 'Elevator' },
  });
  objects.push({
    id: 'unusable-1',
    type: 'unusable-space',
    x: 90,
    y: 42,
    width: 6,
    height: 5,
    rotation: 0,
    layer: 'infrastructure',
    mobility: 'restricted',
    properties: { reason: 'mechanical shaft', label: 'Mech. shaft' },
  });
  objects.push({
    id: 'restricted-1',
    type: 'restricted-area',
    x: 4,
    y: 46,
    width: 8,
    height: 6,
    rotation: 0,
    layer: 'infrastructure',
    mobility: 'restricted',
    properties: { reason: 'emergency exit zone', label: 'Exit zone' },
  });

  // —— Engineering desks (4×4 block) ——
  const engNames = [
    'A. Chen', 'B. Patel', 'C. Kim', 'D. Rossi',
    'E. Novak', 'F. Silva', 'G. Wong', 'H. Berg',
    'I. Costa', 'J. Meier', 'K. Singh', 'L. Park',
    null, 'M. Diaz', null, 'N. Frost',
  ];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const x = 6 + col * 5.5;
      const y = 7 + row * 3.5;
      const idx = row * 4 + col;
      objects.push(desk(x, y, 'team-eng', engNames[idx]));
      objects.push(chair(x + 0.5, y + 1.1));
    }
  }

  // —— Product desks ——
  const prodNames = ['O. Lane', 'P. Reed', 'Q. Fox', 'R. Vale', 'S. Quinn', 'T. Hale'];
  for (let i = 0; i < 6; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 36 + col * 5;
    const y = 7 + row * 4;
    objects.push(desk(x, y, 'team-product', prodNames[i]));
    objects.push(chair(x + 0.5, y + 1.1));
  }

  // —— Finance desks ——
  for (let i = 0; i < 6; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    objects.push(desk(6 + col * 4.5, 30 + row * 4, 'team-finance', `Finance ${i + 1}`));
    objects.push(chair(6.5 + col * 4.5, 31.1 + row * 4));
  }

  // —— Sales desks ——
  for (let i = 0; i < 6; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    objects.push(desk(24 + col * 4.5, 30 + row * 4, 'team-sales', `Sales ${i + 1}`));
    objects.push(chair(24.5 + col * 4.5, 31.1 + row * 4));
  }

  // —— HR desks ——
  for (let i = 0; i < 4; i++) {
    objects.push(desk(56 + (i % 2) * 5, 6 + Math.floor(i / 2) * 4, 'team-hr', `HR ${i + 1}`));
  }

  // —— Marketing ——
  for (let i = 0; i < 4; i++) {
    objects.push(desk(56 + (i % 2) * 5, 20 + Math.floor(i / 2) * 3.5, 'team-marketing', `Mkt ${i + 1}`));
  }

  // Furniture accents
  objects.push({
    id: 'sofa-1',
    type: 'sofa',
    x: 84,
    y: 22,
    width: 2.4,
    height: 0.9,
    rotation: 0,
    layer: 'furniture',
    mobility: 'movable',
    properties: {},
  });
  objects.push({
    id: 'mt-1',
    type: 'meeting-table',
    x: 42,
    y: 29.5,
    width: 3.2,
    height: 1.6,
    rotation: 0,
    layer: 'furniture',
    mobility: 'movable',
    properties: {},
  });
  objects.push({
    id: 'storage-1',
    type: 'storage',
    x: 30,
    y: 5,
    width: 1.2,
    height: 0.5,
    rotation: 0,
    layer: 'furniture',
    mobility: 'movable',
    properties: {},
  });

  return {
    version: 1,
    floor: {
      width: 100,
      height: 55,
      name: 'Level 3 — Main Office',
      gridSize: 0.5,
    },
    objects,
    teams: DEFAULT_TEAMS,
    meta: {
      name: 'SpaceMap Sample Campus',
      updatedAt: new Date().toISOString(),
    },
  };
}
