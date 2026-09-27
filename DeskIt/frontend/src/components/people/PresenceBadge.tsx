import React from 'react';
import { EMPLOYEE_STATUS_CONFIG, type EmployeeStatusColor } from '../../types/database';
import { cn } from '../../lib/cn';

interface PresenceBadgeProps {
  status: EmployeeStatusColor;
  compact?: boolean;
  className?: string;
}

/** Presence with label + color + dot (not color alone). */
export const PresenceBadge: React.FC<PresenceBadgeProps> = ({
  status,
  compact = false,
  className,
}) => {
  const meta = EMPLOYEE_STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-semibold',
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]',
        meta.badgeBg,
        meta.badgeText,
        meta.badgeBorder,
        className,
      )}
      title={meta.label}
    >
      <span className={cn('rounded-full shrink-0', meta.dotColor, compact ? 'w-1.5 h-1.5' : 'w-2 h-2')} />
      {meta.label}
    </span>
  );
};
