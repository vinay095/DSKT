import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Map,
  Users,
  UserCheck,
  Edit3,
  Save,
  UserPlus
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
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
          { id: 'floorplan', label: 'View Published Map', icon: Map },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-light-sidebar dark:bg-dark-sidebar border-r border-light-border dark:border-dark-border flex flex-col justify-between p-4 shrink-0 transition-colors">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2">
            Navigation Hub
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-brandBlue-600 text-white shadow-md shadow-brandBlue-600/20 dark:bg-brandPurple-600 dark:shadow-brandPurple-600/20'
                      : 'text-light-text dark:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-card'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Role Context Banner */}
        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-dark-card border border-light-border dark:border-dark-border">
          <p className="text-[11px] font-bold uppercase text-light-muted dark:text-dark-muted tracking-wider">
            Current Access
          </p>
          <p className="text-xs font-semibold text-light-text dark:text-dark-text mt-0.5 capitalize">
            {role === 'employee' && '🔍 View-Only Seat Lookup'}
            {role === 'hr' && '⚡ Seat & Team Allocator'}
            {role === 'admin' && '📐 Canvas Layout Architect'}
          </p>
          <p className="text-[10px] text-light-muted dark:text-dark-muted mt-1 leading-tight">
            Use the top role switcher to toggle access levels instantly.
          </p>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="pt-4 border-t border-light-border dark:border-dark-border text-center">
        <p className="text-[11px] font-semibold text-light-muted dark:text-dark-muted">
          DeskIT Workspace Management
        </p>
        <p className="text-[10px] text-light-muted/70 dark:text-dark-muted/60 mt-0.5">
          Enterprise React + TypeScript
        </p>
      </div>
    </aside>
  );
};
