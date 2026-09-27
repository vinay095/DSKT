import React from 'react';
import { cn } from '../../lib/cn';

interface AppShellProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
  /** Optional main region class overrides (editor / floor map full-bleed). */
  mainClassName?: string;
}

/**
 * Single enterprise application shell shared by Employee, HR, and Admin.
 * Role differences live in navigation/actions — not in separate visual systems.
 */
export const AppShell: React.FC<AppShellProps> = ({
  sidebar,
  header,
  children,
  mainClassName,
}) => {
  return (
    <div className="ds-shell">
      {sidebar}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {header}
        <main
          className={cn(
            'flex-1 overflow-y-auto p-4 sm:p-6',
            mainClassName,
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
