import type { FloorDocument } from './drafts';
import { normalizeDocument } from './drafts';

/** Shared key so DeskIt frontend can read Admin-published creator maps */
export const DESKIT_PUBLISHED_FLOOR_DOC_KEY = 'deskit_published_floor_document_v2';

export const DESKIT_PUBLISH_EVENT = 'deskit:floor-document-published';
export const DESKIT_CREATOR_READY_EVENT = 'deskit:creator-ready';
export const DESKIT_LOAD_DOCUMENT_EVENT = 'deskit:load-floor-document';
export const DESKIT_REQUEST_DOCUMENT_EVENT = 'deskit:request-floor-document';

export interface PublishResult {
  ok: boolean;
  message: string;
}

export interface CreatorFloorContext {
  floorId?: string;
  officeId?: string;
}

/** Per-floor Creator document key (independent maps per office/floor). */
export function publishedFloorDocKey(floorId: string): string {
  return `${DESKIT_PUBLISHED_FLOOR_DOC_KEY}__${floorId}`;
}

/** Read floorId / officeId from the Creator URL query (set by DeskIt iframe src). */
export function getCreatorContextFromUrl(): CreatorFloorContext {
  try {
    const params = new URLSearchParams(window.location.search);
    const floorId = params.get('floorId')?.trim() || undefined;
    const officeId = params.get('officeId')?.trim() || undefined;
    return { floorId, officeId };
  } catch {
    return {};
  }
}

/**
 * Persist the FloorDocument for DeskIt (HR / published viewer) and notify parent iframe.
 * When floorId is known, also writes the per-floor scoped key so reopening that floor restores it.
 */
export function publishFloorDocument(
  raw: FloorDocument,
  ctx?: CreatorFloorContext,
): PublishResult {
  try {
    const doc = normalizeDocument({
      ...raw,
      savedAt: new Date().toISOString(),
      name: raw.name || 'Published Floor',
    });
    const payload = JSON.stringify(doc);
    localStorage.setItem(DESKIT_PUBLISHED_FLOOR_DOC_KEY, payload);
    if (ctx?.floorId) {
      localStorage.setItem(publishedFloorDocKey(ctx.floorId), payload);
    }

    // Notify same-window listeners (if any), parent DeskIt shell, and opener (popup mode)
    window.dispatchEvent(new CustomEvent(DESKIT_PUBLISH_EVENT, { detail: doc }));
    const notify = (target: Window | null) => {
      if (!target || target === window) return;
      try {
        if (target.closed) return;
      } catch {
        /* ignore */
      }
      try {
        target.postMessage(
          {
            type: DESKIT_PUBLISH_EVENT,
            document: doc,
            floorId: ctx?.floorId,
            officeId: ctx?.officeId,
          },
          '*',
        );
      } catch {
        /* ignore */
      }
    };
    notify(window.parent);
    try {
      notify(window.opener);
    } catch {
      /* ignore */
    }

    return { ok: true, message: 'Published to DeskIt' };
  } catch (err) {
    console.error(err);
    return { ok: false, message: 'Publish failed' };
  }
}

/**
 * Load Creator FloorDocument for a specific floor from Creator-origin localStorage.
 * Falls back to legacy global key.
 */
export function loadPublishedFloorDocument(floorId?: string): FloorDocument | null {
  try {
    if (floorId) {
      const keyed = localStorage.getItem(publishedFloorDocKey(floorId));
      if (keyed) {
        return normalizeDocument(JSON.parse(keyed) as FloorDocument);
      }
    }
    const raw = localStorage.getItem(DESKIT_PUBLISHED_FLOOR_DOC_KEY);
    if (!raw) return null;
    const global = normalizeDocument(JSON.parse(raw) as FloorDocument);
    if (global && floorId) {
      // One-time migrate: associate legacy global publish with this floor
      localStorage.setItem(publishedFloorDocKey(floorId), JSON.stringify(global));
    }
    return global;
  } catch {
    return null;
  }
}
