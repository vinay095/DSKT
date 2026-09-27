import React from 'react';
import { cn } from '../../lib/cn';
import type { FloorReleaseState } from '../../lib/floorVersioning';

interface VersionBadgeProps {
  state: FloorReleaseState;
  /** e.g. Live v3 or Draft */
  label: string;
  className?: string;
}

const STYLES: Record<FloorReleaseState, string> = {
  live: 'bg-success-muted text-success border-success/30',
  draft: 'bg-warning-muted text-warning border-warning/30',
  unpublished: 'bg-surface-muted text-content-secondary border-border',
};

export const VersionBadge: React.FC<VersionBadgeProps> = ({
  state,
  label,
  className,
}) => (
  <span
    className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border',
      STYLES[state],
      className,
    )}
  >
    {label}
  </span>
);
