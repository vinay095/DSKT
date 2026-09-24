export type UserRole = 'employee' | 'hr' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar: string;
  title: string;
  assignedDeskId?: string;
  floorId?: string;
  /** Optional team for HR color grouping when assigning seats */
  team?: string;
}

export type SsoProvider = 'google' | 'microsoft' | 'okta';

