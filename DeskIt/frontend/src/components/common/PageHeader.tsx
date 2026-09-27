import React from 'react';
import { cn } from '../../lib/cn';

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  actions?: React.ReactNode;
}

/**
 * Shared page title + short description.
 * Office/floor context stays in the Navbar.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  className,
  actions,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-xl font-bold text-content-primary tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-content-secondary mt-0.5 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
    </div>
  );
};
