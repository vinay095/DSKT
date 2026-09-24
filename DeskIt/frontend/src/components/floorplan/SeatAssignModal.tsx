import React, { useState } from 'react';
import { DeskElement } from '../../types/floorplan';
import { User } from '../../types/auth';
import { MOCK_999_EMPLOYEES } from '../../data/employeesData';
import { EMPLOYEE_STATUS_CONFIG, EmployeeStatusColor } from '../../types/database';
import { UserCheck, X, Search, CheckCircle2, Clock, Calendar, FileText } from 'lucide-react';

export interface SeatAssignmentDetails {
  isTemporary: boolean;
  startDate?: string;
  endDate?: string;
  notes?: string;
  assignedUserStatus?: EmployeeStatusColor;
}

interface SeatAssignModalProps {
  desk: DeskElement | null;
  onClose: () => void;
  onAssign: (deskId: string, user: User, details?: SeatAssignmentDetails) => void;
  onUnassign: (deskId: string) => void;
}

export const SeatAssignModal: React.FC<SeatAssignModalProps> = ({
  desk,
  onClose,
  onAssign,
  onUnassign,
}) => {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isTemporary, setIsTemporary] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');

  if (!desk) return null;

  const filteredEmployees = MOCK_999_EMPLOYEES.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase()) ||
      emp.team.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 50); // Slice for responsive rendering

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-950 dark:to-teal-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg leading-tight">HR Seat Allocation</h3>
              <p className="text-xs text-emerald-100">
                Assign employee to Desk <span className="font-mono font-bold">{desk.code}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Current Occupant summary */}
          {desk.assignedUserName && (
            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-dark-sidebar border border-light-border dark:border-dark-border flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
                  Currently Assigned To
                </p>
                <p className="font-bold text-sm text-light-text dark:text-dark-text mt-0.5">
                  {desk.assignedUserName} {desk.isTemporary && <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">(Temporary)</span>}
                </p>
              </div>
              <button
                onClick={() => {
                  onUnassign(desk.id);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 transition"
              >
                Unassign Desk
              </button>
            </div>
          )}

          {/* Search Employee Pool */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2">
              Select Colleague (999 Employee Directory)
            </label>
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, department, or team..."
                className="w-full bg-slate-50 dark:bg-dark-sidebar border border-light-border dark:border-dark-border rounded-xl pl-9 pr-4 py-2 text-xs text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 border border-light-border dark:border-dark-border rounded-xl p-2 bg-slate-50/50 dark:bg-dark-sidebar/50">
              {filteredEmployees.map((emp) => {
                const isSelected = selectedUser?.id === emp.emp_id;
                const statusMeta = EMPLOYEE_STATUS_CONFIG[emp.status];
                return (
                  <button
                    key={emp.emp_id}
                    onClick={() =>
                      setSelectedUser({
                        id: emp.emp_id,
                        name: emp.name,
                        email: emp.email,
                        role: 'employee',
                        department: emp.department,
                        title: emp.team,
                        avatar: emp.avatar,
                      })
                    }
                    className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500'
                        : 'border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card hover:bg-slate-100 dark:hover:bg-dark-sidebar'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={emp.avatar}
                          alt={emp.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-dark-card ${statusMeta.dotColor}`}
                          title={statusMeta.label}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-light-text dark:text-dark-text">
                            {emp.name}
                          </h4>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold border ${statusMeta.badgeBg} ${statusMeta.badgeText} ${statusMeta.badgeBorder}`}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-light-muted dark:text-dark-muted">
                          {emp.team} • {emp.department} • {emp.locations.join(', ')}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TEMPORARY ASSIGNMENT CONTROLS */}
          <div className="p-4 rounded-xl border border-light-border dark:border-dark-border bg-slate-50 dark:bg-dark-sidebar space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-light-text dark:text-dark-text">
                  Temporary Seat Assignment
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTemporary}
                  onChange={(e) => setIsTemporary(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {isTemporary && (
              <div className="space-y-3 pt-2 border-t border-light-border dark:border-dark-border animate-in fade-in duration-150">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-500" /> Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg px-2.5 py-1.5 text-xs text-light-text dark:text-dark-text focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-500" /> End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg px-2.5 py-1.5 text-xs text-light-text dark:text-dark-text focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-amber-500" /> Assignment Notes / Reason
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Visiting from Hyderabad branch for Sprint 4 project..."
                    rows={2}
                    className="w-full bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-2 text-xs text-light-text dark:text-dark-text focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-light-border dark:border-dark-border flex justify-end gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted text-xs font-semibold hover:bg-slate-100 dark:hover:bg-dark-sidebar transition"
            >
              Cancel
            </button>
            <button
              disabled={!selectedUser}
              onClick={() => {
                if (selectedUser) {
                  const empRecord = MOCK_999_EMPLOYEES.find((e) => e.emp_id === selectedUser.id);
                  onAssign(desk.id, selectedUser, {
                    isTemporary,
                    startDate: isTemporary ? startDate : undefined,
                    endDate: isTemporary ? endDate : undefined,
                    notes: isTemporary ? notes : undefined,
                    assignedUserStatus: empRecord?.status || 'green',
                  });
                  onClose();
                }
              }}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" /> Confirm {isTemporary ? 'Temporary' : 'Permanent'} Allocation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
