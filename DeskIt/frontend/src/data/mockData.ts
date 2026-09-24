import { User } from '../types/auth';
import { FloorPlan, FloorPlanDraft } from '../types/floorplan';
import { Department, SeatAssignmentRequest } from '../types/seating';
import { DEFAULT_FLOOR_CONFIG } from '../geometry/grid';

export const MOCK_USERS: Record<string, User> = {
  employee: {
    id: 'usr-1',
    name: 'Alex Rivera',
    email: 'alex.rivera@deskit.io',
    role: 'employee',
    department: 'Engineering',
    title: 'Senior Frontend Engineer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    assignedDeskId: 'desk-104',
    floorId: 'floor-4'
  },
  hr: {
    id: 'usr-2',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@deskit.io',
    role: 'hr',
    department: 'People & Culture',
    title: 'Head of Workplace Operations',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    assignedDeskId: 'desk-201',
    floorId: 'floor-4'
  },
  admin: {
    id: 'usr-3',
    name: 'Marcus Vance',
    email: 'marcus.vance@deskit.io',
    role: 'admin',
    department: 'Facilities & Infrastructure',
    title: 'Global Facilities Admin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    assignedDeskId: 'desk-301',
    floorId: 'floor-4'
  }
};

export const ALL_EMPLOYEES: User[] = [
  MOCK_USERS.employee,
  MOCK_USERS.hr,
  MOCK_USERS.admin,
  {
    id: 'usr-4',
    name: 'David Chen',
    email: 'david.chen@deskit.io',
    role: 'employee',
    department: 'Engineering',
    title: 'Backend Tech Lead',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    assignedDeskId: 'desk-101',
    floorId: 'floor-4'
  },
  {
    id: 'usr-5',
    name: 'Elena Rostova',
    email: 'elena.r@deskit.io',
    role: 'employee',
    department: 'Product',
    title: 'Lead Product Manager',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    assignedDeskId: 'desk-102',
    floorId: 'floor-4'
  },
  {
    id: 'usr-6',
    name: 'James Wilson',
    email: 'james.w@deskit.io',
    role: 'employee',
    department: 'Design',
    title: 'Principal UX Architect',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    assignedDeskId: 'desk-103',
    floorId: 'floor-4'
  },
  {
    id: 'usr-7',
    name: 'Priya Sharma',
    email: 'priya.s@deskit.io',
    role: 'employee',
    department: 'Marketing',
    title: 'Growth Specialist',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    assignedDeskId: undefined,
    floorId: undefined
  },
  {
    id: 'usr-8',
    name: 'Lucas Thorne',
    email: 'lucas.t@deskit.io',
    role: 'employee',
    department: 'Engineering',
    title: 'DevOps Specialist',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    assignedDeskId: undefined,
    floorId: undefined
  }
];

export const DEPARTMENTS: Department[] = [
  { id: 'dept-eng', name: 'Engineering', color: '#3B82F6', headCount: 42, assignedDesks: 38 },
  { id: 'dept-prod', name: 'Product', color: '#8B5CF6', headCount: 18, assignedDesks: 16 },
  { id: 'dept-design', name: 'Design', color: '#EC4899', headCount: 12, assignedDesks: 11 },
  { id: 'dept-hr', name: 'People & Culture', color: '#10B981', headCount: 8, assignedDesks: 8 },
  { id: 'dept-mktg', name: 'Marketing', color: '#F59E0B', headCount: 15, assignedDesks: 10 },
];

export const INITIAL_FLOOR_PLAN: FloorPlan = {
  id: 'floor-4',
  name: 'Floor 4 - Tech & Product Hub',
  building: 'HQ Tower Alpha',
  version: 2,
  gridWidth: 20,
  gridHeight: 14,
  floorConfig: DEFAULT_FLOOR_CONFIG,
  lastModified: new Date().toISOString(),
  isPublished: true,
  zones: [
    { id: 'zone-eng', name: 'Engineering Squad Zone', x: 2, y: 2, width: 8, height: 6, color: '#3B82F6', department: 'Engineering' },
    { id: 'zone-prod', name: 'Product & Design Bay', x: 11, y: 2, width: 7, height: 6, color: '#8B5CF6', department: 'Product' },
    { id: 'zone-hr', name: 'Executive & HR Suite', x: 2, y: 9, width: 7, height: 4, color: '#10B981', department: 'People & Culture' },
  ],
  unusableRegions: [
    {
      id: 'unusable-pillar-1',
      name: 'Structural Column A',
      category: 'pillar',
      cells: [{ col: 40, row: 20 }, { col: 41, row: 20 }, { col: 40, row: 21 }, { col: 41, row: 21 }],
      pathSvg: 'M 160 80 L 168 80 L 168 88 L 160 88 Z',
    }
  ],
  rooms: [
    { id: 'room-1', name: 'Titan Conference Room', x: 11, y: 9, width: 4, height: 4, type: 'meeting', capacity: 12 },
    { id: 'room-2', name: 'Coffee & Breakout Lounge', x: 16, y: 9, width: 3, height: 4, type: 'breakout', capacity: 15 },
    { id: 'room-3', name: 'Restrooms', x: 18, y: 2, width: 2, height: 4, type: 'restroom' }
  ],
  walls: [
    { id: 'w-1', x1: 10, y1: 1, x2: 10, y2: 13 },
    { id: 'w-2', x1: 1, y1: 8, x2: 18, y2: 8 }
  ],
  desks: [
    {
      id: 'desk-101',
      code: 'A-101',
      x: 3,
      y: 3,
      rotation: 0,
      status: 'occupied',
      assignedUserId: 'usr-4',
      assignedUserName: 'David Chen',
      department: 'Engineering',
      hasMonitor: true,
      isStandingDesk: true,
      geometry: {
        objectId: 'obj-101',
        category: 'desk',
        elementType: 'cat-desk-standing',
        originFinest: { col: 12, row: 12 },
        widthFinestCells: 8,
        heightFinestCells: 6,
        rotation: 0,
        color: '#3B82F6',
        label: 'A-101',
      },
    },
    {
      id: 'desk-102',
      code: 'A-102',
      x: 5,
      y: 3,
      rotation: 0,
      status: 'occupied',
      assignedUserId: 'usr-5',
      assignedUserName: 'Elena Rostova',
      department: 'Product',
      hasMonitor: true,
      isStandingDesk: false,
      geometry: {
        objectId: 'obj-102',
        category: 'desk',
        elementType: 'cat-desk-standard',
        originFinest: { col: 20, row: 12 },
        widthFinestCells: 8,
        heightFinestCells: 6,
        rotation: 0,
        color: '#8B5CF6',
        label: 'A-102',
      },
    },
    {
      id: 'desk-103',
      code: 'A-103',
      x: 7,
      y: 3,
      rotation: 0,
      status: 'occupied',
      assignedUserId: 'usr-6',
      assignedUserName: 'James Wilson',
      department: 'Design',
      hasMonitor: true,
      isStandingDesk: true,
    },
    {
      id: 'desk-104',
      code: 'A-104',
      x: 3,
      y: 5,
      rotation: 0,
      status: 'occupied',
      assignedUserId: 'usr-1',
      assignedUserName: 'Alex Rivera',
      department: 'Engineering',
      hasMonitor: true,
      isStandingDesk: false,
    },
    {
      id: 'desk-105',
      code: 'A-105',
      x: 5,
      y: 5,
      rotation: 0,
      status: 'available',
      department: 'Engineering',
      hasMonitor: true,
      isStandingDesk: false,
    },
    {
      id: 'desk-106',
      code: 'A-106',
      x: 7,
      y: 5,
      rotation: 0,
      status: 'available',
      department: 'Engineering',
      hasMonitor: false,
      isStandingDesk: true,
    },
    {
      id: 'desk-201',
      code: 'B-201',
      x: 12,
      y: 3,
      rotation: 0,
      status: 'occupied',
      assignedUserId: 'usr-2',
      assignedUserName: 'Sarah Jenkins',
      department: 'People & Culture',
      hasMonitor: true,
      isStandingDesk: false,
    },
    {
      id: 'desk-202',
      code: 'B-202',
      x: 14,
      y: 3,
      rotation: 0,
      status: 'available',
      department: 'Product',
      hasMonitor: true,
      isStandingDesk: true,
    },
    {
      id: 'desk-203',
      code: 'B-203',
      x: 16,
      y: 3,
      rotation: 0,
      status: 'reserved',
      department: 'Product',
      hasMonitor: true,
      isStandingDesk: false,
    },
    {
      id: 'desk-204',
      code: 'B-204',
      x: 12,
      y: 5,
      rotation: 0,
      status: 'available',
      department: 'Product',
      hasMonitor: true,
      isStandingDesk: false,
    },
    {
      id: 'desk-301',
      code: 'C-301',
      x: 3,
      y: 10,
      rotation: 0,
      status: 'occupied',
      assignedUserId: 'usr-3',
      assignedUserName: 'Marcus Vance',
      department: 'Facilities & Infrastructure',
      hasMonitor: true,
      isStandingDesk: true,
    },
    {
      id: 'desk-302',
      code: 'C-302',
      x: 5,
      y: 10,
      rotation: 0,
      status: 'available',
      department: 'People & Culture',
      hasMonitor: true,
      isStandingDesk: false,
    },
    {
      id: 'desk-303',
      code: 'C-303',
      x: 7,
      y: 10,
      rotation: 0,
      status: 'maintenance',
      department: 'Facilities',
      hasMonitor: false,
      isStandingDesk: false,
    },
  ]
};

export const MOCK_REQUESTS: SeatAssignmentRequest[] = [
  {
    id: 'req-1',
    userId: 'usr-7',
    userName: 'Priya Sharma',
    userAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    department: 'Marketing',
    requestedDeskId: 'desk-105',
    status: 'pending',
    requestDate: '2026-09-21',
    notes: 'Needs standing desk near Engineering team for cross-functional project.'
  },
  {
    id: 'req-2',
    userId: 'usr-8',
    userName: 'Lucas Thorne',
    userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    department: 'Engineering',
    requestedDeskId: 'desk-106',
    status: 'pending',
    requestDate: '2026-09-22',
    notes: 'DevOps lead requiring dual monitor setup desk in Zone A.'
  }
];

export const MOCK_DRAFTS: FloorPlanDraft[] = [
  {
    id: 'draft-1',
    floorPlanId: 'floor-4',
    name: 'Q4 2026 Engineering Expansion Draft',
    updatedAt: '2026-09-20T11:30:00Z',
    data: INITIAL_FLOOR_PLAN
  }
];
