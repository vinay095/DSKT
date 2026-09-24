import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { RoleBadge } from '../common/RoleBadge';
import { UserRole } from '../../types/auth';
import {
  Building2,
  Search,
  ChevronDown,
  LogOut,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  activeFloorId: string;
  onFloorChange: (floorId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeFloorId,
  onFloorChange,
  searchQuery,
  onSearchChange,
}) => {
  const { user, switchRole, logout, openSsoModal, ssoProvider } = useAuth();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const rolesList: { role: UserRole; title: string }[] = [
    { role: 'employee', title: 'Employee View' },
    { role: 'hr', title: 'HR Manager' },
    { role: 'admin', title: 'Admin Editor' },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-light-card/90 dark:bg-dark-card/90 border-b border-light-border dark:border-dark-border backdrop-blur-md px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Brand & Floor Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brandBlue-600 to-brandBlue-500 dark:from-brandPurple-600 dark:to-brandPurple-500 flex items-center justify-center text-white shadow-md shadow-brandBlue-500/20 dark:shadow-brandPurple-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-brandBlue-700 to-brandBlue-500 dark:from-brandPurple-400 dark:to-brandPurple-200 bg-clip-text text-transparent">
              DeskIT
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-light-muted dark:text-dark-muted -mt-1">
              Seating Engine
            </p>
          </div>
        </div>

        <div className="h-6 w-px bg-light-border dark:bg-dark-border hidden sm:block" />

        {/* Floor Dropdown Selector */}
        <div className="relative">
          <select
            value={activeFloorId}
            onChange={(e) => onFloorChange(e.target.value)}
            className="appearance-none bg-slate-100 dark:bg-dark-sidebar border border-light-border dark:border-dark-border rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-brandBlue-500 dark:focus:ring-brandPurple-500 cursor-pointer transition"
          >
            <option value="floor-4">Floor 4 - Tech & Product Hub</option>
            <option value="floor-5">Floor 5 - Executive & People Ops</option>
            <option value="floor-3">Floor 3 - Global Operations</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-light-muted dark:text-dark-muted" />
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search colleagues, desks (e.g. A-101), teams..."
            className="w-full bg-slate-100 dark:bg-dark-sidebar border border-light-border dark:border-dark-border rounded-xl pl-9 pr-4 py-1.5 text-xs text-light-text dark:text-dark-text placeholder-light-muted dark:placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-brandBlue-500 dark:focus:ring-brandPurple-500 transition"
          />
        </div>
      </div>

      {/* Controls & User Profile */}
      <div className="flex items-center gap-3">
        {/* Role Fast Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-light-border dark:border-dark-border bg-slate-100 dark:bg-dark-sidebar hover:bg-slate-200 dark:hover:bg-dark-border/60 transition text-xs font-semibold text-light-text dark:text-dark-text"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Role:</span>
            {user && <RoleBadge role={user.role} showIcon={false} />}
            <ChevronDown className="w-3 h-3 text-light-muted dark:text-dark-muted" />
          </button>

          {isRoleDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-52 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              onMouseLeave={() => setIsRoleDropdownOpen(false)}
            >
              <div className="px-3 py-1.5 border-b border-light-border dark:border-dark-border text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider">
                Switch Demo Role
              </div>
              {rolesList.map((r) => (
                <button
                  key={r.role}
                  onClick={() => {
                    switchRole(r.role);
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-100 dark:hover:bg-dark-sidebar transition ${
                    user?.role === r.role ? 'bg-brandBlue-50 dark:bg-brandPurple-900/30 text-brandBlue-600 dark:text-brandPurple-400 font-bold' : 'text-light-text dark:text-dark-text'
                  }`}
                >
                  <span>{r.title}</span>
                  {user?.role === r.role && <RoleBadge role={r.role} showIcon={false} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dark/Light Mode Theme Toggle */}
        <ThemeToggle />

        <div className="h-6 w-px bg-light-border dark:bg-dark-border" />

        {/* User Profile Menu */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-sidebar transition"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-brandBlue-500 dark:ring-brandPurple-500"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold leading-none text-light-text dark:text-dark-text">
                  {user.name}
                </p>
                <p className="text-[10px] text-light-muted dark:text-dark-muted leading-tight mt-0.5">
                  {user.department}
                </p>
              </div>
            </button>

            {isProfileDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-xl p-3 z-50 animate-in fade-in duration-150"
                onMouseLeave={() => setIsProfileDropdownOpen(false)}
              >
                <div className="flex items-center gap-3 pb-3 border-b border-light-border dark:border-dark-border">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-brandBlue-500 dark:ring-brandPurple-500"
                  />
                  <div>
                    <h4 className="font-bold text-xs text-light-text dark:text-dark-text">
                      {user.name}
                    </h4>
                    <p className="text-[11px] text-light-muted dark:text-dark-muted">
                      {user.email}
                    </p>
                    <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 capitalize mt-0.5">
                      SSO: {ssoProvider || 'Enterprise'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 space-y-1">
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      openSsoModal();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-light-text dark:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-sidebar flex items-center gap-2"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-brandBlue-600 dark:text-brandPurple-400" />
                    SSO Access Manager
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={openSsoModal}
            className="px-3.5 py-1.5 rounded-xl bg-brandBlue-600 dark:bg-brandPurple-600 hover:bg-brandBlue-700 dark:hover:bg-brandPurple-700 text-white text-xs font-bold transition shadow-md shadow-brandBlue-600/20 dark:shadow-brandPurple-600/20"
          >
            SSO Login
          </button>
        )}
      </div>
    </header>
  );
};
