/** Local Creator Vite app — must run separately from DeskIt frontend. */
export const LOCAL_CREATOR_URL = 'http://localhost:5174/';
export const HOSTED_FLOOR_CREATOR_URL = 'https://dskt.vercel.app/';

/** @deprecated Prefer LOCAL_CREATOR_URL — relative /creator/ can recurse into DeskIt itself. */
export const DEFAULT_FLOOR_CREATOR_URL = LOCAL_CREATOR_URL;

export const DESKIT_PUBLISHED_FLOOR_DOC_KEY = 'deskit_published_floor_document_v2';
export const DESKIT_PUBLISH_EVENT = 'deskit:floor-document-published';
export const DESKIT_CREATOR_READY_EVENT = 'deskit:creator-ready';

export function getFloorCreatorUrl(opts?: {
  floorId?: string;
  officeId?: string;
}): string {
  const fromEnv = import.meta.env.VITE_FLOOR_CREATOR_URL?.trim();
  const base = fromEnv
    ? fromEnv.endsWith('/')
      ? fromEnv
      : `${fromEnv}/`
    : LOCAL_CREATOR_URL;
  if (!opts?.floorId && !opts?.officeId) return base;
  const url = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  if (opts.floorId) url.searchParams.set('floorId', opts.floorId);
  if (opts.officeId) url.searchParams.set('officeId', opts.officeId);
  return url.toString();
}

/**
 * True when the iframe URL would load this same DeskIt origin (causes nested dashboard bug).
 */
export function isCreatorUrlSameOriginAsDeskIt(creatorUrl: string): boolean {
  try {
    const target = new URL(creatorUrl, window.location.origin);
    return target.origin === window.location.origin;
  } catch {
    return true;
  }
}
