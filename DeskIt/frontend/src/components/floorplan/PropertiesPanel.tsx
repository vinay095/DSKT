import React, { useMemo, useState } from 'react';
import { DeskElement, RoomElement, ZoneElement, UnusableRegion } from '../../types/floorplan';
import { UserRole } from '../../types/auth';
import { MOCK_999_EMPLOYEES } from '../../data/employeesData';
import type { MapElementSelection } from './PublishedFloorMap';
import { getCategoryStyle } from '../../lib/categoryStyles';
import { usePermissions } from '../../hooks/usePermissions';
import { summarizeFloorOccupancy, deskEquipmentList } from '../../lib/floorOccupancy';
import { PresenceBadge } from '../people/PresenceBadge';
import { EmployeeDrawer } from '../people/EmployeeDrawer';
import { ColorHierarchyLegend } from '../common/ColorHierarchyLegend';
import type { FloorOption } from '../../types/office';
import {
  Building,
  Monitor,
  UserCheck,
  RotateCw,
  Trash2,
  CheckCircle2,
  Layers,
  Users,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';

interface PropertiesPanelProps {
  selectedDesk?: DeskElement | null;
  selectedRoom?: RoomElement | null;
  selectedZone?: ZoneElement | null;
  selectedUnusable?: UnusableRegion | null;
  selectedMapElement?: MapElementSelection | null;
  /** @deprecated Prefer permissions via usePermissions */
  role?: UserRole;
  onClose: () => void;
  onRotate?: () => void;
  onDelete?: () => void;
  onAssignClick?: (desk: DeskElement) => void;
  floorContext?: { building?: string; floorName?: string };
  /** All desks on the active floor — powers empty-state occupancy */
  desks?: DeskElement[];
  floors?: FloorOption[];
  onViewTeam?: (teamName: string) => void;
  onGoToEmployee?: (employeeName: string) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedDesk,
  selectedRoom,
  selectedZone,
  selectedUnusable,
  selectedMapElement,
  onClose,
  onRotate,
  onDelete,
  onAssignClick,
  floorContext,
  desks = [],
  floors = [],
  onViewTeam,
  onGoToEmployee,
}) => {
  const { canAllocateSeat, canEditFloorPlan } = usePermissions();
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [detailsEmployeeId, setDetailsEmployeeId] = useState<string | null>(null);

  const occupancy = useMemo(() => summarizeFloorOccupancy(desks), [desks]);

  const directoryEmployee = useMemo(() => {
    if (!selectedDesk?.assignedUserId && !selectedDesk?.assignedUserName) return null;
    return (
      MOCK_999_EMPLOYEES.find(
        (e) =>
          e.emp_id === selectedDesk.assignedUserId ||
          e.name === selectedDesk.assignedUserName,
      ) || null
    );
  }, [selectedDesk]);

  const nothingSelected =
    !selectedDesk &&
    !selectedRoom &&
    !selectedZone &&
    !selectedUnusable &&
    !selectedMapElement;

  if (nothingSelected) {
    return (
      <div className="w-full lg:w-80 ds-panel p-4 flex flex-col gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">
            Floor context
          </p>
          <h4 className="font-bold text-sm text-content-primary mt-0.5">
            {floorContext?.floorName || 'Floor map'}
          </h4>
          {floorContext?.building && (
            <p className="text-xs text-content-secondary flex items-center gap-1.5 mt-1">
              <Building className="w-3.5 h-3.5" aria-hidden />
              {floorContext.building}
            </p>
          )}
        </div>

        <div className="rounded-lg bg-surface-muted border border-border p-3 space-y-2">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase text-content-secondary">Occupancy</p>
              <p className="text-2xl font-bold text-content-primary tracking-tight">
                {occupancy.occupancyPercent}%
              </p>
            </div>
            <p className="text-[11px] text-content-secondary text-right">
              {occupancy.occupied} occupied
              <br />
              {occupancy.available} available
            </p>
          </div>
          <p className="text-[11px] text-content-secondary">
            {occupancy.totalDesks} desks
            {occupancy.reserved ? ` · ${occupancy.reserved} reserved` : ''}
            {occupancy.maintenance ? ` · ${occupancy.maintenance} maintenance` : ''}
          </p>
        </div>

        {occupancy.teams.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase text-content-secondary mb-1.5 flex items-center gap-1">
              <Users className="w-3 h-3" aria-hidden />
              Teams on floor
            </p>
            <ul className="space-y-1">
              {occupancy.teams.slice(0, 6).map((t) => (
                <li
                  key={t.team}
                  className="flex justify-between text-[11px] px-2 py-1 rounded-md bg-surface-muted"
                >
                  <span className="text-content-primary truncate">{t.team}</span>
                  <span className="font-mono text-content-secondary">{t.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="text-[10px] font-bold uppercase text-content-secondary mb-1.5">
            Legend
          </p>
          <ColorHierarchyLegend className="!text-[10px]" />
        </div>

        <p className="text-[11px] text-content-secondary border-t border-border pt-3">
          Hover a seat for a quick tip. Click to inspect. Use More details for the full profile.
        </p>
      </div>
    );
  }

  const equipment = selectedDesk ? deskEquipmentList(selectedDesk) : [];

  return (
    <div className="w-full lg:w-80 ds-panel p-4 flex flex-col gap-4 max-h-[min(80vh,720px)] overflow-y-auto">
      {selectedDesk && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-border">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                Seat
              </span>
              <h3 className="text-lg font-bold text-content-primary font-mono">
                {selectedDesk.code}
              </h3>
              <p className="text-[11px] text-content-secondary">Standard workstation</p>
            </div>
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold capitalize border ${
                selectedDesk.status === 'available'
                  ? 'bg-success-muted text-success border-success/30'
                  : selectedDesk.status === 'occupied'
                    ? 'bg-accent-muted text-accent border-accent/30'
                    : 'bg-warning-muted text-warning border-warning/30'
              }`}
            >
              {selectedDesk.status}
            </span>
          </div>

          {selectedDesk.assignedUserName ? (
            <div className="p-3 rounded-lg bg-surface-muted border border-border space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase text-content-secondary">Employee</p>
                {selectedDesk.assignedUserStatus && (
                  <PresenceBadge status={selectedDesk.assignedUserStatus} compact />
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm shrink-0">
                  {selectedDesk.assignedUserName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm text-content-primary truncate">
                    {selectedDesk.assignedUserName}
                  </h4>
                  <p className="text-[11px] text-content-secondary truncate">
                    {[selectedDesk.team, selectedDesk.department].filter(Boolean).join(' · ') ||
                      '—'}
                  </p>
                </div>
              </div>
              {selectedDesk.isTemporary && (
                <p className="text-[11px] text-warning">
                  Temporary
                  {selectedDesk.startDate && selectedDesk.endDate
                    ? ` · ${selectedDesk.startDate} → ${selectedDesk.endDate}`
                    : ''}
                </p>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-success-muted border border-success/25 text-success text-xs">
              <p className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Available
              </p>
              <p className="mt-1 text-[11px] opacity-90">
                {canAllocateSeat
                  ? `Assign an employee to ${selectedDesk.code}.`
                  : 'No occupant on this seat.'}
              </p>
            </div>
          )}

          {(floorContext?.building || floorContext?.floorName) && (
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {floorContext.building && (
                <div className="p-2 rounded-md bg-surface-muted border border-border">
                  <span className="text-content-secondary block">Office</span>
                  <span className="font-semibold text-content-primary">
                    {floorContext.building}
                  </span>
                </div>
              )}
              {floorContext.floorName && (
                <div className="p-2 rounded-md bg-surface-muted border border-border">
                  <span className="text-content-secondary block">Floor</span>
                  <span className="font-semibold text-content-primary">
                    {floorContext.floorName}
                  </span>
                </div>
              )}
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={() => setEquipmentOpen((v) => !v)}
              className="w-full flex items-center justify-between text-[11px] font-semibold text-content-primary"
            >
              <span className="inline-flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-accent" aria-hidden />
                Equipment · {equipment.length} assets
              </span>
              {equipmentOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-content-secondary" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-content-secondary" />
              )}
            </button>
            {equipmentOpen && (
              <ul className="mt-1.5 space-y-1 text-[11px] text-content-secondary">
                {equipment.map((item) => (
                  <li
                    key={item}
                    className="px-2 py-1 rounded-md bg-surface-muted border border-border"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pt-2 border-t border-border space-y-2">
            {selectedDesk.assignedUserName && (
              <>
                <button
                  type="button"
                  className="ds-btn-ghost w-full"
                  onClick={() => {
                    if (directoryEmployee) {
                      setDetailsEmployeeId(directoryEmployee.emp_id);
                    } else {
                      onGoToEmployee?.(selectedDesk.assignedUserName!);
                    }
                  }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  More details
                </button>
                {selectedDesk.team && onViewTeam && (
                  <button
                    type="button"
                    className="ds-btn-ghost w-full"
                    onClick={() => onViewTeam(selectedDesk.team!)}
                  >
                    <Users className="w-3.5 h-3.5" />
                    View team
                  </button>
                )}
              </>
            )}

            {canAllocateSeat && onAssignClick && (
              <button
                type="button"
                onClick={() => onAssignClick(selectedDesk)}
                className="ds-btn-primary w-full"
              >
                <UserCheck className="w-4 h-4" />
                {selectedDesk.assignedUserName ? 'Reassign' : 'Assign employee'}
              </button>
            )}

            {canEditFloorPlan && (onRotate || onDelete) && (
              <div className="flex gap-2">
                {onRotate && (
                  <button type="button" onClick={onRotate} className="ds-btn-ghost flex-1">
                    <RotateCw className="w-3.5 h-3.5" /> Rotate
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="ds-btn-ghost text-danger border-danger/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>
            )}

            <button type="button" onClick={onClose} className="ds-btn-ghost w-full">
              Clear selection
            </button>
          </div>
        </div>
      )}

      {selectedRoom && (
        <div className="space-y-3">
          <div>
            <span className="text-[10px] font-bold uppercase text-content-secondary">Room</span>
            <h3 className="text-lg font-bold text-content-primary">{selectedRoom.name}</h3>
          </div>
          <p className="text-xs text-content-secondary">
            Capacity {selectedRoom.capacity || 6} · {selectedRoom.width}×{selectedRoom.height}
          </p>
          <button type="button" onClick={onClose} className="ds-btn-ghost w-full">
            Clear selection
          </button>
        </div>
      )}

      {selectedZone && (
        <div className="space-y-3">
          <div>
            <span className="text-[10px] font-bold uppercase text-content-secondary">Zone</span>
            <h3 className="text-lg font-bold text-content-primary">{selectedZone.name}</h3>
          </div>
          <p className="text-xs text-content-secondary">
            {selectedZone.department} · {selectedZone.width}×{selectedZone.height}
          </p>
          <button type="button" onClick={onClose} className="ds-btn-ghost w-full">
            Clear selection
          </button>
        </div>
      )}

      {selectedMapElement && !selectedDesk && (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase text-content-secondary">
                Floor element
              </span>
              <h3 className="text-base font-bold text-content-primary">
                {selectedMapElement.label ||
                  selectedMapElement.elementType.replace(/-/g, ' ') ||
                  selectedMapElement.category}
              </h3>
            </div>
            <Layers className="w-5 h-5 text-accent shrink-0" aria-hidden />
          </div>
          <div className="text-xs space-y-1 text-content-secondary">
            <p>
              <span className="font-semibold text-content-primary">Category:</span>{' '}
              {selectedMapElement.category.replace(/_/g, ' ')}
            </p>
            <p>
              <span className="font-semibold text-content-primary">Type:</span>{' '}
              {selectedMapElement.elementType.replace(/-/g, ' ')}
            </p>
            <p>
              Size {selectedMapElement.widthCells}×{selectedMapElement.heightCells} cells
            </p>
            {(() => {
              const style = getCategoryStyle(
                selectedMapElement.category,
                selectedMapElement.elementType,
                selectedMapElement.color,
              );
              return (
                <p className="flex items-center gap-2 pt-1">
                  <span
                    className="inline-block w-3.5 h-3.5 rounded border border-border"
                    style={{ backgroundColor: style.fill }}
                  />
                  {style.label}
                </p>
              );
            })()}
          </div>
          {canAllocateSeat && (
            <p className="text-[11px] text-warning border-t border-border pt-2">
              To assign a person, click a workstation/desk on the map.
            </p>
          )}
          <button type="button" onClick={onClose} className="ds-btn-ghost w-full">
            Clear selection
          </button>
        </div>
      )}

      {detailsEmployeeId && (
        <EmployeeDrawer
          employee={
            MOCK_999_EMPLOYEES.find((e) => e.emp_id === detailsEmployeeId) || null
          }
          floors={floors}
          currentFloorDesks={desks}
          onClose={() => setDetailsEmployeeId(null)}
        />
      )}
    </div>
  );
};
