import React, { useEffect, useMemo, useState } from 'react';
import { Copy, X } from 'lucide-react';
import type { FloorPlan } from '../../types/floorplan';
import type { FloorOption } from '../../types/office';
import { OFFICES, getOfficeById } from '../../data/offices';
import { loadPublishedFloorDocument } from '../../lib/publishedFloor';
import { formatTimestamp, getFloorVersionSummary } from '../../lib/floorVersioning';
import { VersionBadge } from './VersionBadge';

export interface CloneFloorPlanDialogResult {
  name: string;
  officeId: string;
  clearAssignments: boolean;
  /** When true, also write published desk layout + SVG for viewers immediately. */
  publishImmediately: boolean;
  includeSvgMap: boolean;
}

interface CloneFloorPlanDialogProps {
  open: boolean;
  sourcePlan: FloorPlan;
  sourceFloorId: string;
  sourceFloorLabel: string;
  floors: FloorOption[];
  defaultOfficeId: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (result: CloneFloorPlanDialogResult) => void;
}

const COPIED = [
  'Floor geometry & desk positions',
  'Rooms, zones, and unusable regions',
  'Visual configuration (where available)',
];

const RESET = [
  'New floor plan identity (independent IDs)',
  'Seat assignments cleared (default)',
  'Starts as a draft — source version stays live',
];

export const CloneFloorPlanDialog: React.FC<CloneFloorPlanDialogProps> = ({
  open,
  sourcePlan,
  sourceFloorId,
  sourceFloorLabel,
  defaultOfficeId,
  busy,
  onClose,
  onConfirm,
}) => {
  const version = useMemo(
    () => getFloorVersionSummary(sourceFloorId, sourcePlan),
    [sourceFloorId, sourcePlan],
  );
  const hasSvg = Boolean(loadPublishedFloorDocument(sourceFloorId));

  const [name, setName] = useState('');
  const [officeId, setOfficeId] = useState(defaultOfficeId);
  const [clearAssignments, setClearAssignments] = useState(true);
  const [publishImmediately, setPublishImmediately] = useState(false);
  const [includeSvgMap, setIncludeSvgMap] = useState(true);

  useEffect(() => {
    if (!open) return;
    setName(`${sourcePlan.name || sourceFloorLabel} (Copy)`);
    setOfficeId(defaultOfficeId);
    setClearAssignments(true);
    setPublishImmediately(false);
    setIncludeSvgMap(hasSvg);
  }, [open, sourcePlan.name, sourceFloorLabel, defaultOfficeId, hasSvg]);

  if (!open) return null;

  const sourceOffice = getOfficeById(sourcePlan.officeId || defaultOfficeId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clone-dialog-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-surface border border-border shadow-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="clone-dialog-title"
              className="text-base font-bold text-content-primary"
            >
              Clone floor plan
            </h2>
            <p className="text-xs text-content-secondary mt-1">
              Creates an independent plan. The source is never mutated.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-muted"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-lg border border-border p-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-content-secondary">
            Source
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <VersionBadge state={version.state} label={version.label} />
            <span className="text-sm font-semibold text-content-primary">
              {sourceOffice?.name || 'Office'} · {sourceFloorLabel}
            </span>
          </div>
          <p className="text-[11px] text-content-secondary">
            {version.detail}
            {version.lastModified
              ? ` · Updated ${formatTimestamp(version.lastModified)}`
              : ''}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
          <div className="rounded-lg bg-success-muted/40 border border-success/20 p-3">
            <p className="font-bold text-success mb-1.5">Copied</p>
            <ul className="space-y-1 text-content-primary">
              {COPIED.map((item) => (
                <li key={item}>· {item}</li>
              ))}
              {hasSvg && includeSvgMap && <li>· Published SVG map (as draft or live)</li>}
            </ul>
          </div>
          <div className="rounded-lg bg-warning-muted/40 border border-warning/20 p-3">
            <p className="font-bold text-warning mb-1.5">Reset / new</p>
            <ul className="space-y-1 text-content-primary">
              {RESET.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </div>
        </div>

        <label className="block space-y-1">
          <span className="text-[11px] font-semibold text-content-secondary">New plan name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-surface-elevated text-xs"
            placeholder="e.g. Engineering Expansion – Q4 2026"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] font-semibold text-content-secondary">
            Clone into office
          </span>
          <select
            value={officeId}
            onChange={(e) => setOfficeId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-surface-elevated text-xs"
          >
            {OFFICES.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} · {o.city}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-2 text-xs">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={clearAssignments}
              onChange={(e) => setClearAssignments(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <span className="font-semibold text-content-primary">Clear seat assignments</span>
              <span className="block text-content-secondary">
                Recommended — clone is a layout template, not a people copy
              </span>
            </span>
          </label>
          {hasSvg && (
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSvgMap}
                onChange={(e) => setIncludeSvgMap(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <span className="font-semibold text-content-primary">Include SVG floor map</span>
                <span className="block text-content-secondary">
                  Copies the Creator map with new entity IDs
                </span>
              </span>
            </label>
          )}
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={publishImmediately}
              onChange={(e) => setPublishImmediately(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <span className="font-semibold text-content-primary">
                Publish immediately for viewers
              </span>
              <span className="block text-content-secondary">
                Default is draft only — leave unchecked to edit before going live
              </span>
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl border border-border text-xs font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !name.trim()}
            onClick={() =>
              onConfirm({
                name: name.trim(),
                officeId,
                clearAssignments,
                publishImmediately,
                includeSvgMap: includeSvgMap && hasSvg,
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold disabled:opacity-50"
          >
            <Copy className="w-3.5 h-3.5" />
            {publishImmediately ? 'Clone & publish' : 'Clone as draft'}
          </button>
        </div>
      </div>
    </div>
  );
};
