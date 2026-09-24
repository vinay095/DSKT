import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DbEmployee, DbWorkspace, DbElementType, DbSeatAssignment } from '../types/database';
import { MOCK_999_EMPLOYEES } from '../data/employeesData';
import { CATALOG_ITEMS } from './catalog';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface SeatAssignmentResult {
  success: boolean;
  data?: unknown;
  error?: unknown;
}

function catalogCategoryToDb(
  subcategory: (typeof CATALOG_ITEMS)[number]['subcategory']
): DbElementType['category'] {
  if (subcategory === 'desk' || subcategory === 'room' || subcategory === 'plant' || subcategory === 'amenity') {
    return subcategory;
  }
  if (subcategory === 'infrastructure') return 'pillar';
  return 'amenity';
}

/**
 * Helper to fetch all employees (from Supabase or local mock dataset fallback)
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
 * Helper to fetch element types catalog (Supabase or local CATALOG_ITEMS fallback)
 */
export async function fetchElementTypes(): Promise<DbElementType[]> {
  if (!supabase) {
    return CATALOG_ITEMS.map((item) => ({
      element_id: item.id,
      category: catalogCategoryToDb(item.subcategory),
      element_name: item.name,
      dimensions: {
        widthFinest: item.widthFinestCells,
        heightFinest: item.heightFinestCells,
      },
      associated_ui: {
        icon: item.iconName,
        color: item.color,
        description: item.description,
      },
    }));
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
export async function saveSeatAssignment(
  assignment: Omit<DbSeatAssignment, 'assignment_id' | 'assigned_at'>
): Promise<SeatAssignmentResult> {
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
