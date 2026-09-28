import React, { useMemo } from 'react';
import { UnusableRegion } from '../../types/floorplan';
import { FloorConfig } from '../../types/geometry';
import { DEFAULT_FLOOR_CONFIG } from '../../geometry/grid';
import { generatePerimeterPathSvg } from '../../geometry/footprint';

interface UnusableLayerProps {
  unusableRegions: UnusableRegion[];
  selectedRegionId?: string | null;
  onSelectRegion?: (id: string) => void;
  floorConfig?: FloorConfig;
}

/**
 * Renders unusable regions from pathSvg when present; otherwise builds a path
 * from finest cells, falling back to the cells' AABB rectangle only when empty.
 */
export const UnusableLayer: React.FC<UnusableLayerProps> = ({
  unusableRegions,
  selectedRegionId,
  onSelectRegion,
  floorConfig = DEFAULT_FLOOR_CONFIG,
}) => {
  const finestStep = floorConfig.a / 16;

  const prepared = useMemo(
    () =>
      unusableRegions.map((region) => {
        let d = (region.pathSvg || '').trim();
        if (!d && region.cells && region.cells.length > 0) {
          d = generatePerimeterPathSvg(region.cells, finestStep);
        }
        if (!d && region.cells && region.cells.length > 0) {
          let minC = Infinity;
          let minR = Infinity;
          let maxC = -Infinity;
          let maxR = -Infinity;
          for (const c of region.cells) {
            minC = Math.min(minC, c.col);
            minR = Math.min(minR, c.row);
            maxC = Math.max(maxC, c.col);
            maxR = Math.max(maxR, c.row);
          }
          const x = minC * finestStep;
          const y = minR * finestStep;
          const w = (maxC - minC + 1) * finestStep;
          const h = (maxR - minR + 1) * finestStep;
          d = `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
        }
        return { id: region.id, d };
      }),
    [unusableRegions, finestStep],
  );

  if (!unusableRegions || unusableRegions.length === 0) return null;

  return (
    <g className="unusable-layer">
      {prepared.map((region) => {
        if (!region.d) return null;
        const isSelected = selectedRegionId === region.id;
        return (
          <path
            key={region.id}
            d={region.d}
            onClick={(e) => {
              e.stopPropagation();
              onSelectRegion && onSelectRegion(region.id);
            }}
            className={`cursor-pointer transition-all ${
              isSelected
                ? 'fill-rose-500/30 stroke-rose-600 stroke-[3]'
                : 'fill-slate-300/40 dark:fill-purple-950/40 stroke-slate-400 dark:stroke-purple-700 stroke-2'
            }`}
          />
        );
      })}
    </g>
  );
};
