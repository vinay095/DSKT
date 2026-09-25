export interface Department {
  id: string;
  name: string;
  color: string;
  headCount: number;
  assignedDesks: number;
}

export interface SeatAssignmentRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  department: string;
  requestedDeskId?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  notes?: string;
}

/** HR → Admin request to change the published floor design (not direct edit). */
export interface FloorChangeRequest {
  id: string;
  createdAt: string;
  requestedBy: string;
  requestType: 'add' | 'remove' | 'modify';
  elementDescription: string;
  details: string;
  status: 'pending' | 'acknowledged' | 'done' | 'rejected';
  floorId?: string;
}


