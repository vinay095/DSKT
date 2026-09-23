import React, { useState } from 'react';
import { FloorPlan, DeskElement } from '../../types/floorplan';
import { SeatAssignmentRequest } from '../../types/seating';
import { FloorPlanViewer } from '../floorplan/FloorPlanViewer';
import { SeatAssignModal } from '../floorplan/SeatAssignModal';
import { DEPARTMENTS, MOCK_REQUESTS } from '../../data/mockData';
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
}) => {
  const [requests, setRequests] = useState<SeatAssignmentRequest[]>(MOCK_REQUESTS);
  const [selectedDeskForAssign, setSelectedDeskForAssign] = useState<DeskElement | null>(null);

  const totalDesks = floorPlan.desks.length;
  const occupiedDesks = floorPlan.desks.filter((d) => d.status === 'occupied').length;
  const availableDesks = floorPlan.desks.filter((d) => d.status === 'available').length;

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

  const handleAssignUserToDesk = (deskId: string, targetUser: User) => {
    const targetDesk = floorPlan.desks.find((d) => d.id === deskId);
    if (targetDesk) {
      const updated: DeskElement = {
        ...targetDesk,
        status: 'occupied',
        assignedUserId: targetUser.id,
        assignedUserName: targetUser.name,
        department: targetUser.department,
      };
      onUpdateDesk(updated);
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
      };
      onUpdateDesk(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top HR Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Desks Allocated"
          value={`${occupiedDesks} / ${totalDesks}`}
          subtitle={`${Math.round((occupiedDesks / totalDesks) * 100)}% Capacity Occupied`}
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
          value={requests.filter((r) => r.status === 'pending').length}
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

      {/* Pending Seat Requests Queue */}
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
            {requests.filter((r) => r.status === 'pending').length} Pending Review
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
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30"
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
                <span className="text-xs font-bold capitalize text-slate-700 dark:text-slate-300">
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
                      className="px-3.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow"
                    >
                      Approve Seat
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Processed ✓
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive HR Seat Allocation Floor Viewer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-light-text dark:text-dark-text">
              Interactive HR Allocation Floor Map
            </h3>
            <p className="text-xs text-light-muted dark:text-dark-muted">
              Click any desk on the floor map to assign or reassign employees.
            </p>
          </div>
        </div>

        <FloorPlanViewer
          floorPlan={floorPlan}
          searchQuery={searchQuery}
          onAssignClick={(desk) => setSelectedDeskForAssign(desk)}
        />
      </div>

      {/* Seat Assignment Modal */}
      <SeatAssignModal
        desk={selectedDeskForAssign}
        onClose={() => setSelectedDeskForAssign(null)}
        onAssign={handleAssignUserToDesk}
        onUnassign={handleUnassignDesk}
      />
    </div>
  );
};
