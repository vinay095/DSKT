import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/** Compact context trail for office / floor / page. */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  if (!items.length) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('hidden xl:flex items-center gap-1 min-w-0', className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 && (
              <ChevronRight
                className="w-3 h-3 shrink-0 text-content-secondary opacity-60"
                aria-hidden
              />
            )}
            {item.onClick && !isLast ? (
              <button
                type="button"
                onClick={item.onClick}
                className="text-[11px] font-semibold text-content-secondary hover:text-accent truncate max-w-[8rem] transition"
              >
                {item.label}
              </button>
            ) : (
              <span
                className={cn(
                  'text-[11px] font-semibold truncate max-w-[10rem]',
                  isLast ? 'text-content-primary' : 'text-content-secondary',
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
