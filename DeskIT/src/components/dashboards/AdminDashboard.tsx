import React, { useState } from 'react';
import { FloorPlan, FloorPlanDraft } from '../../types/floorplan';
import { FloorPlanEditor } from '../floorplan/FloorPlanEditor';
import { StatCard } from '../common/StatCard';
import { MOCK_DRAFTS } from '../../data/mockData';
import {
  Edit3,
  Save,
  CheckCircle2,
  Building2
} from 'lucide-react';

interface AdminDashboardProps {
  floorPlan: FloorPlan;
  onSaveDraft: (fp: FloorPlan) => void;
  onPublish: (fp: FloorPlan) => void;
  activeTab: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  floorPlan,
  onSaveDraft,
  onPublish,
  activeTab,
}) => {
  const [drafts, setDrafts] = useState<FloorPlanDraft[]>(MOCK_DRAFTS);

  const handleSaveDraft = (fp: FloorPlan) => {
    onSaveDraft(fp);
    const newDraft: FloorPlanDraft = {
      id: `draft-${Date.now()}`,
      floorPlanId: fp.id,
      name: `Draft ${new Date().toLocaleTimeString()}`,
      updatedAt: new Date().toISOString(),
      data: fp,
    };
    setDrafts((prev) => [newDraft, ...prev]);
  };

  if (activeTab === 'drafts') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-light-text dark:text-dark-text">
              Saved Floor Plan Drafts & Revisions
            </h2>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
              Manage saved layout drafts, export maps, or restore previous layout versions.
            </p>
          </div>
        </div>

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
                  Desks: {d.data.desks.length} • Meeting Pods: {d.data.rooms.length} • Zones: {d.data.zones.length}
                </p>
              </div>

              <div className="pt-3 border-t border-light-border dark:border-dark-border flex gap-2">
                <button
                  onClick={() => onPublish(d.data)}
                  className="flex-1 py-2 px-3 rounded-xl bg-brandPurple-600 hover:bg-brandPurple-700 text-white font-bold text-xs transition"
                >
                  Publish Draft
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Floor Plans Built"
          value="3 Floors"
          subtitle="Floor 3, Floor 4, Floor 5"
          icon={Building2}
          colorScheme="purple"
        />
        <StatCard
          title="Total Canvas Desks"
          value={floorPlan.desks.length}
          subtitle="Interactive desk nodes"
          icon={Edit3}
          colorScheme="blue"
        />
        <StatCard
          title="Saved Layout Drafts"
          value={drafts.length}
          subtitle="LocalStorage persisted"
          icon={Save}
          colorScheme="emerald"
        />
        <StatCard
          title="Published Status"
          value="Live v1.4"
          subtitle="Available for Employee & HR views"
          icon={CheckCircle2}
          colorScheme="amber"
        />
      </div>

      {/* Interactive Admin Studio Editor Canvas */}
      <FloorPlanEditor
        initialFloorPlan={floorPlan}
        onSaveDraft={handleSaveDraft}
        onPublish={onPublish}
      />
    </div>
  );
};
