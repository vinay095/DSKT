import React from 'react';
import { FINEST_PER_A } from '../geometry/grid';

interface PlacePreviewProps {
  origin: { col: number; row: number };
  widthCells: number;
  heightCells: number;
  /** Kept for API compatibility; editor ghost always uses AABB rect. */
  outline?: unknown;
  fits: boolean;
  a: number;
  color?: string;
}

/** Ghost footprint while a library item is armed for placement (AABB rect only). */
const PlacePreview: React.FC<PlacePreviewProps> = ({
  origin,
  widthCells,
  heightCells,
  fits,
  a,
  color = '#3b82f6',
}) => {
  const f = a / FINEST_PER_A;
  const x = origin.col * f;
  const y = origin.row * f;
  const w = widthCells * f;
  const h = heightCells * f;
  const fill = fits ? color : '#ef4444';
  const opacity = fits ? 0.22 : 0.28;

  return (
    <g id="place-preview" pointerEvents="none">
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={fill}
        fillOpacity={opacity}
        stroke={fill}
        strokeWidth={1.5}
        strokeDasharray="4 3"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
};

export default PlacePreview;
