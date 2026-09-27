import React from 'react';
import { Check, ChevronRight, Eye, Map, Pencil, Save, Upload } from 'lucide-react';
import { cn } from '../../lib/cn';

export type AdminWorkflowStep =
  | 'select'
  | 'edit'
  | 'draft'
  | 'preview'
  | 'publish'
  | 'published';

interface AdminFloorWorkflowProps {
  currentStep: AdminWorkflowStep;
  officeLabel?: string;
  floorLabel?: string;
  onNavigateTab?: (tab: string) => void;
  className?: string;
}

const STEPS: {
  id: AdminWorkflowStep;
  label: string;
  tab?: string;
  icon: React.ElementType;
}[] = [
  { id: 'select', label: 'Office / Floor', icon: Map },
  { id: 'edit', label: 'Edit', tab: 'editor', icon: Pencil },
  { id: 'draft', label: 'Save draft', tab: 'drafts', icon: Save },
  { id: 'preview', label: 'Preview', tab: 'editor', icon: Eye },
  { id: 'publish', label: 'Publish', tab: 'editor', icon: Upload },
  { id: 'published', label: 'Live map', tab: 'floorplan', icon: Check },
];

const ORDER: AdminWorkflowStep[] = STEPS.map((s) => s.id);

/**
 * Compact Office → Edit → Draft → Preview → Publish → Live chrome.
 * Preview/Publish happen inside Creator; tabs jump to the right shell surface.
 */
export const AdminFloorWorkflow: React.FC<AdminFloorWorkflowProps> = ({
  currentStep,
  officeLabel,
  floorLabel,
  onNavigateTab,
  className,
}) => {
  const currentIdx = ORDER.indexOf(currentStep);

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface px-3 py-2.5 sm:px-4',
        className,
      )}
    >
      {(officeLabel || floorLabel) && (
        <p className="text-[11px] text-content-secondary mb-2 truncate">
          Active plan:{' '}
          <span className="font-semibold text-content-primary">
            {[officeLabel, floorLabel].filter(Boolean).join(' · ')}
          </span>
          <span className="text-content-secondary"> — switch office/floor in the header</span>
        </p>
      )}
      <ol className="flex flex-wrap items-center gap-1 sm:gap-0">
        {STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const Icon = step.icon;
          const clickable = Boolean(step.tab && onNavigateTab);
          return (
            <li key={step.id} className="flex items-center">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => step.tab && onNavigateTab?.(step.tab)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold transition',
                  active && 'bg-accent-muted text-accent',
                  done && !active && 'text-success',
                  !active && !done && 'text-content-secondary',
                  clickable && 'hover:bg-surface-elevated cursor-pointer',
                  !clickable && 'cursor-default',
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight
                  className="w-3.5 h-3.5 mx-0.5 text-content-secondary/50 shrink-0"
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
      {currentStep === 'edit' && (
        <p className="text-[10px] text-content-secondary mt-1.5">
          In Creator: Save draft → Preview → Publish. The live SVG map updates for Employee & HR.
        </p>
      )}
    </div>
  );
};
