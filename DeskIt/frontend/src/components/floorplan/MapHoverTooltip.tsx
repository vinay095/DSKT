import React from 'react';
import type { DeskElement } from '../../types/floorplan';
import { EMPLOYEE_STATUS_CONFIG } from '../../types/database';

interface MapHoverTooltipProps {
  desk: DeskElement;
  /** Position relative to the map viewport container */
  x: number;
  y: number;
}

/** Lightweight hover tip — not the full inspector. */
export const MapHoverTooltip: React.FC<MapHoverTooltipProps> = ({ desk, x, y }) => {
  const statusMeta = desk.assignedUserStatus
    ? EMPLOYEE_STATUS_CONFIG[desk.assignedUserStatus]
    : null;

  return (
    <div
      className="pointer-events-none absolute z-20 px-2.5 py-2 rounded-md border border-border bg-surface-elevated shadow-md text-[11px] max-w-[220px]"
      style={{
        left: Math.max(8, x + 12),
        top: Math.max(8, y + 12),
      }}
      role="tooltip"
    >
      <p className="font-bold text-content-primary font-mono">Desk {desk.code}</p>
      {desk.assignedUserName ? (
        <>
          <p className="text-content-primary mt-0.5 truncate">{desk.assignedUserName}</p>
          <p className="text-content-secondary truncate">
            {desk.team || desk.department || '—'}
          </p>
          {statusMeta && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-content-secondary">
              <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotColor}`} />
              {statusMeta.label}
            </p>
          )}
        </>
      ) : (
        <p className="text-success mt-0.5 font-semibold capitalize">{desk.status}</p>
      )}
    </div>
  );
};
