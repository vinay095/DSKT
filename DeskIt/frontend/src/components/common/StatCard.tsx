import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorScheme?: 'blue' | 'purple' | 'emerald' | 'amber';
}

const schemeClass: Record<NonNullable<StatCardProps['colorScheme']>, string> = {
  blue: 'bg-accent-muted text-accent border-accent/25',
  purple: 'bg-accent-muted text-accent border-accent/25',
  emerald: 'bg-success-muted text-success border-success/25',
  amber: 'bg-warning-muted text-warning border-warning/25',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'blue',
}) => {
  return (
    <div className="ds-panel p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-content-secondary">
            {title}
          </p>
          <h3 className="text-2xl font-bold mt-1 text-content-primary tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs mt-1 text-content-secondary truncate">
              {subtitle}
            </p>
          )}
          {trend && (
            <p
              className={cn(
                'text-xs mt-2 font-medium',
                trend.isPositive ? 'text-success' : 'text-danger',
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-md border shrink-0', schemeClass[colorScheme])}>
          <Icon className="w-5 h-5" aria-hidden />
        </div>
      </div>
    </div>
  );
};
