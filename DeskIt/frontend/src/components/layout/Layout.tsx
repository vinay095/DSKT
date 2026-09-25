import React, { useEffect, useMemo, useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { FloorPlan, DeskElement } from '../../types/floorplan';
import { EmployeeDashboard } from '../dashboards/EmployeeDashboard';
import { HrDashboard } from '../dashboards/HrDashboard';
import { AdminDashboard } from '../dashboards/AdminDashboard';
import { FloorPlanViewer } from '../floorplan/FloorPlanViewer';
import { SsoLoginModal } from '../auth/SsoLoginModal';
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

const SIDEBAR_COLLAPSED_KEY = 'deskit_sidebar_collapsed';

export const Layout: React.FC = () => {
  const { user } = useAuth();
  const [floors, setFloors] = useState(() => getAllFloors());
  const [activeOfficeId, setActiveOfficeId] = useState<string>(DEFAULT_OFFICE_ID);
  const [activeFloorId, setActiveFloorId] = useState<string>(DEFAULT_FLOOR_ID);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
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

  const role = user?.role || 'employee';
  const activeFloor = useMemo(
    () => getFloorById(activeFloorId, floors),
    [activeFloorId, floors],
  );
  const activeOffice = useMemo(
    () => getOfficeById(activeOfficeId),
    [activeOfficeId],
  );

  useEffect(() => {
    setActiveTab('dashboard');
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
    setCurrentFloorPlan(fp);
    savePublishedToStorage(fp);
    if (fp.id !== activeFloorId) {
      applyFloorContext(fp.id, fp.officeId);
    }
  };

  const handleFloorsChanged = () => {
    setFloors(getAllFloors());
  };

  return (
    <div className="flex h-screen overflow-hidden bg-light-bg dark:bg-dark-bg">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onCollapsedChange={handleSidebarCollapsedChange}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          activeOfficeId={activeOfficeId}
          activeFloorId={activeFloorId}
          floors={floors}
          onOfficeChange={handleOfficeChange}
          onFloorChange={handleFloorChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <main
          className={
            role === 'admin' && activeTab === 'editor'
              ? 'flex-1 min-h-0 overflow-hidden p-3 sm:p-4 flex flex-col'
              : activeTab === 'floorplan'
                ? 'flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 flex flex-col'
                : 'flex-1 overflow-y-auto p-4 sm:p-6'
          }
        >
          {activeTab === 'floorplan' ? (
            role === 'hr' ? (
              <HrDashboard
                floorPlan={currentFloorPlan}
                searchQuery={searchQuery}
                onUpdateDesk={handleUpdateDesk}
                activeTab="floorplan"
                publishedDocument={publishedDoc}
              />
            ) : publishedDoc ? (
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
            ) : (
              <div className="flex-1 min-h-0 flex flex-col gap-3">
                <p className="text-xs text-light-muted dark:text-dark-muted shrink-0">
                  No published SVG map yet — showing desk layout. Admin can publish from Creator.
                </p>
                <div className="flex-1 min-h-[min(60vh,560px)]">
                  <FloorPlanViewer floorPlan={currentFloorPlan} searchQuery={searchQuery} />
                </div>
              </div>
            )
          ) : role === 'employee' ? (
            <EmployeeDashboard
              floorPlan={currentFloorPlan}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeTab={activeTab}
              activeFloor={activeFloor}
              activeOffice={activeOffice}
              floors={floors}
              publishedDocument={publishedDoc}
            />
          ) : role === 'hr' ? (
            <HrDashboard
              floorPlan={currentFloorPlan}
              searchQuery={searchQuery}
              onUpdateDesk={handleUpdateDesk}
              activeTab={activeTab}
              publishedDocument={publishedDoc}
            />
          ) : (
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
          )}
        </main>
      </div>

      <SsoLoginModal />
    </div>
  );
};
