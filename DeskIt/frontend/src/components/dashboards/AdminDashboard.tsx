import React, { useEffect, useMemo, useState } from 'react';
import { FloorPlan, FloorPlanDraft } from '../../types/floorplan';
import { FloorDocumentV2 } from '../../types/floorDocument';
import { FloorChangeRequest } from '../../types/seating';
import type { FloorOption } from '../../types/office';
import { FloorCreatorEmbed } from '../floorplan/FloorCreatorEmbed';
import { StatCard } from '../common/StatCard';
import {
  getAllSavedDrafts,
  loadDraftFromStorage,
  loadPublishedFromStorage,
  saveDraftToStorage,
  savePublishedToStorage,
} from '../../lib/drafts';
import { INITIAL_FLOOR_PLAN } from '../../data/mockData';
import { OFFICES, getOfficeById } from '../../data/offices';
import { registerCustomFloor } from '../../data/floors';
import { cloneFloorPlan, makeCloneFloorId } from '../../lib/cloneFloorPlan';
import {
  cloneFloorDocument,
  loadDraftFloorDocument,
  loadPublishedFloorDocument,
  promoteDraftFloorDocument,
  saveDraftFloorDocument,
  savePublishedFloorDocument,
} from '../../lib/publishedFloor';
import {
  listFloorChangeRequests,
  updateFloorChangeRequestStatus,
} from '../../lib/floorChangeRequests';
import { getAdminOverviewMetrics } from '../../lib/adminMetrics';
import {
  formatTimestamp,
  getFloorVersionSummary,
} from '../../lib/floorVersioning';
import {
  Edit3,
  Save,
  CheckCircle2,
  Building2,
  Upload,
  Copy,
  Layers,
  FileStack,
  Inbox,
  Plus,
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { AccessDenied } from '../common/AccessDenied';
import { usePermissions } from '../../hooks/usePermissions';
import { AdminFloorWorkflow } from '../admin/AdminFloorWorkflow';
import { FloorPlanRegistry } from '../admin/FloorPlanRegistry';
import { AdminChangeRequestPanel } from '../admin/AdminChangeRequestPanel';
import {
  CloneFloorPlanDialog,
  type CloneFloorPlanDialogResult,
} from '../admin/CloneFloorPlanDialog';
import { PublishDialog, type PublishTarget } from '../admin/PublishDialog';
import { VersionBadge } from '../admin/VersionBadge';

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
  onNavigateTab?: (tab: string) => void;
  hasSvgMap?: boolean;
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
  onNavigateTab,
  hasSvgMap = false,
}) => {
  const {
    canAccessAdminTools,
    canCloneFloorPlan,
    canPublishFloorPlan,
    canManageFloorChangeRequests,
    canEditFloorPlan,
    canManageDrafts,
    guard,
  } = usePermissions();

  const [drafts, setDrafts] = useState<FloorPlanDraft[]>([]);
  const [changeRequests, setChangeRequests] = useState<FloorChangeRequest[]>(() =>
    listFloorChangeRequests(),
  );
  const [cloneOpen, setCloneOpen] = useState(false);
  const [cloneMsg, setCloneMsg] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishDraft, setPublishDraft] = useState<FloorPlanDraft | null>(null);
  const [newFloorName, setNewFloorName] = useState('');
  const [newFloorMsg, setNewFloorMsg] = useState<string | null>(null);
  const [versionTick, setVersionTick] = useState(0);

  const refreshDrafts = () => setDrafts(getAllSavedDrafts(activeFloorId));

  useEffect(() => {
    refreshDrafts();
  }, [activeFloorId, floorPlan.lastModified, versionTick]);

  const refreshRequests = () => setChangeRequests(listFloorChangeRequests());

  const metrics = useMemo(
    () => getAdminOverviewMetrics(floors, activeFloorId),
    [floors, activeFloorId, changeRequests, versionTick],
  );

  const versionSummary = useMemo(
    () => getFloorVersionSummary(activeFloorId, floorPlan),
    [activeFloorId, floorPlan, versionTick],
  );

  const officeName = getOfficeById(activeOfficeId)?.name;
  const floorLabel =
    floors.find((f) => f.id === activeFloorId)?.shortLabel || floorPlan.name;

  const officeFloorCounts = useMemo(() => {
    return OFFICES.map((o) => ({
      office: o,
      count: floors.filter((f) => f.officeId === o.id).length,
    }));
  }, [floors]);

  const pendingRequests = useMemo(
    () => changeRequests.filter((r) => r.status === 'pending').slice(0, 3),
    [changeRequests],
  );

  const handleCloneConfirm = (result: CloneFloorPlanDialogResult) => {
    if (!guard('canCloneFloorPlan', 'clone floor plan')) return;
    const source = loadPublishedFromStorage(activeFloorId);
    const newFloorId = makeCloneFloorId(activeFloorId);
    const cloned = cloneFloorPlan(source, {
      newFloorId,
      name: result.name,
      officeId: result.officeId,
      building: getOfficeById(result.officeId)?.name,
      clearAssignments: result.clearAssignments,
    });

    registerCustomFloor({
      id: newFloorId,
      officeId: result.officeId,
      label: result.name,
      shortLabel:
        result.name.length > 28 ? `${result.name.slice(0, 26)}…` : result.name,
      locationLabel: `${getOfficeById(result.officeId)?.city || 'Office'} · ${result.name}`,
      isCustom: true,
      clonedFromId: activeFloorId,
    });

    saveDraftToStorage(cloned);

    if (result.includeSvgMap) {
      const srcDoc = loadPublishedFloorDocument(activeFloorId);
      if (srcDoc) {
        const clonedDoc = cloneFloorDocument(srcDoc, { name: result.name });
        if (result.publishImmediately) {
          savePublishedFloorDocument(clonedDoc, newFloorId);
        } else {
          saveDraftFloorDocument(clonedDoc, newFloorId);
        }
      }
    }

    if (result.publishImmediately) {
      const live: FloorPlan = {
        ...cloned,
        isPublished: true,
        version: Math.max(cloned.version || 0, 1),
      };
      savePublishedToStorage(live);
      onPublish(live);
      if (result.includeSvgMap) {
        const liveDoc = loadPublishedFloorDocument(newFloorId);
        if (liveDoc) onCreatorPublished?.(liveDoc);
      }
    }

    onFloorsChanged();
    onFloorChange(newFloorId);
    setCloneOpen(false);
    setCloneMsg(
      result.publishImmediately
        ? `Cloned and published “${result.name}”. Source plan unchanged.`
        : `Cloned “${result.name}” as a draft. Source plan unchanged — edit, then publish.`,
    );
    setVersionTick((n) => n + 1);
    window.setTimeout(() => setCloneMsg(null), 5000);
    onNavigateTab?.(result.publishImmediately ? 'floorplan' : 'editor');
  };

  const handlePublishConfirm = (target: PublishTarget) => {
    if (!guard('canPublishFloorPlan', 'publish floor plan')) return;

    if (target === 'desk' || target === 'both') {
      const desk =
        publishDraft?.data ||
        loadDraftFromStorage(activeFloorId) ||
        floorPlan;
      const next: FloorPlan = {
        ...desk,
        id: activeFloorId,
        isPublished: true,
        version: (floorPlan.isPublished ? floorPlan.version || 0 : 0) + 1,
        lastModified: new Date().toISOString(),
      };
      savePublishedToStorage(next);
      onPublish(next);
    }

    if (target === 'svg' || target === 'both') {
      const promoted = promoteDraftFloorDocument(activeFloorId);
      if (promoted) onCreatorPublished?.(promoted);
    }

    setPublishOpen(false);
    setPublishDraft(null);
    setVersionTick((n) => n + 1);
    refreshDrafts();
  };

  const handleNewFloor = () => {
    if (!guard('canEditFloorPlan', 'create floor plan')) return;
    const newFloorId = `floor-new-${Date.now()}`;
    const name = newFloorName.trim() || 'New Floor Plan';
    const office = getOfficeById(activeOfficeId);

    registerCustomFloor({
      id: newFloorId,
      officeId: activeOfficeId,
      label: name,
      shortLabel: name.length > 28 ? `${name.slice(0, 26)}…` : name,
      locationLabel: `${office?.city || 'Office'} · ${name}`,
      isCustom: true,
    });

    const empty: FloorPlan = {
      ...INITIAL_FLOOR_PLAN,
      id: newFloorId,
      name,
      building: office?.name || INITIAL_FLOOR_PLAN.building,
      officeId: activeOfficeId,
      desks: [],
      rooms: [],
      walls: [],
      zones: [],
      unusableRegions: [],
      isPublished: false,
      version: 0,
      lastModified: new Date().toISOString(),
    };

    saveDraftToStorage(empty);
    onFloorsChanged();
    onFloorChange(newFloorId);
    setNewFloorMsg(`Created “${name}” as a draft. Open Creator to design, then publish.`);
    setNewFloorName('');
    window.setTimeout(() => setNewFloorMsg(null), 4000);
    onNavigateTab?.('editor');
  };

  if (!canAccessAdminTools) {
    return (
      <AccessDenied description="Admin tools require the Admin role. Switch demo role from the header to continue." />
    );
  }

  const updateRequestStatus = (
    id: string,
    status: FloorChangeRequest['status'],
  ) => {
    if (!guard('canManageFloorChangeRequests', `set change request ${status}`)) return;
    updateFloorChangeRequestStatus(id, status);
    refreshRequests();
  };

  if (activeTab === 'change-requests') {
    return (
      <div className="space-y-4">
        <AdminFloorWorkflow
          currentStep="select"
          officeLabel={officeName}
          floorLabel={floorLabel}
          onNavigateTab={onNavigateTab}
        />
        <AdminChangeRequestPanel
          requests={changeRequests}
          floors={floors}
          activeFloorId={activeFloorId}
          canManage={canManageFloorChangeRequests}
          onRefresh={refreshRequests}
          onUpdateStatus={updateRequestStatus}
          onOpenEditor={(floorId) => {
            if (floorId) onFloorChange(floorId);
            onNavigateTab?.('editor');
          }}
        />
      </div>
    );
  }

  if (activeTab === 'drafts') {
    const hasSvgDraft = Boolean(loadDraftFloorDocument(activeFloorId));
    const hasDeskDraft = Boolean(loadDraftFromStorage(activeFloorId)) || drafts.length > 0;

    return (
      <div className="space-y-4">
        <PageHeader
          title="Drafts & versions"
          description="Drafts stay private until you publish. Viewers only see the live version."
        />
        <AdminFloorWorkflow
          currentStep="draft"
          officeLabel={officeName}
          floorLabel={floorLabel}
          onNavigateTab={onNavigateTab}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="ds-panel p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-wider text-content-secondary font-semibold">
                Published (viewers)
              </p>
              <VersionBadge
                state={versionSummary.state === 'live' ? 'live' : 'unpublished'}
                label={
                  floorPlan.isPublished || hasSvgMap
                    ? `Live v${Math.max(versionSummary.liveVersion, 1)}`
                    : 'Not live'
                }
              />
            </div>
            <p className="text-sm font-bold text-content-primary">{floorLabel}</p>
            <p className="text-[11px] text-content-secondary">
              {versionSummary.detail}
              {versionSummary.lastModified
                ? ` · ${formatTimestamp(versionSummary.lastModified)}`
                : ''}
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab?.('floorplan')}
              className="text-[11px] font-semibold text-accent"
            >
              View published map
            </button>
          </div>
          <div className="ds-panel p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-wider text-content-secondary font-semibold">
                Working draft
              </p>
              <VersionBadge
                state={hasDeskDraft || hasSvgDraft ? 'draft' : 'unpublished'}
                label={hasDeskDraft || hasSvgDraft ? 'Draft' : 'None'}
              />
            </div>
            <p className="text-sm font-bold text-content-primary">
              {hasDeskDraft || hasSvgDraft ? 'Changes not yet live' : 'No local draft'}
            </p>
            <p className="text-[11px] text-content-secondary">
              Last draft save:{' '}
              {formatTimestamp(versionSummary.draftUpdatedAt)}
              {hasSvgDraft ? ' · SVG draft staged' : ''}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={!canEditFloorPlan}
                onClick={() => onNavigateTab?.('editor')}
                className="px-3 py-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-bold disabled:opacity-50"
              >
                Continue editing
              </button>
              <button
                type="button"
                disabled={
                  !canPublishFloorPlan ||
                  !canManageDrafts ||
                  (!hasDeskDraft && !hasSvgDraft)
                }
                onClick={() => {
                  setPublishDraft(drafts[0] || null);
                  setPublishOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold inline-flex items-center gap-1 disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" /> Publish…
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drafts.map((d) => (
            <div
              key={d.id}
              className="p-5 rounded-xl bg-surface border border-border shadow-sm flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <VersionBadge state="draft" label="Draft" />
                  <span className="text-[10px] font-mono text-content-secondary">
                    {formatTimestamp(d.updatedAt)}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-content-primary mt-2">{d.name}</h4>
                <p className="text-xs text-content-secondary mt-1">
                  Desks: {d.data.desks.length} · Rooms: {d.data.rooms.length} · Zones:{' '}
                  {d.data.zones.length}
                </p>
              </div>

              <div className="pt-3 border-t border-border flex flex-col gap-2">
                <button
                  type="button"
                  disabled={!canEditFloorPlan}
                  onClick={() => onNavigateTab?.('editor')}
                  className="w-full py-2 px-3 rounded-xl border border-border font-bold text-xs disabled:opacity-50"
                >
                  Continue editing
                </button>
                <button
                  type="button"
                  disabled={!canPublishFloorPlan || !canManageDrafts}
                  onClick={() => {
                    setPublishDraft(d);
                    setPublishOpen(true);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" /> Publish…
                </button>
              </div>
            </div>
          ))}
          {drafts.length === 0 && !hasSvgDraft && (
            <div className="col-span-full p-8 rounded-xl border border-dashed border-border text-center text-sm text-content-secondary">
              <Save className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No drafts for this floor yet. Save from Creator, clone a plan, or create a new floor.
            </div>
          )}
        </div>

        <PublishDialog
          open={publishOpen}
          floorLabel={[officeName, floorLabel].filter(Boolean).join(' · ')}
          currentLiveVersion={versionSummary.liveVersion}
          hasDeskDraft={hasDeskDraft}
          hasSvgDraft={hasSvgDraft}
          onClose={() => {
            setPublishOpen(false);
            setPublishDraft(null);
          }}
          onConfirm={handlePublishConfirm}
        />
      </div>
    );
  }

  if (activeTab === 'editor') {
    if (!canEditFloorPlan) {
      return (
        <AccessDenied description="Floor plan editing requires Admin layout-authoring permission." />
      );
    }

    return (
      <div className="h-full min-h-0 flex flex-col gap-2">
        <PageHeader
          title="Floor plan editor"
          description={[officeName, floorLabel].filter(Boolean).join(' · ')}
          className="shrink-0"
        />
        <AdminFloorWorkflow
          currentStep="edit"
          officeLabel={officeName}
          floorLabel={floorLabel}
          onNavigateTab={onNavigateTab}
          className="shrink-0"
        />
        <FloorCreatorEmbed
          className="flex-1 min-h-[calc(100vh-12rem)]"
          floorId={activeFloorId}
          officeId={activeOfficeId}
          onPublished={onCreatorPublished}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin overview"
        description="Manage offices, floor plans, drafts, and change requests. Geometry stays in Creator."
      />
      <AdminFloorWorkflow
        currentStep="select"
        officeLabel={officeName}
        floorLabel={floorLabel}
        onNavigateTab={onNavigateTab}
      />

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <VersionBadge state={versionSummary.state} label={versionSummary.label} />
        <span className="text-content-secondary">{versionSummary.detail}</span>
        {versionSummary.draftUpdatedAt && (
          <span className="text-content-secondary">
            · Draft saved {formatTimestamp(versionSummary.draftUpdatedAt)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          title="Offices"
          value={metrics.officeCount}
          subtitle={OFFICES.map((o) => o.city).join(', ')}
          icon={Building2}
          colorScheme="purple"
        />
        <StatCard
          title="Floors"
          value={metrics.floorCount}
          subtitle="Across all offices"
          icon={Layers}
          colorScheme="blue"
        />
        <StatCard
          title="Published SVG maps"
          value={metrics.publishedSvgCount}
          subtitle={`${metrics.publishedLegacyCount} desk layouts in storage`}
          icon={CheckCircle2}
          colorScheme="emerald"
        />
        <StatCard
          title="Floors with drafts"
          value={metrics.draftCount}
          subtitle="Local DeskIt drafts"
          icon={FileStack}
          colorScheme="amber"
        />
        <StatCard
          title="Pending change requests"
          value={metrics.pendingChangeRequests}
          subtitle="From HR"
          icon={Inbox}
          colorScheme="amber"
        />
        <StatCard
          title="Active floor"
          value={
            metrics.activeFloorPublished
              ? `Live v${metrics.activeFloorVersion || 1}`
              : 'Unpublished'
          }
          subtitle={`${floorPlan.desks.length} desks · ${floorLabel}`}
          icon={Edit3}
          colorScheme="blue"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!canEditFloorPlan}
          onClick={() => onNavigateTab?.('editor')}
          className="px-3 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold disabled:opacity-50"
        >
          Open editor
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab?.('drafts')}
          className="px-3 py-2 rounded-xl border border-border text-xs font-bold"
        >
          Drafts & versions
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab?.('floorplan')}
          className="px-3 py-2 rounded-xl border border-border text-xs font-bold"
        >
          Published maps
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab?.('change-requests')}
          className="px-3 py-2 rounded-xl border border-border text-xs font-bold inline-flex items-center gap-1.5"
        >
          Change requests
          {metrics.pendingChangeRequests > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-warning-muted text-warning text-[10px] font-bold">
              {metrics.pendingChangeRequests}
            </span>
          )}
        </button>
      </div>

      <FloorPlanRegistry
        floors={floors}
        activeFloorId={activeFloorId}
        onSelectFloor={onFloorChange}
        onNavigateTab={onNavigateTab}
      />

      {pendingRequests.length > 0 && (
        <div className="ds-panel p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-content-primary flex items-center gap-2">
              <Inbox className="w-4 h-4" /> Pending change requests
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab?.('change-requests')}
              className="text-[11px] font-semibold text-accent"
            >
              View all
            </button>
          </div>
          <ul className="space-y-2">
            {pendingRequests.map((r) => (
              <li
                key={r.id}
                className="flex items-start justify-between gap-3 text-xs border-b border-border last:border-0 pb-2 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-content-primary truncate">
                    {r.elementDescription}
                  </p>
                  <p className="text-content-secondary truncate">{r.details}</p>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-[11px] font-bold text-accent"
                  onClick={() => {
                    if (r.floorId) onFloorChange(r.floorId);
                    onNavigateTab?.('editor');
                  }}
                >
                  Open editor
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-surface border border-border space-y-3">
          <h3 className="text-sm font-extrabold text-content-primary flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Offices & floors
          </h3>
          <ul className="space-y-2">
            {officeFloorCounts.map(({ office, count }) => (
              <li
                key={office.id}
                className="flex items-center justify-between text-xs text-content-primary"
              >
                <span>
                  <span className="font-semibold">{office.name}</span>
                  <span className="text-content-secondary">
                    {' '}
                    · {office.city}, {office.country}
                  </span>
                </span>
                <span className="font-mono text-content-secondary">
                  {count} floor{count === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-5 rounded-xl bg-surface border border-border space-y-3">
          <h3 className="text-sm font-extrabold text-content-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New floor plan
          </h3>
          <p className="text-[11px] text-content-secondary">
            Creates an empty draft for the active office and opens the editor. Does not publish
            until you publish from Creator.
          </p>
          <input
            type="text"
            value={newFloorName}
            onChange={(e) => setNewFloorName(e.target.value)}
            placeholder="Plan name (optional)"
            className="w-full px-3 py-2 rounded-xl border border-border bg-surface-elevated text-xs"
          />
          <button
            type="button"
            onClick={handleNewFloor}
            disabled={!canEditFloorPlan}
            className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> Create & open editor
          </button>
          {newFloorMsg && (
            <p className="text-[11px] font-semibold text-success">{newFloorMsg}</p>
          )}
        </div>
      </div>

      <div className="p-5 rounded-xl bg-surface border border-border space-y-3">
        <h3 className="text-sm font-extrabold text-content-primary flex items-center gap-2">
          <Copy className="w-4 h-4" /> Clone current floor plan
        </h3>
        <p className="text-[11px] text-content-secondary">
          Independent copy with new IDs. Choose destination office, what to copy, and whether to
          publish immediately or keep as draft.
        </p>
        <p className="text-[11px] font-medium text-content-primary flex flex-wrap items-center gap-2">
          Source: {officeName} · {floorLabel}
          <VersionBadge state={versionSummary.state} label={versionSummary.label} />
          {floorPlan.clonedFromId ? (
            <span className="text-content-secondary">· was cloned from {floorPlan.clonedFromId}</span>
          ) : null}
        </p>
        <button
          type="button"
          onClick={() => setCloneOpen(true)}
          disabled={!canCloneFloorPlan}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Copy className="w-3.5 h-3.5" /> Clone floor plan…
        </button>
        {cloneMsg && (
          <p className="text-[11px] font-semibold text-success">{cloneMsg}</p>
        )}
      </div>

      <CloneFloorPlanDialog
        open={cloneOpen}
        sourcePlan={floorPlan}
        sourceFloorId={activeFloorId}
        sourceFloorLabel={floorLabel}
        floors={floors}
        defaultOfficeId={activeOfficeId}
        onClose={() => setCloneOpen(false)}
        onConfirm={handleCloneConfirm}
      />
    </div>
  );
};
