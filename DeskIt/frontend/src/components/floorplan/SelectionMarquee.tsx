import React from 'react';
import { CellCoord, FloorConfig } from '../../types/geometry';
import { DEFAULT_FLOOR_CONFIG, finestCellToWorld } from '../../geometry/grid';

interface SelectionMarqueeProps {
  startCell: CellCoord | null;
  currentCell: CellCoord | null;
  floorConfig?: FloorConfig;
  onConvertSelection?: (type: 'zone' | 'unusable' | 'room', name: string) => void;
}

export const SelectionMarquee: React.FC<SelectionMarqueeProps> = ({
  startCell,
  currentCell,
  floorConfig = DEFAULT_FLOOR_CONFIG,
}) => {
  if (!startCell || !currentCell) return null;

  const minCol = Math.min(startCell.col, currentCell.col);
  const maxCol = Math.max(startCell.col, currentCell.col) + 4; // snap to a/4 placement cells
  const minRow = Math.min(startCell.row, currentCell.row);
  const maxRow = Math.max(startCell.row, currentCell.row) + 4;

  const originWorld = finestCellToWorld({ col: minCol, row: minRow }, floorConfig);
  const widthWorld = ((maxCol - minCol) / 16) * floorConfig.a;
  const heightWorld = ((maxRow - minRow) / 16) * floorConfig.a;

  return (
    <g className="selection-marquee pointer-events-none">
      <rect
        x={originWorld.worldX}
        y={originWorld.worldY}
        width={widthWorld}
        height={heightWorld}
        rx={6}
        className="fill-brandPurple-500/20 stroke-brandPurple-600 stroke-2 stroke-dasharray-4 animate-pulse"
      />
      <g transform={`translate(${originWorld.worldX + widthWorld / 2}, ${originWorld.worldY + heightWorld / 2}) scale(1, -1)`}>
        <text
          textAnchor="middle"
          dominantBaseline="central"
          className="text-xs font-extrabold fill-brandPurple-700 dark:fill-brandPurple-300 pointer-events-none"
        >
          Selected Area ({Math.round(widthWorld / 16)}x{Math.round(heightWorld / 16)})
        </text>
      </g>
    </g>
  );
};
