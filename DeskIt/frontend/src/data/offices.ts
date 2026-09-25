import type { FloorOption, Office } from '../types/office';

/** Seed offices — each can hold multiple independent floor plans. */
export const OFFICES: Office[] = [
  { id: 'office-noida', name: 'Noida HQ', city: 'Noida', country: 'India' },
  { id: 'office-hyderabad', name: 'Hyderabad', city: 'Hyderabad', country: 'India' },
  { id: 'office-kolkata', name: 'Kolkata', city: 'Kolkata', country: 'India' },
  { id: 'office-dubai', name: 'Dubai', city: 'Dubai', country: 'UAE' },
  { id: 'office-romania', name: 'Romania', city: 'Bucharest', country: 'Romania' },
];

/**
 * Seed floors. Keep `floor-4` as default for existing drafts / mock users.
 * locationLabel aligns with employeeGenerator location strings.
 */
export const SEED_FLOORS: FloorOption[] = [
  {
    id: 'floor-4',
    officeId: 'office-noida',
    label: '4th Floor — Tech & Product Hub',
    shortLabel: '4th Floor',
    locationLabel: 'Noida 4th Floor',
  },
  {
    id: 'floor-5',
    officeId: 'office-noida',
    label: '6th Floor — Engineering',
    shortLabel: '6th Floor',
    locationLabel: 'Noida 6th Floor',
  },
  {
    id: 'floor-3',
    officeId: 'office-noida',
    label: '3rd Floor — Global Operations',
    shortLabel: '3rd Floor',
    locationLabel: 'Noida 3rd Floor',
  },
  {
    id: 'floor-hyd-1',
    officeId: 'office-hyderabad',
    label: 'Floor 1 — Main Campus',
    shortLabel: 'Floor 1',
    locationLabel: 'Hyderabad Office',
  },
  {
    id: 'floor-kol-1',
    officeId: 'office-kolkata',
    label: 'Floor 1 — Delivery Center',
    shortLabel: 'Floor 1',
    locationLabel: 'Kolkata Office',
  },
  {
    id: 'floor-dxb-1',
    officeId: 'office-dubai',
    label: 'Floor 1 — Regional Hub',
    shortLabel: 'Floor 1',
    locationLabel: 'Dubai Office',
  },
  {
    id: 'floor-ro-1',
    officeId: 'office-romania',
    label: 'Floor 1 — Bucharest',
    shortLabel: 'Floor 1',
    locationLabel: 'Romania Office',
  },
];

export const DEFAULT_OFFICE_ID = 'office-noida';
export const DEFAULT_FLOOR_ID = 'floor-4';

export function getOfficeById(officeId: string, offices: Office[] = OFFICES): Office | undefined {
  return offices.find((o) => o.id === officeId);
}

export function floorsForOffice(officeId: string, floors: FloorOption[]): FloorOption[] {
  return floors.filter((f) => f.officeId === officeId);
}

export function getFloorById(floorId: string, floors: FloorOption[]): FloorOption | undefined {
  return floors.find((f) => f.id === floorId);
}

export function floorByLocationLabel(
  locationLabel: string,
  floors: FloorOption[],
): FloorOption | undefined {
  return floors.find((f) => f.locationLabel === locationLabel);
}
