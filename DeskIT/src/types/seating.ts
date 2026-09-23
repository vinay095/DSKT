export interface Department {
  id: string;
  name: string;
  color: string;
  headCount: number;
  assignedDesks: number;
}

export interface Team {
  id: string;
  name: string;
  departmentId: string;
  leadName: string;
  memberCount: number;
  zoneId?: string;
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
