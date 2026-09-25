import React, { useMemo, useState } from 'react';
import { FloorPlan, DeskElement } from '../../types/floorplan';
import type { FloorOption, Office } from '../../types/office';
import { FloorDocumentV2 } from '../../types/floorDocument';
import { FloorPlanViewer } from '../floorplan/FloorPlanViewer';
import { PublishedFloorMap, MapElementSelection } from '../floorplan/PublishedFloorMap';
import { PropertiesPanel } from '../floorplan/PropertiesPanel';
import {
  MOCK_999_EMPLOYEES,
  LOCATION_COUNTS,
  DIRECTORY_LOCATION_FILTERS,
} from '../../data/employeesData';
import { EMPLOYEE_STATUS_CONFIG } from '../../types/database';
import { getOfficeById } from '../../data/offices';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../common/StatCard';
import { cn } from '../../lib/cn';
import { MapPin, Users, Sparkles, Building2, Filter } from 'lucide-react';

interface EmployeeDashboardProps {
  floorPlan: FloorPlan;
  searchQuery: string;
  onSearchChange?: (q: string) => void;
  activeTab: string;
  activeFloor?: FloorOption;
  activeOffice?: Office;
  floors?: FloorOption[];
  publishedDocument?: FloorDocumentV2 | null;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  floorPlan,
  searchQuery,
  activeTab,
  activeFloor,
  floors = [],
  publishedDocument = null,
}) => {
  const { user } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [inspectedDesk, setInspectedDesk] = useState<DeskElement | null>(null);
  const [inspectedMapElement, setInspectedMapElement] = useState<MapElementSelection | null>(null);
  const [showGrid, setShowGrid] = useState(true);

  const myDesk =
    floorPlan.desks.find((d) => d.assignedUserId === user?.id) ||
    floorPlan.desks.find((d) => d.id === user?.assignedDeskId);
  const availableDesksCount = floorPlan.desks.filter((d) => d.status === 'available').length;
  const totalDesks = floorPlan.desks.length;
  const onSiteCount = MOCK_999_EMPLOYEES.filter((e) => e.status === 'green').length;

  const floorByLocation = useMemo(() => {
    const map = new Map<string, FloorOption>();
    for (const f of floors) map.set(f.locationLabel, f);
    return map;
  }, [floors]);

  const filteredEmployees = MOCK_999_EMPLOYEES.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      emp.name.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q) ||
      emp.team.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.locations.some((loc) => loc.toLowerCase().includes(q));

    const matchesLoc =
      selectedLocation === 'all' || emp.locations.includes(selectedLocation);

    return matchesSearch && matchesLoc;
  });

  if (activeTab === 'teammates') {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-light-text dark:text-dark-text">
              People Directory ({LOCATION_COUNTS.totalEmployees} Employees)
            </h2>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
              Search anyone across all offices — not limited to the floor selected in the header.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {DIRECTORY_LOCATION_FILTERS.map((loc) => (
              <button
                key={loc.id}
                onClick={() => setSelectedLocation(loc.id)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition',
                  selectedLocation === loc.id
                    ? 'bg-brandBlue-600 text-white dark:bg-brandPurple-600 shadow'
                    : 'bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-sidebar',
                )}
              >
                <Filter className="w-3 h-3 opacity-70" />
                <span>{loc.label}</span>
                <span className="opacity-80 font-mono">({loc.count})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.slice(0, 60).map((emp) => {
            const primaryLoc = emp.locations[0];
            const matchedFloor = floorByLocation.get(primaryLoc);
            const office = matchedFloor
              ? getOfficeById(matchedFloor.officeId)
              : undefined;
            const onCurrentFloor =
              Boolean(activeFloor) &&
              emp.locations.includes(activeFloor!.locationLabel);
            const empDesk = onCurrentFloor
              ? floorPlan.desks.find(
                  (d) =>
                    d.assignedUserId === emp.emp_id || d.assignedUserName === emp.name,
                )
              : undefined;
            const statusMeta = EMPLOYEE_STATUS_CONFIG[emp.status];

            return (
              <div
                key={emp.emp_id}
                className="p-4 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm hover:shadow-md transition flex items-start gap-4"
              >
                <div className="relative">
                  <img
                    src={emp.avatar}
                    alt={emp.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-brandBlue-500/30 dark:ring-brandPurple-500/30"
                  />
                  <span
                    className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-dark-card ${statusMeta.dotColor}`}
                    title={statusMeta.label}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-bold text-sm text-light-text dark:text-dark-text truncate">
                      {emp.name}
                    </h4>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 border ${statusMeta.badgeBg} ${statusMeta.badgeText} ${statusMeta.badgeBorder}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
                  <p className="text-xs text-light-muted dark:text-dark-muted truncate">
                    {emp.team} • {emp.department}
                  </p>

                  <div className="mt-2 space-y-1 text-[10px] text-light-muted dark:text-dark-muted">
                    <p>
                      <span className="font-semibold text-light-text dark:text-dark-text">
                        Office:
                      </span>{' '}
                      {office?.name || primaryLoc}
                    </p>
                    <p>
                      <span className="font-semibold text-light-text dark:text-dark-text">
                        Floor:
                      </span>{' '}
                      {matchedFloor?.shortLabel || primaryLoc}
                    </p>
                    <p className="truncate font-mono">{emp.locations.join(' · ')}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-light-border dark:border-dark-border flex items-center justify-between text-xs">
                    <span className="text-light-muted dark:text-dark-muted">Seat:</span>
                    {empDesk ? (
                      <span className="font-bold text-brandBlue-600 dark:text-brandPurple-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> Desk {empDesk.code}
                      </span>
                    ) : onCurrentFloor ? (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        Unassigned here
                      </span>
                    ) : (
                      <span className="text-light-muted dark:text-dark-muted font-medium">
                        Switch office/floor to map seat
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-6 rounded-2xl bg-gradient-to-r from-brandBlue-600 to-brandBlue-700 dark:from-brandPurple-900 dark:to-brandPurple-950 text-white shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-md">
                Hello, {user?.name.split(' ')[0]}
              </span>
              <h2 className="text-2xl font-extrabold mt-2 tracking-tight">
                {myDesk ? `Desk ${myDesk.code} Assigned Today` : 'No Desk Assigned'}
              </h2>
              <p className="text-xs text-blue-100 dark:text-purple-200 mt-1">
                {myDesk?.team
                  ? `Team: ${myDesk.team}`
                  : myDesk?.department
                    ? myDesk.department
                    : 'Use the header to switch office or floor'}
              </p>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
              <MapPin className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-blue-100 dark:text-purple-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
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
              <span className="font-semibold bg-white/20 px-3 py-1 rounded-lg text-white">
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
            colorScheme="purple"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-bold text-light-text dark:text-dark-text">Seat map</h3>
          <p className="text-xs text-light-muted dark:text-dark-muted">
            View-only. Click a seat for details. Find colleagues via People Directory.
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
              className="flex-1 min-h-[min(50vh,480px)] h-[min(55vh,560px)]"
            />
            <PropertiesPanel
              selectedDesk={inspectedDesk}
              selectedMapElement={inspectedMapElement}
              role="employee"
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
