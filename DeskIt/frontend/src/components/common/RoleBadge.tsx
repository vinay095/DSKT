import React from 'react';
import { UserRole } from '../../types/auth';
import { User, ShieldCheck, Settings } from 'lucide-react';
import { cn } from '../../lib/cn';

interface RoleBadgeProps {
  role: UserRole;
  showIcon?: boolean;
  /** Smaller badge for dense header controls */
  compact?: boolean;
}

/**
 * Role indicator — semantic status styling, not a separate theme per role.
 */
export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  showIcon = true,
  compact = false,
}) => {
  const config = {
    employee: {
      className: 'bg-info-muted text-info border-info/30',
      label: compact ? 'Employee' : 'Employee',
      icon: User,
    },
    hr: {
      className: 'bg-success-muted text-success border-success/30',
      label: compact ? 'HR' : 'HR',
      icon: ShieldCheck,
    },
    admin: {
      className: 'bg-accent-muted text-accent border-accent/30',
      label: compact ? 'Admin' : 'Admin',
      icon: Settings,
    },
  }[role];

  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border font-semibold transition-colors',
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]',
        config.className,
      )}
    >
      {showIcon && <Icon className={cn('shrink-0', compact ? 'w-3 h-3' : 'w-3.5 h-3.5')} aria-hidden />}
      {config.label}
    </span>
  );
};
