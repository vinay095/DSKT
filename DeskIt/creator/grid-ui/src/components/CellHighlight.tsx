import React, { useMemo } from 'react';
import type { CellRef, FloorConfig, GridCell } from '../types/geometry';
import { cellToWorldRect, getLevelCellSize, isCellOnFloor } from '../geometry/grid';
import { cellsToMergedRects } from '../geometry/cellMerge';

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
  const selectedKeys = useMemo(() => {
    const set = new Set<string>();
    for (const c of selectedCells) {
      set.add(`${c.level}:${c.col}:${c.row}`);
    }
    return set;
  }, [selectedCells]);

  const selectedRects = useMemo(() => {
    const byLevel = new Map<number, GridCell[]>();
    for (const c of selectedCells) {
      if (!isCellOnFloor(c, floor)) continue;
      const list = byLevel.get(c.level) ?? [];
      list.push({ col: c.col, row: c.row });
      byLevel.set(c.level, list);
    }
    const rects = [];
    for (const [level, cells] of byLevel) {
      rects.push(...cellsToMergedRects(cells, getLevelCellSize(level, a)));
    }
    return rects;
  }, [selectedCells, floor, a]);

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

      {selectedRects.map((r, i) => (
        <rect
          key={i}
          x={r.x}
          y={r.y}
          width={r.width}
          height={r.height}
          className="cell-selected"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </g>
  );
};

export default React.memo(CellHighlight);
