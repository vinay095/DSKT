import type { DeskElement } from '../types/floorplan';
import type { Team } from '../data/teams';

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
