import { FloorPlan, FloorPlanDraft } from '../types/floorplan';
import { serializeFloorDocument, parseFloorDocument } from './floorDocument';
import { INITIAL_FLOOR_PLAN, MOCK_DRAFTS } from '../data/mockData';
import { getAllFloors } from '../data/floors';
import { DEFAULT_FLOOR_ID } from '../data/offices';

const DRAFT_PREFIX = 'deskit_draft_';
const PUBLISHED_PREFIX = 'deskit_published_';

/**
 * Saves a FloorPlan draft to localStorage (keyed by floor plan id).
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
 * Each floor id is independent — never shares mutable state with another floor.
 */
export function loadPublishedFromStorage(floorId: string): FloorPlan {
  const key = `${PUBLISHED_PREFIX}${floorId}`;
  const data = localStorage.getItem(key);
  if (!data) {
    if (floorId === DEFAULT_FLOOR_ID || floorId === INITIAL_FLOOR_PLAN.id) {
      return { ...INITIAL_FLOOR_PLAN, id: floorId };
    }
    // Empty starter plan for floors without published data yet
    return {
      ...INITIAL_FLOOR_PLAN,
      id: floorId,
      name: getAllFloors().find((f) => f.id === floorId)?.label || `Floor ${floorId}`,
      officeId: getAllFloors().find((f) => f.id === floorId)?.officeId,
      desks: [],
      rooms: [],
      walls: [],
      zones: [],
      unusableRegions: [],
      isPublished: false,
      version: 0,
      lastModified: new Date().toISOString(),
    };
  }
  const parsed = parseFloorDocument(data);
  return parsed || { ...INITIAL_FLOOR_PLAN, id: floorId };
}

/**
 * Returns saved drafts for a floor (local + mock seeds for default floor).
 */
export function getAllSavedDrafts(currentFloorId: string = DEFAULT_FLOOR_ID): FloorPlanDraft[] {
  const drafts: FloorPlanDraft[] =
    currentFloorId === DEFAULT_FLOOR_ID ? [...MOCK_DRAFTS] : [];
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

/** List floor ids that have a published plan in storage. */
export function listPublishedFloorIds(): string[] {
  const ids: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PUBLISHED_PREFIX)) {
        ids.push(key.slice(PUBLISHED_PREFIX.length));
      }
    }
  } catch {
    /* ignore */
  }
  return ids;
}
