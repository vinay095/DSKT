import type { DeskElement } from '../types/floorplan';
import type { Team } from '../data/teams';
import type { DbEmployee } from '../types/database';
import { applySeatAssignment, dbEmployeeToUser, desksForEmployee } from './seatAssignment';

/**
 * Assign (or clear) a team on a desk without changing occupant / occupancy.
 * Team stripe colors use getTeamColor(desk.team) on the published map.
 */
export function applyTeamToDesk(desk: DeskElement, team: Team | null): DeskElement {
  if (!team) {
    return {
      ...desk,
      team: undefined,
    };
  }
  return {
    ...desk,
    team: team.name,
    // Keep existing department when present; otherwise inherit from team.
    department: desk.department || team.departmentName,
  };
}

export function applyTeamToDesks(
  desks: DeskElement[],
  deskIds: Iterable<string>,
  team: Team | null,
): DeskElement[] {
  const idSet = new Set(deskIds);
  return desks.map((d) => (idSet.has(d.id) ? applyTeamToDesk(d, team) : d));
}

/**
 * Tag selected desks with a team and seat unassigned team members into free seats.
 * Occupied seats keep their occupant; team stripe is still applied.
 */
export function assignTeamAndSeatEmployees(
  selectedDesks: DeskElement[],
  team: Team,
  allEmployees: DbEmployee[],
  allFloorDesks: DeskElement[],
): { desks: DeskElement[]; seatedCount: number } {
  const alreadySeated = new Set(
    allFloorDesks
      .filter((d) => d.assignedUserId)
      .map((d) => d.assignedUserId as string),
  );
  const candidates = allEmployees.filter((emp) => {
    if (emp.team !== team.name) return false;
    if (alreadySeated.has(emp.emp_id)) return false;
    if (desksForEmployee(allFloorDesks, emp.emp_id, emp.name).length > 0) return false;
    return true;
  });

  let empIdx = 0;
  let seatedCount = 0;
  const desks = selectedDesks.map((desk) => {
    let next = applyTeamToDesk(desk, team);
    if (next.status === 'available' && empIdx < candidates.length) {
      const emp = candidates[empIdx++];
      next = applySeatAssignment(next, dbEmployeeToUser(emp), {
        isTemporary: false,
        assignedUserStatus: emp.status || 'green',
      });
      seatedCount += 1;
      alreadySeated.add(emp.emp_id);
    }
    return next;
  });

  return { desks, seatedCount };
}
