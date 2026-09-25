import React, { useMemo } from 'react';
import type { UnusableRegion } from '../types/geometry';
import { FINEST_PER_A } from '../geometry/grid';

interface UnusableLayerProps {
  regions: UnusableRegion[];
  a: number;
}

const UnusableLayer: React.FC<UnusableLayerProps> = ({ regions, a }) => {
  const f = a / FINEST_PER_A;

  const prepared = useMemo(
    () =>
      regions.map((region) => {
        const x = region.origin.col * f;
        const y = region.origin.row * f;
        const width = region.widthCells * f;
        const height = region.heightCells * f;
        const cx = x + width / 2;
        const cy = y + height / 2;
        if (!region.outline || region.outline.length < 3) {
          return {
            id: region.id,
            label: region.label,
            kind: 'rect' as const,
            x,
            y,
            width,
            height,
            cx,
            cy,
          };
        }
        const pts = region.outline
          .map(
            (v) =>
              `${(region.origin.col + v.col) * f},${(region.origin.row + v.row) * f}`,
          )
          .join(' ');
        return {
          id: region.id,
          label: region.label,
          kind: 'poly' as const,
          pts,
          cx,
          cy,
        };
      }),
    [regions, f],
  );

  return (
    <g id="unusable" pointerEvents="none">
      <defs>
        <pattern
          id="unusable-hatch"
          width={f * 8}
          height={f * 8}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M0,${f * 8} L${f * 8},0`}
            stroke="rgba(71,85,105,0.5)"
            strokeWidth={f * 0.5}
          />
        </pattern>
      </defs>
      {prepared.map((region) => (
        <g key={region.id}>
          {region.kind === 'rect' ? (
            <rect
              x={region.x}
              y={region.y}
              width={region.width}
              height={region.height}
              fill="url(#unusable-hatch)"
              className="unusable-cell"
            />
          ) : (
            <polygon
              points={region.pts}
              fill="url(#unusable-hatch)"
              className="unusable-cell"
            />
          )}
          {region.label && (
            <g transform={`translate(${region.cx}, ${region.cy}) scale(1, -1)`}>
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={Math.max(f * 4, a * 0.12)}
                fill="rgba(51,65,85,0.85)"
                className="entity-label"
              >
                {region.label}
              </text>
            </g>
          )}
        </g>
      ))}
    </g>
  );
};

export default UnusableLayer;
