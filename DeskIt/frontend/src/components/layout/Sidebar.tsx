import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/cn';
import {
  LayoutDashboard,
  Map,
  Users,
  UserCheck,
  Edit3,
  Save,
  UserPlus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  collapsed,
  onCollapsedChange,
}) => {
  const { user } = useAuth();
  const role = user?.role || 'employee';

  const getNavItems = () => {
    switch (role) {
      case 'employee':
        return [
          { id: 'dashboard', label: 'Employee Dashboard', icon: LayoutDashboard },
          { id: 'floorplan', label: 'Seat Map & Teammates', icon: Map },
          { id: 'teammates', label: 'People Directory', icon: Users },
        ];
      case 'hr':
        return [
          { id: 'dashboard', label: 'HR Overview', icon: LayoutDashboard },
          { id: 'assignments', label: 'Seat Allocations', icon: UserCheck },
          { id: 'floorplan', label: 'Floor Map Viewer', icon: Map },
          { id: 'requests', label: 'Pending Seat Requests', icon: UserPlus },
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: 'Admin Metrics', icon: LayoutDashboard },
          { id: 'editor', label: 'Floor Plan Editor', icon: Edit3 },
          { id: 'drafts', label: 'Drafts & Published', icon: Save },
          { id: 'change-requests', label: 'HR Change Requests', icon: UserPlus },
          { id: 'floorplan', label: 'View Published Map', icon: Map },
        ];
    }
  };

  const navItems = getNavItems();

  const accessLabel =
    role === 'employee'
      ? 'View-only · cross-office search'
      : role === 'hr'
        ? 'Seat & team allocator (no Creator)'
        : 'Author · clone · publish floors';

  const accessHint =
    role === 'employee'
      ? 'Find anyone across offices. No edit or publish tools.'
      : role === 'hr'
        ? 'Assign seats on published maps. Layout changes go to Admin.'
        : 'Create, clone, and publish independent floor plans per office.';

  return (
    <aside
      className={cn(
        'relative bg-light-sidebar dark:bg-dark-sidebar border-r border-light-border dark:border-dark-border flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px] p-2.5' : 'w-64 p-4'
      )}
    >
      {/* Collapse / Expand toggle */}
      <button
        type="button"
        onClick={() => onCollapsedChange(!collapsed)}
        className="absolute -right-3 top-6 z-20 w-6 h-6 rounded-full border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-muted dark:text-dark-muted shadow-sm flex items-center justify-center hover:text-brandBlue-600 dark:hover:text-brandPurple-400 hover:border-brandBlue-300 dark:hover:border-brandPurple-500 transition"
        title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      <div className={cn('space-y-6', collapsed && 'space-y-4')}>
        <div>
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2">
              Navigation Hub
            </p>
          )}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'w-full flex items-center rounded-xl text-xs font-semibold transition-all',
                    collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3.5 py-2.5',
                    isActive
                      ? 'bg-brandBlue-600 text-white shadow-md shadow-brandBlue-600/20 dark:bg-brandPurple-600 dark:shadow-brandPurple-600/20'
                      : 'text-light-text dark:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-card'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate text-left">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {!collapsed && (
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-dark-card border border-light-border dark:border-dark-border">
            <p className="text-[11px] font-bold uppercase text-light-muted dark:text-dark-muted tracking-wider">
              Current Access
            </p>
            <p className="text-xs font-semibold text-light-text dark:text-dark-text mt-0.5">
              {accessLabel}
            </p>
            <p className="text-[10px] text-light-muted dark:text-dark-muted mt-1 leading-tight">
              {accessHint}
            </p>
          </div>
        )}
      </div>

      <div
        className={cn(
          'pt-4 border-t border-light-border dark:border-dark-border',
          collapsed ? 'text-center px-0' : 'text-center'
        )}
      >
        {!collapsed ? (
          <>
            <p className="text-[11px] font-semibold text-light-muted dark:text-dark-muted">
              DeskIt Workspace Management
            </p>
            <p className="text-[10px] text-light-muted/70 dark:text-dark-muted/60 mt-0.5">
              Enterprise React + TypeScript
            </p>
          </>
        ) : (
          <p className="text-[9px] font-bold tracking-wider text-light-muted dark:text-dark-muted">
            DeskIt
          </p>
        )}
      </div>
    </aside>
  );
};
