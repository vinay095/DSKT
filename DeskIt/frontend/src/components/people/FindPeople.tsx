import React, { useMemo, useState } from 'react';
import type { DbEmployee } from '../../types/database';
import type { DeskElement } from '../../types/floorplan';
import type { FloorOption } from '../../types/office';
import {
  MOCK_999_EMPLOYEES,
  DIRECTORY_LOCATION_FILTERS,
} from '../../data/employeesData';
import { PageHeader } from '../common/PageHeader';
import { PresenceBadge } from './PresenceBadge';
import { EmployeeDrawer, type GoToFloorMapArgs } from './EmployeeDrawer';
import {
  DEFAULT_PEOPLE_FILTERS,
  filterEmployees,
  getEmployeeLocationRows,
  buildTeamSummaries,
} from '../../lib/peopleSearch';
import { formatDeskCodes } from '../../lib/employeeAssignments';
import { cn } from '../../lib/cn';
import { MapPin, Search, Users } from 'lucide-react';

interface FindPeopleProps {
  searchQuery: string;
  floors: FloorOption[];
  currentFloorDesks?: DeskElement[];
  currentFloor?: FloorOption;
  onGoToFloorMap?: (args: GoToFloorMapArgs) => void;
}

/**
 * Lightweight employee discovery — find colleagues quickly.
 * Full People & Teams management lives under HR.
 */
export const FindPeople: React.FC<FindPeopleProps> = ({
  searchQuery,
  floors,
  currentFloorDesks,
  currentFloor,
  onGoToFloorMap,
}) => {
  const [locationId, setLocationId] = useState('all');
  const [mode, setMode] = useState<'people' | 'teams'>('people');
  const [selected, setSelected] = useState<DbEmployee | null>(null);
  const [localQuery, setLocalQuery] = useState('');

  const effectiveQuery = searchQuery || localQuery;

  const filtered = useMemo(
    () =>
      filterEmployees(
        MOCK_999_EMPLOYEES,
        { ...DEFAULT_PEOPLE_FILTERS, query: effectiveQuery, locationId },
        floors,
        currentFloorDesks,
        currentFloor,
      ),
    [effectiveQuery, locationId, floors, currentFloorDesks, currentFloor],
  );

  const teamSummaries = useMemo(
    () => buildTeamSummaries(MOCK_999_EMPLOYEES, floors, effectiveQuery),
    [floors, effectiveQuery],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Find People"
        description="Search colleagues and teams across offices. Use the header search or the field below."
      />

      <div className="flex flex-wrap items-center gap-2">
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

        {!searchQuery && (
          <div className="relative flex-1 min-w-[12rem] max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-content-secondary" />
            <input
              type="search"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Name, team, office…"
              className="ds-input !pl-8"
              aria-label="Find people"
            />
          </div>
        )}
      </div>

      {mode === 'people' && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {DIRECTORY_LOCATION_FILTERS.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => setLocationId(loc.id)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-semibold border transition',
                  locationId === loc.id
                    ? 'bg-accent text-accent-foreground border-accent'
                    : 'bg-surface border-border text-content-secondary hover:text-content-primary',
                )}
              >
                {loc.label}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-content-secondary">
            Showing {Math.min(filtered.length, 40)} of {filtered.length} matches
          </p>

          {filtered.length === 0 ? (
            <div className="ds-panel p-8 text-center text-xs text-content-secondary">
              No people match your search. Try another name, team, or office.
            </div>
          ) : (
            <ul className="divide-y divide-border ds-panel overflow-hidden">
              {filtered.slice(0, 40).map((emp) => {
                const rows = getEmployeeLocationRows(
                  emp,
                  floors,
                  currentFloorDesks,
                  currentFloor,
                );
                const primary = rows[0];
                const seatSummary = primary
                  ? formatDeskCodes(primary.deskCodes)
                  : '';
                return (
                  <li key={emp.emp_id}>
                    <button
                      type="button"
                      onClick={() => setSelected(emp)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-muted transition"
                    >
                      <img
                        src={emp.avatar}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-content-primary truncate">
                            {emp.name}
                          </span>
                          <PresenceBadge status={emp.status} compact />
                        </div>
                        <p className="text-[11px] text-content-secondary truncate">
                          {emp.team} · {emp.department}
                        </p>
                        <p className="text-[11px] text-content-secondary mt-0.5 truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" aria-hidden />
                          {primary
                            ? `${primary.officeName} · ${primary.floorShortLabel}${
                                seatSummary ? ` · ${seatSummary}` : ''
                              }`
                            : 'No location'}
                          {rows.length > 1 && (
                            <span className="text-accent font-medium">
                              +{rows.length - 1} offices
                            </span>
                          )}
                          {primary && primary.deskCodes.length > 1 && (
                            <span className="text-accent font-medium">
                              · {primary.deskCodes.length} seats
                            </span>
                          )}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {mode === 'teams' && (
        <>
          {teamSummaries.length === 0 ? (
            <div className="ds-panel p-8 text-center text-xs text-content-secondary">
              No teams match your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {teamSummaries.slice(0, 24).map((summary) => (
                <div key={summary.team.id} className="ds-panel p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-content-primary">
                        {summary.team.name}
                      </h3>
                      <p className="text-[11px] text-content-secondary">
                        {summary.team.departmentName}
                      </p>
                    </div>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                      style={{ backgroundColor: summary.team.color }}
                      aria-hidden
                    />
                  </div>
                  <p className="text-xs text-content-secondary flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" aria-hidden />
                    {summary.memberCount} people · {summary.presentCount} present
                  </p>
                  <ul className="space-y-1.5">
                    {summary.distributions.slice(0, 3).map((d) => (
                      <li key={d.locationLabel}>
                        <button
                          type="button"
                          onClick={() =>
                            onGoToFloorMap?.({
                              floorId: d.floorId,
                              locationLabel: d.locationLabel,
                            })
                          }
                          className="w-full text-left text-[11px] px-2 py-1.5 rounded-md bg-surface-muted hover:bg-accent-muted transition flex justify-between gap-2"
                        >
                          <span className="text-content-primary truncate">
                            {d.officeName} · {d.floorShortLabel}
                          </span>
                          <span className="text-content-secondary shrink-0 font-mono">
                            {d.memberCount}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </>
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
      />
    </div>
  );
};
