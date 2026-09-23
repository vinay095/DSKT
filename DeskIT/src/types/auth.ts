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
}

export type SsoProvider = 'google' | 'microsoft' | 'okta';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  ssoProvider: SsoProvider | null;
}
