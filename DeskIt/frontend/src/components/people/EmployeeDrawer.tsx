import React from 'react';
import type { DbEmployee } from '../../types/database';
import type { DeskElement } from '../../types/floorplan';
import type { FloorOption } from '../../types/office';
import { X, MapPin, Mail, Users } from 'lucide-react';
import { PresenceBadge } from './PresenceBadge';
import { getEmployeeLocationRows } from '../../lib/peopleSearch';
import { usePermissions } from '../../hooks/usePermissions';

export interface GoToFloorMapArgs {
  floorId?: string;
  locationLabel?: string;
  employeeName?: string;
}

interface EmployeeDrawerProps {
  employee: DbEmployee | null;
  floors: FloorOption[];
  currentFloorDesks?: DeskElement[];
  currentFloor?: FloorOption;
  onClose: () => void;
  onGoToFloorMap?: (args: GoToFloorMapArgs) => void;
  /** HR: open seat allocation for this person (Phase 5 can deepen). */
  onAssignSeat?: (employee: DbEmployee) => void;
}

export const EmployeeDrawer: React.FC<EmployeeDrawerProps> = ({
  employee,
  floors,
  currentFloorDesks,
  currentFloor,
  onClose,
  onGoToFloorMap,
  onAssignSeat,
}) => {
  const { canAllocateSeat } = usePermissions();

  if (!employee) return null;

  const locations = getEmployeeLocationRows(
    employee,
    floors,
    currentFloorDesks,
    currentFloor,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="employee-drawer-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        aria-label="Close employee details"
        onClick={onClose}
      />
      <aside className="relative w-full max-w-md h-full bg-surface border-l border-border shadow-md flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-border">
          <div className="flex items-start gap-3 min-w-0">
            <img
              src={employee.avatar}
              alt=""
              className="w-12 h-12 rounded-lg object-cover ring-2 ring-accent/30 shrink-0"
            />
            <div className="min-w-0">
              <h2
                id="employee-drawer-title"
                className="text-base font-bold text-content-primary truncate"
              >
                {employee.name}
              </h2>
              <p className="text-xs text-content-secondary truncate">
                {employee.team} · {employee.department}
              </p>
              <div className="mt-2">
                <PresenceBadge status={employee.status} compact />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-content-secondary hover:bg-surface-muted"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="space-y-2 text-xs">
            <p className="flex items-center gap-2 text-content-secondary">
              <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden />
              <span className="truncate text-content-primary">{employee.email}</span>
            </p>
            <p className="flex items-center gap-2 text-content-secondary">
              <Users className="w-3.5 h-3.5 shrink-0" aria-hidden />
              <span className="text-content-primary">Manager: {employee.manager}</span>
            </p>
            <p className="text-content-secondary font-mono">{employee.emp_id}</p>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-content-secondary mb-2">
              Assignments
            </h3>
            {locations.length === 0 ? (
              <p className="text-xs text-content-secondary">No office assignments on record.</p>
            ) : (
              <ul className="space-y-2">
                {locations.map((loc) => (
                  <li key={loc.locationLabel}>
                    <button
                      type="button"
                      onClick={() =>
                        onGoToFloorMap?.({
                          floorId: loc.floorId,
                          locationLabel: loc.locationLabel,
                          employeeName: employee.name,
                        })
                      }
                      className="w-full text-left p-3 rounded-lg border border-border bg-surface-muted hover:border-accent/40 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-content-primary">
                          {loc.officeName}
                        </span>
                        {loc.isPrimary && (
                          <span className="text-[10px] font-bold uppercase text-accent">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-content-secondary mt-0.5">
                        {loc.floorShortLabel}
                        {loc.deskCode ? ` · Desk ${loc.deskCode}` : ''}
                      </p>
                      <p className="text-[10px] text-accent mt-1.5 inline-flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3" aria-hidden />
                        View on floor map
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-border flex flex-col gap-2">
          {canAllocateSeat && onAssignSeat && (
            <button
              type="button"
              className="ds-btn-primary w-full"
              onClick={() => onAssignSeat(employee)}
            >
              Assign / reassign seat
            </button>
          )}
          <button type="button" className="ds-btn-ghost w-full" onClick={onClose}>
            Close
          </button>
        </div>
      </aside>
    </div>
  );
};
