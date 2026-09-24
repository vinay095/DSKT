import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { FloorPlan, DeskElement } from '../../types/floorplan';
import { EmployeeDashboard } from '../dashboards/EmployeeDashboard';
import { HrDashboard } from '../dashboards/HrDashboard';
import { AdminDashboard } from '../dashboards/AdminDashboard';
import { FloorPlanViewer } from '../floorplan/FloorPlanViewer';
import { SsoLoginModal } from '../auth/SsoLoginModal';
import { loadPublishedFromStorage, savePublishedToStorage, saveDraftToStorage } from '../../lib/drafts';

export const Layout: React.FC = () => {
  const { user } = useAuth();
  const [activeFloorId, setActiveFloorId] = useState<string>('floor-4');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentFloorPlan, setCurrentFloorPlan] = useState<FloorPlan>(() =>
    loadPublishedFromStorage('floor-4')
  );

  const role = user?.role || 'employee';

  const handleFloorChange = (floorId: string) => {
    setActiveFloorId(floorId);
    setCurrentFloorPlan(loadPublishedFromStorage(floorId));
  };

  const handleUpdateDesk = (updatedDesk: DeskElement) => {
    setCurrentFloorPlan((prev) => {
      const updated: FloorPlan = {
        ...prev,
        desks: prev.desks.map((d) => (d.id === updatedDesk.id ? updatedDesk : d)),
        lastModified: new Date().toISOString(),
      };
      savePublishedToStorage(updated);
      return updated;
    });
  };

  const handleSaveDraft = (fp: FloorPlan) => {
    saveDraftToStorage(fp);
  };

  const handlePublishFloorPlan = (fp: FloorPlan) => {
    setCurrentFloorPlan(fp);
    savePublishedToStorage(fp);
  };

  return (
    <div className="min-h-screen flex flex-col bg-light-bg text-light-text dark:bg-dark-bg dark:text-dark-text transition-colors duration-200">
      {/* Top Sticky Navbar */}
      <Navbar
        activeFloorId={activeFloorId}
        onFloorChange={handleFloorChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Dynamic Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Workspace Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'floorplan' ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-light-text dark:text-dark-text">
                  Live Published Floor Plan Map
                </h2>
                <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
                  Interactive seating map view for {currentFloorPlan.name}.
                </p>
              </div>
              <FloorPlanViewer floorPlan={currentFloorPlan} searchQuery={searchQuery} />
            </div>
          ) : role === 'employee' ? (
            <EmployeeDashboard
              floorPlan={currentFloorPlan}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeTab={activeTab}
            />
          ) : role === 'hr' ? (
            <HrDashboard
              floorPlan={currentFloorPlan}
              searchQuery={searchQuery}
              onUpdateDesk={handleUpdateDesk}
              activeTab={activeTab}
            />
          ) : (
            <AdminDashboard
              floorPlan={currentFloorPlan}
              onSaveDraft={handleSaveDraft}
              onPublish={handlePublishFloorPlan}
              activeTab={activeTab}
            />
          )}
        </main>
      </div>

      {/* SSO Login Modal */}
      <SsoLoginModal />
    </div>
  );
};
