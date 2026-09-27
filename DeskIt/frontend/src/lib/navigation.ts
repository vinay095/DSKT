import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Map,
  Users,
  UserCheck,
  Edit3,
  Save,
  UserPlus,
} from 'lucide-react';
import type { UserRole } from '../types/auth';
import type { AppTabId } from './permissions';
import { getAllowedTabs } from './permissions';

export interface NavItem {
  id: AppTabId;
  label: string;
  icon: LucideIcon;
}

const ALL_NAV_ITEMS: Record<AppTabId, NavItem> = {
  dashboard: { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  floorplan: { id: 'floorplan', label: 'Floor Maps', icon: Map },
  teammates: { id: 'teammates', label: 'Find People', icon: Users },
  people: { id: 'people', label: 'People & Teams', icon: Users },
  assignments: { id: 'assignments', label: 'Seat Allocation', icon: UserCheck },
  requests: { id: 'requests', label: 'Seat Requests', icon: UserPlus },
  editor: { id: 'editor', label: 'Floor Plan Editor', icon: Edit3 },
  drafts: { id: 'drafts', label: 'Drafts & Versions', icon: Save },
  'change-requests': { id: 'change-requests', label: 'Change Requests', icon: UserPlus },
};

/** Role-specific label overrides (same tab id, clearer job language). */
const LABEL_OVERRIDES: Partial<Record<UserRole, Partial<Record<AppTabId, string>>>> = {
  employee: {
    dashboard: 'Home',
    floorplan: 'Floor Maps',
    teammates: 'Find People',
  },
  hr: {
    dashboard: 'HR Overview',
    people: 'People & Teams',
    assignments: 'Seat Allocation',
    floorplan: 'Floor Maps',
    requests: 'Seat Requests',
  },
  admin: {
    dashboard: 'Admin Overview',
    editor: 'Floor Plan Editor',
    drafts: 'Drafts & Versions',
    'change-requests': 'Change Requests',
    floorplan: 'Published Maps',
  },
};

export function getNavItemsForRole(role: UserRole | null | undefined): NavItem[] {
  const r = role || 'employee';
  const overrides = LABEL_OVERRIDES[r] || {};
  return getAllowedTabs(r).map((id) => ({
    ...ALL_NAV_ITEMS[id],
    label: overrides[id] || ALL_NAV_ITEMS[id].label,
  }));
}

export function getRoleAccessCopy(role: UserRole | null | undefined): {
  roleLabel: string;
  hint: string;
} {
  switch (role) {
    case 'hr':
      return {
        roleLabel: 'HR',
        hint: 'Allocate seats and manage seating requests.',
      };
    case 'admin':
      return {
        roleLabel: 'Admin',
        hint: 'Create, clone, and publish floor plans.',
      };
    default:
      return {
        roleLabel: 'Employee',
        hint: 'View workplace maps and locate colleagues.',
      };
  }
}
