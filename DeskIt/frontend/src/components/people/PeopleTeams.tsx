import React, { useMemo, useState } from 'react';
import type { DbEmployee, EmployeeStatusColor } from '../../types/database';
import type { DeskElement } from '../../types/floorplan';
import type { FloorOption } from '../../types/office';
import {
  MOCK_999_EMPLOYEES,
  DIRECTORY_LOCATION_FILTERS,
} from '../../data/employeesData';
import { EMPLOYEE_STATUS_CONFIG } from '../../types/database';
import { DEPARTMENTS } from '../../data/mockData';
import { TEAMS } from '../../data/teams';
import { PageHeader } from '../common/PageHeader';
import { PresenceBadge } from './PresenceBadge';
import { EmployeeDrawer, type GoToFloorMapArgs } from './EmployeeDrawer';
import {
  DEFAULT_PEOPLE_FILTERS,
  filterEmployees,
  getEmployeeLocationRows,
  buildTeamSummaries,
  type PeopleFilters,
  uniqueDepartments,
  uniqueTeams,
} from '../../lib/peopleSearch';
import { formatDeskCodes } from '../../lib/employeeAssignments';
import { usePermissions } from '../../hooks/usePermissions';
import { AccessDenied } from '../common/AccessDenied';
import { cn } from '../../lib/cn';
import { MapPin, Users } from 'lucide-react';

interface PeopleTeamsProps {
  searchQuery: string;
  floors: FloorOption[];
  currentFloorDesks?: DeskElement[];
  currentFloor?: FloorOption;
  onGoToFloorMap?: (args: GoToFloorMapArgs) => void;
  /** Jump to Seat Allocation with this employee context (optional). */
  onStartAssign?: (employee: DbEmployee) => void;
}

const PRESENCE_OPTIONS: Array<EmployeeStatusColor | 'all'> = [
  'all',
  'green',
  'blue',
  'orange',
  'yellow',
  'red',
  'purple',
  'teal',
  'white',
];

/**
 * HR People & Teams — information-rich directory with filters and team distribution.
 */
export const PeopleTeams: React.FC<PeopleTeamsProps> = ({
  searchQuery,
  floors,
  currentFloorDesks,
  currentFloor,
  onGoToFloorMap,
  onStartAssign,
}) => {
  const { canViewPeopleDirectory } = usePermissions();
  const [mode, setMode] = useState<'people' | 'teams'>('people');
  const [filters, setFilters] = useState<PeopleFilters>({
    ...DEFAULT_PEOPLE_FILTERS,
  });
  const [selected, setSelected] = useState<DbEmployee | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const departments = useMemo(() => uniqueDepartments(MOCK_999_EMPLOYEES), []);
  const teams = useMemo(() => uniqueTeams(MOCK_999_EMPLOYEES), []);

  const effectiveFilters = useMemo(
    () => ({ ...filters, query: searchQuery || filters.query }),
    [filters, searchQuery],
  );

  const filtered = useMemo(
    () =>
      filterEmployees(
        MOCK_999_EMPLOYEES,
        effectiveFilters,
        floors,
        currentFloorDesks,
        currentFloor,
      ),
    [effectiveFilters, floors, currentFloorDesks, currentFloor],
  );

  const teamSummaries = useMemo(
    () => buildTeamSummaries(MOCK_999_EMPLOYEES, floors, effectiveFilters.query),
    [floors, effectiveFilters.query],
  );

  if (!canViewPeopleDirectory) {
    return (
      <AccessDenied description="People & Teams is available to HR. Employees can use Find People." />
    );
  }

  const setFilter = <K extends keyof PeopleFilters>(key: K, value: PeopleFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="People & Teams"
        description="Search employees and teams, inspect assignments, then continue to Seat Allocation when needed."
      />

      <div className="inline-flex p-0.5 rounded-lg bg-surface-muted border border-border">
        <button
          type="button"
          onClick={() => setMode('people')}
          className={cn(
            'px-3 py-1.5 rounded-md text-xs font-semibold transition',
            mode === 'people'
              ? 'bg-surface text-content-primary shadow-sm'
              : 'text-content-secondary',
          )}
        >
          People
        </button>
        <button
          type="button"
          onClick={() => setMode('teams')}
          className={cn(
            'px-3 py-1.5 rounded-md text-xs font-semibold transition',
            mode === 'teams'
              ? 'bg-surface text-content-primary shadow-sm'
              : 'text-content-secondary',
          )}
        >
          Teams
        </button>
      </div>

      {mode === 'people' && (
        <>
          <div className="ds-panel p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <label className="text-[10px] font-bold uppercase text-content-secondary space-y-1">
              Office / floor
              <select
                value={filters.locationId}
                onChange={(e) => setFilter('locationId', e.target.value)}
                className="ds-control w-full !pr-8"
              >
                {DIRECTORY_LOCATION_FILTERS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.label} ({loc.count})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] font-bold uppercase text-content-secondary space-y-1">
              Department
              <select
                value={filters.department}
                onChange={(e) => setFilter('department', e.target.value)}
                className="ds-control w-full !pr-8"
              >
                <option value="all">All</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] font-bold uppercase text-content-secondary space-y-1">
              Team
              <select
                value={filters.team}
                onChange={(e) => setFilter('team', e.target.value)}
                className="ds-control w-full !pr-8"
              >
                <option value="all">All</option>
                {teams.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] font-bold uppercase text-content-secondary space-y-1">
              Presence
              <select
                value={filters.presence}
                onChange={(e) =>
                  setFilter('presence', e.target.value as PeopleFilters['presence'])
                }
                className="ds-control w-full !pr-8"
              >
                {PRESENCE_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p === 'all' ? 'All' : EMPLOYEE_STATUS_CONFIG[p].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] font-bold uppercase text-content-secondary space-y-1">
              Seat (this floor)
              <select
                value={filters.seatStatus}
                onChange={(e) =>
                  setFilter('seatStatus', e.target.value as PeopleFilters['seatStatus'])
                }
                className="ds-control w-full !pr-8"
              >
                <option value="all">All</option>
                <option value="assigned">Assigned here</option>
                <option value="unassigned">Not on this floor map</option>
              </select>
            </label>
            <label className="text-[10px] font-bold uppercase text-content-secondary space-y-1 col-span-2 md:col-span-1">
              Local search
              <input
                type="search"
                value={filters.query}
                onChange={(e) => setFilter('query', e.target.value)}
                placeholder="Name, email, ID…"
                className="ds-input !pl-3 w-full"
                disabled={Boolean(searchQuery)}
              />
            </label>
          </div>

          <p className="text-[11px] text-content-secondary">
            {filtered.length} employees · showing {Math.min(filtered.length, 80)}
            {searchQuery ? ' (filtered by header search)' : ''}
          </p>

          {filtered.length === 0 ? (
            <div className="ds-panel p-8 text-center text-xs text-content-secondary">
              No employees match these filters.
            </div>
          ) : (
            <div className="ds-panel overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[720px]">
                <thead className="bg-surface-muted text-[10px] uppercase tracking-wider text-content-secondary">
                  <tr>
                    <th className="px-3 py-2.5 font-bold">Employee</th>
                    <th className="px-3 py-2.5 font-bold">Team</th>
                    <th className="px-3 py-2.5 font-bold">Presence</th>
                    <th className="px-3 py-2.5 font-bold">Office / Floor</th>
                    <th className="px-3 py-2.5 font-bold">Seat</th>
                    <th className="px-3 py-2.5 font-bold">Assignments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.slice(0, 80).map((emp) => {
                    const rows = getEmployeeLocationRows(
                      emp,
                      floors,
                      currentFloorDesks,
                      currentFloor,
                    );
                    const primary = rows[0];
                    const seats = primary ? formatDeskCodes(primary.deskCodes) : '';
                    return (
                      <tr
                        key={emp.emp_id}
                        className="hover:bg-surface-muted/80 cursor-pointer transition"
                        onClick={() => setSelected(emp)}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={emp.avatar}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-content-primary truncate">
                                {emp.name}
                              </p>
                              <p className="text-[10px] text-content-secondary truncate">
                                {emp.department}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-content-secondary">{emp.team}</td>
                        <td className="px-3 py-2.5">
                          <PresenceBadge status={emp.status} compact />
                        </td>
                        <td className="px-3 py-2.5 text-content-secondary">
                          {primary
                            ? `${primary.officeName} · ${primary.floorShortLabel}`
                            : '—'}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-content-primary">
                          {seats || '—'}
                          {primary && primary.deskCodes.length > 1 && (
                            <span className="block text-[10px] font-sans text-accent font-medium">
                              +{primary.deskCodes.length - 1} additional
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-content-secondary">
                          {rows.length}
                          {rows.length > 1 && (
                            <span className="text-accent font-medium ml-1">offices</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {mode === 'teams' && (
        <div className="space-y-3">
          <p className="text-[11px] text-content-secondary">
            {teamSummaries.length} teams · {DEPARTMENTS.length} departments · {TEAMS.length}{' '}
            defined teams
          </p>
          {teamSummaries.length === 0 ? (
            <div className="ds-panel p-8 text-center text-xs text-content-secondary">
              No teams match your search.
            </div>
          ) : (
            teamSummaries.map((summary) => {
              const open = expandedTeamId === summary.team.id;
              const occupancyHint =
                summary.memberCount > 0
                  ? Math.round((summary.presentCount / summary.memberCount) * 100)
                  : 0;
              return (
                <div key={summary.team.id} className="ds-panel overflow-hidden">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedTeamId(open ? null : summary.team.id)
                    }
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface-muted transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: summary.team.color }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-content-primary">
                          {summary.team.name}
                        </p>
                        <p className="text-[11px] text-content-secondary">
                          {summary.team.departmentName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 text-[11px] text-content-secondary">
                      <p className="font-semibold text-content-primary flex items-center gap-1 justify-end">
                        <Users className="w-3.5 h-3.5" />
                        {summary.memberCount}
                      </p>
                      <p>{occupancyHint}% present</p>
                    </div>
                  </button>

                  {open && (
                    <div className="border-t border-border px-4 py-3 space-y-3 bg-surface-muted/40">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-content-secondary mb-1.5">
                          Office distribution
                        </p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {summary.distributions.map((d) => (
                            <li key={d.locationLabel}>
                              <button
                                type="button"
                                onClick={() =>
                                  onGoToFloorMap?.({
                                    floorId: d.floorId,
                                    locationLabel: d.locationLabel,
                                  })
                                }
                                className="w-full text-left text-[11px] px-2.5 py-2 rounded-md bg-surface border border-border hover:border-accent/40 flex justify-between gap-2"
                              >
                                <span>
                                  {d.officeName} · {d.floorShortLabel}
                                </span>
                                <span className="font-mono text-content-secondary">
                                  {d.memberCount}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-content-secondary mb-1.5">
                          Members (first 12)
                        </p>
                        <ul className="divide-y divide-border rounded-lg border border-border bg-surface overflow-hidden">
                          {summary.members.slice(0, 12).map((m) => (
                            <li key={m.emp_id}>
                              <button
                                type="button"
                                onClick={() => setSelected(m)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-muted"
                              >
                                <img
                                  src={m.avatar}
                                  alt=""
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                                <span className="flex-1 text-xs font-medium text-content-primary truncate">
                                  {m.name}
                                </span>
                                <PresenceBadge status={m.status} compact />
                                <MapPin className="w-3 h-3 text-content-secondary" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      <EmployeeDrawer
        employee={selected}
        floors={floors}
        currentFloorDesks={currentFloorDesks}
        currentFloor={currentFloor}
        onClose={() => setSelected(null)}
        onGoToFloorMap={(args) => {
          onGoToFloorMap?.(args);
          setSelected(null);
        }}
        onAssignSeat={
          onStartAssign
            ? (emp) => {
                onStartAssign(emp);
                setSelected(null);
              }
            : undefined
        }
      />
    </div>
  );
};
