import React from 'react';
import { UserRole } from '../../types/auth';
import { User, ShieldCheck, Settings } from 'lucide-react';

interface RoleBadgeProps {
  role: UserRole;
  showIcon?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, showIcon = true }) => {
  const getBadgeStyle = () => {
    switch (role) {
      case 'employee':
        return {
          bg: 'bg-brandBlue-50 dark:bg-brandBlue-900/30 text-brandBlue-700 dark:text-brandBlue-300 border-brandBlue-200 dark:border-brandBlue-700/50',
          label: 'Employee Access',
          icon: User,
        };
      case 'hr':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
          label: 'HR Manager Access',
          icon: ShieldCheck,
        };
      case 'admin':
        return {
          bg: 'bg-brandPurple-50 dark:bg-brandPurple-900/40 text-brandPurple-700 dark:text-brandPurple-300 border-brandPurple-200 dark:border-brandPurple-700/50',
          label: 'Admin Facilities Access',
          icon: Settings,
        };
    }
  };

  const style = getBadgeStyle();
  const Icon = style.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg} transition-colors`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      {style.label}
    </span>
  );
};
