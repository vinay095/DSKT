import React, { useMemo } from 'react';
import type { FloorZone } from '../types/geometry';
import { FINEST_PER_A } from '../geometry/grid';

interface ZonesLayerProps {
  zones: FloorZone[];
  a: number;
}

const ZonesLayer: React.FC<ZonesLayerProps> = ({ zones, a }) => {
  const f = a / FINEST_PER_A;

  const prepared = useMemo(
    () =>
      zones.map((zone) => {
        if (!zone.outline || zone.outline.length < 3) {
          return {
            id: zone.id,
            label: zone.label,
            color: zone.color,
            kind: 'rect' as const,
            x: zone.origin.col * f,
            y: zone.origin.row * f,
            width: zone.widthCells * f,
            height: zone.heightCells * f,
          };
        }
        return {
          id: zone.id,
          label: zone.label,
          color: zone.color,
          kind: 'poly' as const,
          pts: zone.outline
            .map((v) => `${(zone.origin.col + v.col) * f},${(zone.origin.row + v.row) * f}`)
            .join(' '),
        };
      }),
    [zones, f],
  );

  return (
    <g id="zones" pointerEvents="none">
      {prepared.map((zone) => (
        <g key={zone.id} data-zone={zone.label}>
          {zone.kind === 'rect' ? (
            <rect
              x={zone.x}
              y={zone.y}
              width={zone.width}
              height={zone.height}
              fill={zone.color}
              stroke="none"
            />
          ) : (
            <polygon points={zone.pts} fill={zone.color} stroke="none" />
          )}
        </g>
      ))}
    </g>
  );
};

export default ZonesLayer;
