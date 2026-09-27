import type { DbEmployee } from '../types/database';
import type { DeskElement } from '../types/floorplan';
import type { FloorOption } from '../types/office';
import type { AssignmentRole, EmployeeAssignment } from '../types/assignment';
import { floorByLocationLabel, getOfficeById } from '../data/offices';
import { desksForEmployee } from './seatAssignment';

export interface EmployeeLocationRow {
  locationLabel: string;
  officeName: string;
  floorShortLabel: string;
  floorId?: string;
  officeId?: string;
  isPrimary: boolean;
  /** First desk code on the current floor for this location (compat). */
  deskCode?: string;
  /** All desk codes on the current floor for this location. */
  deskCodes: string[];
}

/**
 * Build assignment rows for an employee on the active floor.
 * First match is primary; further seats on the same floor are additional.
 */
export function assignmentsOnFloor(
  emp: DbEmployee,
  desks: DeskElement[],
  floor: FloorOption,
): EmployeeAssignment[] {
  const office = getOfficeById(floor.officeId);
  const matches = desksForEmployee(desks, emp.emp_id, emp.name);
  return matches.map((d, index) => ({
    empId: emp.emp_id,
    employeeName: emp.name,
    floorId: floor.id,
    officeId: floor.officeId,
    officeName: office?.name || floor.locationLabel,
    floorLabel: floor.shortLabel || floor.label,
    locationLabel: floor.locationLabel,
    deskId: d.id,
    deskCode: d.code,
    role: (index === 0 ? 'primary' : 'additional') as AssignmentRole,
    isTemporary: d.isTemporary,
    team: d.team || emp.team,
    department: d.department || emp.department,
  }));
}

export function primaryAssignment(
  rows: EmployeeAssignment[],
): EmployeeAssignment | undefined {
  return rows.find((r) => r.role === 'primary') || rows[0];
}

/** Format seat summary: "A-101" or "A-101 + A-105". */
export function formatDeskCodes(codes: string[]): string {
  if (codes.length === 0) return '';
  if (codes.length === 1) return codes[0];
  return `${codes[0]} + ${codes.slice(1).join(', ')}`;
}

/**
 * Resolve employee locations into office/floor rows (multi-office + multi-seat).
 * Desk codes are filled only when the location matches the current floor.
 */
export function getEmployeeLocationRows(
  emp: DbEmployee,
  floors: FloorOption[],
  currentFloorDesks?: DeskElement[],
  currentFloor?: FloorOption,
): EmployeeLocationRow[] {
  return emp.locations.map((locationLabel, index) => {
    const floor = floorByLocationLabel(locationLabel, floors);
    const office = floor ? getOfficeById(floor.officeId) : undefined;
    const onThisFloor =
      currentFloor &&
      currentFloorDesks &&
      locationLabel === currentFloor.locationLabel;

    const desksOnFloor = onThisFloor
      ? desksForEmployee(currentFloorDesks, emp.emp_id, emp.name)
      : [];
    const deskCodes = desksOnFloor.map((d) => d.code);

    return {
      locationLabel,
      officeName: office?.name || locationLabel,
      floorShortLabel: floor?.shortLabel || locationLabel,
      floorId: floor?.id,
      officeId: floor?.officeId,
      isPrimary: index === 0,
      deskCode: deskCodes[0],
      deskCodes,
    };
  });
}

/** Other seats for the same person on this floor (excluding the selected desk). */
export function otherSeatsOnFloor(
  desks: DeskElement[],
  selected: DeskElement,
): DeskElement[] {
  if (!selected.assignedUserId && !selected.assignedUserName) return [];
  return desksForEmployee(
    desks,
    selected.assignedUserId || '',
    selected.assignedUserName,
  ).filter((d) => d.id !== selected.id);
}
