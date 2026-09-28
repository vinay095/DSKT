import React, { useMemo } from 'react';
import { TEAMS, getTeamColor, type Team } from '../../data/teams';
import { cn } from '../../lib/cn';
import { SquareDashedMousePointer, X, Users, Eraser } from 'lucide-react';

export interface TeamAreaAssignBarProps {
  selectionMode: boolean;
  onToggleSelectionMode: () => void;
  selectedCount: number;
  onClearSelection: () => void;
  selectedTeamName: string;
  onSelectedTeamNameChange: (name: string) => void;
  onApplyTeam: () => void;
  onClearTeam: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * HR toolbar: toggle area-select, pick a team, apply / clear on selected seats.
 */
export const TeamAreaAssignBar: React.FC<TeamAreaAssignBarProps> = ({
  selectionMode,
  onToggleSelectionMode,
  selectedCount,
  onClearSelection,
  selectedTeamName,
  onSelectedTeamNameChange,
  onApplyTeam,
  onClearTeam,
  disabled = false,
  className,
}) => {
  const teamsByDept = useMemo(() => {
    const map = new Map<string, Team[]>();
    for (const t of TEAMS) {
      const list = map.get(t.departmentName) || [];
      list.push(t);
      map.set(t.departmentName, list);
    }
    return map;
  }, []);

  const previewColor = selectedTeamName
    ? getTeamColor(selectedTeamName)
    : '#94A3B8';

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm',
        className,
      )}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={onToggleSelectionMode}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border',
          selectionMode
            ? 'bg-brandBlue-600 dark:bg-brandPurple-600 text-white border-transparent'
            : 'bg-white dark:bg-dark-sidebar text-light-text dark:text-dark-text border-light-border dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-card',
        )}
        title="Drag a rectangle on the map to select seats; click seats to toggle"
      >
        <SquareDashedMousePointer className="w-3.5 h-3.5" aria-hidden />
        {selectionMode ? 'Selecting…' : 'Select area'}
      </button>

      {selectionMode && (
        <span className="text-[11px] text-light-muted dark:text-dark-muted">
          Drag to select · click to toggle · Esc clears
        </span>
      )}

      <div className="flex items-center gap-1.5 ml-auto flex-wrap">
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border',
            selectedCount > 0
              ? 'bg-brandBlue-50 dark:bg-brandPurple-950/40 text-brandBlue-700 dark:text-brandPurple-300 border-brandBlue-200 dark:border-brandPurple-700'
              : 'bg-slate-50 dark:bg-dark-sidebar text-light-muted dark:text-dark-muted border-light-border dark:border-dark-border',
          )}
        >
          <Users className="w-3 h-3" aria-hidden />
          {selectedCount} selected
        </span>

        {selectedCount > 0 && (
          <button
            type="button"
            onClick={onClearSelection}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-light-muted dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-dark-sidebar border border-transparent"
            title="Clear selection (Esc)"
          >
            <X className="w-3 h-3" aria-hidden />
            Clear
          </button>
        )}

        <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-light-muted dark:text-dark-muted">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
            style={{ backgroundColor: previewColor }}
            aria-hidden
          />
          Team
          <select
            value={selectedTeamName}
            onChange={(e) => onSelectedTeamNameChange(e.target.value)}
            disabled={disabled}
            className="ml-0.5 px-2 py-1.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-sidebar text-xs text-light-text dark:text-dark-text font-semibold min-w-[10rem]"
          >
            <option value="">Choose team…</option>
            {[...teamsByDept.entries()].map(([dept, teams]) => (
              <optgroup key={dept} label={dept}>
                {teams.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <button
          type="button"
          disabled={disabled || selectedCount === 0 || !selectedTeamName}
          onClick={onApplyTeam}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brandBlue-600 hover:bg-brandBlue-700 dark:bg-brandPurple-600 dark:hover:bg-brandPurple-700 text-white disabled:opacity-40 disabled:pointer-events-none transition"
        >
          Assign to team
        </button>

        <button
          type="button"
          disabled={disabled || selectedCount === 0}
          onClick={onClearTeam}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-light-border dark:border-dark-border bg-white dark:bg-dark-sidebar text-light-text dark:text-dark-text hover:bg-slate-50 dark:hover:bg-dark-card disabled:opacity-40 disabled:pointer-events-none transition"
          title="Remove team from selected seats"
        >
          <Eraser className="w-3.5 h-3.5" aria-hidden />
          Clear team
        </button>
      </div>
    </div>
  );
};
