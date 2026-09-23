import React, { useState } from 'react';
import { DeskElement } from '../../types/floorplan';
import { User } from '../../types/auth';
import { ALL_EMPLOYEES } from '../../data/mockData';
import { UserCheck, X, Search, CheckCircle2 } from 'lucide-react';

interface SeatAssignModalProps {
  desk: DeskElement | null;
  onClose: () => void;
  onAssign: (deskId: string, user: User) => void;
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

  if (!desk) return null;

  const filteredEmployees = ALL_EMPLOYEES.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase()) ||
      emp.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-950 dark:to-teal-950 text-white flex items-center justify-between">
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

        <div className="p-6 space-y-5">
          {/* Current Occupant summary */}
          {desk.assignedUserName && (
            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-dark-sidebar border border-light-border dark:border-dark-border flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
                  Currently Assigned To
                </p>
                <p className="font-bold text-sm text-light-text dark:text-dark-text mt-0.5">
                  {desk.assignedUserName}
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
              Select Employee to Allocate
            </label>
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search colleague by name or department..."
                className="w-full bg-slate-50 dark:bg-dark-sidebar border border-light-border dark:border-dark-border rounded-xl pl-9 pr-4 py-2 text-xs text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {filteredEmployees.map((emp) => {
                const isSelected = selectedUser?.id === emp.id;
                return (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedUser(emp)}
                    className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500'
                        : 'border-light-border dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-sidebar'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.avatar}
                        alt={emp.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="font-bold text-xs text-light-text dark:text-dark-text">
                          {emp.name}
                        </h4>
                        <p className="text-[10px] text-light-muted dark:text-dark-muted">
                          {emp.title} • {emp.department}
                        </p>
                      </div>
                    </div>
                    {emp.assignedDeskId ? (
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200">
                        Assigned ({emp.assignedDeskId})
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200">
                        Unassigned
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-light-border dark:border-dark-border flex justify-end gap-2">
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
                  onAssign(desk.id, selectedUser);
                  onClose();
                }
              }}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" /> Confirm Allocation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
