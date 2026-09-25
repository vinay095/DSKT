import React, { useMemo, useState } from 'react';
import { FloorPlan, FloorPlanDraft } from '../../types/floorplan';
import { FloorDocumentV2 } from '../../types/floorDocument';
import { FloorChangeRequest } from '../../types/seating';
import type { FloorOption } from '../../types/office';
import { FloorCreatorEmbed } from '../floorplan/FloorCreatorEmbed';
import { StatCard } from '../common/StatCard';
import { getAllSavedDrafts, loadPublishedFromStorage, saveDraftToStorage, savePublishedToStorage } from '../../lib/drafts';
import { OFFICES, getOfficeById } from '../../data/offices';
import { registerCustomFloor } from '../../data/floors';
import { cloneFloorPlan, makeCloneFloorId } from '../../lib/cloneFloorPlan';
import {
  listFloorChangeRequests,
  updateFloorChangeRequestStatus,
} from '../../lib/floorChangeRequests';
import {
  Edit3,
  Save,
  CheckCircle2,
  Building2,
  Upload,
  Inbox,
  Copy,
  Layers,
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';

interface AdminDashboardProps {
  floorPlan: FloorPlan;
  onPublish: (fp: FloorPlan) => void;
  onCreatorPublished?: (doc: FloorDocumentV2) => void;
  activeTab: string;
  activeFloorId: string;
  activeOfficeId: string;
  floors: FloorOption[];
  onFloorChange: (floorId: string) => void;
  onFloorsChanged: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  floorPlan,
  onPublish,
  onCreatorPublished,
  activeTab,
  activeFloorId,
  activeOfficeId,
  floors,
  onFloorChange,
  onFloorsChanged,
}) => {
  const [drafts] = useState<FloorPlanDraft[]>(() => getAllSavedDrafts(floorPlan.id));
  const [changeRequests, setChangeRequests] = useState<FloorChangeRequest[]>(() =>
    listFloorChangeRequests(),
  );
  const [cloneName, setCloneName] = useState('');
  const [cloneOfficeId, setCloneOfficeId] = useState(activeOfficeId);
  const [cloneMsg, setCloneMsg] = useState<string | null>(null);

  const refreshRequests = () => setChangeRequests(listFloorChangeRequests());

  const officeFloorCounts = useMemo(() => {
    return OFFICES.map((o) => ({
      office: o,
      count: floors.filter((f) => f.officeId === o.id).length,
    }));
  }, [floors]);

  const handleClone = () => {
    const source = loadPublishedFromStorage(activeFloorId);
    const newFloorId = makeCloneFloorId(activeFloorId);
    const name =
      cloneName.trim() ||
      `${source.name || floorPlan.name} (Copy)`;
    const cloned = cloneFloorPlan(source, {
      newFloorId,
      name,
      officeId: cloneOfficeId,
      building: getOfficeById(cloneOfficeId)?.name,
      clearAssignments: true,
    });

    registerCustomFloor({
      id: newFloorId,
      officeId: cloneOfficeId,
      label: name,
      shortLabel: name.length > 28 ? `${name.slice(0, 26)}…` : name,
      locationLabel: `${getOfficeById(cloneOfficeId)?.city || 'Office'} · ${name}`,
      isCustom: true,
      clonedFromId: activeFloorId,
    });

    saveDraftToStorage(cloned);
    savePublishedToStorage(cloned);
    onFloorsChanged();
    onPublish(cloned);
    onFloorChange(newFloorId);
    setCloneMsg(`Cloned as independent plan “${name}”. Assignments cleared — edit freely.`);
    setCloneName('');
    window.setTimeout(() => setCloneMsg(null), 4000);
  };

  const metricsSection = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Offices"
          value={`${OFFICES.length}`}
          subtitle={OFFICES.map((o) => o.city).join(', ')}
          icon={Building2}
          colorScheme="purple"
        />
        <StatCard
          title="Floor Plans"
          value={`${floors.length}`}
          subtitle="Independent maps per office"
          icon={Layers}
          colorScheme="blue"
        />
        <StatCard
          title="Canvas Desks (this floor)"
          value={floorPlan.desks.length}
          subtitle={floorPlan.name}
          icon={Edit3}
          colorScheme="emerald"
        />
        <StatCard
          title="Published Status"
          value={floorPlan.isPublished ? `Live v${floorPlan.version ?? 1}` : 'Unpublished'}
          subtitle="Employee & HR views"
          icon={CheckCircle2}
          colorScheme="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border space-y-3">
          <h3 className="text-sm font-extrabold text-light-text dark:text-dark-text flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Offices & floors
          </h3>
          <ul className="space-y-2">
            {officeFloorCounts.map(({ office, count }) => (
              <li
                key={office.id}
                className="flex items-center justify-between text-xs text-light-text dark:text-dark-text"
              >
                <span>
                  <span className="font-semibold">{office.name}</span>
                  <span className="text-light-muted dark:text-dark-muted">
                    {' '}
                    · {office.city}, {office.country}
                  </span>
                </span>
                <span className="font-mono text-light-muted dark:text-dark-muted">
                  {count} floor{count === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border space-y-3">
          <h3 className="text-sm font-extrabold text-light-text dark:text-dark-text flex items-center gap-2">
            <Copy className="w-4 h-4" /> Clone current floor plan
          </h3>
          <p className="text-[11px] text-light-muted dark:text-dark-muted">
            Creates an independent copy (new IDs). Source plan is never mutated. Seat assignments
            are cleared on the clone.
          </p>
          <p className="text-[11px] font-medium text-light-text dark:text-dark-text">
            Source: {floorPlan.name}
            {floorPlan.clonedFromId ? ` · cloned from ${floorPlan.clonedFromId}` : ''}
          </p>
          <input
            type="text"
            value={cloneName}
            onChange={(e) => setCloneName(e.target.value)}
            placeholder="New plan name (optional)"
            className="w-full px-3 py-2 rounded-xl border border-light-border dark:border-dark-border bg-slate-50 dark:bg-dark-sidebar text-xs"
          />
          <select
            value={cloneOfficeId}
            onChange={(e) => setCloneOfficeId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-light-border dark:border-dark-border bg-slate-50 dark:bg-dark-sidebar text-xs"
          >
            {OFFICES.map((o) => (
              <option key={o.id} value={o.id}>
                Clone into {o.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleClone}
            className="w-full py-2.5 rounded-xl bg-brandBlue-600 hover:bg-brandBlue-700 dark:bg-brandPurple-600 dark:hover:bg-brandPurple-700 text-white text-xs font-bold flex items-center justify-center gap-2"
          >
            <Copy className="w-3.5 h-3.5" /> Clone & open for editing
          </button>
          {cloneMsg && (
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {cloneMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (activeTab === 'change-requests') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <PageHeader
            title="HR Floor Map Change Requests"
            description="Review requests to add, remove, or modify elements. Apply changes in the Creator, then publish."
          />
          <button
            type="button"
            onClick={refreshRequests}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-light-border dark:border-dark-border shrink-0"
          >
            Refresh
          </button>
        </div>

        {changeRequests.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-light-border dark:border-dark-border text-center text-sm text-light-muted dark:text-dark-muted">
            <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No change requests from HR yet.
          </div>
        ) : (
          <div className="space-y-3">
            {changeRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brandBlue-50 text-brandBlue-700 dark:bg-brandPurple-950 dark:text-brandPurple-300">
                    {req.requestType}
                  </span>
                  <span className="text-[10px] font-mono text-light-muted dark:text-dark-muted">
                    {new Date(req.createdAt).toLocaleString()} · {req.status}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-light-text dark:text-dark-text">
                  {req.elementDescription}
                </h4>
                <p className="text-xs text-light-muted dark:text-dark-muted">{req.details}</p>
                <p className="text-[10px] text-light-muted dark:text-dark-muted">
                  From: {req.requestedBy}
                </p>
                {req.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-brandBlue-600 dark:bg-brandPurple-600 text-white"
                      onClick={() => {
                        updateFloorChangeRequestStatus(req.id, 'acknowledged');
                        refreshRequests();
                      }}
                    >
                      Acknowledge
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-lg text-xs font-bold border border-emerald-300 text-emerald-700"
                      onClick={() => {
                        updateFloorChangeRequestStatus(req.id, 'done');
                        refreshRequests();
                      }}
                    >
                      Mark done
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-lg text-xs font-bold border border-rose-200 text-rose-600"
                      onClick={() => {
                        updateFloorChangeRequestStatus(req.id, 'rejected');
                        refreshRequests();
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'drafts') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Drafts & Published"
          description="Drafts for the active floor. Prefer Creator Preview → Publish for the live SVG map. Use Clone on Admin Metrics to duplicate into another office."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drafts.map((d) => (
            <div
              key={d.id}
              className="p-5 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-brandPurple-100 text-brandPurple-700 dark:bg-brandPurple-950 dark:text-brandPurple-300 border border-brandPurple-300">
                    Draft Saved
                  </span>
                  <span className="text-[10px] font-mono text-light-muted dark:text-dark-muted">
                    {new Date(d.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-light-text dark:text-dark-text mt-2">
                  {d.name}
                </h4>
                <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
                  Desks: {d.data.desks.length} • Meeting Pods: {d.data.rooms.length} • Zones:{' '}
                  {d.data.zones.length}
                </p>
              </div>

              <div className="pt-3 border-t border-light-border dark:border-dark-border flex gap-2">
                <button
                  onClick={() => onPublish(d.data)}
                  className="flex-1 py-2 px-3 rounded-xl bg-brandPurple-600 hover:bg-brandPurple-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Publish Live Layout
                </button>
              </div>
            </div>
          ))}
          {drafts.length === 0 && (
            <div className="col-span-full p-8 rounded-2xl border border-dashed text-center text-sm text-light-muted dark:text-dark-muted">
              <Save className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No drafts for this floor yet. Save from Creator or publish a layout.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'editor') {
    const officeName = getOfficeById(activeOfficeId)?.name;
    const floorLabel =
      floors.find((f) => f.id === activeFloorId)?.shortLabel || floorPlan.name;

    return (
      <div className="h-full min-h-0 flex flex-col gap-2">
        <PageHeader
          title="Floor Plan Creator"
          description={[officeName, floorLabel].filter(Boolean).join(' · ')}
          className="shrink-0"
        />
        <FloorCreatorEmbed
          className="flex-1 min-h-[calc(100vh-10rem)]"
          onPublished={onCreatorPublished}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Metrics"
        description="Offices, floor plans, and clone tools. Switch office/floor in the header to change the active plan."
      />
      {metricsSection}
    </div>
  );
};
