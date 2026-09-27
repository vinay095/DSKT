import type { DeskElement } from '../types/floorplan';

export interface TeamOccupancyRow {
  team: string;
  count: number;
}

export interface FloorOccupancySummary {
  totalDesks: number;
  occupied: number;
  available: number;
  reserved: number;
  maintenance: number;
  occupancyPercent: number;
  teams: TeamOccupancyRow[];
}

/** Aggregate seat occupancy for inspector empty-state / HR context. */
export function summarizeFloorOccupancy(desks: DeskElement[]): FloorOccupancySummary {
  let occupied = 0;
  let available = 0;
  let reserved = 0;
  let maintenance = 0;
  const teamCounts = new Map<string, number>();

  for (const d of desks) {
    switch (d.status) {
      case 'occupied':
        occupied += 1;
        if (d.team) teamCounts.set(d.team, (teamCounts.get(d.team) || 0) + 1);
        break;
      case 'available':
        available += 1;
        break;
      case 'reserved':
        reserved += 1;
        break;
      case 'maintenance':
        maintenance += 1;
        break;
      default:
        break;
    }
  }

  const totalDesks = desks.length;
  const teams = [...teamCounts.entries()]
    .map(([team, count]) => ({ team, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalDesks,
    occupied,
    available,
    reserved,
    maintenance,
    occupancyPercent: totalDesks
      ? Math.round((occupied / totalDesks) * 100)
      : 0,
    teams,
  };
}

/** Compact equipment list from desk flags (progressive disclosure base). */
export function deskEquipmentList(desk: DeskElement): string[] {
  const items: string[] = [];
  if (desk.hasMonitor) items.push('Monitor');
  if (desk.isStandingDesk) items.push('Standing desk');
  if (desk.hasMonitor) items.push('Docking station');
  if (!items.length) items.push('Standard workstation');
  return items;
}
