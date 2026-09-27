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
          { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
          { id: 'floorplan', label: 'Floor Maps', icon: Map },
          { id: 'teammates', label: 'Find People', icon: Users },
        ];
      case 'hr':
        return [
          { id: 'dashboard', label: 'HR Overview', icon: LayoutDashboard },
          { id: 'assignments', label: 'Seat Allocation', icon: UserCheck },
          { id: 'floorplan', label: 'Floor Maps', icon: Map },
          { id: 'requests', label: 'Seat Requests', icon: UserPlus },
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: 'Admin Overview', icon: LayoutDashboard },
          { id: 'editor', label: 'Floor Plan Editor', icon: Edit3 },
          { id: 'drafts', label: 'Drafts & Versions', icon: Save },
          { id: 'change-requests', label: 'Change Requests', icon: UserPlus },
          { id: 'floorplan', label: 'Published Maps', icon: Map },
        ];
    }
  };

  const navItems = getNavItems();

  const roleLabel =
    role === 'employee' ? 'Employee' : role === 'hr' ? 'HR' : 'Admin';

  const accessHint =
    role === 'employee'
      ? 'View workplace maps and locate colleagues.'
      : role === 'hr'
        ? 'Allocate seats and manage seating requests.'
        : 'Create, clone, and publish floor plans.';

  return (
    <aside
      className={cn(
        'relative flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out border-r',
        'bg-sidebar border-border',
        collapsed ? 'w-[72px] p-2.5' : 'w-60 p-4',
      )}
    >
      <button
        type="button"
        onClick={() => onCollapsedChange(!collapsed)}
        className={cn(
          'absolute -right-3 top-6 z-20 w-6 h-6 rounded-full flex items-center justify-center transition',
          'border border-border bg-surface text-content-secondary shadow-sm',
          'hover:text-accent hover:border-accent',
        )}
        title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      <div className={cn('space-y-6', collapsed && 'space-y-4')}>
        <div>
          {!collapsed && (
            <div className="px-2 mb-4">
              <p className="text-sm font-bold tracking-tight text-content-primary">DeskIt</p>
              <p className="text-[10px] font-medium text-content-secondary mt-0.5">
                Workspace seating
              </p>
            </div>
          )}
          {!collapsed && (
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-content-secondary mb-2">
              {roleLabel}
            </p>
          )}
          <nav className="space-y-1" aria-label="Primary">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  title={collapsed ? item.label : undefined}
                  data-active={isActive}
                  className={cn(
                    'ds-nav-item',
                    collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden />
                  {!collapsed && <span className="truncate text-left">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {!collapsed && (
          <div className="p-3 rounded-lg bg-surface-muted border border-border">
            <p className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">
              Access
            </p>
            <p className="text-xs font-semibold text-content-primary mt-0.5">{roleLabel}</p>
            <p className="text-[10px] text-content-secondary mt-1 leading-snug">{accessHint}</p>
          </div>
        )}
      </div>

      <div className={cn('pt-4 border-t border-border', collapsed ? 'text-center' : '')}>
        {!collapsed ? (
          <p className="text-[10px] text-content-secondary px-1">
            Enterprise workplace management
          </p>
        ) : (
          <p className="text-[9px] font-bold tracking-wider text-content-secondary">DK</p>
        )}
      </div>
    </aside>
  );
};
