import React, { useState } from 'react';
import { FloorPlan } from '../../types/floorplan';
import { FloorPlanViewer } from '../floorplan/FloorPlanViewer';
import { MOCK_999_EMPLOYEES, LOCATION_COUNTS } from '../../data/employeesData';
import { EMPLOYEE_STATUS_CONFIG } from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../common/StatCard';
import {
  MapPin,
  Users,
  Sparkles,
  Building2,
  Filter
} from 'lucide-react';

interface EmployeeDashboardProps {
  floorPlan: FloorPlan;
  searchQuery: string;
  onSearchChange?: (q: string) => void;
  activeTab: string;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  floorPlan,
  searchQuery,
  activeTab,
}) => {
  const { user } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  const myDesk = floorPlan.desks.find((d) => d.assignedUserId === user?.id || d.code === 'A-104');
  const availableDesksCount = floorPlan.desks.filter((d) => d.status === 'available').length;
  const totalDesks = floorPlan.desks.length;

  const filteredEmployees = MOCK_999_EMPLOYEES.filter((emp) => {
    const matchesSearch =
      !searchQuery ||
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());

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
              Colleague Directory & Seat Finder (999 Employees)
            </h2>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
              Locate colleagues across Noida 6th Floor (333), Noida 4th Floor (333), and Hyderabad Office (350).
            </p>
          </div>

          {/* Location Filter Dropdown / Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Offices', count: LOCATION_COUNTS.totalEmployees },
              { id: 'Noida 6th Floor', label: 'Noida 6th', count: LOCATION_COUNTS.noida6th },
              { id: 'Noida 4th Floor', label: 'Noida 4th', count: LOCATION_COUNTS.noida4th },
              { id: 'Hyderabad Office', label: 'Hyderabad', count: LOCATION_COUNTS.hyderabad },
            ].map((loc) => (
              <button
                key={loc.id}
                onClick={() => setSelectedLocation(loc.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  selectedLocation === loc.id
                    ? 'bg-brandBlue-600 text-white dark:bg-brandPurple-600 shadow'
                    : 'bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-sidebar'
                }`}
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
            const empDesk = floorPlan.desks.find(
              (d) => d.assignedUserId === emp.emp_id || d.assignedUserName === emp.name
            );
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
                  <p className="text-[10px] text-light-muted dark:text-dark-muted font-mono mt-0.5 truncate">
                    📍 {emp.locations.join(', ')}
                  </p>

                  <div className="mt-3 pt-2 border-t border-light-border dark:border-dark-border flex items-center justify-between text-xs">
                    <span className="text-light-muted dark:text-dark-muted">Seating Position:</span>
                    {empDesk ? (
                      <span className="font-bold text-brandBlue-600 dark:text-brandPurple-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> Desk {empDesk.code}
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">Unassigned</span>
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
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* My Seat Card */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-gradient-to-r from-brandBlue-600 to-brandBlue-700 dark:from-brandPurple-900 dark:to-brandPurple-950 text-white shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-md">
                👋 Hello, {user?.name.split(' ')[0]}
              </span>
              <h2 className="text-2xl font-extrabold mt-2 tracking-tight">
                Desk {myDesk ? myDesk.code : 'A-104'} Assigned Today
              </h2>
              <p className="text-xs text-blue-100 dark:text-purple-200 mt-1">
                {floorPlan.name} • Engineering Squad Zone A
              </p>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
              <MapPin className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-blue-100 dark:text-purple-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Features: Standing Desk, Dual Monitor, Window View</span>
            </div>
            <span className="font-semibold bg-white/20 px-3 py-1 rounded-lg text-white">
              Status: Checked In
            </span>
          </div>
        </div>

        {/* Available Seats Summary */}
        <div className="space-y-4">
          <StatCard
            title="Floor Occupancy"
            value={`${Math.round(((totalDesks - availableDesksCount) / totalDesks) * 100)}%`}
            subtitle={`${availableDesksCount} desks free out of ${totalDesks}`}
            icon={Building2}
            colorScheme="blue"
          />
          <StatCard
            title="Teammates On Site"
            value={`${MOCK_999_EMPLOYEES.length - 12} / ${MOCK_999_EMPLOYEES.length}`}
            subtitle="Across Noida & Hyderabad Branches"
            icon={Users}
            colorScheme="purple"
          />
        </div>
      </div>

      {/* Interactive Floor Map Viewer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-light-text dark:text-dark-text">
              Interactive Office Seating Map
            </h3>
            <p className="text-xs text-light-muted dark:text-dark-muted">
              Click any desk to view who is sitting there and check seat hardware specs.
            </p>
          </div>
        </div>

        <FloorPlanViewer floorPlan={floorPlan} searchQuery={searchQuery} />
      </div>
    </div>
  );
};
