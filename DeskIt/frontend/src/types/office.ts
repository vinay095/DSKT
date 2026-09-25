/** Organization → Office → Floor hierarchy for DeskIt. */

export interface Office {
  id: string;
  name: string;
  city: string;
  country: string;
}

export interface FloorOption {
  id: string;
  officeId: string;
  /** Full label in selectors */
  label: string;
  shortLabel: string;
  /** Matches DbEmployee.locations entries for directory / search */
  locationLabel: string;
  /** True when created via clone / admin (persisted in localStorage) */
  isCustom?: boolean;
  clonedFromId?: string;
}
