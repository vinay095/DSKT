import React, { useEffect, useState } from 'react';
import { FloorPlan, DeskElement } from '../../types/floorplan';
import { FloorDocumentV2 } from '../../types/floorDocument';
import { SeatAssignmentRequest } from '../../types/seating';
import { FloorPlanViewer } from '../floorplan/FloorPlanViewer';
import { PublishedFloorMap, MapElementSelection } from '../floorplan/PublishedFloorMap';
import { PropertiesPanel } from '../floorplan/PropertiesPanel';
import { SeatAssignModal } from '../floorplan/SeatAssignModal';
import {
  AllocationPanel,
  type AllocationFocus,
} from '../floorplan/AllocationPanel';
import { DEPARTMENTS, MOCK_REQUESTS } from '../../data/mockData';
import { saveSeatAssignment } from '../../lib/supabaseClient';
import { saveFloorChangeRequest } from '../../lib/floorChangeRequests';
import {
  applySeatAssignment,
  clearSeatAssignment,
  findDesk,
  type SeatAssignmentDetails,
} from '../../lib/seatAssignment';
import { StatCard } from '../common/StatCard';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { User } from '../../types/auth';
import { AccessDenied } from '../common/AccessDenied';
import {
  UserCheck,
  Building,
  Clock,
  Layers,
  MessageSquarePlus,
} from 'lucide-react';
import { ColorHierarchyLegend } from '../common/ColorHierarchyLegend';
import { PageHeader } from '../common/PageHeader';
import { PeopleTeams } from '../people/PeopleTeams';
import { TeamAreaAssignBar } from '../floorplan/TeamAreaAssignBar';
import { getTeamByName } from '../../data/teams';
import { applyTeamToDesk } from '../../lib/teamAssignment';
import { deskFromEntity, isAssignable } from '../../lib/publishedFloor';
import type { GoToFloorMapArgs } from '../people/EmployeeDrawer';
import type { FloorOption } from '../../types/office';
import type { DbEmployee } from '../../types/database';

interface HrDashboardProps {
  floorPlan: FloorPlan;
  searchQuery: string;
  onUpdateDesk: (updatedDesk: DeskElement) => void;
  /** Bulk desk updates (area-select team assign). Falls back to per-desk updates. */
  onUpdateDesks?: (updatedDesks: DeskElement[]) => void;
  activeTab?: string;
  publishedDocument?: FloorDocumentV2 | null;
  floors?: FloorOption[];
  activeFloor?: FloorOption;
  onGoToFloorMap?: (args: GoToFloorMapArgs) => void;
  onStartAssignFromPeople?: (employeeName: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const HrDashboard: React.FC<HrDashboardProps> = ({
  floorPlan,
  searchQuery,
  onUpdateDesk,
  onUpdateDesks,
  activeTab = 'dashboard',
  publishedDocument = null,
  floors = [],
  activeFloor,
  onGoToFloorMap,
  onStartAssignFromPeople,
  onNavigateTab,
}) => {
  const { user } = useAuth();
  const {
    canAllocateSeat,
    canApproveSeatRequest,
    canSubmitFloorChangeRequest,
    canAccessHrTools,
    guard,
  } = usePermissions();
  const [requests, setRequests] = useState<SeatAssignmentRequest[]>(MOCK_REQUESTS);
  const [selectedDeskForAssign, setSelectedDeskForAssign] = useState<DeskElement | null>(null);
  const [inspectedDesk, setInspectedDesk] = useState<DeskElement | null>(null);
  const [inspectedMapElement, setInspectedMapElement] = useState<MapElementSelection | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [changeType, setChangeType] = useState<'add' | 'remove' | 'modify'>('add');
  const [changeElement, setChangeElement] = useState('');
  const [changeDetails, setChangeDetails] = useState('');
  const [changeMsg, setChangeMsg] = useState<string | null>(null);
  const [allocationFocus, setAllocationFocus] = useState<AllocationFocus | null>(null);
  const [assignPrefill, setAssignPrefill] = useState<{
    employeeId?: string;
    employeeName?: string;
    notes?: string;
  } | null>(null);
  const [areaSelectMode, setAreaSelectMode] = useState(false);
  const [areaSelectedIds, setAreaSelectedIds] = useState<string[]>([]);
  const [areaTeamName, setAreaTeamName] = useState('');
  const [areaAssignMsg, setAreaAssignMsg] = useState<string | null>(null);

  // Keep inspector in sync with live desk assignment state (without removing model data).
  useEffect(() => {
    if (!inspectedDesk) return;
    const latest = floorPlan.desks.find((d) => d.id === inspectedDesk.id) ?? null;
    setInspectedDesk(latest);
  }, [floorPlan.desks, inspectedDesk?.id]);

  // People → Seat Allocation: seed employee-first panel from header search.
  useEffect(() => {
    if (activeTab !== 'assignments' || !searchQuery.trim()) return;
    setAllocationFocus((prev) => {
      if (prev?.source === 'request') return prev;
      return { employeeName: searchQuery.trim(), source: 'people' };
    });
  }, [activeTab, searchQuery]);

  const totalDesks = floorPlan.desks.length;
  const occupiedDesks = floorPlan.desks.filter((d) => d.status === 'occupied').length;
  const availableDesks = floorPlan.desks.filter((d) => d.status === 'available').length;
  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const handleApproveRequest = (reqId: string) => {
    if (!guard('canApproveSeatRequest', 'approve seat request')) return;
    setRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'approved' } : r)),
    );
  };

  const handleRejectRequest = (reqId: string) => {
    if (!guard('canApproveSeatRequest', 'reject seat request')) return;
    setRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'rejected' } : r)),
    );
  };

  /** Continue into allocation for a request (optionally approving first). */
  const handleContinueAllocation = (
    req: SeatAssignmentRequest,
    options?: { approveFirst?: boolean },
  ) => {
    if (options?.approveFirst) {
      if (!guard('canApproveSeatRequest', 'approve and allocate')) return;
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: 'approved' } : r)),
      );
    } else if (!guard('canAllocateSeat', 'continue allocation')) {
      return;
    }

    const preferred = findDesk(floorPlan.desks, req.requestedDeskId);
    setAllocationFocus({
      employeeId: req.userId,
      employeeName: req.userName,
      preferredDeskId: preferred?.id,
      requestNotes: req.notes,
      source: 'request',
    });
    setAssignPrefill({
      employeeId: req.userId,
      employeeName: req.userName,
      notes: req.notes,
    });
    if (preferred) {
      setInspectedDesk(preferred);
      setSelectedDeskForAssign(preferred);
    } else {
      setSelectedDeskForAssign(null);
    }
    onNavigateTab?.('assignments');
  };

  const handleAssignUserToDesk = (
    deskId: string,
    targetUser: User,
    details?: SeatAssignmentDetails,
  ) => {
    if (!guard('canAllocateSeat', 'assign employee to desk')) return;
    const targetDesk = findDesk(floorPlan.desks, deskId) || inspectedDesk;
    if (!targetDesk || targetDesk.id !== deskId) return;

    // Multi-seat safe: only mutates this desk; other assignments stay.
    const updated = applySeatAssignment(targetDesk, targetUser, details);
    onUpdateDesk(updated);
    setInspectedDesk(updated);
    setSelectedDeskForAssign(null);
    setAssignPrefill(null);

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
  };

  const handleUnassignDesk = (deskId: string) => {
    if (!guard('canAllocateSeat', 'unassign desk')) return;
    const targetDesk = findDesk(floorPlan.desks, deskId);
    if (!targetDesk) return;
    const updated = clearSeatAssignment(targetDesk);
    onUpdateDesk(updated);
    setInspectedDesk(updated);
  };

  const persistDesks = (updatedDesks: DeskElement[]) => {
    if (onUpdateDesks) {
      onUpdateDesks(updatedDesks);
      return;
    }
    for (const d of updatedDesks) onUpdateDesk(d);
  };

  const resolveDesksByIds = (ids: string[]) => {
    const byKey = new Map<string, DeskElement>();
    for (const d of floorPlan.desks) {
      byKey.set(d.id, d);
      if (d.geometry?.objectId) byKey.set(d.geometry.objectId, d);
    }
    const result: DeskElement[] = [];
    const seen = new Set<string>();
    for (const id of ids) {
      const existing = byKey.get(id);
      if (existing) {
        if (!seen.has(existing.id)) {
          seen.add(existing.id);
          result.push(existing);
        }
        continue;
      }
      const ent = publishedDocument?.entities.find((e) => e.objectId === id);
      if (ent && isAssignable(ent)) {
        const synthesized = deskFromEntity(ent);
        if (!seen.has(synthesized.id)) {
          seen.add(synthesized.id);
          result.push(synthesized);
        }
      }
    }
    return result;
  };

  const handleApplyTeamToSelection = (clear = false) => {
    if (!guard('canAllocateSeat', clear ? 'clear team on seats' : 'assign team to seats')) return;
    if (!areaSelectedIds.length) return;
    const team = clear ? null : getTeamByName(areaTeamName) ?? null;
    if (!clear && !team) {
      setAreaAssignMsg('Choose a team first.');
      window.setTimeout(() => setAreaAssignMsg(null), 2500);
      return;
    }
    const targets = resolveDesksByIds(areaSelectedIds);
    if (!targets.length) {
      setAreaAssignMsg('No seats found for the current selection.');
      window.setTimeout(() => setAreaAssignMsg(null), 2500);
      return;
    }
    const updated = targets.map((d) => applyTeamToDesk(d, team));
    persistDesks(updated);
    const label = clear ? 'Cleared team on' : `Assigned ${team!.name} to`;
    setAreaAssignMsg(`${label} ${updated.length} seat${updated.length === 1 ? '' : 's'}.`);
    window.setTimeout(() => setAreaAssignMsg(null), 3000);
  };

  const areaAssignBar =
    canAllocateSeat && publishedDocument ? (
      <div className="space-y-1.5">
        <TeamAreaAssignBar
          selectionMode={areaSelectMode}
          onToggleSelectionMode={() => {
            setAreaSelectMode((v) => {
              if (v) setAreaSelectedIds([]);
              return !v;
            });
          }}
          selectedCount={areaSelectedIds.length}
          onClearSelection={() => setAreaSelectedIds([])}
          selectedTeamName={areaTeamName}
          onSelectedTeamNameChange={setAreaTeamName}
          onApplyTeam={() => handleApplyTeamToSelection(false)}
          onClearTeam={() => handleApplyTeamToSelection(true)}
        />
        {areaAssignMsg && (
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 px-1">
            {areaAssignMsg}
          </p>
        )}
      </div>
    ) : null;

  const publishedMapSelectionProps = areaSelectMode
    ? {
        selectionMode: true as const,
        selectedDeskIds: areaSelectedIds,
        onSelectedDeskIdsChange: setAreaSelectedIds,
      }
    : {
        selectionMode: false as const,
        selectedDeskIds: areaSelectedIds.length ? areaSelectedIds : undefined,
        onSelectedDeskIdsChange: setAreaSelectedIds,
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
                  {req.department} · Requested{' '}
                  {findDesk(floorPlan.desks, req.requestedDeskId)?.code ||
                    req.requestedDeskId ||
                    'any seat'}
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
              {req.status === 'pending' && canApproveSeatRequest ? (
                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => handleRejectRequest(req.id)}
                    className="px-3 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 font-bold text-xs hover:bg-rose-100 transition"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveRequest(req.id)}
                    className="px-3 py-1 rounded-lg border border-border bg-surface text-content-primary font-bold text-xs hover:bg-surface-muted transition"
                  >
                    Approve only
                  </button>
                  <button
                    type="button"
                    onClick={() => handleContinueAllocation(req, { approveFirst: true })}
                    className="px-3.5 py-1 rounded-lg bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-xs transition shadow"
                  >
                    Approve & allocate
                  </button>
                </div>
              ) : req.status === 'pending' ? (
                <span className="text-xs text-content-secondary">View only</span>
              ) : req.status === 'approved' && canAllocateSeat ? (
                <button
                  type="button"
                  onClick={() => handleContinueAllocation(req)}
                  className="px-3 py-1 rounded-lg bg-accent text-accent-foreground font-bold text-xs"
                >
                  Continue allocation
                </button>
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
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        <ColorHierarchyLegend compact />
      </div>
      {areaAssignBar}

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
            {...publishedMapSelectionProps}
          />
          <PropertiesPanel
            selectedDesk={inspectedDesk}
            selectedMapElement={inspectedMapElement}
            role="hr"
            desks={floorPlan.desks}
            floors={floors}
            onClose={clearInspector}
            onAssignClick={
              canAllocateSeat ? (desk) => setSelectedDeskForAssign(desk) : undefined
            }
            onViewTeam={(team) => {
              onStartAssignFromPeople?.(team);
              onNavigateTab?.('people');
            }}
            onGoToEmployee={(name) => {
              onStartAssignFromPeople?.(name);
              onNavigateTab?.('people');
            }}
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
            onAssignClick={
              canAllocateSeat ? (desk) => setSelectedDeskForAssign(desk) : undefined
            }
            hrMode={canAllocateSeat}
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
        description="View seats and floor elements. Click for details. Use Select area to highlight seats and assign them to a team."
        actions={<ColorHierarchyLegend compact />}
      />
      {areaAssignBar}
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
            {...publishedMapSelectionProps}
          />
          <PropertiesPanel
            selectedDesk={inspectedDesk}
            selectedMapElement={inspectedMapElement}
            role="hr"
            desks={floorPlan.desks}
            floors={floors}
            onClose={clearInspector}
            onAssignClick={
              canAllocateSeat ? (desk) => setSelectedDeskForAssign(desk) : undefined
            }
            onViewTeam={(team) => {
              onStartAssignFromPeople?.(team);
              onNavigateTab?.('people');
            }}
            onGoToEmployee={(name) => {
              onStartAssignFromPeople?.(name);
              onNavigateTab?.('people');
            }}
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
            onAssignClick={
              canAllocateSeat ? (desk) => setSelectedDeskForAssign(desk) : undefined
            }
            hrMode={canAllocateSeat}
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
            if (!guard('canSubmitFloorChangeRequest', 'submit floor change request')) return;
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
          disabled={!canSubmitFloorChangeRequest}
        >
          Submit request
        </button>
        {changeMsg && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{changeMsg}</span>
        )}
      </div>
    </div>
  );

  const seatModal = canAllocateSeat ? (
    <SeatAssignModal
      desk={selectedDeskForAssign}
      onClose={() => {
        setSelectedDeskForAssign(null);
        setAssignPrefill(null);
      }}
      onAssign={handleAssignUserToDesk}
      onUnassign={handleUnassignDesk}
      preselectedEmployeeId={assignPrefill?.employeeId}
      preselectedEmployeeName={assignPrefill?.employeeName}
      requestNotes={assignPrefill?.notes}
      floorContext={{
        building: floorPlan.building,
        floorName: floorPlan.name,
      }}
    />
  ) : null;

  if (!canAccessHrTools) {
    return (
      <AccessDenied description="HR tools require the HR role. Switch demo role from the header to continue." />
    );
  }

  if (activeTab === 'people') {
    return (
      <PeopleTeams
        searchQuery={searchQuery}
        floors={floors}
        currentFloorDesks={floorPlan.desks}
        currentFloor={activeFloor}
        onGoToFloorMap={onGoToFloorMap}
        onStartAssign={(emp: DbEmployee) => onStartAssignFromPeople?.(emp.name)}
      />
    );
  }

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
      <div className="space-y-6 pb-8">
        <PageHeader
          title="Seat Allocation"
          description="Employee-first: search a person and pick a free seat. Seat-first: click a desk → Assign in the inspector. Area-select: Select area → drag seats → Assign to team."
        />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-1">
            <AllocationPanel
              desks={floorPlan.desks}
              floorName={floorPlan.name}
              building={floorPlan.building}
              focus={allocationFocus}
              searchQuery={searchQuery}
              onAssign={handleAssignUserToDesk}
              onSelectDeskOnMap={(desk) => {
                setInspectedDesk(desk);
                setInspectedMapElement(null);
              }}
              onClearFocus={() => setAllocationFocus(null)}
            />
          </div>
          <div className="xl:col-span-2 space-y-3">
            <p className="text-[11px] text-content-secondary">
              Seat-first: select a desk on the map, then use Assign / Reassign in the inspector.
            </p>
            {allocationMapSection}
          </div>
        </div>
        {canSubmitFloorChangeRequest && changeRequestSection}
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
