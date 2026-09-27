import React, { useMemo } from 'react';
import { FileEdit, Map, Pencil } from 'lucide-react';
import type { FloorOption } from '../../types/office';
import { buildFloorPlanRegistry, type FloorPlanRegistryRow } from '../../lib/adminMetrics';
import { cn } from '../../lib/cn';

interface FloorPlanRegistryProps {
  floors: FloorOption[];
  activeFloorId: string;
  onSelectFloor: (floorId: string) => void;
  onNavigateTab?: (tab: string) => void;
  /** Limit rows (overview widget). */
  limit?: number;
  className?: string;
}

function StatusPill({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold',
        ok
          ? 'bg-success-muted text-success'
          : 'bg-surface-elevated text-content-secondary',
      )}
    >
      {label}
    </span>
  );
}

export const FloorPlanRegistry: React.FC<FloorPlanRegistryProps> = ({
  floors,
  activeFloorId,
  onSelectFloor,
  onNavigateTab,
  limit,
  className,
}) => {
  const rows = useMemo(() => {
    const all = buildFloorPlanRegistry(floors);
    return typeof limit === 'number' ? all.slice(0, limit) : all;
  }, [floors, limit]);

  const openFloor = (row: FloorPlanRegistryRow, tab: string) => {
    onSelectFloor(row.floorId);
    onNavigateTab?.(tab);
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface overflow-hidden',
        className,
      )}
    >
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-content-primary flex items-center gap-2">
          <Map className="w-4 h-4" aria-hidden />
          Floor plan registry
        </h3>
        <span className="text-[10px] text-content-secondary font-mono">
          {floors.length} floor{floors.length === 1 ? '' : 's'}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase tracking-wider text-content-secondary">
              <th className="px-3 py-2 font-semibold">Office</th>
              <th className="px-3 py-2 font-semibold">Floor</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Version</th>
              <th className="px-3 py-2 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const active = row.floorId === activeFloorId;
              return (
                <tr
                  key={row.floorId}
                  className={cn(
                    'border-b border-border/70 last:border-0',
                    active && 'bg-accent-muted/40',
                  )}
                >
                  <td className="px-3 py-2.5 text-content-primary font-medium">
                    {row.officeName}
                  </td>
                  <td className="px-3 py-2.5 text-content-primary">{row.floorLabel}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      <StatusPill
                        ok={row.hasSvgMap || row.hasSvgDraft}
                        label={
                          row.hasSvgMap
                            ? 'SVG live'
                            : row.hasSvgDraft
                              ? 'SVG draft'
                              : 'No SVG'
                        }
                      />
                      <StatusPill ok={row.hasDraft} label={row.hasDraft ? 'Draft' : 'No draft'} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-content-secondary">
                    {row.version > 0 ? `v${row.version}` : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        title="Edit in Creator"
                        onClick={() => openFloor(row, 'editor')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border hover:bg-surface-elevated text-[11px] font-semibold text-content-primary"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button
                        type="button"
                        title="View published map"
                        onClick={() => openFloor(row, 'floorplan')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border hover:bg-surface-elevated text-[11px] font-semibold text-content-primary"
                      >
                        <FileEdit className="w-3 h-3" /> View
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
