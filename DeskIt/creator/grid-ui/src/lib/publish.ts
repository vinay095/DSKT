import type { FloorDocument } from './drafts';
import { normalizeDocument } from './drafts';

/** Shared key so DeskIt frontend can read Admin-published creator maps */
export const DESKIT_PUBLISHED_FLOOR_DOC_KEY = 'deskit_published_floor_document_v2';

export const DESKIT_PUBLISH_EVENT = 'deskit:floor-document-published';

export interface PublishResult {
  ok: boolean;
  message: string;
}

/**
 * Persist the FloorDocument for DeskIt (HR / published viewer) and notify parent iframe.
 */
export function publishFloorDocument(raw: FloorDocument): PublishResult {
  try {
    const doc = normalizeDocument({
      ...raw,
      savedAt: new Date().toISOString(),
      name: raw.name || 'Published Floor',
    });
    const payload = JSON.stringify(doc);
    localStorage.setItem(DESKIT_PUBLISHED_FLOOR_DOC_KEY, payload);

    // Notify same-window listeners (if any) and parent DeskIt shell
    window.dispatchEvent(new CustomEvent(DESKIT_PUBLISH_EVENT, { detail: doc }));
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        { type: DESKIT_PUBLISH_EVENT, document: doc },
        '*',
      );
    }

    return { ok: true, message: 'Published to DeskIt' };
  } catch (err) {
    console.error(err);
    return { ok: false, message: 'Publish failed' };
  }
}

export function loadPublishedFloorDocument(): FloorDocument | null {
  try {
    const raw = localStorage.getItem(DESKIT_PUBLISHED_FLOOR_DOC_KEY);
    if (!raw) return null;
    return normalizeDocument(JSON.parse(raw) as FloorDocument);
  } catch {
    return null;
  }
}
