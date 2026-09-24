import React from 'react';
import { ZoneElement } from '../../types/floorplan';
import { FloorConfig } from '../../types/geometry';
import { DEFAULT_FLOOR_CONFIG } from '../../geometry/grid';

interface ZonesLayerProps {
  zones: ZoneElement[];
  selectedZoneId?: string | null;
  onSelectZone?: (zoneId: string) => void;
  floorConfig?: FloorConfig;
}

export const ZonesLayer: React.FC<ZonesLayerProps> = ({
  zones,
  selectedZoneId,
  onSelectZone,
  floorConfig = DEFAULT_FLOOR_CONFIG,
}) => {
  const placementStep = floorConfig.a / 4;

  return (
    <g className="zones-layer">
      {zones.map((zone) => {
        const isSelected = selectedZoneId === zone.id;
        const zX = zone.x * placementStep;
        const zY = zone.y * placementStep;
        const zW = zone.width * placementStep;
        const zH = zone.height * placementStep;

        return (
          <g
            key={zone.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectZone && onSelectZone(zone.id);
            }}
            className="cursor-pointer group"
          >
            {/* Zone Fill Box */}
            <rect
              x={zX}
              y={zY}
              width={zW}
              height={zH}
              rx={12}
              fill={zone.color}
              fillOpacity={isSelected ? 0.2 : 0.08}
              stroke={isSelected ? '#9333EA' : zone.color}
              strokeWidth={isSelected ? 3 : 1.5}
              strokeDasharray="4 4"
              className="transition-all group-hover:fill-opacity-15"
            />

            {/* Zone Label compensated for SVG scale(1, -1) */}
            <g transform={`translate(${zX + 12}, ${zY + zH - 20}) scale(1, -1)`}>
              <text className="text-[11px] font-bold fill-light-text dark:fill-dark-text opacity-85 uppercase tracking-wider pointer-events-none">
                {zone.name}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
};
