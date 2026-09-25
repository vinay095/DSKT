/**
 * PART 18 — single reference for DeskIt mock/localStorage sources of truth.
 * Prefer these helpers over scattering key strings. No new backend invented.
 */

import { OFFICES, SEED_FLOORS, DEFAULT_FLOOR_ID, DEFAULT_OFFICE_ID } from '../data/offices';
import { TEAMS } from '../data/teams';
import { MOCK_999_EMPLOYEES } from '../data/employeesData';
import { DESKIT_PUBLISHED_FLOOR_DOC_KEY } from './floorCreator';

/** localStorage key map (frontend mock persistence). */
export const STORAGE_KEYS = {
  sidebarCollapsed: 'deskit_sidebar_collapsed',
  customFloors: 'deskit_custom_floors_v1',
  draftPrefix: 'deskit_draft_',
  publishedFloorPlanPrefix: 'deskit_published_',
  /** Latest Creator doc (mirrored); prefer per-floor key. */
  publishedFloorDocGlobal: DESKIT_PUBLISHED_FLOOR_DOC_KEY,
  publishedFloorDocFor: (floorId: string) =>
    `${DESKIT_PUBLISHED_FLOOR_DOC_KEY}__${floorId}`,
  globalCustomLibrary: 'deskit_global_custom_library_v1',
  floorChangeRequests: 'deskit_floor_change_requests_v1',
} as const;

/**
 * Conceptual model (preferred):
 * Organization → Office → Floor → FloorPlan → Elements → Seats
 * Employee → Team → SeatAssignment → Desk/Seat
 */
export const DATA_MODEL = {
  offices: {
    source: 'frontend/src/data/offices.ts (+ custom floors in localStorage)',
    seed: OFFICES,
  },
  floors: {
    source: 'SEED_FLOORS + deskit_custom_floors_v1',
    seedCount: SEED_FLOORS.length,
    defaultId: DEFAULT_FLOOR_ID,
    defaultOfficeId: DEFAULT_OFFICE_ID,
  },
  floorPlans: {
    source: 'localStorage deskit_published_{floorId} / deskit_draft_{floorId}',
    note: 'Each floorId is independent — no shared mutable plan state',
  },
  creatorDocuments: {
    source: 'deskit_published_floor_document_v2__{floorId} (+ global mirror)',
    note: 'Creator SVG FloorDocument v2; DeskIt converts to desks on publish',
  },
  catalog: {
    source: 'creator/grid-ui/public/library-catalog.json',
    styles: 'creator + frontend lib/categoryStyles.ts (keep in sync)',
  },
  customElements: {
    source: 'document.customLibrary + deskit_global_custom_library_v1',
    note: 'Generated SVG data URLs; reusable across drafts',
  },
  employees: {
    source: 'MOCK_999_EMPLOYEES / optional Supabase employees table',
    count: MOCK_999_EMPLOYEES.length,
  },
  teams: {
    source: 'frontend/src/data/teams.ts',
    count: TEAMS.length,
    note: 'Team color ≠ element category color ≠ occupancy status',
  },
  assignments: {
    source: 'FloorPlan.desks.* + optional Supabase seat_assignments',
  },
  statuses: {
    source: 'EMPLOYEE_STATUS_CONFIG in types/database.ts',
  },
} as const;

export type DataModelDomain = keyof typeof DATA_MODEL;
