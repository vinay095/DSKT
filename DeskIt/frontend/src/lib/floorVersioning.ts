import type { FloorPlan } from '../types/floorplan';
import { loadDraftFromStorage } from './drafts';
import {
  loadDraftFloorDocument,
  loadPublishedFloorDocument,
} from './publishedFloor';

export type FloorReleaseState = 'live' | 'draft' | 'unpublished';

export interface FloorVersionSummary {
  state: FloorReleaseState;
  /** Published desk-layout version (0 if never published). */
  liveVersion: number;
  hasDeskDraft: boolean;
  hasSvgLive: boolean;
  hasSvgDraft: boolean;
  lastModified: string | null;
  draftUpdatedAt: string | null;
  label: string;
  detail: string;
}

export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString([], {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/** Human-readable draft vs live status for admin chrome. */
export function getFloorVersionSummary(
  floorId: string,
  publishedPlan: FloorPlan,
): FloorVersionSummary {
  const deskDraft = loadDraftFromStorage(floorId);
  const svgLive = loadPublishedFloorDocument(floorId);
  const svgDraft = loadDraftFloorDocument(floorId);
  const liveVersion = publishedPlan.isPublished ? publishedPlan.version ?? 1 : 0;
  const hasDeskDraft = Boolean(deskDraft);
  const hasSvgLive = Boolean(svgLive);
  const hasSvgDraft = Boolean(svgDraft);

  let state: FloorReleaseState = 'unpublished';
  if (publishedPlan.isPublished || hasSvgLive) state = 'live';
  else if (hasDeskDraft || hasSvgDraft) state = 'draft';

  let label = 'Unpublished';
  if (state === 'live') label = `Live v${Math.max(liveVersion, 1)}`;
  else if (state === 'draft') label = 'Draft';

  const parts: string[] = [];
  if (hasSvgLive) parts.push('SVG live');
  else if (hasSvgDraft) parts.push('SVG draft');
  else parts.push('No SVG map');
  if (hasDeskDraft) parts.push('desk draft saved');
  if (publishedPlan.isPublished) parts.push(`desk layout v${liveVersion}`);

  return {
    state,
    liveVersion,
    hasDeskDraft,
    hasSvgLive,
    hasSvgDraft,
    lastModified: publishedPlan.lastModified || null,
    draftUpdatedAt: deskDraft?.lastModified || svgDraft?.savedAt || null,
    label,
    detail: parts.join(' · '),
  };
}
