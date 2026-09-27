import type { FloorOption } from '../types/office';
import { OFFICES } from '../data/offices';
import { listDraftFloorIds, listPublishedFloorIds, loadPublishedFromStorage } from './drafts';
import {
  listDraftFloorDocumentIds,
  listPublishedFloorDocumentIds,
} from './publishedFloor';
import { countPendingFloorChangeRequests } from './floorChangeRequests';

export interface FloorPlanRegistryRow {
  floorId: string;
  officeId: string;
  officeName: string;
  floorLabel: string;
  hasLegacyPublished: boolean;
  hasSvgMap: boolean;
  hasSvgDraft: boolean;
  hasDraft: boolean;
  version: number;
  lastModified: string | null;
  isPublished: boolean;
}

export interface AdminOverviewMetrics {
  officeCount: number;
  floorCount: number;
  publishedSvgCount: number;
  publishedLegacyCount: number;
  draftCount: number;
  pendingChangeRequests: number;
  activeFloorVersion: number;
  activeFloorPublished: boolean;
}

/** Cross-floor registry for Admin overview / Published Maps. */
export function buildFloorPlanRegistry(floors: FloorOption[]): FloorPlanRegistryRow[] {
  const draftIds = new Set(listDraftFloorIds());
  const svgIds = new Set(listPublishedFloorDocumentIds());
  const svgDraftIds = new Set(listDraftFloorDocumentIds());
  const legacyIds = new Set(listPublishedFloorIds());

  return floors.map((f) => {
    const plan = loadPublishedFromStorage(f.id);
    const office = OFFICES.find((o) => o.id === f.officeId);
    return {
      floorId: f.id,
      officeId: f.officeId,
      officeName: office?.name || f.officeId,
      floorLabel: f.shortLabel || f.label,
      hasLegacyPublished: legacyIds.has(f.id) || Boolean(plan.isPublished),
      hasSvgMap: svgIds.has(f.id),
      hasSvgDraft: svgDraftIds.has(f.id),
      hasDraft: draftIds.has(f.id) || svgDraftIds.has(f.id),
      version: plan.version ?? 0,
      lastModified: plan.lastModified || null,
      isPublished: Boolean(plan.isPublished) || svgIds.has(f.id),
    };
  });
}

export function getAdminOverviewMetrics(
  floors: FloorOption[],
  activeFloorId: string,
): AdminOverviewMetrics {
  const registry = buildFloorPlanRegistry(floors);
  const active = registry.find((r) => r.floorId === activeFloorId);
  return {
    officeCount: OFFICES.length,
    floorCount: floors.length,
    publishedSvgCount: registry.filter((r) => r.hasSvgMap).length,
    publishedLegacyCount: registry.filter((r) => r.hasLegacyPublished).length,
    draftCount: registry.filter((r) => r.hasDraft).length,
    pendingChangeRequests: countPendingFloorChangeRequests(),
    activeFloorVersion: active?.version ?? 0,
    activeFloorPublished: active?.isPublished ?? false,
  };
}
