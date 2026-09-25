import React from 'react';
import { cn } from '../../lib/cn';

/** Explains PART 15 color layers — element vs team vs status. */
export const ColorHierarchyLegend: React.FC<{ className?: string; compact?: boolean }> = ({
  className,
  compact = false,
}) => (
  <div
    className={cn(
      'flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-light-muted dark:text-dark-muted',
      className,
    )}
  >
    <span className="font-bold uppercase tracking-wider text-[9px] opacity-80">Colors</span>
    <span className="inline-flex items-center gap-1.5">
      <span className="w-3 h-3 rounded border border-emerald-500 bg-emerald-500/20" />
      {compact ? 'Seat status' : 'Seat fill = occupancy'}
    </span>
    <span className="inline-flex items-center gap-1.5">
      <span className="w-3 h-3 rounded border-2 border-violet-500 bg-transparent" />
      {compact ? 'Team' : 'Outline / stripe = team'}
    </span>
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
      {compact ? 'Presence' : 'Dot = presence status'}
    </span>
  </div>
);
