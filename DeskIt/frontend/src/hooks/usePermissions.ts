import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  assertPermission,
  canAccessTab,
  getAllowedTabs,
  getPermissions,
  hasPermission,
  type AppTabId,
  type Permissions,
} from '../lib/permissions';
import type { UserRole } from '../types/auth';

export interface UsePermissionsResult extends Permissions {
  role: UserRole;
  allowedTabs: readonly AppTabId[];
  canAccessTab: (tab: string) => boolean;
  /** Returns true if the current role may perform the action. */
  guard: (key: keyof Permissions, actionLabel?: string) => boolean;
  has: (key: keyof Permissions) => boolean;
}

export function usePermissions(): UsePermissionsResult {
  const { user } = useAuth();
  const role: UserRole = user?.role || 'employee';

  return useMemo(() => {
    const permissions = getPermissions(role);
    return {
      ...permissions,
      role,
      allowedTabs: getAllowedTabs(role),
      canAccessTab: (tab: string) => canAccessTab(role, tab),
      guard: (key, actionLabel) => assertPermission(role, key, actionLabel),
      has: (key) => hasPermission(role, key),
    };
  }, [role]);
}
