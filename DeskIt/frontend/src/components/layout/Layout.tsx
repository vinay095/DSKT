import React, { useEffect, useMemo, useState } from 'react';
import { AppShell } from './AppShell';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { usePermissions } from '../../hooks/usePermissions';
import { FloorPlan, DeskElement } from '../../types/floorplan';
import { EmployeeDashboard } from '../dashboards/EmployeeDashboard';
import { HrDashboard } from '../dashboards/HrDashboard';
import { AdminDashboard } from '../dashboards/AdminDashboard';
import { FloorPlanViewer } from '../floorplan/FloorPlanViewer';
import { SsoLoginModal } from '../auth/SsoLoginModal';
import { AccessDenied } from '../common/AccessDenied';
import { loadPublishedFromStorage, savePublishedToStorage } from '../../lib/drafts';
import { DEFAULT_FLOOR_ID, DEFAULT_OFFICE_ID, getFloorById, getOfficeById } from '../../data/offices';
import { getAllFloors } from '../../data/floors';
import { FloorDocumentV2 } from '../../types/floorDocument';
import {
  floorDocumentToFloorPlan,
  loadPublishedFloorDocument,
  savePublishedFloorDocument,
} from '../../lib/publishedFloor';
import { PublishedFloorMap } from '../floorplan/PublishedFloorMap';
import { DEFAULT_TAB } from '../../lib/permissions';

const SIDEBAR_COLLAPSED_KEY = 'deskit_sidebar_collapsed';

const PAGE_LABELS: Record<string, string> = {
  dashboard: 'Overview',
  floorplan: 'Floor Maps',
  teammates: 'Find People',
  people: 'People & Teams',
  assignments: 'Seat Allocation',
  requests: 'Seat Requests',
  editor: 'Floor Plan Editor',
  drafts: 'Drafts & Versions',
  'change-requests': 'Change Requests',
};

export const Layout: React.FC = () => {
  const {
    role,
    canAccessTab,
    canAllocateSeat,
    canPublishFloorPlan,
    canCloneFloorPlan,
    canAccessHrTools,
    canAccessAdminTools,
    canEditFloorPlan,
    guard,
  } = usePermissions();

  const [floors, setFloors] = useState(() => getAllFloors());
  const [activeOfficeId, setActiveOfficeId] = useState<string>(DEFAULT_OFFICE_ID);
  const [activeFloorId, setActiveFloorId] = useState<string>(DEFAULT_FLOOR_ID);
  const [activeTab, setActiveTab] = useState<string>(DEFAULT_TAB);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [currentFloorPlan, setCurrentFloorPlan] = useState<FloorPlan>(() =>
    loadPublishedFromStorage(DEFAULT_FLOOR_ID),
  );
  const [publishedDoc, setPublishedDoc] = useState<FloorDocumentV2 | null>(() =>
    loadPublishedFloorDocument(DEFAULT_FLOOR_ID),
  );
  const [publishedShowGrid, setPublishedShowGrid] = useState(true);

  const activeFloor = useMemo(
    () => getFloorById(activeFloorId, floors),
    [activeFloorId, floors],
  );
  const activeOffice = useMemo(
    () => getOfficeById(activeOfficeId),
    [activeOfficeId],
  );

  /** Reset / clamp tab when role changes or tab is not allowed. */
  useEffect(() => {
    if (!canAccessTab(activeTab)) {
      setActiveTab(DEFAULT_TAB);
    }
  }, [role, activeTab, canAccessTab]);

  useEffect(() => {
    setActiveTab(DEFAULT_TAB);
  }, [role]);

  const applyFloorContext = (floorId: string, officeId?: string) => {
    const floorMeta = getFloorById(floorId, getAllFloors());
    const nextOffice = officeId || floorMeta?.officeId || DEFAULT_OFFICE_ID;
    setActiveFloorId(floorId);
    setActiveOfficeId(nextOffice);

    const legacyPlan = loadPublishedFromStorage(floorId);
    const doc = loadPublishedFloorDocument(floorId);
    setPublishedDoc(doc);
    if (doc) {
      const next = floorDocumentToFloorPlan(doc, legacyPlan, {
        floorId,
        officeId: nextOffice,
        building: getOfficeById(nextOffice)?.name,
      });
      setCurrentFloorPlan(next);
      savePublishedToStorage(next);
    } else {
      setCurrentFloorPlan(legacyPlan);
    }
  };

  useEffect(() => {
    applyFloorContext(DEFAULT_FLOOR_ID, DEFAULT_OFFICE_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreatorPublished = (doc: FloorDocumentV2) => {
    if (!guard('canPublishFloorPlan', 'publish creator floor document')) return;
    savePublishedFloorDocument(doc, activeFloorId);
    setPublishedDoc(doc);
    setCurrentFloorPlan((prev) => {
      const next = floorDocumentToFloorPlan(doc, prev, {
        floorId: activeFloorId,
        officeId: activeOfficeId,
        building: activeOffice?.name,
      });
      savePublishedToStorage(next);
      return next;
    });
  };

  const handleSidebarCollapsedChange = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  const handleTabChange = (tab: string) => {
    if (!canAccessTab(tab)) return;
    setActiveTab(tab);
  };

  const handleOfficeChange = (officeId: string) => {
    setActiveOfficeId(officeId);
    const officeFloors = floors.filter((f) => f.officeId === officeId);
    const nextFloor = officeFloors.find((f) => f.id === activeFloorId) || officeFloors[0];
    if (nextFloor) applyFloorContext(nextFloor.id, officeId);
  };

  const handleFloorChange = (floorId: string) => {
    applyFloorContext(floorId);
  };

  const handleUpdateDesk = (updatedDesk: DeskElement) => {
    if (!guard('canAllocateSeat', 'update seat assignment')) return;
    setCurrentFloorPlan((prev) => {
      const exists = prev.desks.some((d) => d.id === updatedDesk.id);
      const updated: FloorPlan = {
        ...prev,
        desks: exists
          ? prev.desks.map((d) => (d.id === updatedDesk.id ? updatedDesk : d))
          : [...prev.desks, updatedDesk],
        lastModified: new Date().toISOString(),
      };
      savePublishedToStorage(updated);
      return updated;
    });
  };

  const handlePublishFloorPlan = (fp: FloorPlan) => {
    // AdminDashboard uses this for publish and clone-apply.
    if (!canPublishFloorPlan && !canCloneFloorPlan) {
      guard('canPublishFloorPlan', 'publish or apply floor plan');
      return;
    }

    setCurrentFloorPlan(fp);
    savePublishedToStorage(fp);
    if (fp.id !== activeFloorId) {
      applyFloorContext(fp.id, fp.officeId);
    }
  };

  const handleFloorsChanged = () => {
    setFloors(getAllFloors());
  };

  /** Navigate to a floor map from people/team discovery. */
  const handleGoToFloorMap = (args: {
    floorId?: string;
    locationLabel?: string;
    employeeName?: string;
  }) => {
    if (args.floorId) {
      applyFloorContext(args.floorId);
    } else if (args.locationLabel) {
      const match = floors.find((f) => f.locationLabel === args.locationLabel);
      if (match) applyFloorContext(match.id, match.officeId);
    }
    if (args.employeeName) {
      setSearchQuery(args.employeeName);
    }
    if (canAccessTab('floorplan')) {
      setActiveTab('floorplan');
    }
  };

  const handleStartAssignFromPeople = (employeeName: string) => {
    setSearchQuery(employeeName);
    if (canAccessTab('assignments')) {
      setActiveTab('assignments');
    }
  };

  const mainClassName =
    canEditFloorPlan && activeTab === 'editor'
      ? 'min-h-0 overflow-hidden p-3 sm:p-4 flex flex-col'
      : activeTab === 'floorplan'
        ? 'min-h-0 overflow-y-auto p-4 sm:p-6 flex flex-col'
        : undefined;

  const renderContent = () => {
    if (!canAccessTab(activeTab)) {
      return (
        <AccessDenied description="This section is not available for your current role. Switch role from the header if you are demoing." />
      );
    }

    if (activeTab === 'floorplan') {
      if (canAllocateSeat) {
        return (
          <HrDashboard
            floorPlan={currentFloorPlan}
            searchQuery={searchQuery}
            onUpdateDesk={handleUpdateDesk}
            activeTab="floorplan"
            publishedDocument={publishedDoc}
            floors={floors}
            activeFloor={activeFloor}
            onGoToFloorMap={handleGoToFloorMap}
            onStartAssignFromPeople={handleStartAssignFromPeople}
          />
        );
      }
      if (publishedDoc) {
        return (
          <div className="flex-1 min-h-[min(70vh,640px)] flex flex-col">
            <PublishedFloorMap
              document={publishedDoc}
              desks={currentFloorPlan.desks}
              showGrid={publishedShowGrid}
              onToggleGrid={() => setPublishedShowGrid((v) => !v)}
              searchQuery={searchQuery}
              compactChrome
              className="flex-1 min-h-[min(60vh,560px)]"
            />
          </div>
        );
      }
      return (
        <div className="flex-1 min-h-0 flex flex-col gap-3">
          <p className="text-xs text-content-secondary shrink-0">
            No published SVG map yet — showing desk layout. Admin can publish from Creator.
          </p>
          <div className="flex-1 min-h-[min(60vh,560px)]">
            <FloorPlanViewer floorPlan={currentFloorPlan} searchQuery={searchQuery} />
          </div>
        </div>
      );
    }

    if (canAccessHrTools) {
      return (
        <HrDashboard
          floorPlan={currentFloorPlan}
          searchQuery={searchQuery}
          onUpdateDesk={handleUpdateDesk}
          activeTab={activeTab}
          publishedDocument={publishedDoc}
          floors={floors}
          activeFloor={activeFloor}
          onGoToFloorMap={handleGoToFloorMap}
          onStartAssignFromPeople={handleStartAssignFromPeople}
        />
      );
    }

    if (canAccessAdminTools) {
      return (
        <AdminDashboard
          floorPlan={currentFloorPlan}
          onPublish={handlePublishFloorPlan}
          onCreatorPublished={handleCreatorPublished}
          activeTab={activeTab}
          activeFloorId={activeFloorId}
          activeOfficeId={activeOfficeId}
          floors={floors}
          onFloorChange={handleFloorChange}
          onFloorsChanged={handleFloorsChanged}
        />
      );
    }

    return (
      <EmployeeDashboard
        floorPlan={currentFloorPlan}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        activeFloor={activeFloor}
        activeOffice={activeOffice}
        floors={floors}
        publishedDocument={publishedDoc}
        onGoToFloorMap={handleGoToFloorMap}
      />
    );
  };

  return (
    <>
      <AppShell
        mainClassName={mainClassName}
        sidebar={
          <Sidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            collapsed={sidebarCollapsed}
            onCollapsedChange={handleSidebarCollapsedChange}
          />
        }
        header={
          <Navbar
            activeOfficeId={activeOfficeId}
            activeFloorId={activeFloorId}
            floors={floors}
            onOfficeChange={handleOfficeChange}
            onFloorChange={handleFloorChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            pageLabel={PAGE_LABELS[activeTab]}
          />
        }
      >
        {renderContent()}
      </AppShell>

      <SsoLoginModal />
    </>
  );
};
