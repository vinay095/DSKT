import React, { useState } from 'react';
import { FloorPlan, DeskElement } from '../../types/floorplan';
import { SeatAssignmentRequest } from '../../types/seating';
import { FloorPlanViewer } from '../floorplan/FloorPlanViewer';
import { SeatAssignModal, SeatAssignmentDetails } from '../floorplan/SeatAssignModal';
import { DEPARTMENTS, MOCK_REQUESTS } from '../../data/mockData';
import { saveSeatAssignment } from '../../lib/supabaseClient';
import { StatCard } from '../common/StatCard';
import { User } from '../../types/auth';
import {
  UserCheck,
  Building,
  Clock,
  Layers
} from 'lucide-react';

interface HrDashboardProps {
  floorPlan: FloorPlan;
  searchQuery: string;
  onUpdateDesk: (updatedDesk: DeskElement) => void;
  activeTab?: string;
}

export const HrDashboard: React.FC<HrDashboardProps> = ({
  floorPlan,
  searchQuery,
  onUpdateDesk,
  activeTab = 'dashboard',
}) => {
  const [requests, setRequests] = useState<SeatAssignmentRequest[]>(MOCK_REQUESTS);
  const [selectedDeskForAssign, setSelectedDeskForAssign] = useState<DeskElement | null>(null);

  const totalDesks = floorPlan.desks.length;
  const occupiedDesks = floorPlan.desks.filter((d) => d.status === 'occupied').length;
  const availableDesks = floorPlan.desks.filter((d) => d.status === 'available').length;
  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const handleApproveRequest = (reqId: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'approved' } : r))
    );
  };

  const handleRejectRequest = (reqId: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'rejected' } : r))
    );
  };

  const handleAssignUserToDesk = (deskId: string, targetUser: User, details?: SeatAssignmentDetails) => {
    const targetDesk = floorPlan.desks.find((d) => d.id === deskId);
    if (targetDesk) {
      const updated: DeskElement = {
        ...targetDesk,
        status: 'occupied',
        assignedUserId: targetUser.id,
        assignedUserName: targetUser.name,
        department: targetUser.department,
        team: targetUser.team,
        assignedUserStatus: details?.assignedUserStatus || 'green',
        isTemporary: details?.isTemporary ?? false,
        startDate: details?.startDate,
        endDate: details?.endDate,
        notes: details?.notes,
      };
      onUpdateDesk(updated);

      void saveSeatAssignment({
        floor_map_id: floorPlan.id,
        desk_code: targetDesk.code,
        emp_id: targetUser.id,
        assignment_type: details?.isTemporary ? 'temporary' : 'permanent',
        is_temporary: details?.isTemporary ?? false,
        start_date: details?.startDate,
        end_date: details?.endDate,
        notes: details?.notes,
        status: 'active',
      });
    }
  };

  const handleUnassignDesk = (deskId: string) => {
    const targetDesk = floorPlan.desks.find((d) => d.id === deskId);
    if (targetDesk) {
      const updated: DeskElement = {
        ...targetDesk,
        status: 'available',
        assignedUserId: undefined,
        assignedUserName: undefined,
        assignedUserStatus: undefined,
        department: undefined,
        team: undefined,
        isTemporary: false,
        startDate: undefined,
        endDate: undefined,
        notes: undefined,
      };
      onUpdateDesk(updated);
    }
  };

  const metricsSection = (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Desks Allocated"
        value={`${occupiedDesks} / ${totalDesks}`}
        subtitle={`${totalDesks ? Math.round((occupiedDesks / totalDesks) * 100) : 0}% Capacity Occupied`}
        icon={UserCheck}
        colorScheme="emerald"
      />
      <StatCard
        title="Available Unassigned Desks"
        value={availableDesks}
        subtitle="Ready for new hires or team shifts"
        icon={Building}
        colorScheme="blue"
      />
      <StatCard
        title="Pending HR Requests"
        value={pendingCount}
        subtitle="Seat change & relocation requests"
        icon={Clock}
        colorScheme="amber"
      />
      <StatCard
        title="Active Departments"
        value={DEPARTMENTS.length}
        subtitle="Engineering, Product, HR, Design, Mktg"
        icon={Layers}
        colorScheme="purple"
      />
    </div>
  );

  const requestsSection = (
    <div className="p-5 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-light-text dark:text-dark-text">
            Pending Seat Relocation & Booking Requests
          </h3>
          <p className="text-xs text-light-muted dark:text-dark-muted">
            Approve employee desk allocation requests directly.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300">
          {pendingCount} Pending Review
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requests.map((req) => (
          <div
            key={req.id}
            className="p-4 rounded-xl bg-slate-50 dark:bg-dark-sidebar border border-light-border dark:border-dark-border flex flex-col justify-between space-y-3"
          >
            <div className="flex items-start gap-3">
              <img
                src={req.userAvatar}
                alt={req.userName}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-brandBlue-500/30 dark:ring-brandPurple-500/30"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-light-text dark:text-dark-text">
                    {req.userName}
                  </h4>
                  <span className="text-[10px] font-semibold text-light-muted dark:text-dark-muted">
                    {req.requestDate}
                  </span>
                </div>
                <p className="text-[11px] text-light-muted dark:text-dark-muted">
                  {req.department} • Requesting Desk {req.requestedDeskId}
                </p>
                {req.notes && (
                  <p className="text-xs text-light-text dark:text-dark-text bg-white dark:bg-dark-card p-2 rounded-lg mt-2 border border-light-border dark:border-dark-border">
                    "{req.notes}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-light-border dark:border-dark-border">
              <span className="text-xs font-bold capitalize text-light-text dark:text-dark-text">
                Status: {req.status}
              </span>
              {req.status === 'pending' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRejectRequest(req.id)}
                    className="px-3 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 font-bold text-xs hover:bg-rose-100 transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproveRequest(req.id)}
                    className="px-3.5 py-1 rounded-lg bg-brandBlue-600 hover:bg-brandBlue-700 dark:bg-brandPurple-600 dark:hover:bg-brandPurple-700 text-white font-bold text-xs transition shadow"
                  >
                    Approve Seat
                  </button>
                </div>
              ) : (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Processed
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const allocationMapSection = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-light-text dark:text-dark-text">
            Interactive HR Allocation Floor Map
          </h3>
          <p className="text-xs text-light-muted dark:text-dark-muted">
            Toggle grid on/off, color desks by team, then select a desk and use Assign in the inspector.
          </p>
        </div>
      </div>

      <FloorPlanViewer
        floorPlan={floorPlan}
        searchQuery={searchQuery}
        onAssignClick={(desk) => setSelectedDeskForAssign(desk)}
        hrMode
      />
    </div>
  );

  const seatModal = (
    <SeatAssignModal
      desk={selectedDeskForAssign}
      onClose={() => setSelectedDeskForAssign(null)}
      onAssign={handleAssignUserToDesk}
      onUnassign={handleUnassignDesk}
    />
  );

  if (activeTab === 'assignments') {
    return (
      <div className="space-y-6">
        {allocationMapSection}
        {seatModal}
      </div>
    );
  }

  if (activeTab === 'requests') {
    return <div className="space-y-6">{requestsSection}</div>;
  }

  // dashboard (default): overview metrics + requests + allocation map
  return (
    <div className="space-y-6">
      {metricsSection}
      {requestsSection}
      {allocationMapSection}
      {seatModal}
    </div>
  );
};
