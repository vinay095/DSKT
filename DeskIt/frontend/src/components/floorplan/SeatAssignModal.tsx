import React, { useEffect, useMemo, useState } from 'react';
import { DeskElement } from '../../types/floorplan';
import { User } from '../../types/auth';
import { MOCK_999_EMPLOYEES } from '../../data/employeesData';
import { PresenceBadge } from '../people/PresenceBadge';
import {
  dbEmployeeToUser,
  suggestEmployeesForDesk,
  type SeatAssignmentDetails,
} from '../../lib/seatAssignment';
import { UserCheck, X, Search, CheckCircle2, Clock, Calendar, FileText } from 'lucide-react';

export type { SeatAssignmentDetails };

interface SeatAssignModalProps {
  desk: DeskElement | null;
  onClose: () => void;
  onAssign: (deskId: string, user: User, details?: SeatAssignmentDetails) => void;
  onUnassign: (deskId: string) => void;
  /** Prefill search / selection (People or Seat Request flow). */
  preselectedEmployeeId?: string;
  preselectedEmployeeName?: string;
  floorContext?: { building?: string; floorName?: string };
  requestNotes?: string;
}

export const SeatAssignModal: React.FC<SeatAssignModalProps> = ({
  desk,
  onClose,
  onAssign,
  onUnassign,
  preselectedEmployeeId,
  preselectedEmployeeName,
  floorContext,
  requestNotes,
}) => {
  const [search, setSearch] = useState(preselectedEmployeeName || '');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isTemporary, setIsTemporary] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  );
  const [notes, setNotes] = useState(requestNotes || '');

  useEffect(() => {
    if (!desk) return;
    const match = MOCK_999_EMPLOYEES.find(
      (e) =>
        e.emp_id === preselectedEmployeeId ||
        (preselectedEmployeeName &&
          e.name.toLowerCase() === preselectedEmployeeName.toLowerCase()),
    );
    if (match) {
      setSelectedUser(dbEmployeeToUser(match));
      setSearch(match.name);
    }
    if (requestNotes) setNotes(requestNotes);
  }, [desk, preselectedEmployeeId, preselectedEmployeeName, requestNotes]);

  const suggested = useMemo(
    () => (desk ? suggestEmployeesForDesk(MOCK_999_EMPLOYEES, desk, 6) : []),
    [desk],
  );

  const filteredEmployees = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return MOCK_999_EMPLOYEES.slice(0, 30);
    return MOCK_999_EMPLOYEES.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.team.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.locations.some((loc) => loc.toLowerCase().includes(q)),
    ).slice(0, 50);
  }, [search]);

  if (!desk) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-xl bg-surface border border-border rounded-xl shadow-md overflow-hidden max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="seat-assign-title"
      >
        <div className="p-4 bg-accent text-accent-foreground flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-white/15 rounded-lg shrink-0">
              <UserCheck className="w-5 h-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 id="seat-assign-title" className="font-bold text-base leading-tight">
                Assign employee
              </h3>
              <p className="text-xs opacity-90 truncate">
                Desk <span className="font-mono font-bold">{desk.code}</span>
                {floorContext?.building ? ` · ${floorContext.building}` : ''}
                {floorContext?.floorName ? ` · ${floorContext.floorName}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/15 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-md bg-surface-muted border border-border">
              <span className="text-content-secondary block">Status</span>
              <span className="font-semibold text-content-primary capitalize">{desk.status}</span>
            </div>
            <div className="p-2 rounded-md bg-surface-muted border border-border">
              <span className="text-content-secondary block">Zone / team</span>
              <span className="font-semibold text-content-primary truncate">
                {desk.team || desk.department || '—'}
              </span>
            </div>
            <div className="p-2 rounded-md bg-surface-muted border border-border">
              <span className="text-content-secondary block">Equipment</span>
              <span className="font-semibold text-content-primary">
                {[desk.hasMonitor && 'Monitor', desk.isStandingDesk && 'Standing'].filter(Boolean).join(', ') ||
                  'Standard'}
              </span>
            </div>
            <div className="p-2 rounded-md bg-surface-muted border border-border">
              <span className="text-content-secondary block">Seat type</span>
              <span className="font-semibold text-content-primary">Workstation</span>
            </div>
          </div>

          {desk.assignedUserName && (
            <div className="p-3 rounded-lg bg-surface-muted border border-border flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase text-content-secondary">
                  Currently assigned
                </p>
                <p className="font-semibold text-sm text-content-primary mt-0.5">
                  {desk.assignedUserName}
                  {desk.isTemporary && (
                    <span className="text-xs text-warning font-semibold ml-1">(Temporary)</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onUnassign(desk.id);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-md border border-danger/30 bg-danger-muted text-danger font-bold text-xs"
              >
                Unassign
              </button>
            </div>
          )}

          {suggested.length > 0 && !search && (
            <div>
              <p className="text-[10px] font-bold uppercase text-content-secondary mb-1.5">
                Suggested (team / department)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggested.map((emp) => (
                  <button
                    key={emp.emp_id}
                    type="button"
                    onClick={() => {
                      setSelectedUser(dbEmployeeToUser(emp));
                      setSearch(emp.name);
                    }}
                    className="px-2 py-1 rounded-md text-[11px] border border-border bg-surface hover:border-accent/40 font-medium"
                  >
                    {emp.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase text-content-secondary mb-1.5">
              Search employee
            </label>
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-content-secondary" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email, team, office…"
                className="ds-input"
              />
            </div>

            <div className="max-h-44 overflow-y-auto space-y-1.5 border border-border rounded-lg p-1.5 bg-surface-muted/50">
              {filteredEmployees.map((emp) => {
                const isSelected = selectedUser?.id === emp.emp_id;
                return (
                  <button
                    key={emp.emp_id}
                    type="button"
                    onClick={() => setSelectedUser(dbEmployeeToUser(emp))}
                    className={`w-full text-left p-2 rounded-md border flex items-center gap-2 transition ${
                      isSelected
                        ? 'border-accent bg-accent-muted'
                        : 'border-transparent bg-surface hover:border-border'
                    }`}
                  >
                    <img src={emp.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-xs text-content-primary">{emp.name}</h4>
                        <PresenceBadge status={emp.status} compact />
                      </div>
                      <p className="text-[10px] text-content-secondary truncate">
                        {emp.team} · {emp.department}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-surface-muted space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning" aria-hidden />
                <span className="text-xs font-semibold text-content-primary">
                  Temporary assignment
                </span>
              </div>
              <input
                type="checkbox"
                checked={isTemporary}
                onChange={(e) => setIsTemporary(e.target.checked)}
                className="rounded border-border"
                aria-label="Temporary assignment"
              />
            </div>

            {isTemporary && (
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-content-secondary mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Start
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-surface border border-border rounded-md px-2 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-content-secondary mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> End
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-surface border border-border rounded-md px-2 py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase text-content-secondary mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason or context…"
                rows={2}
                className="w-full bg-surface border border-border rounded-md p-2 text-xs"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-border flex justify-end gap-2">
            <button type="button" onClick={onClose} className="ds-btn-ghost">
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedUser}
              onClick={() => {
                if (!selectedUser) return;
                const empRecord = MOCK_999_EMPLOYEES.find((e) => e.emp_id === selectedUser.id);
                onAssign(desk.id, selectedUser, {
                  isTemporary,
                  startDate: isTemporary ? startDate : undefined,
                  endDate: isTemporary ? endDate : undefined,
                  notes: notes || undefined,
                  assignedUserStatus: empRecord?.status || 'green',
                });
                onClose();
              }}
              className="ds-btn-primary disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm {isTemporary ? 'temporary' : 'permanent'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
