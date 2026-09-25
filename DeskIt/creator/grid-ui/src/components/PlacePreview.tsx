import React from 'react';
import type { OutlineVertex } from '../types/geometry';
import { FINEST_PER_A } from '../geometry/grid';

interface PlacePreviewProps {
  origin: { col: number; row: number };
  widthCells: number;
  heightCells: number;
  outline?: OutlineVertex[];
  fits: boolean;
  a: number;
  color?: string;
}

/** Ghost footprint while a library item is armed for placement. */
const PlacePreview: React.FC<PlacePreviewProps> = ({
  origin,
  widthCells,
  heightCells,
  outline,
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

  if (outline && outline.length >= 3) {
    const pts = outline
      .map((v) => `${(origin.col + v.col) * f},${(origin.row + v.row) * f}`)
      .join(' ');
    return (
      <g id="place-preview" pointerEvents="none">
        <polygon
          points={pts}
          fill={fill}
          fillOpacity={opacity}
          stroke={fill}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          vectorEffect="non-scaling-stroke"
        />
      </g>
    );
  }

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
