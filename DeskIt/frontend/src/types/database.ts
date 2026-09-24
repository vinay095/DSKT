/**
 * Supabase Database Table Definitions & Schema Types for DeskIT
 */

export type EmployeeStatusColor = 'white' | 'green' | 'yellow' | 'red' | 'blue' | 'orange';

export interface EmployeeStatusMeta {
  color: EmployeeStatusColor;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
}

export const EMPLOYEE_STATUS_CONFIG: Record<EmployeeStatusColor, EmployeeStatusMeta> = {
  white: {
    color: 'white',
    label: 'Not Present',
    badgeBg: 'bg-slate-100 dark:bg-slate-800/60',
    badgeText: 'text-slate-700 dark:text-slate-300',
    badgeBorder: 'border-slate-300 dark:border-slate-700',
    dotColor: 'bg-slate-400',
  },
  green: {
    color: 'green',
    label: 'Present in Office',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-300 dark:border-emerald-800',
    dotColor: 'bg-emerald-500',
  },
  yellow: {
    color: 'yellow',
    label: 'Away from Desk',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-300 dark:border-amber-800',
    dotColor: 'bg-amber-500',
  },
  red: {
    color: 'red',
    label: 'Absent / On Leave',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-300 dark:border-rose-800',
    dotColor: 'bg-rose-500',
  },
  blue: {
    color: 'blue',
    label: 'Work From Home (Approved)',
    badgeBg: 'bg-brandBlue-50 dark:bg-brandBlue-950/40',
    badgeText: 'text-brandBlue-700 dark:text-brandBlue-300',
    badgeBorder: 'border-brandBlue-300 dark:border-brandBlue-800',
    dotColor: 'bg-brandBlue-500',
  },
  orange: {
    color: 'orange',
    label: 'Remote Work',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/40',
    badgeText: 'text-orange-700 dark:text-orange-300',
    badgeBorder: 'border-orange-300 dark:border-orange-800',
    dotColor: 'bg-orange-500',
  },
};

export interface DbEmployee {
  emp_id: string;
  name: string;
  email: string;
  team: string;
  manager: string;
  department: string;
  locations: string[]; // e.g. ['Noida 6th Floor', 'Hyderabad']
  status: EmployeeStatusColor;
  avatar: string;
}

export interface DbElementType {
  element_id: string;
  category: 'desk' | 'room' | 'pillar' | 'amenity' | 'plant';
  element_name: string;
  dimensions: {
    widthFinest: number;
    heightFinest: number;
  };
  associated_ui: {
    icon: string;
    color: string;
    description?: string;
  };
}

export interface DbWorkspace {
  workspace_id: string;
  name: string;
  floor: string; // e.g., "4th Floor", "6th Floor"
  block: string;
  building: string;
  city: string; // e.g., "Noida", "Hyderabad"
  country: string;
  active_floor_map_id: string;
  scale: number; // minimum measuring unit (e.g. 4 world units)
}

export interface DbSeatAssignment {
  assignment_id: string;
  floor_map_id: string;
  desk_code: string;
  emp_id: string;
  assignment_type: 'permanent' | 'temporary';
  is_temporary: boolean;
  start_date?: string; // ISO date string
  end_date?: string;   // ISO date string
  notes?: string;
  status: 'active' | 'expired' | 'revoked';
  assigned_at: string;
}
