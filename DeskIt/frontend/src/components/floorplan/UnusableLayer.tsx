import React from 'react';
import { UnusableRegion } from '../../types/floorplan';
import { FloorConfig } from '../../types/geometry';

interface UnusableLayerProps {
  unusableRegions: UnusableRegion[];
  selectedRegionId?: string | null;
  onSelectRegion?: (id: string) => void;
  floorConfig?: FloorConfig;
}

export const UnusableLayer: React.FC<UnusableLayerProps> = ({
  unusableRegions,
  selectedRegionId,
  onSelectRegion,
}) => {
  if (!unusableRegions || unusableRegions.length === 0) return null;

  return (
    <g className="unusable-layer">
      {unusableRegions.map((region) => {
        const isSelected = selectedRegionId === region.id;
        return (
          <path
            key={region.id}
            d={region.pathSvg}
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
