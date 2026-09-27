import React, { useEffect, useMemo, useState } from 'react';
import type { DeskElement } from '../../types/floorplan';
import type { DbEmployee } from '../../types/database';
import { MOCK_999_EMPLOYEES } from '../../data/employeesData';
import { PresenceBadge } from '../people/PresenceBadge';
import {
  dbEmployeeToUser,
  desksForEmployee,
  listAvailableDesks,
  type SeatAssignmentDetails,
} from '../../lib/seatAssignment';
import type { User } from '../../types/auth';
import { cn } from '../../lib/cn';
import { Search, UserCheck, MapPin, CheckCircle2 } from 'lucide-react';

export interface AllocationFocus {
  employeeId?: string;
  employeeName?: string;
  preferredDeskId?: string;
  requestNotes?: string;
  source?: 'people' | 'request' | 'manual';
}

interface AllocationPanelProps {
  desks: DeskElement[];
  floorName?: string;
  building?: string;
  /** Prefill from header search / People / Seat Requests */
  focus?: AllocationFocus | null;
  searchQuery?: string;
  onAssign: (deskId: string, user: User, details?: SeatAssignmentDetails) => void;
  onSelectDeskOnMap?: (desk: DeskElement) => void;
  onClearFocus?: () => void;
}

/**
 * Employee-first seat allocation:
 * Search employee → pick available seat → confirm.
 * Uses the same onAssign path as seat-first (SeatAssignModal).
 */
export const AllocationPanel: React.FC<AllocationPanelProps> = ({
  desks,
  floorName,
  building,
  focus,
  searchQuery = '',
  onAssign,
  onSelectDeskOnMap,
  onClearFocus,
}) => {
  const [query, setQuery] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<DbEmployee | null>(null);
  const [selectedDeskId, setSelectedDeskId] = useState<string | null>(null);
  const [isTemporary, setIsTemporary] = useState(false);
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const nameOrId = focus?.employeeName || focus?.employeeId || searchQuery;
    if (!nameOrId) return;
    setQuery(nameOrId);
    const match = MOCK_999_EMPLOYEES.find(
      (e) =>
        e.emp_id === focus?.employeeId ||
        e.name.toLowerCase() === nameOrId.toLowerCase() ||
        e.name.toLowerCase().includes(nameOrId.toLowerCase()),
    );
    if (match) setSelectedEmp(match);
    if (focus?.preferredDeskId) setSelectedDeskId(focus.preferredDeskId);
    if (focus?.requestNotes) setNotes(focus.requestNotes);
  }, [focus, searchQuery]);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return MOCK_999_EMPLOYEES.slice(0, 12);
    return MOCK_999_EMPLOYEES.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.team.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.emp_id.toLowerCase().includes(q),
    ).slice(0, 20);
  }, [query]);

  const available = useMemo(() => listAvailableDesks(desks), [desks]);
  const currentSeats = selectedEmp
    ? desksForEmployee(desks, selectedEmp.emp_id, selectedEmp.name)
    : [];

  const selectedDesk =
    desks.find((d) => d.id === selectedDeskId) ||
    available.find((d) => d.id === selectedDeskId);

  const handleConfirm = () => {
    if (!selectedEmp || !selectedDesk) return;
    if (selectedDesk.status !== 'available' && selectedDesk.assignedUserId !== selectedEmp.emp_id) {
      // Allow reassign of occupied desk explicitly
    }
    onAssign(selectedDesk.id, dbEmployeeToUser(selectedEmp), {
      isTemporary,
      notes: notes || undefined,
      assignedUserStatus: selectedEmp.status,
      startDate: isTemporary ? new Date().toISOString().split('T')[0] : undefined,
      endDate: isTemporary
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : undefined,
    });
    setSuccessMsg(
      `Assigned ${selectedEmp.name} to Desk ${selectedDesk.code}. Other seats for this person were left unchanged.`,
    );
    setSelectedDeskId(null);
    onClearFocus?.();
    window.setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="ds-panel p-4 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-content-primary flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-accent" aria-hidden />
            Assign by employee
          </h3>
          <p className="text-[11px] text-content-secondary mt-0.5">
            {[building, floorName].filter(Boolean).join(' · ') || 'Current floor'}
            {' — '}
            does not remove existing seats for the same person.
          </p>
        </div>
        {focus?.source === 'request' && (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-warning-muted text-warning border border-warning/30">
            From request
          </span>
        )}
      </div>

      {successMsg && (
        <div className="flex items-start gap-2 text-xs text-success bg-success-muted border border-success/25 rounded-lg px-3 py-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          {successMsg}
        </div>
      )}

      <div>
        <label className="text-[10px] font-bold uppercase text-content-secondary">
          1. Select employee
        </label>
        <div className="relative mt-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-content-secondary" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, team, email…"
            className="ds-input !pl-8"
          />
        </div>
        <ul className="mt-2 max-h-40 overflow-y-auto border border-border rounded-lg divide-y divide-border">
          {results.map((emp) => {
            const active = selectedEmp?.emp_id === emp.emp_id;
            return (
              <li key={emp.emp_id}>
                <button
                  type="button"
                  onClick={() => setSelectedEmp(emp)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-2 text-left text-xs transition',
                    active ? 'bg-accent-muted' : 'hover:bg-surface-muted',
                  )}
                >
                  <img src={emp.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-content-primary truncate">{emp.name}</p>
                    <p className="text-[10px] text-content-secondary truncate">
                      {emp.team} · {emp.department}
                    </p>
                  </div>
                  <PresenceBadge status={emp.status} compact />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {selectedEmp && (
        <>
          <div className="text-xs space-y-1.5">
            <p className="text-[10px] font-bold uppercase text-content-secondary">
              Current seats on this floor
            </p>
            {currentSeats.length === 0 ? (
              <p className="text-content-secondary">None on this floor yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {currentSeats.map((d) => (
                  <li
                    key={d.id}
                    className="px-2 py-1 rounded-md bg-surface-muted border border-border font-mono text-[11px]"
                  >
                    {d.code}
                    {d.isTemporary ? ' (temp)' : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="text-[10px] font-bold uppercase text-content-secondary">
                2. Choose available seat
              </label>
              <span className="text-[10px] text-content-secondary font-mono">
                {available.length} free
              </span>
            </div>
            {available.length === 0 ? (
              <p className="text-xs text-content-secondary">
                No available desks on this floor. Switch floor in the header or free a seat.
              </p>
            ) : (
              <ul className="max-h-36 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {available.map((d) => {
                  const active = selectedDeskId === d.id;
                  return (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDeskId(d.id);
                          onSelectDeskOnMap?.(d);
                        }}
                        className={cn(
                          'w-full text-left px-2 py-2 rounded-md border text-[11px] transition',
                          active
                            ? 'border-accent bg-accent-muted'
                            : 'border-border bg-surface hover:border-accent/40',
                        )}
                      >
                        <span className="font-mono font-bold text-content-primary">{d.code}</span>
                        <span className="block text-content-secondary truncate">
                          {d.team || d.department || 'Open seat'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <label className="flex items-center gap-2 text-xs text-content-primary">
            <input
              type="checkbox"
              checked={isTemporary}
              onChange={(e) => setIsTemporary(e.target.checked)}
              className="rounded border-border"
            />
            Temporary assignment
          </label>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Notes (optional)"
            className="w-full text-xs rounded-md border border-border bg-surface-muted px-3 py-2 text-content-primary"
          />

          <button
            type="button"
            disabled={!selectedDesk || selectedDesk.status !== 'available'}
            onClick={handleConfirm}
            className="ds-btn-primary w-full disabled:opacity-50"
          >
            <MapPin className="w-3.5 h-3.5" />
            Confirm assign
            {selectedDesk ? ` → ${selectedDesk.code}` : ''}
          </button>
        </>
      )}
    </div>
  );
};
