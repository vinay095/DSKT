/** Hosted DeskIt Floor Creator (external app — do not modify that codebase). */
export const DEFAULT_FLOOR_CREATOR_URL = 'https://dskt.vercel.app/';

export function getFloorCreatorUrl(): string {
  const fromEnv = import.meta.env.VITE_FLOOR_CREATOR_URL?.trim();
  return fromEnv || DEFAULT_FLOOR_CREATOR_URL;
}
