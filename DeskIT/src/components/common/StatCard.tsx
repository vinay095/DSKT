import React from 'react';
import { LucideIcon } from 'lucide-react';

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

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'blue',
}) => {
  const getColorClasses = () => {
    switch (colorScheme) {
      case 'blue':
        return 'bg-brandBlue-50 dark:bg-brandBlue-900/20 text-brandBlue-600 dark:text-brandBlue-400 border-brandBlue-200 dark:border-brandBlue-800/40';
      case 'purple':
        return 'bg-brandPurple-50 dark:bg-brandPurple-900/20 text-brandPurple-600 dark:text-brandPurple-400 border-brandPurple-200 dark:border-brandPurple-800/40';
      case 'emerald':
        return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40';
      case 'amber':
        return 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40';
    }
  };

  return (
    <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-light-muted dark:text-dark-muted">
            {title}
          </p>
          <h3 className="text-2xl font-bold mt-1 text-light-text dark:text-dark-text">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs mt-1 text-light-muted dark:text-dark-muted">
              {subtitle}
            </p>
          )}
          {trend && (
            <p className={`text-xs mt-2 font-medium ${trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={`p-3.5 rounded-xl border ${getColorClasses()}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
