import React from 'react';
import { Map } from 'lucide-react';
import { cn } from '../../lib/cn';

interface EmptyFloorMapProps {
  className?: string;
  title?: string;
  description?: string;
}

/**
 * Placeholder when there is no published Creator layout (or only an empty document).
 * Prefer this over rendering a blank / tiny default canvas.
 */
export const EmptyFloorMap: React.FC<EmptyFloorMapProps> = ({
  className,
  title = 'No floor map published yet',
  description = 'When Admin publishes a floor plan from the Creator, the live map will appear here.',
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-light-border dark:border-dark-border bg-slate-50 dark:bg-dark-sidebar min-h-[min(45vh,420px)] px-6 py-10 text-center',
      className,
    )}
  >
    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border flex items-center justify-center shadow-sm">
      <Map className="w-6 h-6 text-brandBlue-600 dark:text-brandPurple-400" aria-hidden />
    </div>
    <div className="space-y-1 max-w-sm">
      <h3 className="text-sm font-bold text-light-text dark:text-dark-text">{title}</h3>
      <p className="text-xs text-light-muted dark:text-dark-muted leading-relaxed">{description}</p>
    </div>
  </div>
);
