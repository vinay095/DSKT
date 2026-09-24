import { CanvasElementType } from '../types/floorplan';

export interface CatalogItem {
  id: string;
  name: string;
  category: CanvasElementType;
  subcategory: 'desk' | 'room' | 'seating' | 'amenity' | 'infrastructure' | 'plant';
  widthFinestCells: number;  // Dimension in a/16 finest units
  heightFinestCells: number; // Dimension in a/16 finest units
  color: string;
  hasMonitor?: boolean;
  isStandingDesk?: boolean;
  capacity?: number;
  description: string;
  iconName: string;
}

export const CATALOG_ITEMS: CatalogItem[] = [
  // --- DESKS ---
  {
    id: 'cat-desk-standard',
    name: 'Standard Workstation',
    category: 'desk',
    subcategory: 'desk',
    widthFinestCells: 8,  // 2 placement cells
    heightFinestCells: 6, // 1.5 placement cells
    color: '#3B82F6',
    hasMonitor: true,
    isStandingDesk: false,
    description: 'Standard office desk with single/dual monitor arm.',
    iconName: 'Monitor',
  },
  {
    id: 'cat-desk-standing',
    name: 'Ergonomic Standing Desk',
    category: 'desk',
    subcategory: 'desk',
    widthFinestCells: 8,
    heightFinestCells: 6,
    color: '#8B5CF6',
    hasMonitor: true,
    isStandingDesk: true,
    description: 'Height-adjustable standing desk for modern ergonomics.',
    iconName: 'Sparkles',
  },
  {
    id: 'cat-desk-executive',
    name: 'Executive Suite Desk',
    category: 'desk',
    subcategory: 'desk',
    widthFinestCells: 12, // 3 placement cells
    heightFinestCells: 8,  // 2 placement cells
    color: '#10B981',
    hasMonitor: true,
    isStandingDesk: false,
    description: 'Large L-shaped manager desk with privacy shield.',
    iconName: 'Building',
  },

  // --- ROOMS & CABINS ---
  {
    id: 'cat-room-meeting-sm',
    name: 'Huddle Meeting Pod',
    category: 'room',
    subcategory: 'room',
    widthFinestCells: 16, // 4 placement cells
    heightFinestCells: 16, // 4 placement cells
    color: '#8B5CF6',
    capacity: 4,
    description: '4-person quick sync meeting room.',
    iconName: 'Square',
  },
  {
    id: 'cat-room-conference-lg',
    name: 'Titan Boardroom',
    category: 'room',
    subcategory: 'room',
    widthFinestCells: 28, // 7 placement cells
    heightFinestCells: 20, // 5 placement cells
    color: '#3B82F6',
    capacity: 12,
    description: '12-person executive conference suite.',
    iconName: 'Building2',
  },
  {
    id: 'cat-room-phone-booth',
    name: 'Acoustic Phone Booth',
    category: 'room',
    subcategory: 'amenity',
    widthFinestCells: 8,
    heightFinestCells: 8,
    color: '#EC4899',
    capacity: 1,
    description: 'Private soundproof booth for video calls.',
    iconName: 'PhoneCall',
  },

  // --- AMENITIES & INFRASTRUCTURE ---
  {
    id: 'cat-amenity-cafeteria',
    name: 'Coffee & Snack Lounge',
    category: 'room',
    subcategory: 'amenity',
    widthFinestCells: 24,
    heightFinestCells: 16,
    color: '#F59E0B',
    capacity: 15,
    description: 'Breakout kitchen area with espresso machine.',
    iconName: 'Coffee',
  },
  {
    id: 'cat-infra-restroom',
    name: 'Executive Restroom',
    category: 'room',
    subcategory: 'infrastructure',
    widthFinestCells: 16,
    heightFinestCells: 16,
    color: '#64748B',
    description: 'Gender-neutral restroom facilities.',
    iconName: 'Bath',
  },
  {
    id: 'cat-infra-pillar',
    name: 'Structural Support Pillar',
    category: 'pillar',
    subcategory: 'infrastructure',
    widthFinestCells: 8,
    heightFinestCells: 8,
    color: '#475569',
    description: 'Concrete structural pillar (blocks furniture placement).',
    iconName: 'Box',
  },
  {
    id: 'cat-plant-decor',
    name: 'Indoor Palm Plant',
    category: 'unusable',
    subcategory: 'plant',
    widthFinestCells: 4,
    heightFinestCells: 4,
    color: '#10B981',
    description: 'Decorative greenery element.',
    iconName: 'Trees',
  },
];
