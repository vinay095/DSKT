import type { DeskElement } from '../types/floorplan';
import type { User } from '../types/auth';
import type { DbEmployee, EmployeeStatusColor } from '../types/database';

export interface SeatAssignmentDetails {
  isTemporary: boolean;
  startDate?: string;
  endDate?: string;
  notes?: string;
  assignedUserStatus?: EmployeeStatusColor;
}

/** Map directory employee → User shape used by assign handlers. */
export function dbEmployeeToUser(emp: DbEmployee): User {
  return {
    id: emp.emp_id,
    name: emp.name,
    email: emp.email,
    role: 'employee',
    department: emp.department,
    title: emp.team,
    avatar: emp.avatar,
    team: emp.team,
  };
}

/** Resolve a desk by id or seat code (requests may store either). */
export function findDesk(
  desks: DeskElement[],
  idOrCode?: string | null,
): DeskElement | undefined {
  if (!idOrCode) return undefined;
  const key = idOrCode.trim();
  return desks.find(
    (d) =>
      d.id === key ||
      d.code === key ||
      d.code.toLowerCase() === key.toLowerCase() ||
      d.id.toLowerCase() === key.toLowerCase(),
  );
}

export function listAvailableDesks(desks: DeskElement[]): DeskElement[] {
  return desks.filter((d) => d.status === 'available');
}

/** Desks currently occupied by this employee on the floor (multi-seat safe). */
export function desksForEmployee(
  desks: DeskElement[],
  employeeId: string,
  employeeName?: string,
): DeskElement[] {
  return desks.filter(
    (d) =>
      d.assignedUserId === employeeId ||
      (employeeName ? d.assignedUserName === employeeName : false),
  );
}

/**
 * Apply assignment to one desk only.
 * Does NOT clear the employee's other seats (multi-assignment support).
 */
export function applySeatAssignment(
  desk: DeskElement,
  user: User,
  details?: SeatAssignmentDetails,
): DeskElement {
  return {
    ...desk,
    status: 'occupied',
    assignedUserId: user.id,
    assignedUserName: user.name,
    assignedUserAvatar: user.avatar,
    department: user.department,
    team: user.team,
    assignedUserStatus: (details?.assignedUserStatus || 'green') as EmployeeStatusColor,
    isTemporary: details?.isTemporary ?? false,
    startDate: details?.startDate,
    endDate: details?.endDate,
    notes: details?.notes,
  };
}

export function clearSeatAssignment(desk: DeskElement): DeskElement {
  return {
    ...desk,
    status: 'available',
    assignedUserId: undefined,
    assignedUserName: undefined,
    assignedUserAvatar: undefined,
    assignedUserStatus: undefined,
    department: undefined,
    team: undefined,
    isTemporary: undefined,
    startDate: undefined,
    endDate: undefined,
    notes: undefined,
  };
}

/** Suggest employees for a desk (same team/department first). */
export function suggestEmployeesForDesk(
  employees: DbEmployee[],
  desk: DeskElement,
  limit = 8,
): DbEmployee[] {
  const team = desk.team?.toLowerCase();
  const dept = desk.department?.toLowerCase();
  const scored = employees.map((emp) => {
    let score = 0;
    if (team && emp.team.toLowerCase() === team) score += 3;
    if (dept && emp.department.toLowerCase() === dept) score += 2;
    if (emp.status === 'green') score += 1;
    return { emp, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.emp);
}
