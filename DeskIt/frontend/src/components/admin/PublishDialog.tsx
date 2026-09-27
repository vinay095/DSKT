import React, { useEffect, useState } from 'react';
import { Upload, X } from 'lucide-react';

export type PublishTarget = 'desk' | 'svg' | 'both';

interface PublishDialogProps {
  open: boolean;
  title?: string;
  floorLabel: string;
  /** Current live version before publish (desk layout). */
  currentLiveVersion: number;
  hasSvgDraft: boolean;
  hasDeskDraft: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (target: PublishTarget) => void;
}

/**
 * Confirms promoting drafts to the live viewer-facing map.
 * Viewers only see published versions — drafts stay private until publish.
 */
export const PublishDialog: React.FC<PublishDialogProps> = ({
  open,
  title = 'Publish floor plan',
  floorLabel,
  currentLiveVersion,
  hasSvgDraft,
  hasDeskDraft,
  busy,
  onClose,
  onConfirm,
}) => {
  const [publishDesk, setPublishDesk] = useState(hasDeskDraft);
  const [publishSvg, setPublishSvg] = useState(hasSvgDraft);

  useEffect(() => {
    if (!open) return;
    setPublishDesk(hasDeskDraft);
    setPublishSvg(hasSvgDraft);
  }, [open, hasDeskDraft, hasSvgDraft]);

  if (!open) return null;

  const nextVersion = Math.max(currentLiveVersion, 0) + 1;
  const canSubmit =
    (publishDesk && hasDeskDraft) || (publishSvg && hasSvgDraft);

  const resolveTarget = (): PublishTarget | null => {
    const desk = publishDesk && hasDeskDraft;
    const svg = publishSvg && hasSvgDraft;
    if (desk && svg) return 'both';
    if (desk) return 'desk';
    if (svg) return 'svg';
    return null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-dialog-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-surface border border-border shadow-lg p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="publish-dialog-title"
              className="text-base font-bold text-content-primary"
            >
              {title}
            </h2>
            <p className="text-xs text-content-secondary mt-1">{floorLabel}</p>
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

        <div className="rounded-lg border border-border bg-surface-muted/50 p-3 text-xs space-y-1.5">
          <p className="text-content-primary font-semibold">
            After publish → Live v{nextVersion} for Employee & HR
          </p>
          <p className="text-content-secondary">
            Viewers only see published maps. Drafts stay private until you publish. This floor
            only — other floors are unchanged.
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-[11px] font-semibold uppercase tracking-wider text-content-secondary">
            What to publish
          </legend>
          <label
            className={`flex items-start gap-2 text-xs ${hasDeskDraft ? 'cursor-pointer' : 'opacity-50'}`}
          >
            <input
              type="checkbox"
              checked={publishDesk && hasDeskDraft}
              disabled={!hasDeskDraft}
              onChange={(e) => setPublishDesk(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <span className="font-semibold text-content-primary">Desk layout</span>
              <span className="block text-content-secondary">
                {hasDeskDraft
                  ? 'Local desk/assignment draft for this floor'
                  : 'No desk draft saved'}
              </span>
            </span>
          </label>
          <label
            className={`flex items-start gap-2 text-xs ${hasSvgDraft ? 'cursor-pointer' : 'opacity-50'}`}
          >
            <input
              type="checkbox"
              checked={publishSvg && hasSvgDraft}
              disabled={!hasSvgDraft}
              onChange={(e) => setPublishSvg(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <span className="font-semibold text-content-primary">SVG floor map</span>
              <span className="block text-content-secondary">
                {hasSvgDraft
                  ? 'Cloned / staged Creator map draft'
                  : 'No SVG draft — publish from Creator Preview for new maps'}
              </span>
            </span>
          </label>
        </fieldset>

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
            disabled={busy || !canSubmit}
            onClick={() => {
              const t = resolveTarget();
              if (t) onConfirm(t);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            Publish Live v{nextVersion}
          </button>
        </div>
      </div>
    </div>
  );
};
