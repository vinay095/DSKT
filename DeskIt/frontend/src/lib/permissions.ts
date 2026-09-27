import type { UserRole } from '../types/auth';

/**
 * Centralized DeskIt permission model.
 * Frontend checks are for UX + defense-in-depth; backend remains authoritative when present.
 */
export interface Permissions {
  canViewFloorPlan: boolean;
  canViewEmployeeDetails: boolean;
  canViewPeopleDirectory: boolean;
  canAllocateSeat: boolean;
  canApproveSeatRequest: boolean;
  canSubmitFloorChangeRequest: boolean;
  canManageFloorChangeRequests: boolean;
  canEditFloorPlan: boolean;
  canPublishFloorPlan: boolean;
  canCloneFloorPlan: boolean;
  canManageDrafts: boolean;
  canAccessAdminTools: boolean;
  canAccessHrTools: boolean;
}

const EMPLOYEE_PERMISSIONS: Permissions = {
  canViewFloorPlan: true,
  canViewEmployeeDetails: true,
  canViewPeopleDirectory: false, // lightweight Find People only (Phase 4)
  canAllocateSeat: false,
  canApproveSeatRequest: false,
  canSubmitFloorChangeRequest: false,
  canManageFloorChangeRequests: false,
  canEditFloorPlan: false,
  canPublishFloorPlan: false,
  canCloneFloorPlan: false,
  canManageDrafts: false,
  canAccessAdminTools: false,
  canAccessHrTools: false,
};

const HR_PERMISSIONS: Permissions = {
  canViewFloorPlan: true,
  canViewEmployeeDetails: true,
  canViewPeopleDirectory: true,
  canAllocateSeat: true,
  canApproveSeatRequest: true,
  canSubmitFloorChangeRequest: true,
  canManageFloorChangeRequests: false,
  canEditFloorPlan: false,
  canPublishFloorPlan: false,
  canCloneFloorPlan: false,
  canManageDrafts: false,
  canAccessAdminTools: false,
  canAccessHrTools: true,
};

const ADMIN_PERMISSIONS: Permissions = {
  canViewFloorPlan: true,
  canViewEmployeeDetails: true,
  canViewPeopleDirectory: false,
  canAllocateSeat: false, // routine allocation is HR's job
  canApproveSeatRequest: false,
  canSubmitFloorChangeRequest: false,
  canManageFloorChangeRequests: true,
  canEditFloorPlan: true,
  canPublishFloorPlan: true,
  canCloneFloorPlan: true,
  canManageDrafts: true,
  canAccessAdminTools: true,
  canAccessHrTools: false,
};

const BY_ROLE: Record<UserRole, Permissions> = {
  employee: EMPLOYEE_PERMISSIONS,
  hr: HR_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
};

export function getPermissions(role: UserRole | null | undefined): Permissions {
  return BY_ROLE[role || 'employee'];
}

export function hasPermission(
  role: UserRole | null | undefined,
  key: keyof Permissions,
): boolean {
  return Boolean(getPermissions(role)[key]);
}

/** App tabs used by the shell (no router). */
export type AppTabId =
  | 'dashboard'
  | 'floorplan'
  | 'teammates'
  | 'assignments'
  | 'requests'
  | 'editor'
  | 'drafts'
  | 'change-requests';

const TAB_ACCESS: Record<UserRole, readonly AppTabId[]> = {
  employee: ['dashboard', 'floorplan', 'teammates'],
  hr: ['dashboard', 'assignments', 'floorplan', 'requests'],
  admin: ['dashboard', 'editor', 'drafts', 'change-requests', 'floorplan'],
};

export function getAllowedTabs(role: UserRole | null | undefined): readonly AppTabId[] {
  return TAB_ACCESS[role || 'employee'];
}

export function canAccessTab(
  role: UserRole | null | undefined,
  tab: string,
): boolean {
  return getAllowedTabs(role).includes(tab as AppTabId);
}

export const DEFAULT_TAB: AppTabId = 'dashboard';

/**
 * Guard a mutation. Returns true if allowed.
 * Logs a warning when blocked (demo / frontend defense-in-depth).
 */
export function assertPermission(
  role: UserRole | null | undefined,
  key: keyof Permissions,
  actionLabel?: string,
): boolean {
  const allowed = hasPermission(role, key);
  if (!allowed && typeof console !== 'undefined') {
    console.warn(
      `[DeskIt permissions] Blocked "${actionLabel || key}" for role "${role || 'anonymous'}".`,
    );
  }
  return allowed;
}
