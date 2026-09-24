import React from 'react';
import { DeskElement, RoomElement, ZoneElement, UnusableRegion } from '../../types/floorplan';
import { UserRole } from '../../types/auth';
import { EMPLOYEE_STATUS_CONFIG } from '../../types/database';
import {
  Building,
  Monitor,
  Sparkles,
  UserCheck,
  RotateCw,
  Trash2,
  CheckCircle2
} from 'lucide-react';

interface PropertiesPanelProps {
  selectedDesk?: DeskElement | null;
  selectedRoom?: RoomElement | null;
  selectedZone?: ZoneElement | null;
  selectedUnusable?: UnusableRegion | null;
  role?: UserRole;
  onClose: () => void;
  onRotate?: () => void;
  onDelete?: () => void;
  onAssignClick?: (desk: DeskElement) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedDesk,
  selectedRoom,
  selectedZone,
  selectedUnusable,
  role = 'employee',
  onClose,
  onRotate,
  onDelete,
  onAssignClick,
}) => {
  if (!selectedDesk && !selectedRoom && !selectedZone && !selectedUnusable) {
    return (
      <div className="w-full lg:w-80 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 shadow-sm flex flex-col justify-center items-center text-center text-light-muted dark:text-dark-muted space-y-3">
        <Building className="w-10 h-10 opacity-40 text-brandBlue-500 dark:text-brandPurple-400" />
        <h4 className="font-bold text-sm text-light-text dark:text-dark-text">
          Interactive Object Inspector
        </h4>
        <p className="text-xs max-w-xs">
          Click any desk, meeting pod, or department zone in the floor map to view logical geometry and occupant details.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-80 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-5">
      {/* DESK INSPECTOR */}
      {selectedDesk && (
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-light-border dark:border-dark-border">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
                Workstation Node
              </span>
              <h3 className="text-xl font-extrabold text-light-text dark:text-dark-text">
                Desk {selectedDesk.code}
              </h3>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${
                selectedDesk.status === 'available'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : selectedDesk.status === 'occupied'
                  ? 'bg-brandBlue-50 text-brandBlue-700 border-brandBlue-300 dark:bg-brandPurple-950/40 dark:text-brandPurple-300'
                  : 'bg-amber-50 text-amber-700 border-amber-300'
              }`}
            >
              {selectedDesk.status}
            </span>
          </div>

          {/* Occupant Details */}
          {selectedDesk.assignedUserName ? (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-dark-sidebar border border-light-border dark:border-dark-border space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
                  Current Occupant
                </p>
                {selectedDesk.assignedUserStatus && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${EMPLOYEE_STATUS_CONFIG[selectedDesk.assignedUserStatus].badgeBg} ${EMPLOYEE_STATUS_CONFIG[selectedDesk.assignedUserStatus].badgeText} ${EMPLOYEE_STATUS_CONFIG[selectedDesk.assignedUserStatus].badgeBorder}`}>
                    {EMPLOYEE_STATUS_CONFIG[selectedDesk.assignedUserStatus].label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brandBlue-600 dark:bg-brandPurple-600 text-white flex items-center justify-center font-bold text-sm">
                  {selectedDesk.assignedUserName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-light-text dark:text-dark-text">
                    {selectedDesk.assignedUserName}
                  </h4>
                  <p className="text-xs text-light-muted dark:text-dark-muted">
                    {selectedDesk.department || 'Engineering'}
                  </p>
                </div>
              </div>

              {/* Temporary Assignment Banner */}
              {selectedDesk.isTemporary && (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 space-y-1 text-xs">
                  <span className="font-extrabold text-amber-800 dark:text-amber-300 block">
                    ⏳ Temporary Seat Assignment
                  </span>
                  {selectedDesk.startDate && selectedDesk.endDate && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      Valid: <span className="font-mono font-semibold">{selectedDesk.startDate}</span> to <span className="font-mono font-semibold">{selectedDesk.endDate}</span>
                    </p>
                  )}
                  {selectedDesk.notes && (
                    <p className="text-[11px] italic text-amber-900 dark:text-amber-200">
                      "{selectedDesk.notes}"
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Unassigned Workstation
              </p>
            </div>
          )}

          {/* Logical Geometry Specs */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
              Logical Geometry & Location
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-dark-sidebar border border-light-border dark:border-dark-border">
                <span className="text-[10px] text-light-muted dark:text-dark-muted block">Position (Grid)</span>
                ({selectedDesk.x}, {selectedDesk.y})
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-dark-sidebar border border-light-border dark:border-dark-border">
                <span className="text-[10px] text-light-muted dark:text-dark-muted block">Rotation Angle</span>
                {selectedDesk.rotation}° CCW
              </div>
            </div>
          </div>

          {/* Desk Specs */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
              Hardware Specs
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-dark-sidebar border border-light-border dark:border-dark-border flex items-center gap-2 text-light-text dark:text-dark-text">
                <Monitor className="w-4 h-4 text-brandBlue-500 dark:text-brandPurple-400" />
                <span>{selectedDesk.hasMonitor ? 'Dual Monitor' : 'Single Monitor'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-dark-sidebar border border-light-border dark:border-dark-border flex items-center gap-2 text-light-text dark:text-dark-text">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{selectedDesk.isStandingDesk ? 'Standing Desk' : 'Standard Desk'}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-light-border dark:border-dark-border space-y-2">
            {(role === 'hr' || role === 'admin') && (
              <button
                onClick={() => onAssignClick && onAssignClick(selectedDesk)}
                className="w-full py-2.5 px-4 rounded-xl bg-brandBlue-600 dark:bg-brandPurple-600 hover:bg-brandBlue-700 dark:hover:bg-brandPurple-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
              >
                <UserCheck className="w-4 h-4" />
                {selectedDesk.assignedUserName ? 'Reassign Employee' : 'Assign Employee'}
              </button>
            )}

            {role === 'admin' && (
              <div className="flex gap-2">
                <button
                  onClick={onRotate}
                  className="flex-1 py-2 px-3 rounded-xl border border-light-border dark:border-dark-border bg-slate-100 dark:bg-dark-sidebar hover:bg-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Rotate
                </button>
                <button
                  onClick={onDelete}
                  className="py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-2 px-4 rounded-xl border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-dark-sidebar font-semibold text-xs transition"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* ROOM INSPECTOR */}
      {selectedRoom && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-light-border dark:border-dark-border">
            <span className="text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
              Meeting Pod / Facility
            </span>
            <h3 className="text-xl font-extrabold text-light-text dark:text-dark-text">
              {selectedRoom.name}
            </h3>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-dark-sidebar border border-light-border dark:border-dark-border space-y-2 text-xs">
            <p><span className="font-bold">Capacity:</span> {selectedRoom.capacity || 6} Persons</p>
            <p><span className="font-bold">Dimensions:</span> {selectedRoom.width}x{selectedRoom.height} Placement Cells</p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-dark-sidebar font-semibold text-xs transition"
          >
            Close Details
          </button>
        </div>
      )}

      {/* ZONE INSPECTOR */}
      {selectedZone && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-light-border dark:border-dark-border">
            <span className="text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
              Department Zone
            </span>
            <h3 className="text-xl font-extrabold text-light-text dark:text-dark-text">
              {selectedZone.name}
            </h3>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-dark-sidebar border border-light-border dark:border-dark-border space-y-2 text-xs">
            <p><span className="font-bold">Department:</span> {selectedZone.department}</p>
            <p><span className="font-bold">Grid Area:</span> {selectedZone.width}x{selectedZone.height} Units</p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-dark-sidebar font-semibold text-xs transition"
          >
            Close Details
          </button>
        </div>
      )}
    </div>
  );
};
