import React, { useState } from 'react';
import { FloorPlan } from '../../types/floorplan';
import { FloorPlanViewer } from '../floorplan/FloorPlanViewer';
import { ALL_EMPLOYEES } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../common/StatCard';
import {
  MapPin,
  Users,
  Sparkles,
  Building2
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
  const [selectedDept, setSelectedDept] = useState<string>('all');

  const myDesk = floorPlan.desks.find((d) => d.assignedUserId === user?.id || d.code === 'A-104');
  const availableDesksCount = floorPlan.desks.filter((d) => d.status === 'available').length;
  const totalDesks = floorPlan.desks.length;

  const filteredEmployees = ALL_EMPLOYEES.filter((emp) => {
    const matchesSearch =
      !searchQuery ||
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'all' || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  if (activeTab === 'teammates') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-light-text dark:text-dark-text">
              Colleague Directory & Seat Finder
            </h2>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
              Locate where your teammates are sitting today across all floors.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedDept('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                selectedDept === 'all'
                  ? 'bg-brandBlue-600 text-white dark:bg-brandPurple-600'
                  : 'bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text'
              }`}
            >
              All Colleagues ({ALL_EMPLOYEES.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const empDesk = floorPlan.desks.find((d) => d.assignedUserId === emp.id || d.assignedUserName === emp.name);
            return (
              <div
                key={emp.id}
                className="p-4 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm hover:shadow-md transition flex items-start gap-4"
              >
                <img
                  src={emp.avatar}
                  alt={emp.name}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-brandBlue-500/30 dark:ring-brandPurple-500/30"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-light-text dark:text-dark-text">
                    {emp.name}
                  </h4>
                  <p className="text-xs text-light-muted dark:text-dark-muted">{emp.title}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-brandBlue-50 text-brandBlue-700 dark:bg-brandPurple-950/50 dark:text-brandPurple-300 border border-brandBlue-200 dark:border-brandPurple-800">
                    {emp.department}
                  </span>

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
            value={`${ALL_EMPLOYEES.length - 2} / ${ALL_EMPLOYEES.length}`}
            subtitle="Department Engineering & Product"
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
