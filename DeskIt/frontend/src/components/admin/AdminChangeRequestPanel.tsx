import React, { useMemo, useState } from 'react';
import { Inbox, Pencil } from 'lucide-react';
import type { FloorChangeRequest } from '../../types/seating';
import type { FloorOption } from '../../types/office';
import { getOfficeById } from '../../data/offices';
import { PageHeader } from '../common/PageHeader';
import { cn } from '../../lib/cn';

type StatusFilter = 'all' | 'pending' | 'acknowledged' | 'done' | 'rejected';

interface AdminChangeRequestPanelProps {
  requests: FloorChangeRequest[];
  floors: FloorOption[];
  activeFloorId: string;
  canManage: boolean;
  onRefresh: () => void;
  onUpdateStatus: (id: string, status: FloorChangeRequest['status']) => void;
  onOpenEditor: (floorId?: string) => void;
}

export const AdminChangeRequestPanel: React.FC<AdminChangeRequestPanelProps> = ({
  requests,
  floors,
  activeFloorId,
  canManage,
  onRefresh,
  onUpdateStatus,
  onOpenEditor,
}) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [floorFilter, setFloorFilter] = useState<string>('all');

  const floorLabel = (floorId?: string) => {
    if (!floorId) return 'Unspecified floor';
    const f = floors.find((x) => x.id === floorId);
    if (!f) return floorId;
    const office = getOfficeById(f.officeId);
    return `${office?.name || f.officeId} · ${f.shortLabel || f.label}`;
  };

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (floorFilter !== 'all' && r.floorId !== floorFilter) return false;
      return true;
    });
  }, [requests, statusFilter, floorFilter]);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Floor map change requests"
          description="Review HR requests to add, remove, or modify layout elements. Apply in Creator, then publish."
        />
        <button
          type="button"
          onClick={onRefresh}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-border shrink-0"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium"
          aria-label="Filter by status"
        >
          <option value="pending">Pending ({pendingCount})</option>
          <option value="all">All statuses</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="done">Done</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={floorFilter}
          onChange={(e) => setFloorFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium"
          aria-label="Filter by floor"
        >
          <option value="all">All floors</option>
          <option value={activeFloorId}>Active floor</option>
          {floors.map((f) => (
            <option key={f.id} value={f.id}>
              {f.shortLabel || f.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-border text-center text-sm text-content-secondary">
          <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
          No change requests match this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-xl bg-surface border border-border space-y-2"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-accent-muted text-accent">
                  {req.requestType}
                </span>
                <span className="text-[10px] font-mono text-content-secondary">
                  {new Date(req.createdAt).toLocaleString()} · {req.status}
                </span>
              </div>
              <h4 className="font-bold text-sm text-content-primary">{req.elementDescription}</h4>
              <p className="text-xs text-content-secondary">{req.details}</p>
              <p className="text-[11px] text-content-secondary">
                From: {req.requestedBy}
                <span className="mx-1.5">·</span>
                {floorLabel(req.floorId)}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border border-border hover:bg-surface-elevated"
                  onClick={() => onOpenEditor(req.floorId || activeFloorId)}
                >
                  <Pencil className="w-3 h-3" /> Open editor
                </button>
                {req.status === 'pending' && canManage && (
                  <>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-accent text-accent-foreground"
                      onClick={() => onUpdateStatus(req.id, 'acknowledged')}
                    >
                      Acknowledge
                    </button>
                    <button
                      type="button"
                      className={cn(
                        'px-3 py-1 rounded-lg text-xs font-bold border border-success/40 text-success',
                      )}
                      onClick={() => onUpdateStatus(req.id, 'done')}
                    >
                      Mark done
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-lg text-xs font-bold border border-danger/30 text-danger"
                      onClick={() => onUpdateStatus(req.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
