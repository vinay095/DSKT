import { FloorPlan, FloorPlanDraft } from '../types/floorplan';
import { serializeFloorDocument, parseFloorDocument } from './floorDocument';
import { INITIAL_FLOOR_PLAN, MOCK_DRAFTS } from '../data/mockData';

const DRAFT_PREFIX = 'deskit_draft_';
const PUBLISHED_PREFIX = 'deskit_published_';

/**
 * Saves a FloorPlan draft to localStorage.
 */
export function saveDraftToStorage(floorPlan: FloorPlan): FloorPlanDraft {
  const serialized = serializeFloorDocument(floorPlan);
  const key = `${DRAFT_PREFIX}${floorPlan.id}`;
  localStorage.setItem(key, serialized);

  const draft: FloorPlanDraft = {
    id: `draft-${Date.now()}`,
    floorPlanId: floorPlan.id,
    name: `${floorPlan.name} (Draft ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
    updatedAt: new Date().toISOString(),
    data: floorPlan,
  };

  return draft;
}

/**
 * Loads a FloorPlan draft from localStorage by floor ID.
 */
export function loadDraftFromStorage(floorId: string): FloorPlan | null {
  const key = `${DRAFT_PREFIX}${floorId}`;
  const data = localStorage.getItem(key);
  if (!data) return null;
  return parseFloorDocument(data);
}

/**
 * Saves a published FloorPlan to localStorage (making it live for Employee & HR views).
 */
export function savePublishedToStorage(floorPlan: FloorPlan): void {
  const publishedPlan: FloorPlan = {
    ...floorPlan,
    isPublished: true,
    lastModified: new Date().toISOString(),
  };
  const serialized = serializeFloorDocument(publishedPlan);
  const key = `${PUBLISHED_PREFIX}${floorPlan.id}`;
  localStorage.setItem(key, serialized);
}

/**
 * Loads the published FloorPlan from localStorage for Employee & HR views.
 */
export function loadPublishedFromStorage(floorId: string): FloorPlan {
  const key = `${PUBLISHED_PREFIX}${floorId}`;
  const data = localStorage.getItem(key);
  if (!data) return INITIAL_FLOOR_PLAN;
  const parsed = parseFloorDocument(data);
  return parsed || INITIAL_FLOOR_PLAN;
}

/**
 * Returns all saved drafts from localStorage and mock drafts.
 */
export function getAllSavedDrafts(currentFloorId: string = 'floor-4'): FloorPlanDraft[] {
  const drafts: FloorPlanDraft[] = [...MOCK_DRAFTS];
  const localDraft = loadDraftFromStorage(currentFloorId);

  if (localDraft) {
    drafts.unshift({
      id: `local-draft-${currentFloorId}`,
      floorPlanId: currentFloorId,
      name: `Latest Local Draft (${new Date(localDraft.lastModified).toLocaleTimeString()})`,
      updatedAt: localDraft.lastModified,
      data: localDraft,
    });
  }

  return drafts;
}
