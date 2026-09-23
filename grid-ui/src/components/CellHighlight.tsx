import React from 'react';
import type { CellRef, FloorConfig } from '../types/geometry';
import { cellToWorldRect, isCellOnFloor } from '../geometry/grid';

interface CellHighlightProps {
  hoveredCell: CellRef | null;
  selectedCells: CellRef[];
  floor: FloorConfig;
  a: number;
}

const CellHighlight: React.FC<CellHighlightProps> = ({
  hoveredCell,
  selectedCells,
  floor,
  a,
}) => {
  const selectedKeys = new Set(
    selectedCells.map((c) => `${c.level}:${c.col}:${c.row}`),
  );

  const hoverOnFloor =
    hoveredCell &&
    isCellOnFloor(hoveredCell, floor) &&
    !selectedKeys.has(`${hoveredCell.level}:${hoveredCell.col}:${hoveredCell.row}`);

  return (
    <g id="cell-highlight" pointerEvents="none">
      {hoverOnFloor &&
        (() => {
          const r = cellToWorldRect(hoveredCell!, a);
          return (
            <rect
              x={r.x}
              y={r.y}
              width={r.width}
              height={r.height}
              className="cell-hover"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          );
        })()}

      {selectedCells.filter((c) => isCellOnFloor(c, floor)).map((cell) => {
        const r = cellToWorldRect(cell, a);
        return (
          <rect
            key={`${cell.level}:${cell.col}:${cell.row}`}
            x={r.x}
            y={r.y}
            width={r.width}
            height={r.height}
            className="cell-selected"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </g>
  );
};

export default CellHighlight;
