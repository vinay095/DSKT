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

