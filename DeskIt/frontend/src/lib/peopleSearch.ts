import type { DbEmployee, EmployeeStatusColor } from '../types/database';
import type { DeskElement } from '../types/floorplan';
import type { FloorOption } from '../types/office';
import { TEAMS, type Team } from '../data/teams';
import { floorByLocationLabel, getOfficeById } from '../data/offices';
import {
  getEmployeeLocationRows,
  type EmployeeLocationRow,
} from './employeeAssignments';
import { desksForEmployee } from './seatAssignment';

export type { EmployeeLocationRow };
export { getEmployeeLocationRows };

export interface PeopleFilters {
  query: string;
  locationId: string; // 'all' or locationLabel
  department: string; // 'all' or name
  team: string; // 'all' or name
  presence: EmployeeStatusColor | 'all';
  seatStatus: 'all' | 'assigned' | 'unassigned';
}

export const DEFAULT_PEOPLE_FILTERS: PeopleFilters = {
  query: '',
  locationId: 'all',
  department: 'all',
  team: 'all',
  presence: 'all',
  seatStatus: 'all',
};

export function matchesPeopleQuery(emp: DbEmployee, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase().trim();
  return (
    emp.name.toLowerCase().includes(q) ||
    emp.email.toLowerCase().includes(q) ||
    emp.team.toLowerCase().includes(q) ||
    emp.department.toLowerCase().includes(q) ||
    emp.manager.toLowerCase().includes(q) ||
    emp.emp_id.toLowerCase().includes(q) ||
    emp.locations.some((loc) => loc.toLowerCase().includes(q))
  );
}

export function filterEmployees(
  employees: DbEmployee[],
  filters: PeopleFilters,
  _floors: FloorOption[],
  currentFloorDesks?: DeskElement[],
  currentFloor?: FloorOption,
): DbEmployee[] {
  return employees.filter((emp) => {
    if (!matchesPeopleQuery(emp, filters.query)) return false;

    if (filters.locationId !== 'all' && !emp.locations.includes(filters.locationId)) {
      return false;
    }
    if (filters.department !== 'all' && emp.department !== filters.department) {
      return false;
    }
    if (filters.team !== 'all' && emp.team !== filters.team) {
      return false;
    }
    if (filters.presence !== 'all' && emp.status !== filters.presence) {
      return false;
    }

    if (filters.seatStatus !== 'all' && currentFloor && currentFloorDesks) {
      const onFloor = emp.locations.includes(currentFloor.locationLabel);
      const hasDesk =
        onFloor && desksForEmployee(currentFloorDesks, emp.emp_id, emp.name).length > 0;
      if (filters.seatStatus === 'assigned' && !hasDesk) return false;
      if (filters.seatStatus === 'unassigned' && hasDesk) return false;
    }

    return true;
  });
}

export interface TeamDistributionRow {
  locationLabel: string;
  officeName: string;
  floorShortLabel: string;
  floorId?: string;
  memberCount: number;
}

export interface TeamSummary {
  team: Team;
  memberCount: number;
  presentCount: number;
  distributions: TeamDistributionRow[];
  members: DbEmployee[];
}

export function buildTeamSummaries(
  employees: DbEmployee[],
  floors: FloorOption[],
  query = '',
): TeamSummary[] {
  const q = query.toLowerCase().trim();

  return TEAMS.map((team) => {
    const members = employees.filter((e) => e.team === team.name);
    const locCounts = new Map<string, number>();
    for (const m of members) {
      for (const loc of m.locations) {
        locCounts.set(loc, (locCounts.get(loc) || 0) + 1);
      }
    }

    const distributions: TeamDistributionRow[] = [...locCounts.entries()]
      .map(([locationLabel, memberCount]) => {
        const floor = floorByLocationLabel(locationLabel, floors);
        const office = floor ? getOfficeById(floor.officeId) : undefined;
        return {
          locationLabel,
          officeName: office?.name || locationLabel,
          floorShortLabel: floor?.shortLabel || locationLabel,
          floorId: floor?.id,
          memberCount,
        };
      })
      .sort((a, b) => b.memberCount - a.memberCount);

    return {
      team,
      memberCount: members.length,
      presentCount: members.filter((m) => m.status === 'green').length,
      distributions,
      members,
    };
  }).filter((summary) => {
    if (!q) return summary.memberCount > 0;
    return (
      summary.team.name.toLowerCase().includes(q) ||
      summary.team.departmentName.toLowerCase().includes(q) ||
      summary.distributions.some(
        (d) =>
          d.officeName.toLowerCase().includes(q) ||
          d.locationLabel.toLowerCase().includes(q),
      )
    );
  });
}

export function uniqueDepartments(employees: DbEmployee[]): string[] {
  return [...new Set(employees.map((e) => e.department))].sort();
}

export function uniqueTeams(employees: DbEmployee[]): string[] {
  return [...new Set(employees.map((e) => e.team))].sort();
}
