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
import { PublishedFloorMap, type MapElementSelection } from '../floorplan/PublishedFloorMap';
import { PropertiesPanel } from '../floorplan/PropertiesPanel';
import { PageHeader } from '../common/PageHeader';
import { AdminFloorWorkflow } from '../admin/AdminFloorWorkflow';
import { FloorPlanRegistry } from '../admin/FloorPlanRegistry';
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

const ADMIN_PAGE_LABELS: Partial<Record<string, string>> = {
  dashboard: 'Admin Overview',
  floorplan: 'Published Maps',
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
  const [viewDesk, setViewDesk] = useState<DeskElement | null>(null);
  const [viewMapElement, setViewMapElement] = useState<MapElementSelection | null>(null);

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

  /** Bulk desk update (e.g. area-select → assign team). Single localStorage write. */
  const handleUpdateDesks = (updatedDesks: DeskElement[]) => {
    if (!guard('canAllocateSeat', 'update seat assignments')) return;
    if (!updatedDesks.length) return;
    setCurrentFloorPlan((prev) => {
      const byId = new Map(updatedDesks.map((d) => [d.id, d]));
      const seen = new Set<string>();
      const desks = prev.desks.map((d) => {
        const next = byId.get(d.id);
        if (next) {
          seen.add(d.id);
          return next;
        }
        return d;
      });
      for (const d of updatedDesks) {
        if (!seen.has(d.id) && !prev.desks.some((x) => x.id === d.id)) {
          desks.push(d);
        }
      }
      const updated: FloorPlan = {
        ...prev,
        desks,
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
            onUpdateDesks={handleUpdateDesks}
            activeTab="floorplan"
            publishedDocument={publishedDoc}
            floors={floors}
            activeFloor={activeFloor}
            onGoToFloorMap={handleGoToFloorMap}
            onStartAssignFromPeople={handleStartAssignFromPeople}
            onNavigateTab={handleTabChange}
          />
        );
      }

      const mapPane = publishedDoc ? (
        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-[min(65vh,600px)]">
          <PublishedFloorMap
            document={publishedDoc}
            desks={currentFloorPlan.desks}
            showGrid={publishedShowGrid}
            onToggleGrid={() => setPublishedShowGrid((v) => !v)}
            searchQuery={searchQuery}
            compactChrome
            showHoverTooltip
            onDeskClick={(desk) => {
              setViewMapElement(null);
              setViewDesk(desk);
            }}
            onEntityClick={(el) => {
              setViewDesk(null);
              setViewMapElement(el);
            }}
            onBackgroundClick={() => {
              setViewDesk(null);
              setViewMapElement(null);
            }}
            selectedDeskId={viewDesk?.id}
            selectedEntityId={viewMapElement?.objectId}
            className="flex-1 min-h-0 h-[min(65vh,600px)]"
          />
          <PropertiesPanel
            selectedDesk={viewDesk}
            selectedMapElement={viewMapElement}
            desks={currentFloorPlan.desks}
            floors={floors}
            onClose={() => {
              setViewDesk(null);
              setViewMapElement(null);
            }}
            floorContext={{
              building: activeOffice?.name || currentFloorPlan.building,
              floorName: activeFloor?.shortLabel || currentFloorPlan.name,
            }}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col gap-3">
          <p className="text-xs text-content-secondary shrink-0">
            No published SVG map yet for this floor — showing desk layout. Publish from Creator
            (Preview → Publish) to go live.
          </p>
          <div className="flex-1 min-h-0 h-[min(60vh,560px)]">
            <FloorPlanViewer floorPlan={currentFloorPlan} searchQuery={searchQuery} />
          </div>
        </div>
      );

      if (canAccessAdminTools) {
        return (
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            <PageHeader
              title="Published maps"
              description="Live SVG maps for Employee & HR. Switch floors in the header or registry below."
            />
            <AdminFloorWorkflow
              currentStep="published"
              officeLabel={activeOffice?.name}
              floorLabel={activeFloor?.shortLabel || currentFloorPlan.name}
              onNavigateTab={handleTabChange}
            />
            <p className="text-[11px] text-content-secondary -mt-2">
              Live published map only — drafts are not visible here. Publish from Drafts &amp;
              Versions or Creator Preview to update viewers.
            </p>
            <FloorPlanRegistry
              floors={floors}
              activeFloorId={activeFloorId}
              onSelectFloor={handleFloorChange}
              onNavigateTab={handleTabChange}
            />
            {mapPane}
          </div>
        );
      }

      return mapPane;
    }

    if (canAccessHrTools) {
      return (
        <HrDashboard
          floorPlan={currentFloorPlan}
          searchQuery={searchQuery}
          onUpdateDesk={handleUpdateDesk}
          onUpdateDesks={handleUpdateDesks}
          activeTab={activeTab}
          publishedDocument={publishedDoc}
          floors={floors}
          activeFloor={activeFloor}
          onGoToFloorMap={handleGoToFloorMap}
          onStartAssignFromPeople={handleStartAssignFromPeople}
          onNavigateTab={handleTabChange}
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
          onNavigateTab={handleTabChange}
          hasSvgMap={Boolean(publishedDoc)}
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
            pageLabel={
              canAccessAdminTools
                ? ADMIN_PAGE_LABELS[activeTab] || PAGE_LABELS[activeTab]
                : PAGE_LABELS[activeTab]
            }
          />
        }
      >
        {renderContent()}
      </AppShell>

      <SsoLoginModal />
    </>
  );
};
