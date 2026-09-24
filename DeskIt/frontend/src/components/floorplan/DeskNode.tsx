import React from 'react';
import { DeskElement } from '../../types/floorplan';
import { EMPLOYEE_STATUS_CONFIG } from '../../types/database';

interface DeskNodeProps {
  desk: DeskElement;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
  gridSize?: number;
}

export const DeskNode: React.FC<DeskNodeProps> = ({
  desk,
  isSelected,
  isHighlighted,
  onClick,
  gridSize = 48,
}) => {
  const getStatusColor = () => {
    switch (desk.status) {
      case 'available':
        return {
          fill: 'fill-emerald-500/20 dark:fill-emerald-500/20',
          stroke: 'stroke-emerald-500',
          badge: 'bg-emerald-500',
          text: 'text-emerald-700 dark:text-emerald-400',
        };
      case 'occupied':
        return {
          fill: 'fill-brandBlue-500/20 dark:fill-brandPurple-500/20',
          stroke: 'stroke-brandBlue-600 dark:stroke-brandPurple-500',
          badge: 'bg-brandBlue-600 dark:bg-brandPurple-600',
          text: 'text-brandBlue-700 dark:text-brandPurple-300',
        };
      case 'reserved':
        return {
          fill: 'fill-amber-500/20 dark:fill-amber-500/20',
          stroke: 'stroke-amber-500',
          badge: 'bg-amber-500',
          text: 'text-amber-700 dark:text-amber-400',
        };
      case 'maintenance':
        return {
          fill: 'fill-slate-400/20 dark:fill-slate-600/20',
          stroke: 'stroke-slate-400 dark:stroke-slate-600',
          badge: 'bg-slate-400',
          text: 'text-slate-500 dark:text-slate-400',
        };
    }
  };

  const statusStyle = getStatusColor();
  const width = gridSize * 1.8;
  const height = gridSize * 1.2;

  const empStatusDot = desk.assignedUserStatus
    ? EMPLOYEE_STATUS_CONFIG[desk.assignedUserStatus]?.dotColor || 'bg-emerald-500'
    : 'bg-emerald-500';

  return (
    <g
      transform={`translate(${desk.x * gridSize}, ${desk.y * gridSize}) rotate(${desk.rotation})`}
      onClick={onClick}
      className={`cursor-pointer transition-all group ${
        isHighlighted ? 'scale-110' : ''
      }`}
    >
      {/* Selection Glow */}
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

      {/* Desk Main Box */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={8}
        className={`stroke-2 transition-all ${statusStyle.fill} ${statusStyle.stroke} ${
          isSelected ? 'stroke-[3px]' : ''
        } group-hover:stroke-brandBlue-500 dark:group-hover:stroke-brandPurple-400`}
      />

      {/* Chair representation */}
      <rect
        x={width / 2 - 12}
        y={height + 3}
        width={24}
        height={6}
        rx={3}
        className={`${statusStyle.stroke} fill-light-card dark:fill-dark-card stroke-2`}
      />

      {/* Employee Status Indicator Dot (6-Color system) */}
      {desk.assignedUserName && (
        <circle
          cx={6}
          cy={6}
          r={4}
          className={`${empStatusDot} stroke-white dark:stroke-dark-card stroke-1`}
        />
      )}

      {/* Temporary Seat Clock Indicator Badge */}
      {desk.isTemporary && (
        <g transform={`translate(4, ${height - 12})`}>
          <rect width={22} height={9} rx={3} className="fill-amber-500" />
          <text x={11} y={7} textAnchor="middle" className="text-[7px] font-extrabold fill-white">
            TEMP
          </text>
        </g>
      )}

      {/* Desk Code Label */}
      <text
        x={width / 2}
        y={16}
        textAnchor="middle"
        className="text-[11px] font-extrabold fill-light-text dark:fill-dark-text pointer-events-none"
      >
        {desk.code}
      </text>

      {/* Occupant Name or Status Text */}
      <text
        x={width / 2}
        y={30}
        textAnchor="middle"
        className="text-[9px] font-semibold fill-light-muted dark:fill-dark-muted pointer-events-none"
      >
        {desk.assignedUserName
          ? desk.assignedUserName.split(' ')[0]
          : desk.status.toUpperCase()}
      </text>

      {/* Small Feature Indicators (Standing Desk / Monitor) */}
      <g transform={`translate(${width - 16}, 4)`}>
        {desk.isStandingDesk && (
          <circle cx={4} cy={4} r={3} className="fill-brandBlue-500 dark:fill-brandPurple-400" />
        )}
      </g>
    </g>
  );
};
