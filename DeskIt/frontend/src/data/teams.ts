import { Department } from '../types/seating';

export interface Team {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  color: string;
}

/** Stable team palette — assignment/ownership indicators only (PART 15).
 * Do not use these colors as element/category fills — those live in categoryStyles.
 */
export const TEAMS: Team[] = [
  { id: 'team-fe', name: 'Frontend Core', departmentId: 'dept-eng', departmentName: 'Engineering', color: '#3B82F6' },
  { id: 'team-be', name: 'Backend Services', departmentId: 'dept-eng', departmentName: 'Engineering', color: '#2563EB' },
  { id: 'team-devops', name: 'DevOps & Infra', departmentId: 'dept-eng', departmentName: 'Engineering', color: '#0EA5E9' },
  { id: 'team-qa', name: 'QA Automation', departmentId: 'dept-eng', departmentName: 'Engineering', color: '#06B6D4' },
  { id: 'team-mobile', name: 'Mobile Apps', departmentId: 'dept-eng', departmentName: 'Engineering', color: '#6366F1' },
  { id: 'team-ux', name: 'Core UX/UI', departmentId: 'dept-prod', departmentName: 'Product', color: '#8B5CF6' },
  { id: 'team-analytics', name: 'Product Analytics', departmentId: 'dept-prod', departmentName: 'Product', color: '#A855F7' },
  { id: 'team-roadmap', name: 'Platform Roadmap', departmentId: 'dept-prod', departmentName: 'Product', color: '#C084FC' },
  { id: 'team-brand', name: 'Brand Systems', departmentId: 'dept-design', departmentName: 'Design', color: '#EC4899' },
  { id: 'team-pd', name: 'Product Design', departmentId: 'dept-design', departmentName: 'Design', color: '#F472B6' },
  { id: 'team-research', name: 'Research', departmentId: 'dept-design', departmentName: 'Design', color: '#DB2777' },
  { id: 'team-workplace', name: 'Workplace Ops', departmentId: 'dept-hr', departmentName: 'People & Culture', color: '#10B981' },
  { id: 'team-ta', name: 'Talent Acquisition', departmentId: 'dept-hr', departmentName: 'People & Culture', color: '#34D399' },
  { id: 'team-hrbp', name: 'HRBP', departmentId: 'dept-hr', departmentName: 'People & Culture', color: '#059669' },
  { id: 'team-growth', name: 'Growth & SEO', departmentId: 'dept-mktg', departmentName: 'Marketing', color: '#F59E0B' },
  { id: 'team-content', name: 'Content Strategy', departmentId: 'dept-mktg', departmentName: 'Marketing', color: '#FBBF24' },
  { id: 'team-events', name: 'Event Ops', departmentId: 'dept-mktg', departmentName: 'Marketing', color: '#D97706' },
];

const TEAM_BY_NAME = new Map(TEAMS.map((t) => [t.name, t]));

export function getTeamByName(name?: string): Team | undefined {
  if (!name) return undefined;
  return TEAM_BY_NAME.get(name);
}

export function getTeamColor(name?: string, fallback = '#94A3B8'): string {
  return getTeamByName(name)?.color ?? fallback;
}

export function getTeamsForDepartment(departmentName: string): Team[] {
  return TEAMS.filter((t) => t.departmentName === departmentName);
}

/** Resolve a sensible default team for a department (first team in that dept). */
export function defaultTeamForDepartment(departmentName?: string): Team | undefined {
  if (!departmentName) return undefined;
  return TEAMS.find((t) => t.departmentName === departmentName);
}

export function departmentColor(departments: Department[], name?: string, fallback = '#94A3B8'): string {
  if (!name) return fallback;
  return departments.find((d) => d.name === name)?.color ?? fallback;
}
