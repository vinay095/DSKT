import React, { useState } from 'react';
import { FloorPlan, DeskElement } from '../../types/floorplan';
import type { FloorOption, Office } from '../../types/office';
import { FloorDocumentV2 } from '../../types/floorDocument';
import { FloorPlanViewer } from '../floorplan/FloorPlanViewer';
import { PublishedFloorMap, MapElementSelection } from '../floorplan/PublishedFloorMap';
import { PropertiesPanel } from '../floorplan/PropertiesPanel';
import { MOCK_999_EMPLOYEES } from '../../data/employeesData';
import { EMPLOYEE_STATUS_CONFIG } from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../common/StatCard';
import { FindPeople } from '../people/FindPeople';
import type { GoToFloorMapArgs } from '../people/EmployeeDrawer';
import { desksForEmployee } from '../../lib/seatAssignment';
import { MapPin, Users, Sparkles, Building2 } from 'lucide-react';

interface EmployeeDashboardProps {
  floorPlan: FloorPlan;
  searchQuery: string;
  onSearchChange?: (q: string) => void;
  activeTab: string;
  activeFloor?: FloorOption;
  activeOffice?: Office;
  floors?: FloorOption[];
  publishedDocument?: FloorDocumentV2 | null;
  onGoToFloorMap?: (args: GoToFloorMapArgs) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  floorPlan,
  searchQuery,
  activeTab,
  activeFloor,
  floors = [],
  publishedDocument = null,
  onGoToFloorMap,
}) => {
  const { user } = useAuth();
  const [inspectedDesk, setInspectedDesk] = useState<DeskElement | null>(null);
  const [inspectedMapElement, setInspectedMapElement] = useState<MapElementSelection | null>(null);
  const [showGrid, setShowGrid] = useState(true);

  const myDesks = user
    ? desksForEmployee(floorPlan.desks, user.id, user.name)
    : [];
  const myDesk =
    myDesks[0] ||
    floorPlan.desks.find((d) => d.id === user?.assignedDeskId);
  const additionalDesks = myDesks.slice(1);
  const availableDesksCount = floorPlan.desks.filter((d) => d.status === 'available').length;
  const totalDesks = floorPlan.desks.length;
  const onSiteCount = MOCK_999_EMPLOYEES.filter((e) => e.status === 'green').length;

  if (activeTab === 'teammates') {
    return (
      <FindPeople
        searchQuery={searchQuery}
        floors={floors}
        currentFloorDesks={floorPlan.desks}
        currentFloor={activeFloor}
        onGoToFloorMap={onGoToFloorMap}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-6 rounded-xl bg-accent text-accent-foreground shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="px-2.5 py-1 rounded-md bg-white/15 text-xs font-semibold">
                Hello, {user?.name.split(' ')[0]}
              </span>
              <h2 className="text-2xl font-bold mt-2 tracking-tight">
                {myDesk
                  ? additionalDesks.length > 0
                    ? `Primary desk ${myDesk.code}`
                    : `Desk ${myDesk.code} Assigned Today`
                  : 'No Desk Assigned'}
              </h2>
              <p className="text-xs opacity-90 mt-1">
                {additionalDesks.length > 0
                  ? `Additional on this floor: ${additionalDesks.map((d) => d.code).join(', ')}`
                  : myDesk?.team
                    ? `Team: ${myDesk.team}`
                    : myDesk?.department
                      ? myDesk.department
                      : 'Use Find People to locate colleagues'}
              </p>
            </div>
            <div className="p-3 bg-white/10 rounded-lg">
              <MapPin className="w-8 h-8" />
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-xs opacity-90">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>
                {myDesk
                  ? [
                      myDesk.isStandingDesk && 'Standing Desk',
                      myDesk.hasMonitor && 'Monitor',
                    ]
                      .filter(Boolean)
                      .join(', ') || 'Standard workstation'
                  : 'Request a seat from HR to get started'}
              </span>
            </div>
            {myDesk && (
              <span className="font-semibold bg-white/15 px-3 py-1 rounded-md">
                Status:{' '}
                {myDesk.assignedUserStatus
                  ? EMPLOYEE_STATUS_CONFIG[myDesk.assignedUserStatus]?.label
                  : 'Assigned'}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <StatCard
            title="Floor Occupancy"
            value={`${totalDesks ? Math.round(((totalDesks - availableDesksCount) / totalDesks) * 100) : 0}%`}
            subtitle={`${availableDesksCount} desks free out of ${totalDesks}`}
            icon={Building2}
            colorScheme="blue"
          />
          <StatCard
            title="Teammates On Site"
            value={`${onSiteCount} / ${MOCK_999_EMPLOYEES.length}`}
            subtitle="Present across all offices"
            icon={Users}
            colorScheme="emerald"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-bold text-content-primary">Seat map</h3>
          <p className="text-xs text-content-secondary">
            View-only. Click a seat for details. Find colleagues via Find People.
          </p>
        </div>

        {publishedDocument ? (
          <div className="flex flex-col lg:flex-row gap-4 min-h-[min(55vh,520px)]">
            <PublishedFloorMap
              document={publishedDocument}
              desks={floorPlan.desks}
              showGrid={showGrid}
              onToggleGrid={() => setShowGrid((v) => !v)}
              onDeskClick={(desk) => {
                setInspectedMapElement(null);
                setInspectedDesk(desk);
              }}
              onEntityClick={(el) => {
                setInspectedDesk(null);
                setInspectedMapElement(el);
              }}
              onBackgroundClick={() => {
                setInspectedDesk(null);
                setInspectedMapElement(null);
              }}
              selectedDeskId={inspectedDesk?.id}
              selectedEntityId={inspectedMapElement?.objectId}
              searchQuery={searchQuery}
              compactChrome
              showMapLabels={false}
              className="flex-1 min-h-0 h-[min(55vh,560px)]"
            />
            <PropertiesPanel
              selectedDesk={inspectedDesk}
              selectedMapElement={inspectedMapElement}
              role="employee"
              desks={floorPlan.desks}
              floors={floors}
              onClose={() => {
                setInspectedDesk(null);
                setInspectedMapElement(null);
              }}
              floorContext={{
                building: floorPlan.building,
                floorName: floorPlan.name,
              }}
            />
          </div>
        ) : (
          <div className="min-h-[min(60vh,560px)]">
            <FloorPlanViewer floorPlan={floorPlan} searchQuery={searchQuery} />
          </div>
        )}
      </div>
    </div>
  );
};
