import React, { useEffect, useState } from 'react';
import { FloorPlan, DeskElement } from '../../types/floorplan';
import { FloorDocumentV2 } from '../../types/floorDocument';
import { SeatAssignmentRequest } from '../../types/seating';
import { FloorPlanViewer } from '../floorplan/FloorPlanViewer';
import { PublishedFloorMap, MapElementSelection } from '../floorplan/PublishedFloorMap';
import { PropertiesPanel } from '../floorplan/PropertiesPanel';
import { SeatAssignModal, SeatAssignmentDetails } from '../floorplan/SeatAssignModal';
import { DEPARTMENTS, MOCK_REQUESTS } from '../../data/mockData';
import { saveSeatAssignment } from '../../lib/supabaseClient';
import { saveFloorChangeRequest } from '../../lib/floorChangeRequests';
import { StatCard } from '../common/StatCard';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types/auth';
import {
  UserCheck,
  Building,
  Clock,
  Layers,
  MessageSquarePlus,
} from 'lucide-react';
import { ColorHierarchyLegend } from '../common/ColorHierarchyLegend';
import { PageHeader } from '../common/PageHeader';

interface HrDashboardProps {
  floorPlan: FloorPlan;
  searchQuery: string;
  onUpdateDesk: (updatedDesk: DeskElement) => void;
  activeTab?: string;
  publishedDocument?: FloorDocumentV2 | null;
}

export const HrDashboard: React.FC<HrDashboardProps> = ({
  floorPlan,
  searchQuery,
  onUpdateDesk,
  activeTab = 'dashboard',
  publishedDocument = null,
}) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SeatAssignmentRequest[]>(MOCK_REQUESTS);
  const [selectedDeskForAssign, setSelectedDeskForAssign] = useState<DeskElement | null>(null);
  const [inspectedDesk, setInspectedDesk] = useState<DeskElement | null>(null);
  const [inspectedMapElement, setInspectedMapElement] = useState<MapElementSelection | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [changeType, setChangeType] = useState<'add' | 'remove' | 'modify'>('add');
  const [changeElement, setChangeElement] = useState('');
  const [changeDetails, setChangeDetails] = useState('');
  const [changeMsg, setChangeMsg] = useState<string | null>(null);

  // Keep inspector in sync with live desk assignment state (without removing model data).
  useEffect(() => {
    if (!inspectedDesk) return;
    const latest = floorPlan.desks.find((d) => d.id === inspectedDesk.id) ?? null;
    setInspectedDesk(latest);
  }, [floorPlan.desks, inspectedDesk?.id]);

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
    const targetDesk = floorPlan.desks.find((d) => d.id === deskId) || inspectedDesk;
    if (targetDesk && targetDesk.id === deskId) {
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
      setInspectedDesk(updated);
      setSelectedDeskForAssign(null);

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
        assignedUserAvatar: undefined,
        assignedUserStatus: undefined,
        department: undefined,
        team: undefined,
        isTemporary: undefined,
        startDate: undefined,
        endDate: undefined,
        notes: undefined,
      };
      onUpdateDesk(updated);
      setInspectedDesk(updated);
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

  const clearInspector = () => {
    setInspectedDesk(null);
    setInspectedMapElement(null);
  };

  const selectDesk = (desk: DeskElement) => {
    setInspectedMapElement(null);
    // Ensure desk exists in plan so assign/unassign can persist
    if (!floorPlan.desks.some((d) => d.id === desk.id)) {
      onUpdateDesk(desk);
    }
    setInspectedDesk(desk);
  };

  const selectMapElement = (el: MapElementSelection) => {
    setInspectedDesk(null);
    setInspectedMapElement(el);
  };

  const allocationMapSection = (
    <div className="space-y-3">
      <div className="flex justify-end shrink-0">
        <ColorHierarchyLegend compact />
      </div>

      {publishedDocument ? (
        <div className="flex flex-col lg:flex-row gap-4">
          <PublishedFloorMap
            document={publishedDocument}
            desks={floorPlan.desks}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid((v) => !v)}
            onDeskClick={selectDesk}
            onEntityClick={selectMapElement}
            onBackgroundClick={clearInspector}
            selectedDeskId={inspectedDesk?.id}
            selectedEntityId={inspectedMapElement?.objectId}
            searchQuery={searchQuery}
            showTeamMarkers
            compactChrome
            hideFooterLegend
            showMapLabels={false}
            className="flex-1 min-h-[min(50vh,480px)] max-h-[min(62vh,640px)] h-[min(55vh,560px)]"
          />
          <PropertiesPanel
            selectedDesk={inspectedDesk}
            selectedMapElement={inspectedMapElement}
            role="hr"
            onClose={clearInspector}
            onAssignClick={(desk) => setSelectedDeskForAssign(desk)}
            floorContext={{
              building: floorPlan.building,
              floorName: floorPlan.name,
            }}
          />
        </div>
      ) : (
        <div className="min-h-[min(50vh,480px)]">
          <FloorPlanViewer
            floorPlan={floorPlan}
            searchQuery={searchQuery}
            onAssignClick={(desk) => setSelectedDeskForAssign(desk)}
            hrMode
          />
        </div>
      )}
    </div>
  );

  /** Floor Map Viewer tab — map + inspector only (no requests / change form). */
  const floorMapOnlySection = (
    <div className="space-y-3 flex-1 min-h-0 flex flex-col">
      <PageHeader
        title="Floor map"
        description="View seats and floor elements. Click anything for details in the inspector. Use Seat Allocations to assign people or request layout changes."
        actions={<ColorHierarchyLegend compact />}
      />
      {publishedDocument ? (
        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-[min(65vh,600px)]">
          <PublishedFloorMap
            document={publishedDocument}
            desks={floorPlan.desks}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid((v) => !v)}
            onDeskClick={selectDesk}
            onEntityClick={selectMapElement}
            onBackgroundClick={clearInspector}
            selectedDeskId={inspectedDesk?.id}
            selectedEntityId={inspectedMapElement?.objectId}
            searchQuery={searchQuery}
            showTeamMarkers
            compactChrome
            hideFooterLegend
            showMapLabels={false}
            className="flex-1 min-h-[min(55vh,520px)] h-[min(68vh,700px)]"
          />
          <PropertiesPanel
            selectedDesk={inspectedDesk}
            selectedMapElement={inspectedMapElement}
            role="hr"
            onClose={clearInspector}
            onAssignClick={(desk) => setSelectedDeskForAssign(desk)}
            floorContext={{
              building: floorPlan.building,
              floorName: floorPlan.name,
            }}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-[min(60vh,560px)]">
          <FloorPlanViewer
            floorPlan={floorPlan}
            searchQuery={searchQuery}
            onAssignClick={(desk) => setSelectedDeskForAssign(desk)}
            hrMode
          />
        </div>
      )}
    </div>
  );

  const changeRequestSection = (
    <div className="p-5 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-brandBlue-50 dark:bg-brandPurple-950/40">
          <MessageSquarePlus className="w-5 h-5 text-brandBlue-600 dark:text-brandPurple-400" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-light-text dark:text-dark-text">
            Request Floor Map Change
          </h3>
          <p className="text-xs text-light-muted dark:text-dark-muted">
            Ask Admin to add, remove, or modify elements. You cannot edit the published design directly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="text-xs font-semibold text-light-muted dark:text-dark-muted space-y-1">
          Request type
          <select
            value={changeType}
            onChange={(e) => setChangeType(e.target.value as 'add' | 'remove' | 'modify')}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-sidebar text-xs"
          >
            <option value="add">Add element</option>
            <option value="remove">Remove element</option>
            <option value="modify">Modify element</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-light-muted dark:text-dark-muted space-y-1 md:col-span-2">
          Element / area
          <input
            value={changeElement}
            onChange={(e) => setChangeElement(e.target.value)}
            placeholder="e.g. Add 4 desks near Engineering zone"
            className="w-full mt-1 px-3 py-2 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-sidebar text-xs"
          />
        </label>
      </div>
      <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted space-y-1">
        Details
        <textarea
          value={changeDetails}
          onChange={(e) => setChangeDetails(e.target.value)}
          rows={3}
          placeholder="Describe the change for Admin…"
          className="w-full mt-1 px-3 py-2 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-sidebar text-xs"
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-brandBlue-600 hover:bg-brandBlue-700 dark:bg-brandPurple-600 dark:hover:bg-brandPurple-700 text-white"
          onClick={() => {
            if (!changeElement.trim() || !changeDetails.trim()) {
              setChangeMsg('Please fill element and details.');
              return;
            }
            saveFloorChangeRequest({
              requestedBy: user?.name || 'HR',
              requestType: changeType,
              elementDescription: changeElement.trim(),
              details: changeDetails.trim(),
              floorId: floorPlan.id,
            });
            setChangeElement('');
            setChangeDetails('');
            setChangeMsg('Request submitted to Admin.');
            window.setTimeout(() => setChangeMsg(null), 3000);
          }}
        >
          Submit request
        </button>
        {changeMsg && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{changeMsg}</span>
        )}
      </div>
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

  if (activeTab === 'floorplan') {
    return (
      <div className="flex-1 min-h-0 flex flex-col space-y-4">
        {floorMapOnlySection}
        {seatModal}
      </div>
    );
  }

  if (activeTab === 'assignments') {
    return (
      <div className="space-y-8 pb-8">
        <PageHeader
          title="Seat Allocations"
          description="Click a seat or floor element for details. Assign from the inspector. Request layout changes in the section below."
        />
        {allocationMapSection}
        {changeRequestSection}
        {seatModal}
      </div>
    );
  }

  if (activeTab === 'requests') {
    return (
      <div className="space-y-6 pb-8">
        <PageHeader
          title="Pending Seat Requests"
          description="Approve or reject employee desk relocation and booking requests."
        />
        {requestsSection}
      </div>
    );
  }

  // dashboard (default): metrics + pending requests only — map lives on Seat Allocations / Floor Map Viewer
  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="HR Overview"
        description="Capacity and pending requests for the floor selected in the header. Open Seat Allocations to assign seats, or Floor Map Viewer for the full map."
      />
      {metricsSection}
      <div className="space-y-2">
        <h3 className="text-base font-extrabold text-light-text dark:text-dark-text">
          Pending seat requests
        </h3>
        {requestsSection}
      </div>
      {seatModal}
    </div>
  );
};
