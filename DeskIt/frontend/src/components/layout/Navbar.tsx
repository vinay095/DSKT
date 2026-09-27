import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { RoleBadge } from '../common/RoleBadge';
import { Breadcrumb } from '../common/Breadcrumb';
import { UserRole } from '../../types/auth';
import type { FloorOption } from '../../types/office';
import { OFFICES, floorsForOffice, getOfficeById, getFloorById } from '../../data/offices';
import {
  Building2,
  Search,
  ChevronDown,
  LogOut,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface NavbarProps {
  activeOfficeId: string;
  activeFloorId: string;
  floors: FloorOption[];
  onOfficeChange: (officeId: string) => void;
  onFloorChange: (floorId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  /** Optional page label for breadcrumb context */
  pageLabel?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeOfficeId,
  activeFloorId,
  floors,
  onOfficeChange,
  onFloorChange,
  searchQuery,
  onSearchChange,
  pageLabel,
}) => {
  const { user, switchRole, logout, openSsoModal, ssoProvider } = useAuth();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const officeFloors = useMemo(
    () => floorsForOffice(activeOfficeId, floors),
    [activeOfficeId, floors],
  );

  const activeOffice = getOfficeById(activeOfficeId);
  const activeFloor = getFloorById(activeFloorId, floors);

  const rolesList: { role: UserRole; title: string }[] = [
    { role: 'employee', title: 'Employee' },
    { role: 'hr', title: 'HR' },
    { role: 'admin', title: 'Admin' },
  ];

  const searchPlaceholder =
    user?.role === 'employee'
      ? 'Search people, teams, seats…'
      : 'Search people, desks, teams…';

  const breadcrumbItems = [
    { label: activeOffice?.name || 'Office' },
    { label: activeFloor?.shortLabel || 'Floor' },
    ...(pageLabel ? [{ label: pageLabel }] : []),
  ];

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 bg-surface/95 border-b border-border backdrop-blur-md px-3 sm:px-5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center text-accent-foreground shadow-sm">
            <Building2 className="w-4 h-4" aria-hidden />
          </div>
          <div className="hidden lg:block">
            <h1 className="font-bold text-sm tracking-tight text-content-primary leading-none">
              DeskIt
            </h1>
            <p className="text-[10px] font-medium text-content-secondary mt-0.5">
              Smart workspace seating
            </p>
          </div>
        </div>

        <div className="ds-divider hidden md:block" aria-hidden />

        <div className="relative shrink-0">
          <label htmlFor="office-select" className="sr-only">
            Office
          </label>
          <select
            id="office-select"
            value={activeOfficeId}
            onChange={(e) => onOfficeChange(e.target.value)}
            className="ds-control max-w-[9.5rem]"
            title="Office"
          >
            {OFFICES.map((office) => (
              <option key={office.id} value={office.id}>
                {office.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-content-secondary" />
        </div>

        <div className="relative shrink-0">
          <label htmlFor="floor-select" className="sr-only">
            Floor
          </label>
          <select
            id="floor-select"
            value={activeFloorId}
            onChange={(e) => onFloorChange(e.target.value)}
            className="ds-control max-w-[12rem]"
            title="Floor"
          >
            {officeFloors.map((floor) => (
              <option key={floor.id} value={floor.id}>
                {floor.shortLabel}
                {floor.isCustom ? ' (clone)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-content-secondary" />
        </div>

        <Breadcrumb items={breadcrumbItems} className="ml-1" />
      </div>

      <div className="flex-1 max-w-md mx-2 hidden md:block min-w-0">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-content-secondary" aria-hidden />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="ds-input"
            aria-label="Global search"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="ds-btn-ghost gap-1.5"
            aria-expanded={isRoleDropdownOpen}
            aria-haspopup="listbox"
          >
            <Layers className="w-3.5 h-3.5 text-accent" aria-hidden />
            <span className="hidden sm:inline text-content-secondary">Role</span>
            {user && <RoleBadge role={user.role} showIcon={false} compact />}
            <ChevronDown className="w-3 h-3 text-content-secondary" aria-hidden />
          </button>

          {isRoleDropdownOpen && (
            <div
              className="ds-dropdown absolute right-0 mt-2 w-48 py-1.5 z-50"
              role="listbox"
              onMouseLeave={() => setIsRoleDropdownOpen(false)}
            >
              <div className="px-3 py-1.5 border-b border-border text-[10px] font-bold text-content-secondary uppercase tracking-wider">
                Demo role
              </div>
              {rolesList.map((r) => (
                <button
                  key={r.role}
                  type="button"
                  role="option"
                  aria-selected={user?.role === r.role}
                  onClick={() => {
                    switchRole(r.role);
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between transition hover:bg-surface-muted ${
                    user?.role === r.role
                      ? 'bg-accent-muted text-accent font-semibold'
                      : 'text-content-primary'
                  }`}
                >
                  <span>{r.title}</span>
                  {user?.role === r.role && <RoleBadge role={r.role} showIcon={false} compact />}
                </button>
              ))}
            </div>
          )}
        </div>

        <ThemeToggle />

        <div className="ds-divider hidden sm:block" aria-hidden />

        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-md hover:bg-surface-muted transition"
              aria-expanded={isProfileDropdownOpen}
              aria-haspopup="menu"
            >
              <img
                src={user.avatar}
                alt=""
                className="w-8 h-8 rounded-full object-cover ring-2 ring-accent/40"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold leading-none text-content-primary">
                  {user.name}
                </p>
                <p className="text-[10px] text-content-secondary leading-tight mt-0.5">
                  {user.department}
                </p>
              </div>
            </button>

            {isProfileDropdownOpen && (
              <div
                className="ds-dropdown absolute right-0 mt-2 w-64 p-3 z-50"
                role="menu"
                onMouseLeave={() => setIsProfileDropdownOpen(false)}
              >
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <img
                    src={user.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-accent/40"
                  />
                  <div className="min-w-0">
                    <h4 className="font-semibold text-xs text-content-primary truncate">
                      {user.name}
                    </h4>
                    <p className="text-[11px] text-content-secondary truncate">{user.email}</p>
                    <p className="text-[10px] font-medium text-success capitalize mt-0.5">
                      SSO: {ssoProvider || 'Enterprise'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 space-y-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      openSsoModal();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium text-content-primary hover:bg-surface-muted flex items-center gap-2"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-accent" aria-hidden />
                    SSO access
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium text-danger hover:bg-danger-muted flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button type="button" onClick={openSsoModal} className="ds-btn-primary">
            SSO Login
          </button>
        )}
      </div>
    </header>
  );
};
