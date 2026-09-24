export interface FloorOption {
  id: string;
  label: string;
}

/** Floors available in the floor selector and admin metrics. */
export const AVAILABLE_FLOORS: FloorOption[] = [
  { id: 'floor-4', label: 'Floor 4 - Tech & Product Hub' },
  { id: 'floor-5', label: 'Floor 5 - Executive & People Ops' },
  { id: 'floor-3', label: 'Floor 3 - Global Operations' },
];

export const DEFAULT_FLOOR_ID = 'floor-4';
