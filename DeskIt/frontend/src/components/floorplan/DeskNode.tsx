import React from 'react';
import { DeskElement } from '../../types/floorplan';
import { EMPLOYEE_STATUS_CONFIG } from '../../types/database';
import {
  adaptiveLabelFontSize,
  maxLabelChars,
  truncateLabel,
} from '../../geometry/labels';
import type { ElementRenderState } from '../../lib/categoryStyles';
import { FloorObjectRenderer } from './renderers';

interface DeskNodeProps {
  desk: DeskElement;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
  gridSize?: number;
  /**
   * Team color for assignment indicators.
   * Never replaces desk status fill — use stripe / badge / outline only.
   */
  teamColor?: string;
  /** Show team indicators (stripe + badge + outline). No team name text on map. */
  showTeamIndicators?: boolean;
}

/**
 * Map labels = physical seat code only.
 * Employee / team / assignment details belong in PropertiesPanel after selection.
 */
export const DeskNode: React.FC<DeskNodeProps> = ({
  desk,
  isSelected,
  isHighlighted,
  onClick,
  gridSize = 48,
  teamColor,
  showTeamIndicators = false,
}) => {
  const renderState: ElementRenderState = isSelected
    ? 'selected'
    : desk.status;
  const width = gridSize * 1.8;
  const height = gridSize * 1.2;
  const showTeam = showTeamIndicators && Boolean(teamColor);
  const codeSize = adaptiveLabelFontSize(width, height, { ratio: 0.22, min: 8, max: 14 });
  const code = truncateLabel(desk.code, maxLabelChars(width, codeSize));

  const empStatusDot = desk.assignedUserStatus
    ? EMPLOYEE_STATUS_CONFIG[desk.assignedUserStatus]?.dotColor || 'bg-emerald-500'
    : 'bg-emerald-500';

  const labelGroup = `translate(${width / 2}, ${height / 2}) rotate(${-(desk.rotation || 0)}) scale(1, -1)`;

  return (
    <g
      transform={`translate(${desk.x * gridSize}, ${desk.y * gridSize}) rotate(${desk.rotation})`}
      onClick={onClick}
      className={`cursor-pointer transition-all group ${isHighlighted ? 'scale-110' : ''}`}
    >
      {(isSelected || isHighlighted) && (
        <rect
          x={-4}
          y={-4}
          width={width + 8}
          height={height + 8}
          rx={12}
          className="fill-none stroke-brandBlue-500 dark:stroke-brandPurple-400 stroke-2 animate-pulse"
        />
      )}

      {showTeam && (
        <rect
          x={-2.5}
          y={-2.5}
          width={width + 5}
          height={height + 5}
          rx={10}
          fill="none"
          stroke={teamColor}
          strokeWidth={2}
          strokeOpacity={0.85}
        />
      )}

      <g className="transition-opacity group-hover:opacity-90">
        <FloorObjectRenderer
          width={width}
          height={height}
          category="workstation"
          elementType="desk"
          renderState={renderState}
        />
      </g>

      {showTeam && (
        <>
          <rect x={0} y={0} width={5} height={height} rx={2} style={{ fill: teamColor }} />
          <circle
            cx={width - 8}
            cy={8}
            r={5}
            style={{ fill: teamColor }}
            className="stroke-white dark:stroke-dark-card"
            strokeWidth={1.5}
          />
        </>
      )}

      {desk.assignedUserName && (
        <circle
          cx={showTeam ? 12 : 6}
          cy={6}
          r={4}
          className={`${empStatusDot} stroke-white dark:stroke-dark-card stroke-1`}
        />
      )}

      {desk.isTemporary && (
        <g transform={`translate(4, ${height - 12}) rotate(${-(desk.rotation || 0)}) scale(1, -1)`}>
          <rect x={0} y={-9} width={22} height={9} rx={3} className="fill-amber-500" />
          <text x={11} y={-2} textAnchor="middle" className="text-[7px] font-extrabold fill-white">
            TEMP
          </text>
        </g>
      )}

      <g transform={labelGroup} pointerEvents="none" style={{ userSelect: 'none' }}>
        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={codeSize}
          className="font-extrabold fill-light-text dark:fill-dark-text"
        >
          {code}
        </text>
      </g>

      <g transform={`translate(${width - 16}, ${showTeam ? 16 : 4})`}>
        {desk.isStandingDesk && (
          <circle cx={4} cy={4} r={3} className="fill-brandBlue-500 dark:fill-brandPurple-400" />
        )}
      </g>
    </g>
  );
};
