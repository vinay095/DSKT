/**
 * Normalized seat assignment view (runtime truth remains FloorPlan.desks).
 * Supports one employee → many offices / floors / seats.
 */
export type AssignmentRole = 'primary' | 'additional';

export interface EmployeeAssignment {
  empId: string;
  employeeName: string;
  floorId: string;
  officeId?: string;
  officeName: string;
  floorLabel: string;
  locationLabel: string;
  deskId: string;
  deskCode: string;
  role: AssignmentRole;
  isTemporary?: boolean;
  team?: string;
  department?: string;
}
