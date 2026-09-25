import { FloorChangeRequest } from '../types/seating';

const STORAGE_KEY = 'deskit_floor_change_requests_v1';

export function listFloorChangeRequests(): FloorChangeRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FloorChangeRequest[];
  } catch {
    return [];
  }
}

export function saveFloorChangeRequest(
  input: Omit<FloorChangeRequest, 'id' | 'createdAt' | 'status'>,
): FloorChangeRequest {
  const req: FloorChangeRequest = {
    ...input,
    id: `fcr-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  const all = [req, ...listFloorChangeRequests()];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 100)));
  return req;
}

export function updateFloorChangeRequestStatus(
  id: string,
  status: FloorChangeRequest['status'],
): void {
  const all = listFloorChangeRequests().map((r) => (r.id === id ? { ...r, status } : r));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
