import type { FloorObject, Mobility } from '@/types/floorPlan';
import { getRotatedAABB, rectsOverlap } from '@/utils/coordinates';

const BLOCKING: Mobility[] = ['fixed', 'restricted'];

/** Basic AABB collision against fixed/restricted objects. */
export function findCollisions(
  target: FloorObject,
  all: FloorObject[],
): string[] {
  if (target.mobility === 'fixed' || target.mobility === 'restricted') {
    return [];
  }
  // Spaces as open workspaces are soft zones — skip soft space types for hard collision
  const softTypes = new Set([
    'open-workspace',
    'collaboration-area',
    'waiting-area',
    'lounge',
    'rest-area',
  ]);

  const targetBox = getRotatedAABB(target, target.rotation);
  const hits: string[] = [];

  for (const other of all) {
    if (other.id === target.id) continue;
    if (!BLOCKING.includes(other.mobility) && other.layer !== 'infrastructure') {
      continue;
    }
    if (softTypes.has(other.type)) continue;
    // Don't treat chairs/desks as blocking each other for soft warning only on hard obstacles
    if (other.mobility === 'movable') continue;

    const otherBox = getRotatedAABB(other, other.rotation);
    if (rectsOverlap(targetBox, otherBox, -0.05)) {
      hits.push(other.id);
    }
  }
  return hits;
}

export function isOutsideFloor(
  obj: FloorObject,
  floorWidth: number,
  floorHeight: number,
): boolean {
  const box = getRotatedAABB(obj, obj.rotation);
  return (
    box.x < 0 ||
    box.y < 0 ||
    box.x + box.width > floorWidth ||
    box.y + box.height > floorHeight
  );
}
