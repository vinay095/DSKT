import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DbEmployee, DbWorkspace, DbElementType, DbSeatAssignment } from '../types/database';
import { MOCK_999_EMPLOYEES } from '../data/employeesData';

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Helper to fetch all employees (from Supabase or local 999 mock dataset fallback)
 */
export async function fetchEmployees(): Promise<DbEmployee[]> {
  if (!supabase) {
    return MOCK_999_EMPLOYEES;
  }

  try {
    const { data, error } = await supabase.from('employees').select('*');
    if (error || !data) {
      console.warn('Supabase query failed, using local mock employees:', error);
      return MOCK_999_EMPLOYEES;
    }
    return data as DbEmployee[];
  } catch (err) {
    console.warn('Supabase fetch error, returning local dataset:', err);
    return MOCK_999_EMPLOYEES;
  }
}

/**
 * Helper to fetch workspaces
 */
export async function fetchWorkspaces(): Promise<DbWorkspace[]> {
  if (!supabase) {
    return [
      {
        workspace_id: 'ws-noida-6',
        name: 'Noida Tech Tower - Floor 6',
        floor: '6th Floor',
        block: 'Block A',
        building: 'Tower 1',
        city: 'Noida',
        country: 'India',
        active_floor_map_id: 'map-noida-6a',
        scale: 4,
      },
      {
        workspace_id: 'ws-noida-4',
        name: 'Noida Tech Tower - Floor 4',
        floor: '4th Floor',
        block: 'Block B',
        building: 'Tower 1',
        city: 'Noida',
        country: 'India',
        active_floor_map_id: 'map-noida-4a',
        scale: 4,
      },
      {
        workspace_id: 'ws-hyd',
        name: 'Hyderabad Cyber Hub',
        floor: '2nd Floor',
        block: 'Wing C',
        building: 'Building 3',
        city: 'Hyderabad',
        country: 'India',
        active_floor_map_id: 'map-hyd-2a',
        scale: 4,
      },
    ];
  }

  try {
    const { data, error } = await supabase.from('workspaces').select('*');
    if (error || !data) return [];
    return data as DbWorkspace[];
  } catch {
    return [];
  }
}

/**
 * Helper to fetch element types catalog
 */
export async function fetchElementTypes(): Promise<DbElementType[]> {
  if (!supabase) {
    return [
      {
        element_id: 'elem-desk-single',
        category: 'desk',
        element_name: 'Standard Workstation Desk',
        dimensions: { widthFinest: 8, heightFinest: 6 },
        associated_ui: { icon: 'Monitor', color: '#3B82F6', description: 'Single monitor desk' },
      },
      {
        element_id: 'elem-desk-standing',
        category: 'desk',
        element_name: 'Motorized Standing Desk',
        dimensions: { widthFinest: 8, heightFinest: 6 },
        associated_ui: { icon: 'Sparkles', color: '#8B5CF6', description: 'Standing desk with dual monitors' },
      },
    ];
  }

  try {
    const { data, error } = await supabase.from('element_types').select('*');
    if (error || !data) return [];
    return data as DbElementType[];
  } catch {
    return [];
  }
}

/**
 * Save or insert seat assignment (Permanent or Temporary)
 */
export async function saveSeatAssignment(assignment: Omit<DbSeatAssignment, 'assignment_id' | 'assigned_at'>) {
  if (!supabase) {
    console.log('[Mock DB] Saved Seat Assignment:', assignment);
    return { success: true, data: assignment };
  }

  try {
    const { data, error } = await supabase.from('seat_assignments').insert([assignment]).select();
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error saving seat assignment to Supabase:', err);
    return { success: false, error: err };
  }
}
